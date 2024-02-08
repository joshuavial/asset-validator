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
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateEthUserInput {
    pub original_eth_user_hash: ActionHash,
    pub updated_eth_user: EthUser,
}

#[hdk_extern]
pub fn update_eth_user(input: UpdateEthUserInput) -> ExternResult<Record> {
    let UpdateEthUserInput {
        original_eth_user_hash: original_eth_user_hash_clone,
        updated_eth_user,
    } = input;

    // Retrieve the original EthUser record to compare eth_addresses
    let old_record = get(original_eth_user_hash_clone.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the original EthUser"))
            ),
        )?;
    let old_eth_user: EthUser = old_record.entry().to_app_option().map_err(|e| wasm_error!(WasmErrorInner::Serialize(e)))?.ok_or(
        wasm_error!(
            WasmErrorInner::Guest(String::from("Original EthUser entry not found"))
        ),
    )?;

    // Prevent changing the eth_address
    if old_eth_user.eth_address != updated_eth_user.eth_address {
        return Err(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Changing eth_address is not allowed"))
            ),
        );
    }

    // Update the EthUser entry
    let updated_eth_user_hash = update_entry(original_eth_user_hash_clone.clone(), &updated_eth_user)?;

    // Retrieve the updated record to return
    let updated_record = get(updated_eth_user_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the updated EthUser"))
            ),
        )?;


    Ok(updated_record)
}
#[derive(Serialize, Deserialize, Debug)]
pub struct WhoAmIInput {
    pub agent_pub_key: AgentPubKey,
}

#[hdk_extern]
pub fn who_am_i(input: WhoAmIInput) -> ExternResult<Option<Record>> {
    let agent_pub_key = input.agent_pub_key;
    let eth_users_path = Path::from("eth_users");
    let links = get_links(eth_users_path.path_entry_hash()?, LinkTypes::EthUsers, None)?;
    for link in links {
        let hash = link.target.clone().into_any_dht_hash().ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not convert link target to hash"))
            ),
        )?;
        let eth_user_record = get(hash, GetOptions::default())?
            .ok_or(
                wasm_error!(
                    WasmErrorInner::Guest(String::from("EthUser entry not found"))
                ),
            )?;
        let eth_user: EthUser = eth_user_record.entry().to_app_option().map_err(|e| wasm_error!(WasmErrorInner::Serialize(e)))?.ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("EthUser entry not found"))
            ),
        )?;
        if eth_user.current_pub_key == agent_pub_key {
            return Ok(Some(eth_user_record));
        }
    }
    Ok(None)
}
