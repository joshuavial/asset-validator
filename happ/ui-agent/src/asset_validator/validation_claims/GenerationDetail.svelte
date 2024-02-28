<script lang="ts">
import { onMount, getContext, createEventDispatcher } from 'svelte';
import '@material/mwc-circular-progress';
import { decode, encode } from '@msgpack/msgpack';
import type { Record, ActionHash, AppAgentClient} from '@holochain/client';
import {encodeHashToBase64} from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Generation, Observation } from './types';
import '@material/mwc-circular-progress';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';

const dispatch = createEventDispatcher();

import { formatTimeAgo, onNewObservation, get_observations_for_generation } from '../../../../shared/lib';

const SENSOR_1 = 'sensor_1';
const SENSOR_2 = 'sensor_2';

import CreateImageObservation from './CreateImageObservation.svelte'
import ObservationDetail from '../../../../shared/ObservationDetail.svelte'

export let hash: ActionHash;
export let sensorAllocations: Record<string, string | null>;

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let loading = true;
let error: any = undefined;

let record: Record | undefined;
let generation: Generation | undefined;
let timeAgo: string | undefined;
let showDetails = false;
let observations: Observation[] = [];
let totalJoulesGenerated: number;

let editing = false;

let errorSnackbar: Snackbar;

$: editing,  error, loading, record, generation, timeAgo, observations;
let totalJoulesGeneratedFormatted: string;

$: {
  const totalJoulesGenerated = observations.reduce((sum, obs) => {
      if (obs.data.EnergyObservation) {
          return sum + parseFloat(obs.data.EnergyObservation.energy);
      }
      return sum;
  }, 0);
  totalJoulesGeneratedFormatted = totalJoulesGenerated.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1});
}

onMount(async () => {
  if (hash === undefined) {
    throw new Error(`The generationHash input is required for the GenerationDetail element`);
  }
  await fetchGeneration();

  onNewObservation(client, (payload) => {
    if (encodeHashToBase64(hash) == encodeHashToBase64(payload.app_entry.generation_hash)) {
      observations = [...observations, payload.app_entry as Observation];
    }
  });
});

async function fetchGeneration() {
  loading = true;
  error = undefined;
  record = undefined;
  generation = undefined;
  timeAgo = undefined;
  observations = [];

  try {
    const generationHash = hash; // Use the new prop name
    record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'get_latest_generation',
      payload: generationHash,
    });
    if (record) {
      generation = decode((record.entry as any).Present.entry) as Generation;
      timeAgo = formatTimeAgo(record.signed_action.hashed.content.timestamp);
      observations = await get_observations_for_generation(client, generationHash);
    }
  } catch (e) {
    error = e;
  }

  loading = false;
}

async function allocateSensorToGeneration(sensor_id) {
  try {
    dispatch('allocate-sensor', {sensor_id, generationHash: hash}); // Use the new prop name
  } catch (error) {
    console.error('Error allocating sensor to generation:', error);
  }
}

async function clearSensorAllocation(sensor_id) {
  dispatch('allocate-sensor', {sensor_id, generationHash: null});
}

function toggleDetails() {
  showDetails = !showDetails;
}

</script>

<!-- The rest of the component remains unchanged -->
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>

{#if loading}
<div style="display: flex; flex: 1; align-items: center; justify-content: center">
  <mwc-circular-progress indeterminate></mwc-circular-progress>
</div>
{:else if error}
<span>Error fetching the generation: {error}</span>
{:else}

<div style="display: flex; flex-direction: column">
  <div style="display: flex; flex-direction: row">
    <span class="generation-span" style="flex: 1" on:click={toggleDetails}> 
      {#if sensorAllocations[SENSOR_1] == encodeHashToBase64(hash)}[fun bike] {/if}
      {#if sensorAllocations[SENSOR_2] == encodeHashToBase64(hash)}[work bike] {/if}
      {generation.user_handle}:
      {generation.status.type}:
      {timeAgo}
      <strong>Total Generated:</strong> 

      {totalJoulesGeneratedFormatted} joules
    </span>
  </div>
  {#if showDetails}
  <div class="details">

    {#if sensorAllocations[SENSOR_2] == encodeHashToBase64(hash)}
      <button on:click={() => clearSensorAllocation(SENSOR_2)}>Finish work bike</button>
    {:else}
      <button on:click={() => allocateSensorToGeneration(SENSOR_2)}>Allocate work bike</button>
    {/if}
    {#if sensorAllocations[SENSOR_1] == encodeHashToBase64(hash)}
      <button on:click={() => clearSensorAllocation(SENSOR_1)}>Clear fun bike allocation</button>
    {:else}
      <button on:click={() => allocateSensorToGeneration(SENSOR_1)}>Allocate fun bike</button>
    {/if}

    <p>User Address: {generation.user_address}</p>
    <CreateImageObservation generationRecord={record}/>
    {#each observations as observation}
      <ObservationDetail {observation} />
    {/each}
  </div>
  {/if}

</div>
{/if}

<style>
  .details {
    padding: 8px;
    margin-top: 4px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f9f9f9;
    overflow: hidden;
  }
  .details img {
    max-width: 00%;
    height: auto;
  }
  .generation-span {
    padding:4px;
    margin:0px;
  }
  .generation-span:hover {
    cursor: pointer;
    background-color: #e6e6e6;
  }
</style>
