<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import type { AppAgentClient,SigningCredentials } from '@holochain/client';
  import {AppAgentWebsocket, encodeHashToBase64, decodeHashFromBase64, generateSigningKeyPair, setSigningCredentials} from '@holochain/client';
  import '@material/mwc-circular-progress';

  import { clientContext } from './contexts';

  import Generators from './Generators.svelte';
  import Observations from './Observations.svelte';
  import Scan from './Scan.svelte';

  let client: AppAgentClient | undefined;

  let currentTab = writable('generators');

  let loading = true; 

  onMount(async () => {
    let response = await fetch('http://127.0.0.1:5000/agent_ws');
    let data = await response.json();
    let url = data.agent_ws_url;
    client = await AppAgentWebsocket.connect(new URL(url), 'asset-validator');
    const cellId = client.cachedAppInfo.cell_info.asset_validator[0].provisioned.cell_id;

    const cellIdB64 = encodeHashToBase64(cellId[0]) + encodeHashToBase64(cellId[1]);
    const signingCredentialsJson = localStorage.getItem(cellIdB64);
    let signingCredentials: SigningCredentials | null = signingCredentialsJson && JSON.parse(signingCredentialsJson);
    if (!signingCredentials) {
      const [keyPair, signingKey] = await generateSigningKeyPair();
      console.log(cellId, signingKey)
      response = await fetch('http://127.0.0.1:5000/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signingKey: encodeHashToBase64(signingKey),
          cellId: [encodeHashToBase64(cellId[0]), encodeHashToBase64(cellId[1])]
        })
      });
      data = await response.json();
      const capSecret = decodeHashFromBase64(data.capSecret);
      console.log(capSecret)
      signingCredentials = { capSecret, keyPair, signingKey};
      localStorage.setItem(cellIdB64, JSON.stringify(signingCredentials));
    }
    setSigningCredentials(cellId, signingCredentials);
    console.log(signingCredentials)


    loading = false;
  });

  setContext(clientContext, {
    getClient: () => client,
  });
  let setTab = (newTab, e) => {
    currentTab.set(newTab);
  }
</script>

<nav>
  <ul>
    <li><button on:click={(e) => setTab('generate', e)}>Generate</button></li>
    <li><button on:click={(e) => setTab('generators', e)}>Generators</button></li>
    <li><button on:click={(e) => setTab('observations', e)}>Observations</button></li>
    <li><button on:click={(e) => setTab('scan', e)}>Scan</button></li>
  </ul>
</nav>

<main>
  {#if loading}
    <div style="display: flex; flex: 1; align-items: center; justify-content: center">
      <mwc-circular-progress indeterminate />
    </div>
  {:else}
    <div id="content" style="display: flex; flex-direction: column; flex: 1;">
      {#if $currentTab === 'generators'}
        <Generators />
      {:else if $currentTab === 'observations'}
        <Observations />
      {:else if $currentTab === 'scan'}
        <Scan />
      {/if}
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
