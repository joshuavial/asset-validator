<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, DnaHash, ActionHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';
import { clientContext } from '../../contexts';
import type { Observation } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

import '@vaadin/date-time-picker/theme/material/vaadin-date-time-picker.js';
let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

export let currentRecord!: Record;
let currentObservation: Observation = decode((currentRecord.entry as any).Present.entry) as Observation;

let observedAt: number | undefined = currentObservation.observed_at;

let errorSnackbar: Snackbar;

$: observedAt;
$: isObservationValid = true && true;

onMount(() => {
  if (currentRecord === undefined) {
    throw new Error(`The currentRecord input is required for the EditObservation element`);
  }
});

async function updateObservation() {

  const observation: Observation = { 
    observed_at: observedAt!,
    creator: currentObservation.creator,
  };

  try {
    const updateRecord: Record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'update_observation',
      payload: {
        previous_observation_hash: currentRecord.signed_action.hashed.hash,
        updated_observation: observation
      }
    });
  
    dispatch('observation-updated', { actionHash: updateRecord.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error updating the observation: ${e}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Edit Observation</span>
  
  <div style="margin-bottom: 16px">
    <vaadin-date-time-picker label="Observed At" value={new Date(observedAt / 1000).toISOString()} on:change={e => { observedAt = new Date(e.target.value).valueOf() * 1000;} } required></vaadin-date-time-picker>    
  </div>


  <div style="display: flex; flex-direction: row">
    <mwc-button
      outlined
      label="Cancel"
      on:click={() => dispatch('edit-canceled')}
      style="flex: 1; margin-right: 16px"
    ></mwc-button>
    <mwc-button 
      raised
      label="Save"
      disabled={!isObservationValid}
      on:click={() => updateObservation()}
      style="flex: 1;"
    ></mwc-button>
  </div>
</div>
