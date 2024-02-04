use hdk::prelude::*;
use eth_user_integrity::*;
#[hdk_extern]
pub fn create_eth_user(eth_user: EthUser) -> ExternResult<Record> {
    let eth_user_hash = create_entry(&EntryTypes::EthUser(eth_user.clone()))?;
    let record = get(eth_user_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created EthUser"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_eth_user(eth_user_hash: ActionHash) -> ExternResult<Option<Record>> {
    let Some(details) = get_details(eth_user_hash, GetOptions::default())? else {
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
