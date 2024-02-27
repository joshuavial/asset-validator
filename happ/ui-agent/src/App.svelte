<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import type { AppAgentClient, SigningCredentials} from '@holochain/client';
  import {setSigningCredentials} from '@holochain/client';
  import '@material/mwc-circular-progress';

  import {cellIdFromClient, getSigningCredentials, createSigningCredentials, newAppAgentWebsocket} from './lib'
  import Generations from './Generations.svelte';

  import { clientContext } from './contexts';
  import Welcome from './Welcome.svelte';

  let client: AppAgentClient | undefined;

  let currentTab = writable('generations');
  let signingCredentials = writable<SigningCredentials | null>(null);

  let loading = true; 

  onMount(async () => {
    client = await newAppAgentWebsocket()
    const cellId = cellIdFromClient(client)
    let credentials = getSigningCredentials(cellId);
    if (!credentials) {
      credentials = await createSigningCredentials(cellId);
    }
    signingCredentials.set(credentials);
    setSigningCredentials(cellId, credentials)
    loading = false;
  });

  setContext(clientContext, {
    getClient: () => client,
  });
  let setTab = (newTab:string, _e=null) => {
    currentTab.set(newTab);
  }

</script>

<nav>
  <ul>
    {#if $signingCredentials}
      <li><button on:click={(e) => setTab('generations', e)}>Human Power</button></li>
    {/if}
  </ul>
</nav>

<main>
  {#if loading}
    <div style="display: flex; flex: 1; align-items: center; justify-content: center">
      <mwc-circular-progress indeterminate />
    </div>
  {:else}
    {#if $signingCredentials}
    <div id="content" style="display: flex; flex-direction: column; flex: 1;">
      {#if $currentTab === 'generations'}
        <Generations />
      {/if}
    </div>
    {:else}
      <Welcome />
    {/if}
  {/if}
</main>

<style>
  main {
    text-align: center;
    padding: 0.5em;
    max-width: 90%;
    margin: 0 auto;
  }
  nav ul {
    list-style: none;
    padding: 0;
  }

  @media (min-width: 640px) {
    nav ul {
      display: flex;
      justify-content: center;
      margin-bottom: 1em;
    }

    nav ul li {
      margin: 0 1em;
    }

    nav ul li a {
      text-decoration: none;
      color: #333;
      font-weight: bold;
    }

   nav ul {
     list-style: none;
     padding: 0;
     display: flex;
     justify-content: center;
     margin-bottom: 1em;
   }

   nav ul li {
     margin: 0 1em;
   }

   nav ul li a {
     text-decoration: none;
     color: #333;
     font-weight: bold;
   }

    main {
      max-width: none;
    }
  }
</style>
