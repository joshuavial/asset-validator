
<script lang="ts">
import { onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import type { Link, ActionHash, EntryHash, AppAgentClient, Record, AgentPubKey, NewEntryAction } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Issuance } from './types';
import IssuanceDetail from './IssuanceDetail.svelte';

export let generationHash: ActionHash;

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let links: Array<Link> | undefined;

let loading = true;
let error: any = undefined;

$: links, loading, error;

onMount(async () => {
  if (generationHash === undefined) {
    throw new Error(`The generationHash input is required for the IssuancesForGeneration element`);
  }

  try {
    links = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'get_issuances_for_generation',
      payload: generationHash
    });
  } catch (e) {
    error = e;
  }
  loading = false;
});

</script>

{#if loading }
<div style="display: flex; flex: 1; align-items: center; justify-content: center">
  <mwc-circular-progress indeterminate></mwc-circular-progress>
</div>
{:else if error}
<span>Error fetching issuances: ${error}.</span>
{:else if links.length === 0}
<span>No issuances found for this generation.</span>
{:else}
<div style="display: flex; flex-direction: column">
  {#each links as link}
    <div style="margin-bottom: 8px;">
      <IssuanceDetail issuanceHash={link.target}></IssuanceDetail>
    </div>
  {/each}
</div>
{/if}
