<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, DnaHash, ActionHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';
import { clientContext } from '../../contexts';
import type { Generation, GenerationStatus } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

export let originalGenerationHash!: ActionHash;

export let currentRecord!: Record;
let currentGeneration: Generation = decode((currentRecord.entry as any).Present.entry) as Generation;


let errorSnackbar: Snackbar;

$: ;
$: isGenerationValid = true;

onMount(() => {
  if (currentRecord === undefined) {
    throw new Error(`The currentRecord input is required for the EditGeneration element`);
  }
  if (originalGenerationHash === undefined) {
    throw new Error(`The originalGenerationHash input is required for the EditGeneration element`);
  }
});

async function updateGeneration() {

  const generation: Generation = { 
    user_address: currentGeneration.user_address,
    status: currentGeneration.status,
    signature: currentGeneration.signature,
  };

  try {
    const updateRecord: Record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'update_generation',
      payload: {
        original_generation_hash: originalGenerationHash,
        previous_generation_hash: currentRecord.signed_action.hashed.hash,
        updated_generation: generation
      }
    });
  
    dispatch('generation-updated', { actionHash: updateRecord.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error updating the generation: ${e}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Edit Generation</span>
  

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
      disabled={!isGenerationValid}
      on:click={() => updateGeneration()}
      style="flex: 1;"
    ></mwc-button>
  </div>
</div>
