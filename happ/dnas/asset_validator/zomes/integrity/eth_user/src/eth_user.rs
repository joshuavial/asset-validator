use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct EthUser {
    pub handle: String,
    pub eth_address: String,
    pub current_pub_key: AgentPubKey,
}
pub fn validate_create_eth_user(
    _action: EntryCreationAction,
    _eth_user: EthUser,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_eth_user(
    _action: Update,
    _eth_user: EthUser,
    _original_action: EntryCreationAction,
    _original_eth_user: EthUser,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Eth Users cannot be updated")))
}
pub fn validate_delete_eth_user(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_eth_user: EthUser,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Eth Users cannot be deleted")))
}
