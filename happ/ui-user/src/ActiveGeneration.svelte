<script lang="ts">
import { getContext, onMount, createEventDispatcher } from 'svelte';
import type { AppAgentClient } from '@holochain/client';
import { updateGenerationStatus } from '../../shared/lib/generation';
import {encodeHashToBase64} from '@holochain/client';

import type { GenerationWithHash, Observation } from '../../shared/types';
import { formatTimeAgo, get_observations_for_generation, onNewObservation } from '../../shared/lib';
import ObservationDetail from '../../shared/ObservationDetail.svelte'

import { clientContext } from './contexts';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();
const dispatch = createEventDispatcher();

export let activeGeneration: GenerationWithHash;
let timeAgo: string | undefined;
let observations: Observation[] = [];
let totalJoules: number = 0;

onMount(async () => {
  if (activeGeneration === undefined) {
    throw new Error('The activeGeneration input is required for the ActiveGeneration element');
  }

  try {
  observations = await get_observations_for_generation(client, activeGeneration.hash);
  timeAgo = formatTimeAgo(activeGeneration.action.hashed.content.timestamp); 

  totalJoules = observations.reduce((acc, observation) => {
    if (observation.data.EnergyObservation) {
      return acc + observation.data.EnergyObservation.energy;
    }
    return acc;
  }, 0);

  onNewObservation(client, (payload) => {
    if (encodeHashToBase64(activeGeneration.hash) == encodeHashToBase64(payload.app_entry.generation_hash)) {
      observations = [...observations, payload.app_entry as Observation];
      if (payload.app_entry.data.EnergyObservation) {
        totalJoules += payload.app_entry.data.EnergyObservation.energy;
      }
    }
  });
  } catch (error) {
    console.log(error);
  }
});


  const handleDoneClick = async () => {
    try {
      await updateGenerationStatus(client, activeGeneration, 'Complete');
      dispatch('setActiveGeneration', { activeGeneration: null});
    } catch (error) {
      console.error('Error updating generation status:', error);
    }
  };
</script>

<h1>Ready for Human Power?</h1>
<p>Total Energy Generated: <span class='total'>{totalJoules.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</span> joules</p>
<mwc-button 
  raised
  label="I'm done"
  class='done'
  on:click={handleDoneClick}></mwc-button>
<p>Status : {activeGeneration.generation.status.type} </p>
{#each observations as observation}
  <ObservationDetail {observation} />
{/each}

<style>
  .total {
    font-weight: bold;
    color: green;
    font-size: 2em;
  }
</style>

