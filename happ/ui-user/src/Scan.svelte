<script>
  import jsQR from "jsqr";
  import { onMount } from 'svelte';

  let videoStream;
  let qrCodeResult = '';

  async function setupCamera() {
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoElement = document.querySelector('video');
      videoElement.srcObject = videoStream;
    } catch (error) {
      console.error('Error accessing the webcam', error);
    }
  }

  function scanQRCode() {
    const videoElement = document.querySelector('video');
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
    qrCodeResult = qrCode ? qrCode.data : 'No QR code detected';
  }

  onMount(() => {
    setupCamera();
  });

  let greeting = "Hello";
</script>

<main>
  <h1>{greeting}</h1>
  <video autoplay></video>
  <button on:click={scanQRCode}>Scan QR Code</button>
  <p>{qrCodeResult}</p>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    background-color: #f9f9f9;
  }
  h1 {
    color: #333;
  }
  video {
    width: 100%;
    max-width: 640px;
    border: 1px solid #ccc;
  }
  button {
    margin-top: 1em;
  }
</style>
