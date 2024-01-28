<script lang="ts">
import { createEventDispatcher, onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { Record, ActionHash, AppAgentClient, EntryHash, AgentPubKey, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Observation, EnergyData } from './types';
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
  console.log(observationHash)
    record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'get_observation',
      payload: observationHash,
    });
    if (record) {
    console.log(record)
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


  {#if observation.data.EnergyObservation}
  <div style="margin-bottom: 16px">
    <span>
      <strong>Energy Usage:</strong> { observation.data.EnergyObservation.energy } joules from
      { new Date(observation.data.EnergyObservation.from * 1000).toLocaleString() } to
      { new Date(observation.data.EnergyObservation.to * 1000).toLocaleString() }
    </span>
  </div>
  {/if}

</div>
{/if}
