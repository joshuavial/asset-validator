<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
import { encodeHashToBase64 } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Issuance, IssuanceStatus } from './types';
import type { GenerationWithHash} from '../../../../shared/types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';
import {fetchGenerations, get_observations_for_generation} from '../../../../shared/lib/generations';
import {formatTimeAgo} from '../../../../shared/lib';

function formatJoules(joules: number): string {
  if (!joules) return '';
  return joules.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

let generationHashes =  [];
let transaction: string | undefined = '';
let quantity: number = 0;
let status: IssuanceStatus = { type: 'Created' };

let generations:GenerationWithHash = [];
let generationTotalJoules = {};

let errorSnackbar: Snackbar;

$: isIssuanceValid = generationHashes.length > 0 && quantity > 0;

onMount(async () => {
  try {
    generations = (await fetchGenerations(client))
      .filter(g => g.generation.status.type === 'Complete')

    quantity = await calculateTotalJoules(generations, client);
    generationHashes = generations.map(g => g.action.hashed.content.entry_hash);

  } catch (e) {
    errorSnackbar.labelText = `Error fetching generations: ${e}`;
    errorSnackbar.show();
  }
});


async function calculateTotalJoules(generations: Array<GenerationWithHash>, client: AppAgentClient): Promise<number> {
  let totalJoules = 0;
  for (let generation of generations) {
    let generationJoules = 0;
    const observations = await get_observations_for_generation(client, generation.hash);
    for (const observation of observations) {
      if (observation.data.EnergyObservation ) {
        generationJoules += observation.data.EnergyObservation.energy;
        totalJoules += observation.data.EnergyObservation.energy;
      }
    }
    generationTotalJoules[generation.hash] = generationJoules;
  }
  return totalJoules;
}

function validateIssuance() {
  return generationHashes.length > 0 && transaction !== '' && quantity > 0;
}

async function createIssuance() {  
  const issuanceEntry: Issuance = { 
    generation_hashes: generationHashes,
    transaction: transaction,
    quantity: parseInt(quantity),
    status: status!,
  };

  console.log(issuanceEntry);
  

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
  <h2>Create Issuance</h2>
  <p>
  Total Joules : {formatJoules(quantity)}
  </p>

  <div class='generation-list'>
    {#each generations as generation}
      <div>
        <span>{generation.generation.user_handle}</span>
        <span> generated {formatJoules(generationTotalJoules[generation.hash])}</span>
        <span>{formatTimeAgo(generation.action.hashed.content.timestamp)}</span>
      </div>
    {/each}
  </div>


  <mwc-button 
    raised
    label="Create Issuance"
    disabled={!isIssuanceValid}
    on:click={() => createIssuance()}
  ></mwc-button>
</div>

<style>
  .generation-list {
    margin-bottom:20px;
  }
</style>
