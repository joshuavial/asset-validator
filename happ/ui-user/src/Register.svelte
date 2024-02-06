<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import type { AppAgentClient } from '@holochain/client';
  import { generateSigningKeyPair, encodeHashToBase64, decodeHashFromBase64 } from '@holochain/client';

  import {cellIdFromClient} from './lib'
  import { clientContext } from './contexts';

  let client: AppAgentClient = (getContext(clientContext) as any).getClient();

  const dispatch = createEventDispatcher();

  let handle = '';
  let password = '';
  let confirmPassword = '';
  let ethAddress = '';
  let keyPair;
  let signingKey;
  let errorMessage = '';

  async function register() {
    if (password !== confirmPassword) {
      errorMessage = 'Passwords do not match.';
      return;
    }

    try {
      [keyPair, signingKey] = await generateSigningKeyPair();
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
          signingKey: encodeHashToBase64(signingKey),
        })
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      // Handle successful registration here
      const data = await response.json()
      const capSecret = decodeHashFromBase64(data.capSecret);
      const signingCredentials = { capSecret, keyPair, signingKey};
      dispatch('registrationSuccess', signingCredentials);
    } catch (error) {
      errorMessage = error.message;
    }
  }
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
