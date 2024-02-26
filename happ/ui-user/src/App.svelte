<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import type { AppAgentClient, SigningCredentials} from '@holochain/client';
  import {setSigningCredentials} from '@holochain/client';
  import '@material/mwc-circular-progress';

  import type {EthUser} from './asset_validator/eth_user/types';
  import {cellIdFromClient, getSigningCredentials, saveSigningCredentials, newAppAgentWebsocket, whoAmI} from './lib'

  import { clientContext, userContext } from './contexts';
  import Welcome from './Welcome.svelte';
  import LoginOrRegister from './LoginOrRegister.svelte';

  import Generate from './Generate.svelte';

  let client: AppAgentClient | undefined;

  let currentTab = writable('generate');
  let signingCredentials = writable<SigningCredentials | null>(null);
  let me = writable<EthUser>({handle: '', eth_address: ''});

  let loading = true; 
  let logout = async () => {
    localStorage.clear();
    signingCredentials.set(null);
    client = await newAppAgentWebsocket()
    me.set({handle: '', ethAddress: ''});

    setTab('welcome', {});
  };

  onMount(async () => {
    client = await newAppAgentWebsocket()
    const cellId = cellIdFromClient(client)
    let credentials = getSigningCredentials(cellId);
    if (credentials) {
      signingCredentials.set(credentials);
      setSigningCredentials(cellId, credentials)
      const maybeMe = await whoAmI(client, credentials.signingKey)
      me.set(maybeMe)
    } 
    loading = false;
  });

  setContext(clientContext, {
    getClient: () => client,
  });
  setContext(userContext, {
    getUser: () => me
  }); 
  let setTab = (newTab:string, _e=null) => {
    currentTab.set(newTab);
  }
  const handleAuthSuccess = (event) => {
    const cellId = cellIdFromClient(client)
    const {signingCredentials: credentials, handle, ethAddress} = event.detail
    me.set({handle, eth_address: ethAddress, current_pub_key: credentials.signingKey});
    setSigningCredentials(cellId, credentials); //update the writable
    signingCredentials.set(credentials); //update the ws client
    saveSigningCredentials(cellId, credentials); //save to local storage
    setTab('generate')
  }

</script>

<nav>
  <ul>
    {#if $signingCredentials}
    <li><button on:click={(e) => setTab('generate', e)}>Human Power</button></li>
    <li><button on:click={logout}>Logout</button></li>
    {:else}
    <li><button on:click={(e) => setTab('welcome', e)}>Welcome</button></li>
    <li><button on:click={(e) => setTab('loginOrRegister', e)}>Login</button></li>

    {/if}
  </ul>
</nav>

<main>
{#if $me.handle}
<div>
  Hello {$me.handle} : {$me.eth_address.slice(0,10)}..
</div>
{/if}
  {#if loading}
    <div style="display: flex; flex: 1; align-items: center; justify-content: center">
      <mwc-circular-progress indeterminate />
    </div>
  {:else}
    {#if $signingCredentials}
    <div id="content" style="display: flex; flex-direction: column; flex: 1;">
      {#if $currentTab === 'generate'}
        <Generate />
      {/if}
    </div>
    {:else}
      {#if $currentTab === 'loginOrRegister'}
        <LoginOrRegister on:authSuccess={handleAuthSuccess} />
      {:else}
        <Welcome />
      {/if}
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
  @media (max-width: 640px) {
   nav ul {
     list-style: none;
   }
  }
</style>
