<script>
  import PopupPage from "./pages/popup.svelte";
  import ListPage from "./pages/list.svelte";
  import { onMount } from "svelte";

  let currentPage = PopupPage;

  const map = {
    list: ListPage,
  };

  function onhashchange() {
    currentPage = map[window.location.hash.slice(1)] || PopupPage;
  }

  onMount(onhashchange);
</script>

<svelte:window on:hashchange={onhashchange} />

<svelte:component this={currentPage} />
