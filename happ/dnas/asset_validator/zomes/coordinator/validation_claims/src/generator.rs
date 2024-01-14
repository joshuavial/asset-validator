use hdk::prelude::*;
use validation_claims_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateGeneratorInput {
    pub name: String,
}

#[hdk_extern]
pub fn create_generator(input: CreateGeneratorInput) -> ExternResult<Record> {
    let agent_info = agent_info()?;
    let generator = Generator {
        owner: agent_info.agent_latest_pubkey,
        name: input.name,
    };
    let generator_hash = create_entry(&EntryTypes::Generator(generator))?;
    let record = get(generator_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Generator"))
            ),
        )?;
    let path = Path::from("all_generators");
    create_link(
        path.path_entry_hash()?,
        generator_hash.clone(),
        LinkTypes::AllGenerators,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_generator(
    original_generator_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    get_latest_generator(original_generator_hash)
}
fn get_latest_generator(generator_hash: ActionHash) -> ExternResult<Option<Record>> {
    let details = get_details(generator_hash, GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Generator not found".into())))?;
    //TODO debug details
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
        Some(update) => get_latest_generator(update.action_address().clone()),
        None => Ok(Some(record_details.record)),
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateGeneratorInput {
    pub previous_generator_hash: ActionHash,
    pub updated_generator: CreateGeneratorInput,
}

#[hdk_extern]
pub fn update_generator(input: UpdateGeneratorInput) -> ExternResult<Record> {
    // Retrieve the original generator's details
    let original_generator_record = get_latest_generator(input.previous_generator_hash.clone())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Original Generator not found".into())))?;
    let original_generator: Generator = original_generator_record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Original Generator entry missing".into())))?;

    // Create an updated generator with the same owner and a new name from the input
    let updated_generator = Generator {
        owner: original_generator.owner,
        name: input.updated_generator.name,
    };
    update_entry(input.previous_generator_hash, &EntryTypes::Generator(updated_generator.clone()))?;

    // Retrieve the updated generator's hash
    let updated_generator_hash = hash_entry(&updated_generator)?;

    // Retrieve the updated generator's record
    let updated_record = get(updated_generator_hash.clone(), GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Could not find the newly updated Generator".into())))?;

    Ok(updated_record)
}

#[hdk_extern]
pub fn delete_generator(
    original_generator_hash: ActionHash,
) -> ExternResult<ActionHash> {
    delete_entry(original_generator_hash)
}
