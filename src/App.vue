<template>
  <h3 class="text-red" v-if="error">{{ error }}</h3>
  <router-view v-else />
</template>

<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';

const error = ref('')

onErrorCaptured(err => {
  error.value = String(err)
  return true
})
</script>
