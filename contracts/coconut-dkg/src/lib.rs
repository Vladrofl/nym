// Copyright 2022 - Nym Technologies SA <contact@nymtech.net>
// SPDX-License-Identifier: Apache-2.0

use crate::constants::MINIMUM_DEPOSIT;
use crate::dealers::queries::{
    query_blacklisted_dealers_paged, query_blacklisting, query_current_dealers_paged,
    query_dealer_details, query_past_dealers_paged,
};
use crate::dealings::queries::query_epoch_dealings_commitments_paged;
use crate::epoch::queries::query_current_epoch;
use crate::error::ContractError;
use coconut_dkg_common::msg::{ExecuteMsg, InstantiateMsg, MigrateMsg, QueryMsg};
use coconut_dkg_common::types::{Epoch, EpochState, MinimumDepositResponse};
use config::defaults::STAKE_DENOM;
use cosmwasm_std::{
    entry_point, to_binary, Coin, Deps, DepsMut, Env, MessageInfo, QueryResponse, Response,
};
use epoch::storage as epoch_storage;

mod constants;
mod dealers;
mod dealings;
mod epoch;
mod error;
mod support;

/// Instantiate the contract.
///
/// `deps` contains Storage, API and Querier
/// `env` contains block, message and contract info
/// `msg` is the contract initialization message, sort of like a constructor call.
#[entry_point]
pub fn instantiate(
    deps: DepsMut<'_>,
    env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    if msg.public_key_submission_end_height < env.block.height {
        return Err(ContractError::EpochStateFinishInPast);
    }

    // if threshold was not provided in arguments, use ceil(2/3 of validators)
    let system_threshold = if let Some(system_threshold) = msg.system_threshold {
        system_threshold
    } else {
        let validators = deps.querier.query_all_validators()?.len() as u64;
        // note: ceiling in integer division can be achieved via q = (x + y - 1) / y;
        (2 * validators + 3 - 1) / 3
    };

    epoch_storage::CURRENT_EPOCH.save(
        deps.storage,
        &Epoch {
            id: 0,
            state: EpochState::PublicKeySubmission {
                begun_at: env.block.height,
                finish_by: msg.public_key_submission_end_height,
            },
            system_threshold,
        },
    )?;
    Ok(Response::default())
}

/// Handle an incoming message
#[entry_point]
pub fn execute(
    deps: DepsMut<'_>,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::RegisterDealer {
            ed25519_key,
            bte_key_with_proof,
            owner_signature,
            host,
        } => dealers::transactions::try_add_dealer(
            deps,
            env,
            info,
            ed25519_key,
            bte_key_with_proof,
            owner_signature,
            host,
        ),
        ExecuteMsg::CommitDealing {
            epoch_id,
            commitment,
        } => dealings::transactions::try_commit_dealing(deps, info, epoch_id, commitment),
        ExecuteMsg::DebugUnsafeResetAll { init_msg } => {
            reset_contract_state(deps, env, info, init_msg)
        }
        ExecuteMsg::DebugAdvanceEpochState {} => advance_epoch_state(deps, env),
    }
}

fn advance_epoch_state(deps: DepsMut<'_>, env: Env) -> Result<Response, ContractError> {
    const STATE_LENGTH: u64 = 1000;

    let epoch = epoch_storage::CURRENT_EPOCH.load(deps.storage)?;
    let next = epoch
        .next_state(
            Some(env.block.height),
            Some(env.block.height + STATE_LENGTH),
        )
        .unwrap();

    epoch_storage::CURRENT_EPOCH.save(deps.storage, &next)?;
    Ok(Response::default())
}

fn reset_contract_state(
    mut deps: DepsMut<'_>,
    env: Env,
    info: MessageInfo,
    init_msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    // this resets the epoch
    instantiate(deps.branch(), env, info, init_msg)?;

    // clear all dealings, public keys, etc
    let current = dealers::storage::current_dealers()
        .keys(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .collect::<Result<Vec<_>, _>>()?;
    let past = dealers::storage::past_dealers()
        .keys(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .collect::<Result<Vec<_>, _>>()?;
    let blacklisted = crate::dealers::storage::BLACKLISTED_DEALERS
        .keys(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .collect::<Result<Vec<_>, _>>()?;
    let commitments = crate::dealings::storage::DEALING_COMMITMENTS
        .keys(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .collect::<Result<Vec<_>, _>>()?;

    for dealer in current {
        dealers::storage::current_dealers().remove(deps.storage, &dealer)?;
    }

    for dealer in past {
        dealers::storage::past_dealers().remove(deps.storage, &dealer)?;
    }

    for dealer in blacklisted {
        dealers::storage::BLACKLISTED_DEALERS.remove(deps.storage, &dealer);
    }

    for (epoch, addr) in commitments {
        dealings::storage::DEALING_COMMITMENTS.remove(deps.storage, (epoch, &addr));
    }

    crate::dealers::storage::NODE_INDEX_COUNTER.save(deps.storage, &0u64)?;

    Ok(Response::default())
}

#[entry_point]
pub fn query(deps: Deps<'_>, _env: Env, msg: QueryMsg) -> Result<QueryResponse, ContractError> {
    let response = match msg {
        QueryMsg::GetCurrentEpoch {} => to_binary(&query_current_epoch(deps.storage)?)?,
        QueryMsg::GetDealerDetails { dealer_address } => {
            to_binary(&query_dealer_details(deps, dealer_address)?)?
        }
        QueryMsg::GetCurrentDealers { limit, start_after } => {
            to_binary(&query_current_dealers_paged(deps, start_after, limit)?)?
        }
        QueryMsg::GetPastDealers { limit, start_after } => {
            to_binary(&query_past_dealers_paged(deps, start_after, limit)?)?
        }
        QueryMsg::GetBlacklistedDealers { limit, start_after } => {
            to_binary(&query_blacklisted_dealers_paged(deps, start_after, limit)?)?
        }
        QueryMsg::GetBlacklisting { dealer } => to_binary(&query_blacklisting(deps, dealer)?)?,
        QueryMsg::GetDepositAmount {} => to_binary(&MinimumDepositResponse::new(Coin::new(
            MINIMUM_DEPOSIT.u128(),
            STAKE_DENOM,
        )))?,
        QueryMsg::GetEpochDealingsCommitments {
            limit,
            epoch,
            start_after,
        } => to_binary(&query_epoch_dealings_commitments_paged(
            deps,
            epoch,
            start_after,
            limit,
        )?)?,
    };

    Ok(response)
}

#[entry_point]
pub fn migrate(_deps: DepsMut<'_>, _env: Env, _msg: MigrateMsg) -> Result<Response, ContractError> {
    Ok(Default::default())
}

#[cfg(test)]
mod tests {
    use super::*;
    use config::defaults::DENOM;
    use cosmwasm_std::coins;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};

    #[test]
    fn initialize_contract() {
        let mut deps = mock_dependencies();
        let env = mock_env();
        let msg = InstantiateMsg {
            public_key_submission_end_height: env.block.height + 123,
            system_threshold: None,
        };
        let info = mock_info("creator", &[]);

        let res = instantiate(deps.as_mut(), env.clone(), info, msg);
        assert!(res.is_ok())
    }
}