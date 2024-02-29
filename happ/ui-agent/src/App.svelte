<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import type { AppAgentClient, SigningCredentials} from '@holochain/client';
  import { setSigningCredentials } from '@holochain/client';
  import '@material/mwc-circular-progress';

  import {cellIdFromClient, getSigningCredentials, createSigningCredentials, newAppAgentWebsocket} from './lib'
  import Generations from './Generations.svelte';

  import Issuances from './asset_validator/validation_claims/Issuances.svelte';

  import { clientContext } from './contexts';
  import Welcome from './Welcome.svelte';

  let client: AppAgentClient;

  let currentTab = writable('generations');
  let signingCredentials = writable<SigningCredentials | null>(null);

  let logout = () => {
    localStorage.clear();
    // Additional logic to reset the application state may be added here
    window.location.reload(); // Optionally reload the page to reset the app state
  };

  let loading = true; 
  let password: string | null = null;

  setContext(clientContext, {
    getClient: () => client,
  });
  let setTab = (newTab:string, _e=null) => {
    currentTab.set(newTab);
  }

  onMount(async () => {
    client = await newAppAgentWebsocket();
    const cellId = cellIdFromClient(client);
    let credentials = getSigningCredentials(cellId);
    if (!credentials && password !== null) {
      credentials = await createSigningCredentials(cellId, password);
    }
    if (credentials) {
      signingCredentials.set(credentials);
      setSigningCredentials(cellId, credentials);
    } else {
      password = ''; // Prompt for password if credentials are not found
    }
    loading = false;
  });


</script>

{#if !client}
  <div>
    {#if password !== null}
      <input type="password" bind:value={password} placeholder="Enter your password" />
      <button on:click={handlePasswordSubmit}>Submit</button>
    {/if}
  </div>

{:else}
<nav>
  <ul>
    {#if $signingCredentials}
      <li><button on:click={(e) => setTab('generations', e)}>Human Power</button></li>
      <li><button on:click={(e) => setTab('issuances', e)}>Issuances</button></li>
      <li><button on:click={logout}>Logout</button></li>
      <li><button on:click={logout}>Logout</button></li>
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
     {#if $currentTab === 'issuances'}
       <Issuances />
     {/if}
    </div>
    {:else}
      <Welcome />
    {/if}
  {/if}
</main>
{/if}

<style>
  div {
    margin: 1em;
  }

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
