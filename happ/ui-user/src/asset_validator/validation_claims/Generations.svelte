<script lang="ts">
import { onMount, getContext, createEventDispatcher } from 'svelte';
import { userContext } from '../../contexts';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { EntryHash, Record, AgentPubKey, ActionHash, AppAgentClient, NewEntryAction } from '@holochain/client';
import { clientContext } from '../../contexts';
import GenerationDetail from './GenerationDetail.svelte';
import type { EntryHash, AgentPubKey, ActionHash, AppAgentClient } from '@holochain/client';
import { fetchGenerations } from '../../shared/lib/generations';
import type { ValidationClaimsSignal, GenerationWithHash } from './types';


let client: AppAgentClient = (getContext(clientContext) as any).getClient();
let user = (getContext(userContext) as any).getUser();
const dispatch = createEventDispatcher();

let hashes: Array<ActionHash> | undefined;
let generations: Array<Generation> | undefined;
let loading = true;
let error: any = undefined;

$: hashes, loading, error;

let generations: Array<GenerationWithHash> | undefined;
onMount(() => {
  fetchGenerationsWrapper();
  client.on('signal', signal => {
    if (signal.zome_name !== 'validation_claims') return;
    const payload = signal.payload as ValidationClaimsSignal;
    if (payload.type !== 'EntryCreated') return;
    if (payload.app_entry.type !== 'Generation') return;
    hashes = [payload.action.hashed.hash, ...hashes];
    checkAndSetActiveGeneration([{generation: payload.app_entry, hash: payload.action.hashed.hash, action: payload.action} as GenerationWithHash]);
  });
});

function checkAndSetActiveGeneration(generations: GenerationWithHash[]) {
  for (let generationWithHash of generations) {
    let {generation} = generationWithHash;
    if (generation.user_address === $user.eth_address && generation.status.type === 'Active') {
      dispatch('setActiveGeneration', { activeGeneration: generationWithHash });
      return 
    }
  }
}

async function fetchGenerationsWrapper() {
  loading = true;
  try {
    generations = await fetchGenerations(client);
    hashes = generations.map(g => g.hash);
    checkAndSetActiveGeneration(generations);
  } catch (e) {
    error = e;
  } finally {
    loading = false;
  }
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
  <h2>All Generations</h2>
  {#each hashes as hash}
    <div style="margin-bottom: 8px;">
      <GenerationDetail generationHash={hash}  on:generation-deleted={() => fetchGenerations()}></GenerationDetail>
    </div>
  {/each}
</div>
{/if}
