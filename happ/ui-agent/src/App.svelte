<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import type { AppAgentClient, SigningCredentials} from '@holochain/client';
  import {setSigningCredentials} from '@holochain/client';
  import '@material/mwc-circular-progress';

  import {cellIdFromClient, getSigningCredentials, createSigningCredentials, saveSigningCredentials, newAppAgentWebsocket} from './lib'

  import { clientContext } from './contexts';
  import Welcome from './Welcome.svelte';

  let client: AppAgentClient | undefined;

  let currentTab = writable('overview');
  let signingCredentials = writable<SigningCredentials | null>(null);

  let loading = true; 
  let logout = async () => {
    localStorage.clear();
    signingCredentials.set(null);
    client = await newAppAgentWebsocket()

    setTab('welcome', {});
  };

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
  const handleAuthSuccess = (event) => {
    const cellId = cellIdFromClient(client)
    const {signingCredentials: credentials, handle, ethAddress} = event.detail
    setSigningCredentials(cellId, credentials); //update the writable
    signingCredentials.set(credentials); //update the ws client
    saveSigningCredentials(cellId, credentials); //save to local storage
    setTab('overview')
  }

</script>

<nav>
  <ul>
    {#if $signingCredentials}
      <li><button on:click={(e) => setTab('overview', e)}>Human Power</button></li>
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
      {#if $currentTab === 'overview'}
        Overview
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
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
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
