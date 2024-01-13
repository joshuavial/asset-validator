import { CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeActionHash, fakeAgentPubKey, fakeEntryHash, fakeDnaHash } from '@holochain/client';



export async function sampleObservation(cell: CallableCell, partialObservation = {}) {
    return {
        ...{
          creator: cell.cell_id[1],
	  observed_at: 1674053334548000,
        },
        ...partialObservation
    };
}

export async function createObservation(cell: CallableCell, observation = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "validation_claims",
      fn_name: "create_observation",
      payload: observation || await sampleObservation(cell),
    });
}



export async function sampleGenerator(cell: CallableCell, partialGenerator = {}) {
    return {
        ...{
	  owner: cell.cell_id[1], // The pubkey of the creator
	  name: "Lorem ipsum generator",
        },
        ...partialGenerator
    };
}

export async function createGenerator(cell: CallableCell, generator = undefined): Promise<Record> {
    const sample = generator || await sampleGenerator(cell);
    const { owner, ...generatorWithoutOwner } = sample;
    return cell.callZome({
      zome_name: "validation_claims",
      fn_name: "create_generator",
      payload: generatorWithoutOwner,
    });
}

