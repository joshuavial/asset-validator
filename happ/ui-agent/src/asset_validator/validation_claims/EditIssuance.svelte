<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, DnaHash, ActionHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';
import { clientContext } from '../../contexts';
import type { Issuance, IssuanceStatus } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-select';
import '@material/mwc-textfield';

import '@material/mwc-slider';
let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

export let originalIssuanceHash!: ActionHash;

export let currentRecord!: Record;
let currentIssuance: Issuance = decode((currentRecord.entry as any).Present.entry) as Issuance;

let transaction: string | undefined = currentIssuance.transaction;
let quantity: number | undefined = currentIssuance.quantity;
let status: IssuanceStatus | undefined = currentIssuance.status;

let errorSnackbar: Snackbar;

$: transaction, quantity, status;
$: isIssuanceValid = true && true && true;

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
    transaction: transaction,
    quantity: quantity!,
    status: status!,
    generation_hashes: currentIssuance.generation_hashes,
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
  
  <div style="margin-bottom: 16px">
    <mwc-textfield outlined label="Transaction" value={ transaction } on:input={e => { transaction = e.target.value; } } ></mwc-textfield>    
  </div>

  <div style="margin-bottom: 16px">
    <div style="display: flex; flex-direction: row">
      <span style="margin-right: 4px">Quantity</span>
    
      <mwc-slider value={ quantity } on:input={e => { quantity = e.detail.value; } } discrete></mwc-slider>
    </div>    
  </div>

  <div style="margin-bottom: 16px">
    <mwc-select outlined helper="Status" required>
  <mwc-list-item selected={ status.type === 'Created' } on:request-selected={() => { status = { type: 'Created' }; } }>Created</mwc-list-item>
  <mwc-list-item selected={ status.type === 'Finalised' } on:request-selected={() => { status = { type: 'Finalised' }; } }>Finalised</mwc-list-item>
</mwc-select>    
  </div>


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
