<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { decode } from '@msgpack/msgpack';
  import { generateSigningKeyPair, encodeHashToBase64, decodeHashFromBase64 } from '@holochain/client';
  import type {EthUser} from './asset_validator/eth_user/types';
  const VITE_USER_DOMAIN = import.meta.env.VITE_USER_DOMAIN;

  const dispatch = createEventDispatcher();

  let handle = '';
  let password = '';
  let confirmPassword = '';
  let ethAddress = '';
  let tempEthAddress = '';
  let keyPair;
  let signingKey;
  let errorMessage = '';
  let qrCodeImage = '';
  let tpDeepLink = '';

  // Reactive statement to detect if the user is on a mobile device
  let isMobile = typeof window !== 'undefined' &&
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  onMount(async () => {
    try {
      const currentTime = new Date().getTime();

      const storedRegistrationCredentials = JSON.parse(localStorage.getItem('registrationCredentials'));
      if (storedRegistrationCredentials && currentTime - storedRegistrationCredentials.timestamp < 120000) {
        keyPair = {
          privateKey: decodeHashFromBase64(storedRegistrationCredentials.keyPair.privateKey),
          publicKey: decodeHashFromBase64(storedRegistrationCredentials.keyPair.publicKey),
        }
        signingKey = decodeHashFromBase64(storedRegistrationCredentials.signingKey);
      } else {
        [keyPair, signingKey] = await generateSigningKeyPair();
        localStorage.setItem('registrationCredentials', JSON.stringify({
          keyPair: {privateKey: encodeHashToBase64(keyPair.privateKey), publicKey: encodeHashToBase64(keyPair.publicKey)},
          signingKey: encodeHashToBase64(signingKey),
          timestamp: currentTime,
        }));
      }
      const tokenProofResponse = await fetch('http://' + VITE_USER_DOMAIN + '/get-token-proof', {
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
      const ws = new WebSocket('ws://' + VITE_USER_DOMAIN + '?signingKey=' + encodeHashToBase64(signingKey));

      ws.onopen = () => {
        console.log('connection open')
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        ethAddress = data.address;

        if (data.existingUser) {
          const user: EthUser = decode(decodeHashFromBase64(data.existingUser)) as EthUser;
          handle = user.handle;
          register();
        }
        ws.close();
      };

    } catch (error) {
      errorMessage = error.message;
    }
  });

  function setEthAddress() {
    ethAddress = tempEthAddress;
  }

  async function register() {
    try {
        let payload = {
          handle,
          signingKey: encodeHashToBase64(signingKey),
        }
        if (ethAddress) {
          payload.ethAddress = ethAddress
        }
      const response = await fetch('http://' + VITE_USER_DOMAIN + '/login_or_register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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
  {#if isMobile}
    <p>
      To authenticate, please ensure you have tokenProof installed on your device and click the button below.
    </p>
    <p>
      Note: that any wallet or email addresses that you share from tokenproof will be publicly visible within the holochain application.  
    </p>
    <p>
    <button on:click={() => window.location.href = tpDeepLink} class="tp-deep-link-button">Open in tokenproof</button>
    </p>
  {:else}
    <div class="container">
        <div class="qr-code-container">
          <div class='qr-code-inner'>
            <div class="qr-code-header">Scan QR Code</div>
            <div class='qr-code-text'>
            To authenticate, please continue on your mobile device and scan with the tokenproof app
            </div>
    <div class='qr-code-text'>
      Note: that any wallet or email addresses that you share from tokenproof will be publicly visible within the holochain application.  
    </div>
            <img src={qrCodeImage} alt="QR Code" class="qr-code-image" />
          </div>
          <div class="qr-code-footer">
            <img src='http://localhost:5000/tokenproofIconWhite.png' alt="" class="secured-token-proof" /> Secured with tokenproof
          </div>
        </div>

    </div>
        <div>
            If token proof isn't working submit this form with an email, ENS, or eth address. Just remember it will be public in the hApp.
            <input type="text" bind:value={tempEthAddress} placeholder="ethAddress, email, ENS" required>
            <button on:click={setEthAddress}>Register</button>
        </div>
  {/if}
{/if}

<style>
  .error {
    color: red;
  }
  img {
    margin-top: 10px;
  }
  .tp-deep-link-button {
    display: block;
    margin: auto;
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
