<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Issuance, IssuanceStatus } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';
import {fetchGenerations} from '../../../../shared/lib/generations';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();


let generationHashes: EntryHash[] = [];
let transaction: string | undefined = '';
let quantity: number = 0;
let status: IssuanceStatus = { type: 'Created' };

let errorSnackbar: Snackbar;
let totalJoules: number = 0;

$: isIssuanceValid = generationHashes.length > 0 && transaction !== '' && quantity > 0;

onMount(async () => {
  try {
    let generations = (await fetchGenerations(client))
      .filter(g => g.generation.status.type === 'Complete')

    generationHashes = generations.map(g => g.hash);
    totalJoules = await calculateTotalJoules(generations, client);
    quantity = totalJoules;

  } catch (e) {
    errorSnackbar.labelText = `Error fetching generations: ${e}`;
    errorSnackbar.show();
  }
});

async function calculateTotalJoules(generations: Array<GenerationWithHash>, client: AppAgentClient): Promise<number> {
  let totalJoules = 0;
  for (const generation of generations) {
    const observations = await fetchObservationsForGeneration(client, generation.hash);
    for (const observation of observations) {
      if (observation.type === 'EnergyData') {
        totalJoules += observation.energy;
      }
    }
  }
  return totalJoules;
}

function validateIssuance() {
  return generationHashes.length > 0 && transaction !== '' && quantity > 0;
}

onMount(() => {
//TODO get all generations and add those that are complete to generationHashes
});

async function createIssuance() {  
  const issuanceEntry: Issuance = { 
    generation_hashes: generationHashes,
    transaction: transaction,
    quantity: quantity!,
    status: status!,
  };
  
  try {
    const record: Record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'create_issuance',
      payload: issuanceEntry,
    });
    dispatch('issuance-created', { issuanceHash: record.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error creating the issuance: ${e}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Create Issuance</span>
            
  <mwc-button 
    raised
    label="Create Issuance"
    disabled={!isIssuanceValid}
    on:click={() => createIssuance()}
  ></mwc-button>
</div>
