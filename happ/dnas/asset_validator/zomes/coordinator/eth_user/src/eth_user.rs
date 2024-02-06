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
    let eth_users_path = Path::from("eth_users");
    let eth_address_path = Path::from(eth_user.eth_address.clone());
    create_link(
        eth_users_path.path_entry_hash()?,
        eth_user_hash.clone(),
        LinkTypes::EthUsers,
        (),
    )?;
    create_link(
        eth_address_path.path_entry_hash()?,
        eth_user_hash,
        LinkTypes::EthUserByEthAddress,
        (),
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

#[hdk_extern]
pub fn get_eth_user_by_address(eth_address: String) -> ExternResult<Option<Record>> {
    let eth_address_path = Path::from(eth_address);
    let links = get_links(
        eth_address_path.path_entry_hash()?,
        LinkTypes::EthUserByEthAddress,
        None
    )?;
    match links.last() {
        Some(link) => {
            let hash = link.target.clone().into_any_dht_hash().ok_or(
                wasm_error!(
                    WasmErrorInner::Guest(String::from("Could not convert link target to hash"))
                ),
            )?;
            let record = get(hash, GetOptions::default())?
                .ok_or(
                    wasm_error!(
                        WasmErrorInner::Guest(String::from("Could not find the linked EthUser"))
                    ),
                )?;
            Ok(Some(record))
        },
        None => Ok(None),
    }
}
