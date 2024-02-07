<script lang="ts">
  import { createEventDispatcher} from 'svelte';
  import { onMount } from 'svelte';
  import { generateSigningKeyPair, encodeHashToBase64, decodeHashFromBase64 } from '@holochain/client';
  const tokenProofWhite = '/tp.png';

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

<div class="container">
  <div class="qr-code-container">
    <span class="close-icon">✕</span>
    <div class="qr-code-header">Scan QR Code</div>
    <img src={qrCodeImage} alt="QR Code" class="qr-code-image" />
    <div class="qr-code-footer">
      <img src={tokenProofWhite} alt="Token Proof" class="token-proof-image" />
      Secured with tokenproof
    </div>
  </div>
</div>

<form on:submit|preventDefault={register}>
  <div><input type="text" bind:value={handle} placeholder="Handle" required></div>
  <!--<div><input type="password" bind:value={password} placeholder="Password" required></div>-->
  <!--<div><input type="password" bind:value={confirmPassword} placeholder="Confirm Password" required></div>-->
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
  img {
    margin-top: 10px;
  }
  .container {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    margin-bottom: 30px;
  }

  .qr-code-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 344px;
    font-family: 'Montserrat', sans-serif;
  }

  .qr-code-container img {
    border-radius: 12px;
    width: 258px;
    height: 258px;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  }

  .qr-code-header {
    font-size: 21px;
    font-weight: 700;
    color: #141416;
    margin-bottom: 20px;
  }

  .qr-code-footer {
    background-color: #2665FF;
    color: white;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    width: 100%;
    padding: 10px 0;
    border-radius: 0 0 12px 12px;
    margin-top: 20px;
  }

  .close-icon {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 14px;
    font-weight: 500;
    color: #98A1B0;
    cursor: pointer;
  }
</style>
