<script lang="ts">
import { createEventDispatcher, onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { Record, ActionHash, AppAgentClient, EntryHash, AgentPubKey, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Generator } from './types';
import '@material/mwc-circular-progress';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';
import EditGenerator from './EditGenerator.svelte'; 

const dispatch = createEventDispatcher();

export let generatorHash: ActionHash;

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let loading = true;
let isAuthor = false;
let error: any = undefined;

let record: Record | undefined;
let generator: Generator | undefined;

let editing = false;

let errorSnackbar: Snackbar;
  
$: editing,  error, loading, record, generator;

onMount(async () => {
  if (generatorHash === undefined) {
    throw new Error(`The generatorHash input is required for the GeneratorDetail element`);
  }
  await fetchGenerator();
});

async function fetchGenerator() {
  loading = true;
  error = undefined;
  record = undefined;
  generator = undefined;
  
  try {
    record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'get_generator',
      payload: generatorHash,
    });
    if (record) {
      generator = decode((record.entry as any).Present.entry) as Generator;
      isAuthor = (record.signed_action.hashed.content.author === client.agentPubKey);
    }
  } catch (e) {
    error = e;
  }

  loading = false;
}

async function deleteGenerator() {
  try {
    await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'delete_generator',
      payload: generatorHash,
    });
    dispatch('generator-deleted', { generatorHash: generatorHash });
  } catch (e: any) {
    errorSnackbar.labelText = `Error deleting the generator: ${e}`;
    errorSnackbar.show();
  }
}
</script>

<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>

{#if loading}
<div style="display: flex; flex: 1; align-items: center; justify-content: center">
  <mwc-circular-progress indeterminate></mwc-circular-progress>
</div>
{:else if error}
<span>Error fetching the generator: {error}</span>
{:else if editing}
<EditGenerator
  currentRecord={record}
  on:generator-updated={async () => {
    editing = false;
    await fetchGenerator()
  } }
  on:edit-canceled={() => { editing = false; } }
></EditGenerator>
{:else}

<div style="display: flex; flex-direction: column">
  <div style="display: flex; flex-direction: row">
    <span style="flex: 1"></span>
    {#if isAuthor}
    <mwc-icon-button style="margin-left: 8px" icon="edit" on:click={() => { editing = true; } }></mwc-icon-button>
    <mwc-icon-button style="margin-left: 8px" icon="delete" on:click={() => deleteGenerator()}></mwc-icon-button>
    {/if}
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Name:</strong></span>
    <span style="white-space: pre-line">{ generator.name }</span>
  </div>

</div>
{/if}

