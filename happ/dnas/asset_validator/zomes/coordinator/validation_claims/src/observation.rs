use hdk::prelude::*;
use validation_claims_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateObservationInput {
    pub observation: Observation,
    pub generation_hash: ActionHash,
}

#[hdk_extern]
pub fn create_observation(input: CreateObservationInput) -> ExternResult<Record> {
    let observation = input.observation;
    let observation_hash = create_entry(&EntryTypes::Observation(observation.clone()))?;
    let record = get(observation_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Observation"))
            ),
        )?;
    create_link(
        input.generation_hash.clone(),
        observation_hash.clone(),
        LinkTypes::GenerationToObservation,
        (),
    )?;
    Ok(record)
}

#[hdk_extern]
pub fn get_observations_for_generation(generation_hash: ActionHash) -> ExternResult<Vec<Record>> {
    let links = get_links(
        generation_hash,
        LinkTypes::GenerationToObservation,
        None,
    )?;
    let records = links
        .into_iter()
        .map(|link| link.target.into_action_hash()
            .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Target is not an ActionHash")))))
        .collect::<Result<Vec<ActionHash>, WasmError>>()?
        .into_iter()
        .map(|action_hash| get(action_hash, GetOptions::default()))
        .collect::<Result<Vec<Option<Record>>, WasmError>>()?
        .into_iter()
        .filter_map(|record_option| record_option)
        .collect::<Vec<Record>>();
    Ok(records)
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
pub fn get_all_observations(_: ()) -> ExternResult<Vec<Record>> {
    let path = Path::from("all_observations");
    let links = get_links(path.path_entry_hash()?, LinkTypes::AllObservations, None)?;
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
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().filter_map(|r| r).collect();
    Ok(records)
}
