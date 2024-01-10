<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import type { ActionHash, AppAgentClient } from '@holochain/client';
  import { AppAgentWebsocket } from '@holochain/client';
  import '@material/mwc-circular-progress';
  import CreateGenerator from './asset_validator/validation_claims/CreateGenerator.svelte';
  import GeneratorDetail from './asset_validator/validation_claims/GeneratorDetail.svelte';
  import AllGenerators from './asset_validator/validation_claims/AllGenerators.svelte';

  import { clientContext } from './contexts';

  let client: AppAgentClient | undefined;

  let loading = true; 


  onMount(async () => {
    // We pass an unused string as the url because it will dynamically be replaced in launcher environments
    client = await AppAgentWebsocket.connect(new URL('https://UNUSED'), 'asset-validator');

    loading = false;
  });

  setContext(clientContext, {
    getClient: () => client,
  });
</script>

<main>
  {#if loading}
    <div style="display: flex; flex: 1; align-items: center; justify-content: center">
      <mwc-circular-progress indeterminate />
    </div>
  {:else}
    <div id="content" style="display: flex; flex-direction: column; flex: 1;">
      <CreateGenerator />
      <AllGenerators />
    </div>
  {/if}
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
