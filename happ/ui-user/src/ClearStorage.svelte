<script lang="ts">
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';

  // This store will be used to reactively control the display of the reset link
  let hasLocalStorageData = writable(false);

  // Check if there's any data in localStorage
  onMount(() => {
    const data = Object.keys(localStorage).length > 0;
    hasLocalStorageData.set(data);
  });

  // Function to clear localStorage and update the reactive variable
  function clearStorage() {
    localStorage.clear();
    hasLocalStorageData.set(false);
  }
</script>
{#if $hasLocalStorageData}
  <a href="javascript:void(0)" on:click={clearStorage}>Reset</a>
{/if}
