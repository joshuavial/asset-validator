<script lang="ts">
import { onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { Record, ActionHash, AppAgentClient} from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Generation, Observation } from './types';
import '@material/mwc-circular-progress';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';

import { formatTimeAgo, onNewObservation, get_observations_for_generation } from '../../../../shared/lib';

import CreateImageObservation from './CreateImageObservation.svelte'
import ObservationDetail from '../../../../shared/ObservationDetail.svelte'

export let generationHash: ActionHash;

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let loading = true;
let error: any = undefined;

let record: Record | undefined;
let generation: Generation | undefined;
let timeAgo: string | undefined;
let showDetails = false;
let observations: Observation[];

let editing = false;

let errorSnackbar: Snackbar;

$: editing,  error, loading, record, generation, timeAgo, observations;

onMount(async () => {
  if (generationHash === undefined) {
    throw new Error(`The generationHash input is required for the GenerationDetail element`);
  }
  await fetchGeneration();

  onNewObservation(client, (payload) => {
    observations = [...observations, payload.app_entry as Observation];
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

function toggleDetails() {
  showDetails = !showDetails;
}

</script>

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
      {generation.user_handle}:
      {generation.status.type}:
      {timeAgo}
    </span>
  </div>
  {#if showDetails}
  <div class="details">
    <p>User Address: {generation.user_address}</p>
    {#each observations as observation}
      <ObservationDetail {observation} />
    {/each}
    <CreateImageObservation generationRecord={record}/>
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
