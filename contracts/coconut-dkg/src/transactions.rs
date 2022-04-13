// Copyright 2022 - Nym Technologies SA <contact@nymtech.net>
// SPDX-License-Identifier: Apache-2.0

use crate::constants::{INVALID_ED25519_BLACKLISTING_EXPIRATION, MINIMUM_DEPOSIT};
use crate::storage::{next_node_index, BLACKLISTED_DEALERS, CURRENT_DEALERS, PAST_DEALERS};
use crate::ContractError;
use coconut_dkg_common::types::{
    Blacklisting, BlacklistingReason, BlockHeight, DealerDetails, EncodedBTEPublicKeyWithProof,
    EncodedEd25519PublicKey, EncodedEd25519PublicKeyRef,
};
use config::defaults::STAKE_DENOM;
use cosmwasm_std::{Addr, Coin, Deps, DepsMut, Env, MessageInfo, Response};

// currently we only require that
// a) it's a validator
// b) it wasn't blacklisted
// c) it isn't already a dealer
fn verify_dealer(
    deps: DepsMut<'_>,
    current_height: BlockHeight,
    dealer: &Addr,
) -> Result<(), ContractError> {
    if let Some(blacklisting) = BLACKLISTED_DEALERS.may_load(deps.storage, dealer)? {
        // TODO: perhaps whenever we touch anything to do with blacklisting, each should check for
        // expiration and auto-magically clear stale ones
        if !blacklisting.has_expired(current_height) {
            return Err(ContractError::BlacklistedDealer {
                reason: blacklisting,
            });
        } else {
            // remove the expired blacklisting
            BLACKLISTED_DEALERS.remove(deps.storage, dealer)
        }
    }

    if CURRENT_DEALERS.has(deps.storage, dealer) {
        return Err(ContractError::AlreadyADealer);
    }

    let all_validators = deps.querier.query_all_validators()?;
    if !all_validators
        .iter()
        .any(|validator| validator.address == dealer.as_ref())
    {
        return Err(ContractError::NotAValidator);
    }

    Ok(())
}

fn validate_dealer_deposit(mut deposit: Vec<Coin>) -> Result<Coin, ContractError> {
    // check if anything was put as deposit
    if deposit.is_empty() {
        return Err(ContractError::NoDepositFound);
    }

    if deposit.len() > 1 {
        return Err(ContractError::MultipleDenoms);
    }

    // check that the denomination is correct
    if deposit[0].denom != STAKE_DENOM {
        return Err(ContractError::WrongDenom {});
    }

    // check that we have at least MINIMUM_DEPOSIT coins in our deposit
    if deposit[0].amount < MINIMUM_DEPOSIT {
        return Err(ContractError::InsufficientDeposit {
            received: deposit[0].amount.into(),
            minimum: MINIMUM_DEPOSIT.into(),
        });
    }

    // the unwrap would have been safe here under all circumstances, since we checked whether the vector is empty
    // but in case something did change, change option into an error
    deposit.pop().ok_or(ContractError::NoDepositFound)
}

pub(crate) fn validate_key_possession_signature(
    deps: Deps<'_>,
    owner: &Addr,
    signature: String,
    encoded_key: EncodedEd25519PublicKeyRef<'_>,
) -> Result<(), ContractError> {
    let mut key_bytes = [0u8; 32];
    let mut signature_bytes = [0u8; 64];

    bs58::decode(encoded_key)
        .into(&mut key_bytes)
        .map_err(ContractError::MalformedEd25519PublicKey)?;
    bs58::decode(signature)
        .into(&mut signature_bytes)
        .map_err(ContractError::MalformedEd25519Signature)?;

    let res = deps
        .api
        .ed25519_verify(owner.as_bytes(), &signature_bytes, &key_bytes)?;

    if !res {
        Err(ContractError::InvalidEd25519Signature)
    } else {
        Ok(())
    }
}

pub fn try_add_dealer(
    mut deps: DepsMut<'_>,
    env: Env,
    info: MessageInfo,
    ed25519_key: EncodedEd25519PublicKey,
    bte_key_with_proof: EncodedBTEPublicKeyWithProof,
    owner_signature: String,
) -> Result<Response, ContractError> {
    // check whether this sender is eligible to become a dealer
    verify_dealer(deps.branch(), env.block.height, &info.sender)?;

    // check if this dealer actually has control of his ed25519 key
    // (BTE key has a proof assigned so if a malformed key is provided, somebody should complaint
    // and then get this dealers deposit for themselves)
    if let Err(err) = validate_key_possession_signature(
        deps.as_ref(),
        &info.sender,
        owner_signature,
        &ed25519_key,
    ) {
        // TODO: it looks like blacklisting could use a constructor
        let blacklisting = Blacklisting {
            reason: BlacklistingReason::Ed25519PossessionVerificationFailure,
            height: env.block.height,
            expiration: Some(env.block.height + INVALID_ED25519_BLACKLISTING_EXPIRATION),
        };
        BLACKLISTED_DEALERS.save(deps.storage, &info.sender, &blacklisting)?;
        return Err(err);
    }

    // validate and extract sent deposit
    let _deposit = validate_dealer_deposit(info.funds)?;

    // if it was already a dealer in the past, assign the same node index
    let node_index =
        if let Some(prior_details) = PAST_DEALERS.may_load(deps.storage, &info.sender)? {
            // since this dealer is going to become active now, remove it from the past dealers
            PAST_DEALERS.remove(deps.storage, &info.sender);
            prior_details.assigned_index
        } else {
            next_node_index(deps.storage)?
        };

    // save the dealer into the storage
    let dealer_details = DealerDetails {
        joined_at: env.block.height,
        left_at: None,
        blacklisting: None,
        ed25519_public_key: ed25519_key,
        bte_public_key_with_proof: bte_key_with_proof,
        assigned_index: node_index,
    };
    CURRENT_DEALERS.save(deps.storage, &info.sender, &dealer_details)?;

    Ok(Response::new().set_data(node_index.to_be_bytes()))
}
