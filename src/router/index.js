import { createRouter, createWebHistory } from 'vue-router';

import Login from '../components/Login.vue';
import Register from '../components/Register.vue';
import Mapa from '../components/Mapa.vue';
import Mahastia from '../components/Mahastia.vue';

const routes = [
  { path: '/', redirect: '/login' }, 
  { path: '/login', component: Login },
  { path: '/erregistroa', component: Register },
  { path: '/mapa', component: Mapa },
  { path: '/mahastia/:id', component: Mahastia } 
];

const router = createRouter({
  history: createWebHistory(), 
  routes,
});

export default router;