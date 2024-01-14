use hdi::prelude::*;
use hdi::prelude::debug;

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Generator {
    pub owner: AgentPubKey,
    pub name: String,
}

pub fn validate_create_generator(
    _action: EntryCreationAction,
    _generator: Generator,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_generator(
    _action: Update,
    _generator: Generator,
    _original_action: EntryCreationAction,
    _original_generator: Generator,
) -> ExternResult<ValidateCallbackResult> {
    // Debug the original generator and generator
    debug!("Original Generator: {:?}", _original_generator);
    debug!("Updated Generator: {:?}", _generator);
    //TODO ensure original_generator and generator owner is the same
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_generator(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_generator: Generator,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_all_generators(
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
    let _generator: crate::Generator = record
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
pub fn validate_delete_link_all_generators(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("AllGenerators links cannot be deleted"),
        ),
    )
}
