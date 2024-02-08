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
    eth_user: EthUser,
    _original_action: EntryCreationAction,
    original_eth_user: EthUser,
) -> ExternResult<ValidateCallbackResult> {
    if eth_user.eth_address != original_eth_user.eth_address {
        return Ok(ValidateCallbackResult::Invalid("eth_address cannot be changed".into()));
    }
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_eth_user(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_eth_user: EthUser,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Eth Users cannot be deleted")))
}
pub fn validate_create_link_eth_users(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // Check the entry type for the given action hash
    let action_hash = target_address
        .into_action_hash()
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("No action hash associated with link"))
            ),
        )?;
    let record = must_get_valid_record(action_hash)?;
    let _eth_user: crate::EthUser = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_eth_user_by_eth_address(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_delete_link_eth_users(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_eth_user_by_eth_address(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}
