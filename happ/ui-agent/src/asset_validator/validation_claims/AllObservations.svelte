<script lang="ts">
import { onMount, getContext, createEventDispatcher } from 'svelte';
import { clientContext } from '../../contexts';
import ObservationDetail from './ObservationDetail.svelte';
import type { AppAgentClient, Record, ActionHash } from '@holochain/client';
import type { ValidationClaimsSignal, Observation } from './types';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let hashes: Array<ActionHash> | undefined;
let loading = true;
let error: any = undefined;

$: hashes, loading, error;

onMount(async () => {
  await fetchObservations();
  client.on('signal', signal => {
    if (signal.zome_name !== 'validation_claims') return;
    const payload = signal.payload as ValidationClaimsSignal;
    if (payload.type !== 'EntryCreated') return;
    if (payload.app_entry.type !== 'Observation') return;
    hashes = [...hashes, payload.app_entry as Observation];
  });
});

async function fetchObservations() {
  loading = true;
  error = undefined;
  hashes = [];

  try {
    const records = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'get_all_observations',
      payload: null,
    });
    hashes = records.map(r => r.signed_action.hashed.hash);
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
<span>Error fetching the observations: {error}.</span>
{:else if hashes.length === 0}
<span>No observations found.</span>
{:else}
<div style="display: flex; flex-direction: column">
  {#each hashes as hash}
    <div style="margin-bottom: 8px;">
      <ObservationDetail observationHash={hash}  on:observation-deleted={() => fetchObservations()}></ObservationDetail>
    </div>
  {/each}
</div>
{/if}
