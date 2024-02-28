<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
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

export let generationHashes!: Array<EntryHash>;


let transaction: string | undefined = '';
let quantity: number = 0;
let status: IssuanceStatus = { type: 'Created' };

let errorSnackbar: Snackbar;

$: generationHashes, transaction, quantity, status;
$: isIssuanceValid = true && true && true;

onMount(() => {
  if (generationHashes === undefined) {
    throw new Error(`The generationHashes input is required for the CreateIssuance element`);
  }
});

async function createIssuance() {  
  const issuanceEntry: Issuance = { 
    generation_hashes: generationHashes,
    transaction: transaction,
    quantity: quantity!,
    status: status!,
  };
  
  try {
    const record: Record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'create_issuance',
      payload: issuanceEntry,
    });
    dispatch('issuance-created', { issuanceHash: record.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error creating the issuance: ${e.data.data}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Create Issuance</span>
  

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
            

  <mwc-button 
    raised
    label="Create Issuance"
    disabled={!isIssuanceValid}
    on:click={() => createIssuance()}
  ></mwc-button>
</div>
