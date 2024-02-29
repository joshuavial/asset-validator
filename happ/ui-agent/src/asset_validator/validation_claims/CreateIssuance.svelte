<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Issuance, IssuanceStatus } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

export let generationHashes!: Array<ActionHash>;

export let transaction: string | undefined;

export let quantity!: number;

export let status!: IssuanceStatus;



let errorSnackbar: Snackbar;

$: generationHashes, transaction, quantity, status;
$: isIssuanceValid = true;

onMount(() => {
  if (generationHashes === undefined) {
    throw new Error(`The generationHashes input is required for the CreateIssuance element`);
  }
  if (quantity === undefined) {
    throw new Error(`The quantity input is required for the CreateIssuance element`);
  }
  if (status === undefined) {
    throw new Error(`The status input is required for the CreateIssuance element`);
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
  


  <mwc-button 
    raised
    label="Create Issuance"
    disabled={!isIssuanceValid}
    on:click={() => createIssuance()}
  ></mwc-button>
</div>
