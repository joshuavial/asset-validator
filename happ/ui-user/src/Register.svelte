<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { generateSigningKeyPair, encodeHashToBase64 } from '@holochain/client';
  import { getAgentWsUrl } from './lib';
  const dispatch = createEventDispatcher();

  let handle = '';
  let password = '';
  let confirmPassword = '';
  let ethAddress = '';
  let keyPair;
  let signingKey;
  let agentWsUrl = '';
  let errorMessage = '';

  async function fetchAgentWsUrl() {
    try {
      const response = await getAgentWsUrl();
      agentWsUrl = response.agent_ws_url;
    } catch (error) {
      errorMessage = 'Failed to fetch agent websocket URL.';
    }
  }

  async function register() {
    if (password !== confirmPassword) {
      errorMessage = 'Passwords do not match.';
      return;
    }

    // Generate key pair and signing key
    try {
      [keyPair, signingKey] = await generateSigningKeyPair();
      await fetchAgentWsUrl();
    } catch (error) {
      errorMessage = 'Failed to generate key pair.';
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          handle,
          password,
          ethAddress,
          signingKey: encodeHashToBase64(signingKey)
          agentWsUrl
      })
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      // Handle successful registration here
      dispatch('registrationSuccess');
    } catch (error) {
      errorMessage = error.message;
    }
  }

  // Fetch the agent websocket URL when the component is first rendered
  fetchAgentWsUrl();
</script>

<form on:submit|preventDefault={register}>
  <div><input type="text" bind:value={handle} placeholder="Handle" required></div>
  <div><input type="password" bind:value={password} placeholder="Password" required></div>
  <div><input type="password" bind:value={confirmPassword} placeholder="Confirm Password" required></div>
  <div><input type="text" bind:value={ethAddress} placeholder="Ethereum Address" required></div>
  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}
  <button type="submit">Register</button>
</form>

<style>
  .error {
    color: red;
  }
</style>
