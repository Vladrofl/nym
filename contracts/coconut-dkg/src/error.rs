// Copyright 2022 - Nym Technologies SA <contact@nymtech.net>
// SPDX-License-Identifier: Apache-2.0

use coconut_dkg_common::types::{Blacklisting, EpochId};
use config::defaults::STAKE_DENOM;
use cosmwasm_std::{Addr, StdError, VerificationError};
use thiserror::Error;

/// Custom errors for contract failure conditions.
#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("No coin was sent for the deposit, you must send {}", STAKE_DENOM)]
    NoDepositFound,

    #[error("Received multiple coin types")]
    MultipleDenoms,

    #[error("Wrong coin denomination, you must send {}", STAKE_DENOM)]
    WrongDenom,

    #[error("Not enough funds sent for deposit. (received {received}, minimum {minimum})")]
    InsufficientDeposit { received: u128, minimum: u128 },

    #[error("Failed to recover ed25519 public key from its base58 representation - {0}. This dealer will be temporarily blacklisted now.")]
    MalformedEd25519PublicKey(bs58::decode::Error),

    #[error("Failed to recover ed25519 signature from its base58 representation - {0}. This dealer will be temporarily blacklisted now.")]
    MalformedEd25519Signature(bs58::decode::Error),

    #[error("Failed to perform ed25519 signature verification - {0}. This dealer will be temporarily blacklisted now.")]
    Ed25519VerificationError(#[from] VerificationError),

    #[error("Provided ed25519 signature did not verify correctly. This dealer will be temporarily blacklisted now.")]
    InvalidEd25519Signature,

    #[error("This dealer has been blacklisted - {reason}")]
    BlacklistedDealer { reason: Blacklisting },

    #[error("This potential dealer is not a validator")]
    NotAValidator,

    #[error("This sender is already a dealer for the epoch")]
    AlreadyADealer,

    #[error("Epoch hasn't been correctly initialised!")]
    EpochNotInitialised,

    #[error("Attempted to set the current epoch state to finish in the past")]
    EpochStateFinishInPast,

    // we should never ever see this error (famous last words in programming), therefore, I'd want to
    // explicitly declare it so that when we ultimate do see it, it's gonna be more informative over "normal" panic
    #[error("Somehow our validated address {address} is not using correct bech32 encoding")]
    InvalidValidatedAddress { address: Addr },

    #[error("This sender is not a dealer for the current epoch")]
    NotADealer,

    #[error("The current epoch does not match the one present in the request. Current: {current}, in request: {request_for}")]
    MismatchedEpoch {
        current: EpochId,
        request_for: EpochId,
    },

    #[error("This dealer has already commited dealing for this epoch")]
    AlreadyCommitted,
}