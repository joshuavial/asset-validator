<script lang="ts">
import { createEventDispatcher, onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { Record, ActionHash, AppAgentClient, EntryHash, AgentPubKey, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Generation, GenerationStatus } from './types';
import '@material/mwc-circular-progress';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';
import { formatDistanceToNow } from 'date-fns';

export let generationHash: ActionHash;

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let loading = true;
let error: any = undefined;

let record: Record | undefined;
let generation: Generation | undefined;
let timeAgo: string | undefined;

let editing = false;

let errorSnackbar: Snackbar;
  
$: editing,  error, loading, record, generation;

onMount(async () => {
  if (generationHash === undefined) {
    throw new Error(`The generationHash input is required for the GenerationDetail element`);
  }
  await fetchGeneration();
});

async function fetchGeneration() {
  loading = true;
  error = undefined;
  record = undefined;
  generation = undefined;
  timeAgo = undefined;
  
  try {
    record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'get_latest_generation',
      payload: generationHash,
    });
    if (record) {
      generation = decode((record.entry as any).Present.entry) as Generation;
      let timestamp = new Date(record.signed_action.hashed.content.timestamp / 1000);
      timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });
    }
  } catch (e) {
    error = e;
  }

  loading = false;
}

</script>

<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>

{#if loading}
<div style="display: flex; flex: 1; align-items: center; justify-content: center">
  <mwc-circular-progress indeterminate></mwc-circular-progress>
</div>
{:else if error}
<span>Error fetching the generation: {error.data.data}</span>
{:else}

<div style="display: flex; flex-direction: column">
  <div style="display: flex; flex-direction: row">
    <span style="flex: 1">
      {generation.user_handle}:
      {generation.status.type}:
      {timeAgo}
    </span>
  </div>

</div>
{/if}

