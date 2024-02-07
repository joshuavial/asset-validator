<script lang="ts">
  import { createEventDispatcher} from 'svelte';
  import { onMount } from 'svelte';
  import { generateSigningKeyPair, encodeHashToBase64, decodeHashFromBase64 } from '@holochain/client';

  const dispatch = createEventDispatcher();

  let handle = '';
  let password = '';
  let confirmPassword = '';
  let ethAddress = '';
  let keyPair;
  let signingKey;
  let errorMessage = '';
  let qrCodeImage = '';

  onMount(async () => {
    try {
      [keyPair, signingKey] = await generateSigningKeyPair();
      const tokenProofResponse = await fetch('http://127.0.0.1:5000/get-token-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signingKey: encodeHashToBase64(signingKey),
        })
      });
      const tokenProofData = await tokenProofResponse.json();
      qrCodeImage = tokenProofData.qrcode_image;
      console.log('Token Proof Data:', tokenProofData);
    } catch (error) {
      errorMessage = 'Failed to generate key pair.';
    }
  });

  async function register() {
    if (password !== confirmPassword) {
      errorMessage = 'Passwords do not match.';
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
  {#if qrCodeImage}
    <img src={qrCodeImage} alt="QR Code" />
  {/if}
  <button type="submit">Register</button>
</form>

<style>
  .error {
    color: red;
  }
  img {
    margin-top: 10px;
  }
</style>
