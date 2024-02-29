<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, DnaHash, ActionHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';
import { clientContext } from '../../contexts';
import type { Issuance, IssuanceStatus } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

export let originalIssuanceHash!: ActionHash;

export let currentRecord!: Record;
let currentIssuance: Issuance = decode((currentRecord.entry as any).Present.entry) as Issuance;


let errorSnackbar: Snackbar;

$: ;
$: isIssuanceValid = true;

onMount(() => {
  if (currentRecord === undefined) {
    throw new Error(`The currentRecord input is required for the EditIssuance element`);
  }
  if (originalIssuanceHash === undefined) {
    throw new Error(`The originalIssuanceHash input is required for the EditIssuance element`);
  }
});

async function updateIssuance() {

  const issuance: Issuance = { 
    generation_hashes: currentIssuance.generation_hashes,
    transaction: currentIssuance.transaction,
    quantity: currentIssuance.quantity,
    status: currentIssuance.status,
  };

  try {
    const updateRecord: Record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'update_issuance',
      payload: {
        original_issuance_hash: originalIssuanceHash,
        previous_issuance_hash: currentRecord.signed_action.hashed.hash,
        updated_issuance: issuance
      }
    });
  
    dispatch('issuance-updated', { actionHash: updateRecord.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error updating the issuance: ${e.data.data}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Edit Issuance</span>
  

  <div style="display: flex; flex-direction: row">
    <mwc-button
      outlined
      label="Cancel"
      on:click={() => dispatch('edit-canceled')}
      style="flex: 1; margin-right: 16px"
    ></mwc-button>
    <mwc-button 
      raised
      label="Save"
      disabled={!isIssuanceValid}
      on:click={() => updateIssuance()}
      style="flex: 1;"
    ></mwc-button>
  </div>
</div>
