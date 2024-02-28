use hdk::prelude::*;
use validation_claims_integrity::*;
#[hdk_extern]
pub fn create_issuance(issuance: Issuance) -> ExternResult<Record> {
    let issuance_hash = create_entry(&EntryTypes::Issuance(issuance.clone()))?;
    for base in issuance.generation_hashes.clone() {
        create_link(base, issuance_hash.clone(), LinkTypes::GenerationToIssuances, ())?;
    }
    let record = get(issuance_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Issuance"))
            ),
        )?;
    let path = Path::from("issuances");
    create_link(
        path.path_entry_hash()?,
        issuance_hash.clone(),
        LinkTypes::Issuances,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_latest_issuance(
    original_issuance_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        original_issuance_hash.clone(),
        LinkTypes::IssuanceUpdates,
        None,
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_a.timestamp.cmp(&link_b.timestamp));
    let latest_issuance_hash = match latest_link {
        Some(link) => {
            link.target
                .clone()
                .into_action_hash()
                .ok_or(
                    wasm_error!(
                        WasmErrorInner::Guest(String::from("No action hash associated with link"))
                    ),
                )?
        }
        None => original_issuance_hash.clone(),
    };
    get(latest_issuance_hash, GetOptions::default())
}
#[hdk_extern]
pub fn get_original_issuance(
    original_issuance_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let Some(details) = get_details(original_issuance_hash, GetOptions::default())? else {
        return Ok(None);
    };
    match details {
        Details::Record(details) => Ok(Some(details.record)),
        _ => {
            Err(
                wasm_error!(
                    WasmErrorInner::Guest(String::from("Malformed get details response"))
                ),
            )
        }
    }
}
#[hdk_extern]
pub fn get_all_revisions_for_issuance(
    original_issuance_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let Some(original_record) = get_original_issuance(original_issuance_hash.clone())?
    else {
        return Ok(vec![]);
    };
    let links = get_links(
        original_issuance_hash.clone(),
        LinkTypes::IssuanceUpdates,
        None,
    )?;
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
    let mut records: Vec<Record> = records.into_iter().filter_map(|r| r).collect();
    records.insert(0, original_record);
    Ok(records)
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateIssuanceInput {
    pub original_issuance_hash: ActionHash,
    pub previous_issuance_hash: ActionHash,
    pub updated_issuance: Issuance,
}
#[hdk_extern]
pub fn update_issuance(input: UpdateIssuanceInput) -> ExternResult<Record> {
    let updated_issuance_hash = update_entry(
        input.previous_issuance_hash.clone(),
        &input.updated_issuance,
    )?;
    create_link(
        input.original_issuance_hash.clone(),
        updated_issuance_hash.clone(),
        LinkTypes::IssuanceUpdates,
        (),
    )?;
    let record = get(updated_issuance_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated Issuance"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_issuance(original_issuance_hash: ActionHash) -> ExternResult<ActionHash> {
    let details = get_details(original_issuance_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("{pascal_entry_def_name} not found"))
            ),
        )?;
    let record = match details {
        Details::Record(details) => Ok(details.record),
        _ => {
            Err(
                wasm_error!(
                    WasmErrorInner::Guest(String::from("Malformed get details response"))
                ),
            )
        }
    }?;
    let entry = record
        .entry()
        .as_option()
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Issuance record has no entry"))
            ),
        )?;
    let issuance = Issuance::try_from(entry)?;
    for base_address in issuance.generation_hashes {
        let links = get_links(
            base_address.clone(),
            LinkTypes::GenerationToIssuances,
            None,
        )?;
        for link in links {
            if let Some(action_hash) = link.target.into_action_hash() {
                if action_hash.eq(&original_issuance_hash) {
                    delete_link(link.create_link_hash)?;
                }
            }
        }
    }
    let path = Path::from("issuances");
    let links = get_links(path.path_entry_hash()?, LinkTypes::Issuances, None)?;
    for link in links {
        if let Some(hash) = link.target.into_action_hash() {
            if hash.eq(&original_issuance_hash) {
                delete_link(link.create_link_hash)?;
            }
        }
    }
    delete_entry(original_issuance_hash)
}
#[hdk_extern]
pub fn get_all_deletes_for_issuance(
    original_issuance_hash: ActionHash,
) -> ExternResult<Option<Vec<SignedActionHashed>>> {
    let Some(details) = get_details(original_issuance_hash, GetOptions::default())? else {
        return Ok(None);
    };
    match details {
        Details::Entry(_) => {
            Err(wasm_error!(WasmErrorInner::Guest("Malformed details".into())))
        }
        Details::Record(record_details) => Ok(Some(record_details.deletes)),
    }
}
#[hdk_extern]
pub fn get_oldest_delete_for_issuance(
    original_issuance_hash: ActionHash,
) -> ExternResult<Option<SignedActionHashed>> {
    let Some(mut deletes) = get_all_deletes_for_issuance(original_issuance_hash)? else {
        return Ok(None);
    };
    deletes
        .sort_by(|delete_a, delete_b| {
            delete_a.action().timestamp().cmp(&delete_b.action().timestamp())
        });
    Ok(deletes.first().cloned())
}
#[hdk_extern]
pub fn get_issuances_for_generation(
    generation_hash: EntryHash,
) -> ExternResult<Vec<Link>> {
    get_links(generation_hash, LinkTypes::GenerationToIssuances, None)
}
#[hdk_extern]
pub fn get_deleted_issuances_for_generation(
    generation_hash: EntryHash,
) -> ExternResult<Vec<(SignedActionHashed, Vec<SignedActionHashed>)>> {
    let details = get_link_details(
        generation_hash,
        LinkTypes::GenerationToIssuances,
        None,
    )?;
    Ok(
        details
            .into_inner()
            .into_iter()
            .filter(|(_link, deletes)| deletes.len() > 0)
            .collect(),
    )
}
