// This is still not an ideal home for this struct, because it's not an
// universal nymsphinx addressing method, however, it needs to be
// accessible by both desktop and webassembly client (it's more
// of a helper/utils structure, because before it reaches the gateway
// it's already destructed).

use crate::nodes::{NodeIdentity, NODE_IDENTITY_SIZE};
use crypto::asymmetric::{encryption, identity};
use nymsphinx_types::Destination;

// Not entirely sure whether this is the correct place for those, but let's see how it's going
// to work out
pub type ClientEncryptionKey = encryption::PublicKey;
const CLIENT_ENCRYPTION_KEY_SIZE: usize = encryption::PUBLIC_KEY_SIZE;

pub type ClientIdentity = identity::PublicKey;
const CLIENT_IDENTITY_SIZE: usize = identity::PUBLIC_KEY_LENGTH;

#[derive(Debug)]
pub enum RecipientFormattingError {
    MalformedRecipientError,
    MalformedIdentityError(identity::SignatureError),
    MalformedEncryptionKeyError(encryption::EncryptionKeyError),
    MalformedGatewayError(identity::SignatureError),
}

impl From<encryption::EncryptionKeyError> for RecipientFormattingError {
    fn from(err: encryption::EncryptionKeyError) -> Self {
        RecipientFormattingError::MalformedEncryptionKeyError(err)
    }
}

// TODO: this should a different home... somewhere, but where?
#[derive(Clone, Debug)]
pub struct Recipient {
    client_identity: ClientIdentity,
    client_encryption_key: ClientEncryptionKey,
    gateway: NodeIdentity,
}

impl Recipient {
    pub const LEN: usize = CLIENT_IDENTITY_SIZE + CLIENT_ENCRYPTION_KEY_SIZE + NODE_IDENTITY_SIZE;

    pub fn new(
        client_identity: ClientIdentity,
        client_encryption_key: ClientEncryptionKey,
        gateway: NodeIdentity,
    ) -> Self {
        Recipient {
            client_identity,
            client_encryption_key,
            gateway,
        }
    }

    // TODO: Currently the `DestinationAddress` is equivalent to `ClientIdentity`, but perhaps
    // it shouldn't be? Maybe it should be (for example) H(`ClientIdentity || ClientEncryptionKey`)
    // instead? That is an open question.
    pub fn as_sphinx_destination(&self) -> Destination {
        // since the nym mix network differs slightly in design from loopix, we do not care
        // about "surb_id" field at all and just use the default value.
        Destination::new(
            self.client_identity.derive_destination_address(),
            Default::default(),
        )
    }

    pub fn identity(&self) -> &ClientIdentity {
        &self.client_identity
    }

    pub fn encryption_key(&self) -> &ClientEncryptionKey {
        &self.client_encryption_key
    }

    pub fn gateway(&self) -> &NodeIdentity {
        &self.gateway
    }

    pub fn into_bytes(self) -> [u8; Self::LEN] {
        let mut out = [0u8; Self::LEN];
        out[..CLIENT_IDENTITY_SIZE].copy_from_slice(&self.client_identity.to_bytes());
        out[CLIENT_IDENTITY_SIZE..CLIENT_IDENTITY_SIZE + CLIENT_ENCRYPTION_KEY_SIZE]
            .copy_from_slice(&self.client_encryption_key.to_bytes());
        out[CLIENT_IDENTITY_SIZE + CLIENT_ENCRYPTION_KEY_SIZE..]
            .copy_from_slice(&self.gateway.to_bytes());

        out
    }

    pub fn try_from_bytes(bytes: [u8; Self::LEN]) -> Result<Self, RecipientFormattingError> {
        let identity_bytes = &bytes[..CLIENT_IDENTITY_SIZE];
        let enc_key_bytes =
            &bytes[CLIENT_IDENTITY_SIZE..CLIENT_IDENTITY_SIZE + CLIENT_ENCRYPTION_KEY_SIZE];
        let gateway_bytes = &bytes[CLIENT_IDENTITY_SIZE + CLIENT_ENCRYPTION_KEY_SIZE..];

        let client_identity = match ClientIdentity::from_bytes(identity_bytes) {
            Ok(client_id) => client_id,
            Err(err) => return Err(RecipientFormattingError::MalformedIdentityError(err)),
        };

        let client_encryption_key = ClientEncryptionKey::from_bytes(enc_key_bytes)?;

        let gateway = match NodeIdentity::from_bytes(gateway_bytes) {
            Ok(gate_id) => gate_id,
            Err(err) => return Err(RecipientFormattingError::MalformedGatewayError(err)),
        };

        Ok(Recipient {
            client_identity,
            client_encryption_key,
            gateway,
        })
    }

    pub fn try_from_string<S: Into<String>>(
        full_address: S,
    ) -> Result<Self, RecipientFormattingError> {
        let string_address = full_address.into();
        let split: Vec<_> = string_address.split('@').collect();
        if split.len() != 2 {
            return Err(RecipientFormattingError::MalformedRecipientError);
        }
        let client_half = split[0];
        let gateway_half = split[1];

        let split_client: Vec<_> = client_half.split('.').collect();
        if split_client.len() != 2 {
            return Err(RecipientFormattingError::MalformedRecipientError);
        }

        let client_identity = match ClientIdentity::from_base58_string(split_client[0]) {
            Ok(client_id) => client_id,
            Err(err) => return Err(RecipientFormattingError::MalformedIdentityError(err)),
        };

        let client_encryption_key = ClientEncryptionKey::from_base58_string(split_client[1])?;

        let gateway = match NodeIdentity::from_base58_string(gateway_half) {
            Ok(gate_id) => gate_id,
            Err(err) => return Err(RecipientFormattingError::MalformedGatewayError(err)),
        };

        Ok(Recipient {
            client_identity,
            client_encryption_key,
            gateway,
        })
    }
}

// ADDRESS . ENCRYPTION @ GATEWAY_ID
impl std::fmt::Display for Recipient {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}.{}@{}",
            self.client_identity.to_base58_string(),
            self.client_encryption_key.to_base58_string(),
            self.gateway.to_base58_string()
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn string_conversion_works() {
        let client_id_pair = identity::KeyPair::new();
        let client_enc_pair = encryption::KeyPair::new();
        let gateway_id_pair = identity::KeyPair::new();

        let recipient = Recipient::new(
            *client_id_pair.public_key(),
            client_enc_pair.public_key().clone(),
            *gateway_id_pair.public_key(),
        );

        let str_recipient = recipient.to_string();
        let recovered_recipient = Recipient::try_from_string(str_recipient).unwrap();

        // as long as byte representation of internal keys are identical, it's all fine
        assert_eq!(
            recipient.client_identity.to_bytes(),
            recovered_recipient.client_identity.to_bytes()
        );
        assert_eq!(
            recipient.client_encryption_key.to_bytes(),
            recovered_recipient.client_encryption_key.to_bytes()
        );
        assert_eq!(
            recipient.gateway.to_bytes(),
            recovered_recipient.gateway.to_bytes()
        );
    }

    #[test]
    fn bytes_conversion_works() {
        let client_id_pair = identity::KeyPair::new();
        let client_enc_pair = encryption::KeyPair::new();
        let gateway_id_pair = identity::KeyPair::new();

        let recipient = Recipient::new(
            *client_id_pair.public_key(),
            client_enc_pair.public_key().clone(),
            *gateway_id_pair.public_key(),
        );

        let bytes_recipient = recipient.clone().into_bytes();
        let recovered_recipient = Recipient::try_from_bytes(bytes_recipient).unwrap();

        // as long as byte representation of internal keys are identical, it's all fine
        assert_eq!(
            recipient.client_identity.to_bytes(),
            recovered_recipient.client_identity.to_bytes()
        );
        assert_eq!(
            recipient.client_encryption_key.to_bytes(),
            recovered_recipient.client_encryption_key.to_bytes()
        );
        assert_eq!(
            recipient.gateway.to_bytes(),
            recovered_recipient.gateway.to_bytes()
        );
    }
}