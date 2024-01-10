<script lang="ts">
import { createEventDispatcher, onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { Record, ActionHash, AppAgentClient, EntryHash, AgentPubKey, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Observation } from './types';
import '@material/mwc-circular-progress';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';
import EditObservation from './EditObservation.svelte'; 

const dispatch = createEventDispatcher();

export let observationHash: ActionHash;

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let loading = true;
let error: any = undefined;

let record: Record | undefined;
let observation: Observation | undefined;

let editing = false;

  
$: editing,  error, loading, record, observation;

onMount(async () => {
  if (observationHash === undefined) {
    throw new Error(`The observationHash input is required for the ObservationDetail element`);
  }
  await fetchObservation();
});

async function fetchObservation() {
  loading = true;
  error = undefined;
  record = undefined;
  observation = undefined;
  
  try {
    record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'get_observation',
      payload: observationHash,
    });
    if (record) {
      observation = decode((record.entry as any).Present.entry) as Observation;
    }
  } catch (e) {
    error = e;
  }

  loading = false;
}

</script>


{#if loading}
<div style="display: flex; flex: 1; align-items: center; justify-content: center">
  <mwc-circular-progress indeterminate></mwc-circular-progress>
</div>
{:else if error}
<span>Error fetching the observation: {error}</span>
{:else if editing}
<EditObservation
  currentRecord={record}
  on:observation-updated={async () => {
    editing = false;
    await fetchObservation()
  } }
  on:edit-canceled={() => { editing = false; } }
></EditObservation>
{:else}

<div style="display: flex; flex-direction: column">
  <div style="display: flex; flex-direction: row">
    <span style="flex: 1"></span>
    <mwc-icon-button style="margin-left: 8px" icon="edit" on:click={() => { editing = true; } }></mwc-icon-button>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Observed At:</strong></span>
    <span style="white-space: pre-line">{ new Date(observation.observed_at / 1000).toLocaleString() }</span>
  </div>

</div>
{/if}

