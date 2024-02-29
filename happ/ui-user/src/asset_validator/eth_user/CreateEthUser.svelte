<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { EthUser } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

import '@material/mwc-textfield';
let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

export let currentPubKey!: AgentPubKey;


let handle: string = '';
let ethAddress: string = '';

let errorSnackbar: Snackbar;

$: handle, ethAddress, currentPubKey;
$: isEthUserValid = true && handle !== '' && ethAddress !== '';

onMount(() => {
  if (currentPubKey === undefined) {
    throw new Error(`The currentPubKey input is required for the CreateEthUser element`);
  }
});

async function createEthUser() {  
  const ethUserEntry: EthUser = { 
    handle: handle!,
    eth_address: ethAddress!,
    current_pub_key: currentPubKey!,
  };
  
  try {
    const record: Record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'eth_user',
      fn_name: 'create_eth_user',
      payload: ethUserEntry,
    });
    dispatch('eth-user-created', { ethUserHash: record.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error creating the eth user: ${e}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Create EthUser</span>
  

  <div style="margin-bottom: 16px">
    <mwc-textfield outlined label="Handle" value={ handle } on:input={e => { handle = e.target.value; } } required></mwc-textfield>          
  </div>
            
  <div style="margin-bottom: 16px">
    <mwc-textfield outlined label="Eth Address" value={ ethAddress } on:input={e => { ethAddress = e.target.value; } } required></mwc-textfield>          
  </div>
            

  <mwc-button 
    raised
    label="Create EthUser"
    disabled={!isEthUserValid}
    on:click={() => createEthUser()}
  ></mwc-button>
</div>
