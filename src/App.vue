<script setup>
import { onMounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; 
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  const auth = getAuth();
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (router.currentRoute.value.path === '/login' || router.currentRoute.value.path === '/') {
         router.push('/mapa');
      }
    } else {
      router.push('/login');
    }
  });
});
</script>

<template>
  <main>
    <router-view /> 
  </main>
</template>

<style>
@import './assets/main.css';
</style>