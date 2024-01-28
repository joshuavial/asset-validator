use hdk::prelude::*;
use validation_claims_integrity::*;
#[hdk_extern]
pub fn create_observation(observation: Observation) -> ExternResult<Record> {
    let observation_hash = create_entry(&EntryTypes::Observation(observation.clone()))?;
    let record = get(observation_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Observation"))
            ),
        )?;
    //TODO link to action author
    Ok(record)
}
#[hdk_extern]
pub fn get_observation(
    original_observation_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    get_latest_observation(original_observation_hash)
}
fn get_latest_observation(observation_hash: ActionHash) -> ExternResult<Option<Record>> {
    let details = get_details(observation_hash, GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Observation not found".into())))?;
    let record_details = match details {
        Details::Entry(_) => {
            Err(wasm_error!(WasmErrorInner::Guest("Malformed details".into())))
        }
        Details::Record(record_details) => Ok(record_details),
    }?;
    if record_details.deletes.len() > 0 {
        return Ok(None);
    }
    match record_details.updates.last() {
        Some(update) => get_latest_observation(update.action_address().clone()),
        None => Ok(Some(record_details.record)),
    }
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateObservationInput {
    pub previous_observation_hash: ActionHash,
    pub updated_observation: Observation,
}
#[hdk_extern]
pub fn update_observation(input: UpdateObservationInput) -> ExternResult<Record> {
    let updated_observation_hash = update_entry(
        input.previous_observation_hash,
        &input.updated_observation,
    )?;
    let record = get(updated_observation_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated Observation"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_observations_for_creator(creator: AgentPubKey) -> ExternResult<Vec<Record>> {
    let links = get_links(creator, LinkTypes::CreatorToObservations, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| Ok(
            GetInput::new(
                link
                    .target
                    .into_action_hash()
                    .ok_or(
                        wasm_error!(
                            WasmErrorInner::Guest(String::from("No action hash associated with link"))
                        ),
                    )?
                    .into(),
                GetOptions::default(),
            ),
        ))
        .collect::<ExternResult<Vec<GetInput>>>()?;
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();
    Ok(records)
}
