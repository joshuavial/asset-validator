<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Generation, GenerationStatus } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

export let userAddress!: string;

export let status!: GenerationStatus;

export let signature!: string;



let errorSnackbar: Snackbar;

$: userAddress, status, signature;
$: isGenerationValid = true;

onMount(() => {
  if (userAddress === undefined) {
    throw new Error(`The userAddress input is required for the CreateGeneration element`);
  }
  if (status === undefined) {
    throw new Error(`The status input is required for the CreateGeneration element`);
  }
  if (signature === undefined) {
    throw new Error(`The signature input is required for the CreateGeneration element`);
  }
});

async function createGeneration() {  
  const generationEntry: Generation = { 
    user_address: userAddress!,
    status: status!,
    signature: signature!,
  };
  
  try {
    const record: Record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'create_generation',
      payload: generationEntry,
    });
    dispatch('generation-created', { generationHash: record.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error creating the generation: ${e.data.data}`;
    errorSnackbar.show();
  }
}
</script>

<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div class='createGeneration' style="display: flex; flex-direction: column">
  


  <mwc-button 
    raised
    label="Create Generation"
    disabled={!isGenerationValid}
    on:click={() => createGeneration()}
  ></mwc-button>
</div>

<style>
  .createGeneration {
    width: 300px;
    width: 500px;
    margin: auto;
  }

</style>
