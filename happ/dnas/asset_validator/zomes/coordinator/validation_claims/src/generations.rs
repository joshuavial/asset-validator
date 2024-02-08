use hdk::prelude::*;
use validation_claims_integrity::*;
#[hdk_extern]
pub fn get_generations(_: ()) -> ExternResult<Vec<Link>> {
    let path = Path::from("generations");
    get_links(path.path_entry_hash()?, LinkTypes::Generations, None)
}
