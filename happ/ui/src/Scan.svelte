<script>
  import { onMount } from 'svelte';

  let videoStream;

  async function setupCamera() {
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoElement = document.querySelector('video');
      videoElement.srcObject = videoStream;
    } catch (error) {
      console.error('Error accessing the webcam', error);
    }
  }

  onMount(() => {
    setupCamera();
  });

  let greeting = "Hello";
</script>

<main>
  <h1>{greeting}</h1>
  <video autoplay></video>
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
</style>
