<script lang="ts">
import { getContext, onMount } from 'svelte';
import type { AppAgentClient} from '@holochain/client';

import type { GenerationWithHash } from '../../shared/types';
import { formatTimeAgo, get_observations_for_generation, onNewObservation } from '../../shared/lib';
import ObservationDetail from '../../shared/ObservationDetail.svelte'

import { clientContext } from './contexts';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

export let activeGeneration: GenerationWithHash;
let timeAgo: string | undefined;
let observations: Observation[] = [];

onMount(async () => {
  if (activeGeneration === undefined) {
    throw new Error('The activeGeneration input is required for the ActiveGeneration element');
  }

  try {
  observations = await get_observations_for_generation(client, activeGeneration.hash);
  timeAgo = formatTimeAgo(activeGeneration.action.hashed.content.timestamp); 

  onNewObservation(client, (payload) => {
    observations = [...observations, payload.app_entry as Observation];
  });
  console.log(observations);
  } catch (error) {
    console.log(error);
  }
});
</script>

<h1>Your generation</h1>
<p>Created {timeAgo}</p>
<p>Status : {activeGeneration.generation.status.type} </p>
{#each observations as observation}
  <ObservationDetail {observation} />
{/each}
