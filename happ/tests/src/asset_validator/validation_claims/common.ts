import { CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeActionHash, fakeAgentPubKey, fakeEntryHash, fakeDnaHash } from '@holochain/client';



export async function sampleObservation(partialObservation = {}) {
    const now = Math.floor(Date.now());
    const tenSecondsLater = now + 10000;
    return {
        observed_at: now, // Ensure this is an integer (i64)
        data: {
            EnergyObservation: {
                from: now, // Ensure this is an integer (i64), in seconds
                to: tenSecondsLater, // Ensure this is an integer (i64), in seconds
                energy: 100
            }
        },
        ...partialObservation,
    };
}

export async function createObservation(cell: CallableCell, observation = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "validation_claims",
      fn_name: "create_observation",
      payload: observation || await sampleObservation(),
    });
}


export async function sampleGenerator(partialGenerator = {}) {
    return {
        ...{
	  name: "Lorem ipsum generator",
        },
        ...partialGenerator
    };
}

export async function createGenerator(cell: CallableCell, generator = undefined): Promise<Record> {
    const payload = generator || await sampleGenerator();
    return cell.callZome({
      zome_name: "validation_claims",
      fn_name: "create_generator",
      payload,
    });
}

