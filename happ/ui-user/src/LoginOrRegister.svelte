<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
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
  let tpDeepLink = '';

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
      tpDeepLink = tokenProofData.app_link;
      qrCodeImage = tokenProofData.qrcode_image;
      const ws = new WebSocket('ws://127.0.0.1:5000?signingKey=' + encodeHashToBase64(signingKey));

      ws.onopen = () => {
        console.log('connection open')
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        ethAddress = data.address;
        ws.close();
      };

    } catch (error) {
      errorMessage = error.message;
    }
  });

  // Function to detect if the user is on a mobile device
  const isMobile = () => {
    return typeof window.orientation !== "undefined" || navigator.userAgent.indexOf('IEMobile') !== -1;
  };

  // Reactive statement to store the result of isMobile
  $: mobileUser = isMobile();

  async function register() {
    if (password !== confirmPassword) {
      errorMessage = 'Passwords do not match.';
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/login_or_register', {
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
      dispatch('authSuccess', {signingCredentials, handle, ethAddress});
    } catch (error) {
      errorMessage = error.message;
    }
  }
</script>

{#if ethAddress}

<form on:submit|preventDefault={register}>
  <p>
  Welcome! What would you like us to call you?
  </p>
  <p><input type="text" bind:value={handle} placeholder="Handle" required></p>
  <!--<div><input type="password" bind:value={password} placeholder="Password" required></div>-->
  <!--<div><input type="password" bind:value={confirmPassword} placeholder="Confirm Password" required></div>-->
  <!--<div><input type="text" bind:value={ethAddress} placeholder="Ethereum Address" required></div>-->
  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}
  <button type="submit">Register</button>
</form>
{:else }
<div class="container">
  <div class="qr-code-container">
    <div class='qr-code-inner'>
      <div class="qr-code-header">Scan QR Code</div>
      <div class='qr-code-text'>
      To authenticate, please continue on your mobile device and scan with the tokenproof app
      </div>
      <img src={qrCodeImage} alt="QR Code" class="qr-code-image" />
    </div>
    <div class="qr-code-footer">
      <img src='http://localhost:5000/tokenproofIconWhite.png' alt="" class="secured-token-proof" /> Secured with tokenproof
    </div>
  </div>
</div>
{/if}

<style>
  .error {
    color: red;
  }
  img {
    margin-top: 10px;
  }
  .tp-deep-link-button {
    background-color: #2665FF;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    text-decoration: none;
    cursor: pointer;
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
    position: relative;
    top:-20px;
  }

  .qr-code-text {
    margin-bottom: 10px;
    text-align: left;
    padding-left: 42px;
    padding-right: 40px;
    font-size: 14px;
    font-weight: 500;
    color: #98A1B0;
    font-family: 'Montserrat', sans-serif;
  }

  .qr-code-inner {
    border-radius: 12px;
    position: relative;
    top: 25px;
    background-color: white;
    width: 100%;
    border: 1px solid lightgrey;
    padding-bottom: 20px;
    padding-top: 20px;
    z-index: 100;
  }

  .qr-code-container img.qr-code-image{
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
    text-align: left;
    padding-left: 42px;
  }

  .qr-code-footer {
    background-color: #2665FF;
    color: white;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    width: 100%;
    padding-top: 5px;
    padding-bottom: 10px;
    border-radius: 0 0 12px 12px;
    padding-top: 20px;
    margin-top: 10px;
    line-height: 20px;
  }

  .qr-code-footer img {
    margin: 0px;
    height: 20px;
    width: 20px;
    padding: 0px;
    position: relative;
    top: 4px;
    left: -3px;
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
