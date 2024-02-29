use hdk::prelude::*;
use validation_claims_integrity::*;
#[hdk_extern]
pub fn get_issuances(_: ()) -> ExternResult<Vec<Link>> {
    let path = Path::from("issuances");
    get_links(path.path_entry_hash()?, LinkTypes::Issuances, None)
}
