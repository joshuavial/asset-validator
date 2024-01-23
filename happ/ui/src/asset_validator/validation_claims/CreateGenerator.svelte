<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Generator } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

import '@material/mwc-textfield';
let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();


let name: string = '';

let errorSnackbar: Snackbar;

$: name;
$: isGeneratorValid = true && name !== '';


async function createGenerator() {  
  const generatorEntry: Generator = { 
    name: name!,
  };
  console.log(generatorEntry)
  
  try {
    const record: Record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'create_generator',
      payload: generatorEntry,
    });
    console.log(record)
    dispatch('generator-created', { generatorHash: record.signed_action.hashed.hash });
  } catch (e) {
  console.log(e)
    errorSnackbar.labelText = `Error creating the generator: ${e}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Create Generator</span>
  <div style="margin-bottom: 16px">
    <mwc-textfield outlined label="Name" value={ name } on:input={e => { name = e.target.value; } } required></mwc-textfield>          
  </div>
            

  <mwc-button 
    raised
    label="Create Generator"
    disabled={!isGeneratorValid}
    on:click={() => createGenerator()}
  ></mwc-button>
</div>
