pub mod issuance;
pub use issuance::*;
pub mod generation;
pub use generation::*;
pub mod observation;
pub use observation::*;
use hdi::prelude::*;
#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Observation(Observation),
    Generation(Generation),
    Issuance(Issuance),
}
#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    AllObservations,
    GenerationToObservation,
    GenerationUpdates,
    Generations,
    GenerationToIssuances,
    IssuanceUpdates,
    Issuances,
}
#[hdk_extern]
pub fn genesis_self_check(
    _data: GenesisSelfCheckData,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_agent_joining(
    _agent_pub_key: AgentPubKey,
    _membrane_proof: &Option<MembraneProof>,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op.flattened::<EntryTypes, LinkTypes>()? {
        FlatOp::StoreEntry(store_entry) => {
            match store_entry {
                OpEntry::CreateEntry { app_entry, action } => {
                    match app_entry {
                        EntryTypes::Observation(observation) => {
                            validate_create_observation(
                                EntryCreationAction::Create(action),
                                observation,
                            )
                        }
                        EntryTypes::Generation(generation) => {
                            validate_create_generation(
                                EntryCreationAction::Create(action),
                                generation,
                            )
                        }
                        EntryTypes::Issuance(issuance) => {
                            validate_create_issuance(
                                EntryCreationAction::Create(action),
                                issuance,
                            )
                        }
                    }
                }
                OpEntry::UpdateEntry { app_entry, action, .. } => {
                    match app_entry {
                        EntryTypes::Observation(observation) => {
                            validate_create_observation(
                                EntryCreationAction::Update(action),
                                observation,
                            )
                        }
                        EntryTypes::Generation(generation) => {
                            validate_create_generation(
                                EntryCreationAction::Update(action),
                                generation,
                            )
                        }
                        EntryTypes::Issuance(issuance) => {
                            validate_create_issuance(
                                EntryCreationAction::Update(action),
                                issuance,
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        FlatOp::RegisterUpdate(update_entry) => {
            match update_entry {
                OpUpdate::Entry {
                    original_action,
                    original_app_entry,
                    app_entry,
                    action,
                } => {
                    match (app_entry, original_app_entry) {
                        (
                            EntryTypes::Issuance(issuance),
                            EntryTypes::Issuance(original_issuance),
                        ) => {
                            validate_update_issuance(
                                action,
                                issuance,
                                original_action,
                                original_issuance,
                            )
                        }
                        (
                            EntryTypes::Generation(generation),
                            EntryTypes::Generation(original_generation),
                        ) => {
                            validate_update_generation(
                                action,
                                generation,
                                original_action,
                                original_generation,
                            )
                        }
                        (
                            EntryTypes::Observation(observation),
                            EntryTypes::Observation(original_observation),
                        ) => {
                            validate_update_observation(
                                action,
                                observation,
                                original_action,
                                original_observation,
                            )
                        }
                        _ => {
                            Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original and updated entry types must be the same"
                                        .to_string(),
                                ),
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        FlatOp::RegisterDelete(delete_entry) => {
            match delete_entry {
                OpDelete::Entry { original_action, original_app_entry, action } => {
                    match original_app_entry {
                        EntryTypes::Observation(observation) => {
                            validate_delete_observation(
                                action,
                                original_action,
                                observation,
                            )
                        }
                        EntryTypes::Generation(generation) => {
                            validate_delete_generation(
                                action,
                                original_action,
                                generation,
                            )
                        }
                        EntryTypes::Issuance(issuance) => {
                            validate_delete_issuance(action, original_action, issuance)
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        FlatOp::RegisterCreateLink {
            link_type,
            base_address,
            target_address,
            tag,
            action,
        } => {
            match link_type {
                LinkTypes::GenerationToObservation => {
                    validate_create_link_generation_to_observation(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllObservations => {
                    validate_create_link_all_observations(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::GenerationUpdates => {
                    validate_create_link_generation_updates(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::Generations => {
                    validate_create_link_generations(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::GenerationToIssuances => {
                    validate_create_link_generation_to_issuances(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::IssuanceUpdates => {
                    validate_create_link_issuance_updates(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::Issuances => {
                    validate_create_link_issuances(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
            }
        }
        FlatOp::RegisterDeleteLink {
            link_type,
            base_address,
            target_address,
            tag,
            original_action,
            action,
        } => {
            match link_type {
                LinkTypes::GenerationToObservation => {
                    validate_delete_link_generation_to_observation(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllObservations => {
                    validate_delete_link_all_observations(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::GenerationUpdates => {
                    validate_delete_link_generation_updates(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::Generations => {
                    validate_delete_link_generations(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::GenerationToIssuances => {
                    validate_delete_link_generation_to_issuances(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::IssuanceUpdates => {
                    validate_delete_link_issuance_updates(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::Issuances => {
                    validate_delete_link_issuances(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
            }
        }
        FlatOp::StoreRecord(store_record) => {
            match store_record {
                OpRecord::CreateEntry { app_entry, action } => {
                    match app_entry {
                        EntryTypes::Observation(observation) => {
                            validate_create_observation(
                                EntryCreationAction::Create(action),
                                observation,
                            )
                        }
                        EntryTypes::Generation(generation) => {
                            validate_create_generation(
                                EntryCreationAction::Create(action),
                                generation,
                            )
                        }
                        EntryTypes::Issuance(issuance) => {
                            validate_create_issuance(
                                EntryCreationAction::Create(action),
                                issuance,
                            )
                        }
                    }
                }
                OpRecord::UpdateEntry {
                    original_action_hash,
                    app_entry,
                    action,
                    ..
                } => {
                    let original_record = must_get_valid_record(original_action_hash)?;
                    let original_action = original_record.action().clone();
                    let original_action = match original_action {
                        Action::Create(create) => EntryCreationAction::Create(create),
                        Action::Update(update) => EntryCreationAction::Update(update),
                        _ => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original action for an update must be a Create or Update action"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    match app_entry {
                        EntryTypes::Observation(observation) => {
                            let result = validate_create_observation(
                                EntryCreationAction::Update(action.clone()),
                                observation.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_observation: Option<Observation> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_observation = match original_observation {
                                    Some(observation) => observation,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_observation(
                                    action,
                                    observation,
                                    original_action,
                                    original_observation,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::Generation(generation) => {
                            let result = validate_create_generation(
                                EntryCreationAction::Update(action.clone()),
                                generation.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_generation: Option<Generation> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_generation = match original_generation {
                                    Some(generation) => generation,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_generation(
                                    action,
                                    generation,
                                    original_action,
                                    original_generation,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::Issuance(issuance) => {
                            let result = validate_create_issuance(
                                EntryCreationAction::Update(action.clone()),
                                issuance.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_issuance: Option<Issuance> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_issuance = match original_issuance {
                                    Some(issuance) => issuance,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_issuance(
                                    action,
                                    issuance,
                                    original_action,
                                    original_issuance,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                    }
                }
                OpRecord::DeleteEntry { original_action_hash, action, .. } => {
                    let original_record = must_get_valid_record(original_action_hash)?;
                    let original_action = original_record.action().clone();
                    let original_action = match original_action {
                        Action::Create(create) => EntryCreationAction::Create(create),
                        Action::Update(update) => EntryCreationAction::Update(update),
                        _ => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original action for a delete must be a Create or Update action"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    let app_entry_type = match original_action.entry_type() {
                        EntryType::App(app_entry_type) => app_entry_type,
                        _ => {
                            return Ok(ValidateCallbackResult::Valid);
                        }
                    };
                    let entry = match original_record.entry().as_option() {
                        Some(entry) => entry,
                        None => {
                            if original_action.entry_type().visibility().is_public() {
                                return Ok(
                                    ValidateCallbackResult::Invalid(
                                        "Original record for a delete of a public entry must contain an entry"
                                            .to_string(),
                                    ),
                                );
                            } else {
                                return Ok(ValidateCallbackResult::Valid);
                            }
                        }
                    };
                    let original_app_entry = match EntryTypes::deserialize_from_type(
                        app_entry_type.zome_index.clone(),
                        app_entry_type.entry_index.clone(),
                        &entry,
                    )? {
                        Some(app_entry) => app_entry,
                        None => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original app entry must be one of the defined entry types for this zome"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    match original_app_entry {
                        EntryTypes::Observation(original_observation) => {
                            validate_delete_observation(
                                action,
                                original_action,
                                original_observation,
                            )
                        }
                        EntryTypes::Generation(original_generation) => {
                            validate_delete_generation(
                                action,
                                original_action,
                                original_generation,
                            )
                        }
                        EntryTypes::Issuance(original_issuance) => {
                            validate_delete_issuance(
                                action,
                                original_action,
                                original_issuance,
                            )
                        }
                    }
                }
                OpRecord::CreateLink {
                    base_address,
                    target_address,
                    tag,
                    link_type,
                    action,
                } => {
                    match link_type {
                        LinkTypes::AllObservations => {
                            validate_create_link_all_observations(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::GenerationToObservation => {
                            validate_create_link_generation_to_observation(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::GenerationUpdates => {
                            validate_create_link_generation_updates(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::Generations => {
                            validate_create_link_generations(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::GenerationToIssuances => {
                            validate_create_link_generation_to_issuances(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::IssuanceUpdates => {
                            validate_create_link_issuance_updates(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::Issuances => {
                            validate_create_link_issuances(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                    }
                }
                OpRecord::DeleteLink { original_action_hash, base_address, action } => {
                    let record = must_get_valid_record(original_action_hash)?;
                    let create_link = match record.action() {
                        Action::CreateLink(create_link) => create_link.clone(),
                        _ => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "The action that a DeleteLink deletes must be a CreateLink"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    let link_type = match LinkTypes::from_type(
                        create_link.zome_index.clone(),
                        create_link.link_type.clone(),
                    )? {
                        Some(lt) => lt,
                        None => {
                            return Ok(ValidateCallbackResult::Valid);
                        }
                    };
                    match link_type {
                        LinkTypes::AllObservations => {
                            validate_delete_link_all_observations(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::GenerationToObservation => {
                            validate_delete_link_generation_to_observation(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::GenerationUpdates => {
                            validate_delete_link_generation_updates(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::Generations => {
                            validate_delete_link_generations(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::GenerationToIssuances => {
                            validate_delete_link_generation_to_issuances(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::IssuanceUpdates => {
                            validate_delete_link_issuance_updates(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::Issuances => {
                            validate_delete_link_issuances(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                    }
                }
                OpRecord::CreatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CreateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CreateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::Dna { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::OpenChain { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CloseChain { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::InitZomesComplete { .. } => Ok(ValidateCallbackResult::Valid),
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        FlatOp::RegisterAgentActivity(agent_activity) => {
            match agent_activity {
                OpActivity::CreateAgent { agent, action } => {
                    let previous_action = must_get_action(action.prev_action)?;
                    match previous_action.action() {
                        Action::AgentValidationPkg(
                            AgentValidationPkg { membrane_proof, .. },
                        ) => validate_agent_joining(agent, membrane_proof),
                        _ => {
                            Ok(
                                ValidateCallbackResult::Invalid(
                                    "The previous action for a `CreateAgent` action must be an `AgentValidationPkg`"
                                        .to_string(),
                                ),
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
    }
}
