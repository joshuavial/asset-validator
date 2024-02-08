<script lang="ts">
import { onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import type { EntryHash, Record, AgentPubKey, ActionHash, AppAgentClient, NewEntryAction } from '@holochain/client';
import { clientContext } from '../../contexts';
import GenerationDetail from './GenerationDetail.svelte';
import type { ValidationClaimsSignal } from './types';


let client: AppAgentClient = (getContext(clientContext) as any).getClient();

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
});

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
<span>Error fetching the generations: {error.data.data}.</span>
{:else if hashes.length === 0}
<span>No generations found.</span>
{:else}
<div style="display: flex; flex-direction: column">
  {#each hashes as hash}
    <div style="margin-bottom: 8px;">
      <GenerationDetail generationHash={hash}  on:generation-deleted={() => fetchGenerations()}></GenerationDetail>
    </div>
  {/each}
</div>
{/if}

