<script lang="ts">
import { onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import type { EntryHash, Record, AgentPubKey, ActionHash, AppAgentClient, NewEntryAction } from '@holochain/client';
import { clientContext } from '../../contexts';
import EthUserDetail from './EthUserDetail.svelte';
import type { EthUserSignal } from './types';


let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let hashes: Array<ActionHash> | undefined;
let loading = true;
let error: any = undefined;

$: hashes, loading, error;

onMount(async () => {

  await fetchEthUsers();
  client.on('signal', signal => {
    if (signal.zome_name !== 'eth_user') return;
    const payload = signal.payload as EthUserSignal;
    if (payload.type !== 'EntryCreated') return;
    if (payload.app_entry.type !== 'EthUser') return;
    hashes = [...hashes, payload.action.hashed.hash];
  });
});

async function fetchEthUsers() {
  try {
    const links = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'eth_user',
      fn_name: 'get_eth_users',
      payload: null,
    });
    hashes = links.map(l => l.target);
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
<span>Error fetching the eth users: {error.data.data}.</span>
{:else if hashes.length === 0}
<span>No eth users found.</span>
{:else}
<div style="display: flex; flex-direction: column">
  {#each hashes as hash}
    <div style="margin-bottom: 8px;">
      <EthUserDetail ethUserHash={hash}  on:eth-user-deleted={() => fetchEthUsers()}></EthUserDetail>
    </div>
  {/each}
</div>
{/if}

