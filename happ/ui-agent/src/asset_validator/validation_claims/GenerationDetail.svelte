<script lang="ts">
import { onMount, getContext, createEventDispatcher } from 'svelte';
import '@material/mwc-circular-progress';
import type { Record, ActionHash, AppAgentClient} from '@holochain/client';
import {encodeHashToBase64} from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Generation, Observation } from './types';
import '@material/mwc-circular-progress';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';

import { submitWattbikeUrl} from '../../lib';

import { updateGenerationStatus, get_observations_for_generation  } from '../../../../shared/lib/generations';

const dispatch = createEventDispatcher();

import {onNewObservation} from '../../../../shared/lib';
import {fetchGeneration} from '../../../../shared/lib/generations';

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

let editing = false;

let errorSnackbar: Snackbar;

$: editing,  error, loading, record, generation, timeAgo, observations;
let wattbikeUrl = '';
let totalJoulesGeneratedFormatted: string;
let totalJoulesGenerated: number;

$: {
  totalJoulesGenerated = observations.reduce((sum, obs) => {
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
  let res = await fetchGeneration(client, hash);
  generation = res.generation; 
  record = res.record;
  timeAgo = res.timeAgo;

  if (record) {
    observations = await get_observations_for_generation(client, hash);
  }
  loading = false;

  onNewObservation(client, (payload) => {
    if (encodeHashToBase64(hash) == encodeHashToBase64(payload.app_entry.generation_hash)) {
      observations = [...observations, payload.app_entry as Observation];
    }
  });
});


async function allocateSensorToGeneration(sensor_id) {
  if (sensorAllocations[SENSOR_1] === encodeHashToBase64(hash) && sensor_id === SENSOR_2) {
    await clearSensorAllocation(SENSOR_1);
  } else if (sensorAllocations[SENSOR_2] === encodeHashToBase64(hash) && sensor_id === SENSOR_1) {
    await clearSensorAllocation(SENSOR_2);
  }
  dispatch('allocate-sensor', {sensor_id, generationHash: hash});
}

async function clearSensorAllocation(sensor_id) {
  dispatch('allocate-sensor', {sensor_id, generationHash: null});
}

function toggleDetails() {
  showDetails = !showDetails;
}

async function cancelGeneration() {
  const confirmCancel = confirm('Are you sure you want to cancel this generation?');
  if (confirmCancel) {
    try {
      await updateGenerationStatus(client, hash, {generation, hash: record.signed_action.hashed.hash}, 'Cancelled');
      // Refresh the generation details or emit an event to notify the parent component
      // This part of the code depends on how you want to handle the update in the UI
    } catch (error) {
      console.error('Error cancelling generation:', error);
    }
  }
}

function canAllocate() {
  return generation && generation.status.type === 'Active';
}

function handleWattBike() {
  submitWattbikeUrl(wattbikeUrl, encodeHashToBase64(hash), client);
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
{:else if generation.status.type == 'Cancelled'}
  <span></span>
{:else}
<div style="display: flex; flex-direction: column">
  <div style="display: flex; flex-direction: row">
    <span class="generation-span" style="flex: 1" on:click={toggleDetails}> 
      {#if sensorAllocations[SENSOR_2] == encodeHashToBase64(hash)}[fun bike] {/if}
      {#if sensorAllocations[SENSOR_1] == encodeHashToBase64(hash)}[work bike] {/if}
      {generation.user_handle}:
      {generation.status.type}:
      {timeAgo}
      <strong>Total Generated:</strong> 

      {totalJoulesGeneratedFormatted} joules
    </span>
  </div>
  {#if showDetails}
  <div class="details">
  <div class="wattbike-api-container">
    <input type="url" bind:value={wattbikeUrl} placeholder="Enter URL" required />
    <button on:click={handleWattBike}>Submit URL</button>
  </div>

    {#if generation.status.type === 'Complete' && totalJoulesGenerated == 0}
      <button on:click={cancelGeneration} class="cancel-button">Cancel</button>
    {/if}

    {#if sensorAllocations[SENSOR_1] == encodeHashToBase64(hash)}
      <button on:click={() => clearSensorAllocation(SENSOR_1)}>Clear work bike allocation</button>
    {:else}
      {#if canAllocate()}
        <button on:click={() => allocateSensorToGeneration(SENSOR_1)}>Allocate to work bike</button>
      {/if}
    {/if}
    <!--
    {#if sensorAllocations[SENSOR_2] == encodeHashToBase64(hash)}
      <button on:click={() => clearSensorAllocation(SENSOR_2)}>Finish fun bike</button>
    {:else}
      {#if canAllocate()}
        <button on:click={() => allocateSensorToGeneration(SENSOR_2)}>Allocate to fun bike</button>
      {/if}
    {/if}
    -->

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
  .wattbike-form-container {
    position: absolute;
    top: 0;
    right: 0;
    padding: 8px;
  }
  .wattbike-api-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
  }
  .wattbike-api-container input {
    margin-right: 8px;
  }
  .wattbike-form-container {
    position: relative;
    padding: 8px;
    text-align: right;
  }
  .wattbike-form {
    display: inline-block;
    margin-bottom: 4px;
  }
  .cancel-button {
    align-self: flex-end;
    margin-left: auto;
    background-color: red;
    color: white;
  }
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

