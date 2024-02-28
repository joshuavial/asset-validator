use hdi::prelude::*;
use crate::generation::Generation;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Observation {
    pub generation_hash: ActionHash,
    pub observed_at: Timestamp,
    pub data: ObservationType,
}
#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub enum ObservationType {
    ImageObservation(ImageData),
    EnergyObservation(EnergyData),
}
#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub struct ImageData {
    pub image_data: String,
}
#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub struct EnergyData {
    pub from: Timestamp,
    pub to: Timestamp,
    pub energy: f64,
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
pub fn validate_create_link_all_observations(
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
pub fn validate_delete_link_all_observations(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("AllObservations links cannot be deleted"),
        ),
    )
}
pub fn validate_create_link_generation_to_observation(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let base_action_hash = base_address
        .into_action_hash()
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Base address must be an action hash"))
            ),
        )?;
    let _generation: Generation = must_get_valid_record(base_action_hash)?
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Base address must reference a Generation entry"))
            ),
        )?;
    let target_action_hash = target_address
        .into_action_hash()
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Target address must be an action hash"))
            ),
        )?;
    let _observation: Observation = must_get_valid_record(target_action_hash)?
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Target address must reference an Observation entry"))
            ),
        )?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_generation_to_observation(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("GenerationToObservation links cannot be deleted"),
        ),
    )
}
