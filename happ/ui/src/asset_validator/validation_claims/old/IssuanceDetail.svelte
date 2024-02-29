<script lang="ts">
import { createEventDispatcher, onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { Record, ActionHash, AppAgentClient, EntryHash, AgentPubKey, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Issuance, IssuanceStatus } from './types';
import '@material/mwc-circular-progress';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';
import EditIssuance from './EditIssuance.svelte'; 

const dispatch = createEventDispatcher();

export let issuanceHash: ActionHash;

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let loading = true;
let error: any = undefined;

let record: Record | undefined;
let issuance: Issuance | undefined;

let editing = false;

let errorSnackbar: Snackbar;
  
$: editing,  error, loading, record, issuance;

onMount(async () => {
  if (issuanceHash === undefined) {
    throw new Error(`The issuanceHash input is required for the IssuanceDetail element`);
  }
  await fetchIssuance();
});

async function fetchIssuance() {
  loading = true;
  error = undefined;
  record = undefined;
  issuance = undefined;
  
  try {
    record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'get_latest_issuance',
      payload: issuanceHash,
    });
    if (record) {
      issuance = decode((record.entry as any).Present.entry) as Issuance;
    }
  } catch (e) {
    error = e;
  }

  loading = false;
}

async function deleteIssuance() {
  try {
    await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'delete_issuance',
      payload: issuanceHash,
    });
    dispatch('issuance-deleted', { issuanceHash: issuanceHash });
  } catch (e: any) {
    errorSnackbar.labelText = `Error deleting the issuance: ${e}`;
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
<span>Error fetching the issuance: {error}</span>
{:else if editing}
<EditIssuance
  originalIssuanceHash={ issuanceHash}
  currentRecord={record}
  on:issuance-updated={async () => {
    editing = false;
    await fetchIssuance()
  } }
  on:edit-canceled={() => { editing = false; } }
></EditIssuance>
{:else}

<div style="display: flex; flex-direction: column">
  <div style="display: flex; flex-direction: row">
    <span style="flex: 1"></span>
    <mwc-icon-button style="margin-left: 8px" icon="edit" on:click={() => { editing = true; } }></mwc-icon-button>
    <mwc-icon-button style="margin-left: 8px" icon="delete" on:click={() => deleteIssuance()}></mwc-icon-button>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Transaction:</strong></span>
    <span style="white-space: pre-line">{ issuance.transaction }</span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Quantity:</strong></span>
    <span style="white-space: pre-line">{ issuance.quantity }</span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Status:</strong></span>
    <span style="white-space: pre-line">{  issuance.status.type === 'Created' ? `Created` :  `Finalised`  }</span>
  </div>

</div>
{/if}

