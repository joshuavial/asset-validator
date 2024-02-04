<script lang="ts">
import { createEventDispatcher, onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { Record, ActionHash, AppAgentClient, EntryHash, AgentPubKey, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { EthUser } from './types';
import '@material/mwc-circular-progress';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';

const dispatch = createEventDispatcher();

export let ethUserHash: ActionHash;

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let loading = true;
let error: any = undefined;

let record: Record | undefined;
let ethUser: EthUser | undefined;


  
$:  error, loading, record, ethUser;

onMount(async () => {
  if (ethUserHash === undefined) {
    throw new Error(`The ethUserHash input is required for the EthUserDetail element`);
  }
  await fetchEthUser();
});

async function fetchEthUser() {
  loading = true;
  error = undefined;
  record = undefined;
  ethUser = undefined;
  
  try {
    record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'eth_user',
      fn_name: 'get_eth_user',
      payload: ethUserHash,
    });
    if (record) {
      ethUser = decode((record.entry as any).Present.entry) as EthUser;
    }
  } catch (e) {
    error = e;
  }

  loading = false;
}

</script>


{#if loading}
<div style="display: flex; flex: 1; align-items: center; justify-content: center">
  <mwc-circular-progress indeterminate></mwc-circular-progress>
</div>
{:else if error}
<span>Error fetching the eth user: {error.data.data}</span>
{:else}

<div style="display: flex; flex-direction: column">
  <div style="display: flex; flex-direction: row">
    <span style="flex: 1"></span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Handle:</strong></span>
    <span style="white-space: pre-line">{ ethUser.handle }</span>
  </div>

  <div style="display: flex; flex-direction: row; margin-bottom: 16px">
    <span style="margin-right: 4px"><strong>Eth Address:</strong></span>
    <span style="white-space: pre-line">{ ethUser.eth_address }</span>
  </div>

</div>
{/if}

