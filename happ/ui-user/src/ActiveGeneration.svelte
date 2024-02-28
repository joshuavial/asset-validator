<script lang="ts">
import { getContext, onMount } from 'svelte';
import type { AppAgentClient} from '@holochain/client';
import {encodeHashToBase64} from '@holochain/client';

import type { GenerationWithHash } from '../../shared/types';
import { formatTimeAgo, get_observations_for_generation, onNewObservation } from '../../shared/lib';
import ObservationDetail from '../../shared/ObservationDetail.svelte'

import { clientContext } from './contexts';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

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
</script>

<h1>Your generation</h1>
<p>Created {timeAgo}</p>
<p>Status : {activeGeneration.generation.status.type} </p>
<p>Total Energy Generated: {totalJoules.toFixed(1)} joules</p>
{#each observations as observation}
  <ObservationDetail {observation} />
{/each}
