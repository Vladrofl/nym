// Copyright 2022 - Nym Technologies SA <contact@nymtech.net>
// SPDX-License-Identifier: Apache-2.0

use log::*;

use coconut_interface::{Credential, VerificationKey};
use validator_client::{
    nymd::{NymdClient, SigningNymdClient},
    ApiClient,
};

use super::authenticated::RequestHandlingError;

pub struct CoconutVerifier {
    api_clients: Vec<ApiClient>,
    _nymd_client: NymdClient<SigningNymdClient>,
    aggregated_verification_key: VerificationKey,
}

impl CoconutVerifier {
    pub fn new(
        api_clients: Vec<ApiClient>,
        _nymd_client: NymdClient<SigningNymdClient>,
        aggregated_verification_key: VerificationKey,
    ) -> Result<Self, RequestHandlingError> {
        if api_clients.is_empty() {
            return Err(RequestHandlingError::NotEnoughValidatorAPIs {
                received: 0,
                needed: 1,
            });
        }
        Ok(CoconutVerifier {
            api_clients,
            _nymd_client,
            aggregated_verification_key,
        })
    }

    pub fn _nymd_client(&self) -> &NymdClient<SigningNymdClient> {
        &self._nymd_client
    }

    pub fn aggregated_verification_key(&self) -> &VerificationKey {
        &self.aggregated_verification_key
    }

    pub async fn release_funds(&self, credential: &Credential) -> Result<(), RequestHandlingError> {
        let req = coconut_interface::ProposeReleaseFundsRequestBody::new(credential.clone());
        let proposal_id = self
            .api_clients
            .get(0)
            .expect("This shouldn't happen, as we check for length in constructor")
            .propose_release_funds(&req)
            .await?
            .proposal_id;

        let req = coconut_interface::VerifyCredentialBody::new(credential.clone(), proposal_id);
        for client in self.api_clients.iter().skip(1) {
            if !client
                .verify_bandwidth_credential(&req)
                .await?
                .verification_result
            {
                debug!("Validator {} didn't accept the credential. It will probably vote No on the spending proposal", client.validator_api.current_url());
            }
        }

        let req = coconut_interface::ExecuteReleaseFundsRequestBody::new(proposal_id);
        self.api_clients
            .get(0)
            .expect("This shouldn't happen, as we check for length in constructor")
            .execute_release_funds(&req)
            .await?;

        Ok(())
    }
}
