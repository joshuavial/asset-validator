<script lang="ts">
import { onMount, getContext, createEventDispatcher } from 'svelte';
import { userContext } from '../../contexts';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { EntryHash, Record, AgentPubKey, ActionHash, AppAgentClient, NewEntryAction } from '@holochain/client';
import { clientContext } from '../../contexts';
import GenerationDetail from './GenerationDetail.svelte';
import type { ValidationClaimsSignal, Generation, GenerationWithHash } from './types';


let client: AppAgentClient = (getContext(clientContext) as any).getClient();
let user = (getContext(userContext) as any).getUser();
const dispatch = createEventDispatcher();

let hashes: Array<ActionHash> | undefined;
let generations: Array<Generation> | undefined;
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

async function fetchGenerations() {
  try {
    const links = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'get_generations',
      payload: null,
    });
    hashes = links.map(l => l.target);
    generations = await Promise.all(hashes.map(async (hash) => {
      const record: Record = await client.callZome({
        cap_secret: null,
        role_name: 'asset_validator',
        zome_name: 'validation_claims',
        fn_name: 'get_latest_generation',
        payload: hash,
      });
      let g = decode((record.entry as any).Present.entry) as Generation;
      return {generation: g, hash, action: record.signed_action} as GenerationWithHash;
    })) as Array<GenerationWithHash>;
    checkAndSetActiveGeneration(generations);
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
  <h2>All Generations</h2>
  {#each hashes as hash}
    <div style="margin-bottom: 8px;">
      <GenerationDetail generationHash={hash}  on:generation-deleted={() => fetchGenerations()}></GenerationDetail>
    </div>
  {/each}
</div>
{/if}
