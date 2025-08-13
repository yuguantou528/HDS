<template>
  <div class="app-container">
    <AppHeader v-if="showLayout" />
    <AppSidebar v-if="showLayout" />
    <main :class="{'main-content': showLayout}">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppSidebar from '@/components/AppSidebar.vue';

const route = useRoute();
const showLayout = computed(() => route.meta.requiresLayout !== false);
</script>

<style>
@import './styles/main.css';
</style> 