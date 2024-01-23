use hdk::prelude::*;
use validation_claims_integrity::*;

#[hdk_extern]
pub fn create_generator(input: Generator) -> ExternResult<Record> {
    let generator_hash = create_entry(&EntryTypes::Generator(input))?;
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
    let response = get_details(generator_hash, GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Generator not found".into())))?;
    let record_details = match response {
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
    pub updated_generator: Generator,
}

#[hdk_extern]
pub fn update_generator(input: UpdateGeneratorInput) -> ExternResult<Record> {
    // Retrieve the original generator's details
    let updated_generator_hash = update_entry(
        input.previous_generator_hash, 
        &input.updated_generator,
    )?;

    // Retrieve the updated generator's record
    let record = get(updated_generator_hash.clone(), GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Could not find the newly updated Generator".into())))?;

    Ok(record)
}

#[hdk_extern]
pub fn delete_generator(
    original_generator_hash: ActionHash,
) -> ExternResult<ActionHash> {
    delete_entry(original_generator_hash)
}
