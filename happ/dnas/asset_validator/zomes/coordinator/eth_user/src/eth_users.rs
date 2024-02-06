use hdk::prelude::*;
use eth_user_integrity::*;

#[hdk_extern]
pub fn get_eth_users(_: ()) -> ExternResult<Vec<Link>> {
    let path = Path::from("eth_users");
    get_links(path.path_entry_hash()?, LinkTypes::EthUsers, None)
}
