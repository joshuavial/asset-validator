<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Observation, EnergyData } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';
import '@vaadin/date-time-picker/theme/material/vaadin-date-time-picker.js';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

let observedAt: number = Math.floor(Date.now() / 1000);
let from: number = observedAt;
let to: number = observedAt + 3600; // default to one hour later
let energy: number = 0;

let errorSnackbar: Snackbar;

$: isObservationValid = true && true;

onMount(() => {
});

async function createObservation() {  
  const energyData: EnergyData = {
    from: from,
    to: to,
    energy: energy,
  };

  const observationEntry: Observation = {
    observed_at: observedAt,
    data: {
      EnergyObservation: energyData,
    },
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
  

  <div style="margin-bottom: 16px;">
    <vaadin-date-time-picker label="Observed At" value={new Date(observedAt * 1000).toISOString()} on:change={e => { observedAt = Math.floor(new Date(e.target.value).valueOf() / 1000);}} required></vaadin-date-time-picker>
  </div>
  <div style="margin-bottom: 16px;">
    <vaadin-date-time-picker label="From" value={new Date(from * 1000).toISOString()} on:change={e => { from = Math.floor(new Date(e.target.value).valueOf() / 1000);}} required></vaadin-date-time-picker>
  </div>
  <div style="margin-bottom: 16px;">
    <vaadin-date-time-picker label="To" value={new Date(to * 1000).toISOString()} on:change={e => { to = Math.floor(new Date(e.target.value).valueOf() / 1000);}} required></vaadin-date-time-picker>
  </div>
  <div style="margin-bottom: 16px;">
    <mwc-textfield label="Energy (in joules)" type="number" min="0" step="any" value={energy.toString()} on:change={e => { energy = parseFloat(e.target.value);}} required></mwc-textfield>
  </div>
            

  <mwc-button 
    raised
    label="Create Observation"
    disabled={!isObservationValid}
    on:click={() => createObservation()}
  ></mwc-button>
</div>
