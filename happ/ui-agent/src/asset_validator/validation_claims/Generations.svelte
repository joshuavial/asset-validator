<script lang="ts">
import { onMount, getContext, createEventDispatcher } from 'svelte';
import { userContext } from '../../contexts';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { EntryHash, Record, AgentPubKey, ActionHash, AppAgentClient, NewEntryAction } from '@holochain/client';

import {getSensorAllocations, allocateSensor} from '../../lib';
import { clientContext } from '../../contexts';
import GenerationDetail from './GenerationDetail.svelte';
import type { ValidationClaimsSignal, Generation, GenerationWithHash } from './types';


let client: AppAgentClient = (getContext(clientContext) as any).getClient();
const dispatch = createEventDispatcher();

let sensorAllocations: Record<string, string | null> = {};
let hashes: Array<ActionHash> | undefined;
let loading = true;
let error: any = undefined;

$: hashes, loading, error;

onMount(async () => {
  await fetchGenerations();
  client.on('signal', signal => {
    if (signal.zome_name !== 'validation_claims') return;
    const payload = signal.payload as ValidationClaimsSignal;
    if (payload.type !== 'EntryCreated') return;
    if (payload.app_entry.type !== 'Generation') return;
    hashes = [...hashes, payload.action.hashed.hash];
  });

  try {
    sensorAllocations = await getSensorAllocations();
  } catch (error) {
    console.error('Error fetching sensor allocations:', error);
  }
});

async function allocateSensorToGeneration(event: Event) {
  try {
    const { sensor_id, generationHash } = event.detail;
    sensorAllocations = await allocateSensor(sensor_id, generationHash);
  } catch (error) {
    console.error('Error allocating sensor to generation:', error);
  }
}

async function fetchGenerations() {
  try {
    const links = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'get_generations',
      payload: null,
    });
    hashes = links.map(l => l.target).slice(0, 10);
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
<span>Error fetching the generations: {error}.</span>
{:else if hashes.length === 0}
<span>No generations found.</span>
{:else}
<div style="display: flex; flex-direction: column">
  <h2>Last 10 Generations</h2>
  {#each hashes as hash}
    <div style="margin-bottom: 8px;">
      <GenerationDetail {hash} {sensorAllocations} on:generation-deleted={() => fetchGenerations()} on:allocate-sensor={allocateSensorToGeneration}></GenerationDetail>
    </div>
  {/each}
</div>
{/if}
