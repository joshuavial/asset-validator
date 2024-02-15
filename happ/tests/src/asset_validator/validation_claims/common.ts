import { CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeActionHash, fakeAgentPubKey, fakeEntryHash, fakeDnaHash } from '@holochain/client';



export async function sampleObservation(generation_hash: string, partialObservation = {}) {
    const now = Math.floor(Date.now());
    const tenSecondsLater = now + 10000;
    return {
      observation: {
        observed_at: now, // Ensure this is an integer (i64)
        data: {
            EnergyObservation: {
                from: now, // Ensure this is an integer (i64), in seconds
                to: tenSecondsLater, // Ensure this is an integer (i64), in seconds
                energy: 100
            }
        },
        ...partialObservation,
      },
      generation_hash: generation_hash,
    };
}

export async function createObservation(cell: CallableCell, observation = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "validation_claims",
      fn_name: "create_observation",
      payload: observation || await sampleObservation(),
    });
}


export async function sampleGeneration(cell: CallableCell, partialGeneration = {}) {
    return {
        ...{
	  user_address: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    user_handle: 'test',
	  status: { type: 'Active' },
	  signature: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
        ...partialGeneration
    };
}

export async function createGeneration(cell: CallableCell, generation = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "validation_claims",
      fn_name: "create_generation",
      payload: generation || await sampleGeneration(cell),
    });
}

