<script lang="ts">
import { onMount, getContext } from 'svelte';
import { clientContext } from './contexts';
import { saveAs } from 'file-saver';
import type { Link } from '@holochain/client';
import { decode } from '@msgpack/msgpack';
import type { EthUser } from './asset_validator/eth_user/types';

let client = (getContext(clientContext) as any).getClient();
let ethUsers: Map<string, EthUser> = new Map();
let loading = true;
let error: any = undefined;

function downloadCSV() {
  const csvContent = "data:text/csv;charset=utf-8," 
    + "Eth Address,Handle\n"
    + Array.from(ethUsers.values())
      .map(u => `${u.eth_address},${u.handle}`)
      .join("\n");
  const encodedUri = encodeURI(csvContent);
  saveAs(encodedUri, "eth_users.csv");
}

onMount(async () => {
  try {
    const links = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'eth_user',
      fn_name: 'get_eth_users',
      payload: null,
    });
    for (const link of links) {
      const ethUserRecord = await client.callZome({
        cap_secret: null,
        role_name: 'asset_validator',
        zome_name: 'eth_user',
        fn_name: 'get_eth_user',
        payload: link.target,
      });
      if (ethUserRecord) {
        const ethUser = decode((ethUserRecord.entry as any).Present.entry) as EthUser;
        ethUsers.set(ethUser.eth_address, ethUser); // Use eth_address as the key for uniqueness
      }
    }
  } catch (e) {
    error = e;
  } finally {
    loading = false;
  }
});
</script>

{#if loading}
<div>Loading...</div>
{:else if error}
<div>Error: {error}</div>
{:else}
<button on:click={downloadCSV}>Download CSV</button>
<div>
  <h1>Eth Users</h1>
  {#each Array.from(ethUsers.values()) as user}
    <p>{user.eth_address} - {user.handle}</p>
  {/each}
</div>
{/if}
