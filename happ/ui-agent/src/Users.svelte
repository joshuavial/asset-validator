<script lang="ts">
import { onMount, getContext } from 'svelte';
import { clientContext } from './contexts';
import type { Link } from '@holochain/client';

let client = (getContext(clientContext) as any).getClient();
let ethUsersLinks: Link[] = [];
let loading = true;
let error: any = undefined;

onMount(async () => {
  try {
    const result = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'eth_user',
      fn_name: 'get_eth_users',
      payload: null,
    });
    ethUsersLinks = result;
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
<div>
  <h1>Eth Users</h1>
  {#each ethUsersLinks as link}
    <p>{link.target}</p>
  {/each}
</div>
{/if}
