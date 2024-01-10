use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Observation {
    pub creator: AgentPubKey,
    pub observed_at: Timestamp,
}
pub fn validate_create_observation(
    _action: EntryCreationAction,
    _observation: Observation,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_observation(
    _action: Update,
    _observation: Observation,
    _original_action: EntryCreationAction,
    _original_observation: Observation,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_observation(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_observation: Observation,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Observations cannot be deleted")))
}
pub fn validate_create_link_creator_to_observations(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = target_address
        .into_action_hash()
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("No action hash associated with link"))
            ),
        )?;
    let record = must_get_valid_record(action_hash)?;
    let _observation: crate::Observation = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_creator_to_observations(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("CreatorToObservations links cannot be deleted"),
        ),
    )
}
