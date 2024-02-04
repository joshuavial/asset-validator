<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, DnaHash, ActionHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';
import { clientContext } from '../../contexts';
import type { Generator } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

import '@material/mwc-textfield';
let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

export let currentRecord!: Record;
let currentGenerator: Generator = decode((currentRecord.entry as any).Present.entry) as Generator;

let name: string | undefined = currentGenerator.name;

let errorSnackbar: Snackbar;

$: name;
$: isGeneratorValid = true && name !== '';

onMount(() => {
  if (currentRecord === undefined) {
    throw new Error(`The currentRecord input is required for the EditGenerator element`);
  }
});

async function updateGenerator() {

  const generator: Generator = { 
    name: name!,
  };

  try {
    const updateRecord: Record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'update_generator',
      payload: {
        previous_generator_hash: currentRecord.signed_action.hashed.hash,
        updated_generator: generator
      }
    });
  
    dispatch('generator-updated', { actionHash: updateRecord.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error updating the generator: ${e}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Edit Generator</span>
  
  <div style="margin-bottom: 16px">
    <mwc-textfield outlined label="Name" value={ name } on:input={e => { name = e.target.value; } } required></mwc-textfield>    
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
      disabled={!isGeneratorValid}
      on:click={() => updateGenerator()}
      style="flex: 1;"
    ></mwc-button>
  </div>
</div>
