<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
import { clientContext, userContext } from '../../contexts';
import type { Generation, GenerationStatus } from './types';
import type { EthUser } from '../eth_user/types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();
let user: EthUser = (getContext(userContext) as any).getUser();

const dispatch = createEventDispatcher();

const userAddress: string = user.eth_address;

const status: GenerationStatus = GenerationStatus.Active;

let signaturea = ''



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
    status: status,
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
  <mwc-button class="generationButton"
    raised
    label="Start Pedalling"
    disabled={!isGenerationValid}
    on:click={() => createGeneration()}
  ></mwc-button>
</div>

<style>
  .createGeneration {
    width: 500px;
    margin: auto;
  }
  .generationButton {
    width: 300px;
    margin: auto;
    margin-top: 20px;
  }

</style>
