<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Issuance, IssuanceStatus } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';
import { GenerationStatus } from '../../types';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

export let generationHashes!: Array<EntryHash>;


let transaction: string | undefined = '';
let quantity: number = 0;
let status: IssuanceStatus = { type: 'Created' };

let errorSnackbar: Snackbar;

$: generationHashes, transaction, quantity, status;
$: isIssuanceValid = generationHashes.length > 0 && transaction !== '' && quantity > 0;

onMount(() => {
//TODO get all generations and add those that are complete to generationHashes
      .filter(g => g.generation.status.type === 'Complete')
      .map(g => g.hash);
  } catch (e) {
    errorSnackbar.labelText = `Error fetching generations: ${e}`;
    errorSnackbar.show();
  }
});

function validateIssuance() {
  return generationHashes.length > 0 && transaction !== '' && quantity > 0;
}

onMount(() => {
//TODO get all generations and add those that are complete to generationHashes
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
    errorSnackbar.labelText = `Error creating the issuance: ${e}`;
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
