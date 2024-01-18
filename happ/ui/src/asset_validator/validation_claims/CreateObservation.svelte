<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Observation } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';
import '@vaadin/date-time-picker/theme/material/vaadin-date-time-picker.js';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

let observedAt: number = Date.now();

let errorSnackbar: Snackbar;

$: isObservationValid = true && true;

onMount(() => {
});

async function createObservation() {  
  const observationEntry: Observation = { 
    creator: null,
    observed_at: observedAt!,
  };
  
  try {
    const record: Record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'create_observation',
      payload: observationEntry,
    });
    dispatch('observation-created', { observationHash: record.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error creating the observation: ${e}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Create Observation</span>
  

  <div style="margin-bottom: 16px">
    <vaadin-date-time-picker label="Observed At" value={new Date(observedAt / 1000).toISOString()} on:change={e => { observedAt = new Date(e.target.value).valueOf() * 1000;} } required></vaadin-date-time-picker>          
  </div>
            

  <mwc-button 
    raised
    label="Create Observation"
    disabled={!isObservationValid}
    on:click={() => createObservation()}
  ></mwc-button>
</div>
