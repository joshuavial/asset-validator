import { CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeActionHash, fakeAgentPubKey, fakeEntryHash, fakeDnaHash } from '@holochain/client';



export async function sampleEthUser(cell: CallableCell, partialEthUser = {}) {
    return {
        ...{
	  handle: "handle",
	  eth_address: "0xeth",
	  current_pub_key: (await fakeAgentPubKey()),
        },
        ...partialEthUser
    };
}

export async function createEthUser(cell: CallableCell, ethUser = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "eth_user",
      fn_name: "create_eth_user",
      payload: ethUser || await sampleEthUser(cell),
    });
}

