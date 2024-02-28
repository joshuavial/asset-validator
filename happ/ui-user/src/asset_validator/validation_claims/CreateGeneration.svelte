<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record } from '@holochain/client';
import { clientContext, userContext } from '../../contexts';
import type { Generation } from './types';
import type { EthUser } from '../eth_user/types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();
let user: EthUser = (getContext(userContext) as any).getUser();

const dispatch = createEventDispatcher();

let errorSnackbar: Snackbar;

$: isGenerationValid = true;

async function createGeneration() {  
  const generationEntry: Generation = { 
    user_handle: $user.handle,
    user_address: $user.eth_address,
    status: { type: 'Active'},
    signature: null,
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
    errorSnackbar.labelText = `Error creating the generation: ${e}`;
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
    max-width: 500px;
    margin: 20px auto;
    padding: 0 10px;
  }
  .generationButton {
    width: 100%;
    margin-top: 20px;
    margin-bottom: 20px;
  }

</style>
