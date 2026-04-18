<script setup>
import { ref } from 'vue';
import { auth } from '../firebase.js';
import { signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, 
  browserSessionPersistence } from 'firebase/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const pasahitza = ref('');
const error = ref('');

async function saioaHasi() {
  error.value = '';

  try {
    await setPersistence(auth, browserSessionPersistence);
    
    const userCredential = await signInWithEmailAndPassword(auth, email.value, pasahitza.value);
    const user = userCredential.user;

    console.log("Saioa hasita!", user);
    
    router.push('/mapa');

  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      error.value = 'Emaila edo pasahitza okerrak dira';
    } else {
      error.value = 'Errorea saioa hastean: ' + err.message;
    }
  }
}

async function pasahitzaBerreskuratu() {
  if (!email.value) {
    error.value = "Mesedez, idatzi zure emaila goiko laukian berreskuratzeko.";
    return;
  }
  
  try {
    await sendPasswordResetEmail(auth, email.value);
    alert("Email bat bidali dizugu pasahitza berrezartzeko! Begiratu zure sarrera-ontzia.");
    error.value = "";
  } catch (err) {
    console.error("Errorea:", err);
    error.value = "Ezin izan da emaila bidali. Egiaztatu helbidea ondo idatzi duzula.";
  }
}
</script>

<template>
  <div class="fondo">
    <div class="form-kutxa">
      <h1>Saioa hasi</h1>

      <form @submit.prevent="saioaHasi">
        <div class="form-group">
          <label>Email:</label>
          <input type="email" v-model="email" required>
        </div>

        <div class="form-group">
          <label>Pasahitza:</label>
          <input type="password" v-model="pasahitza" required>
        </div>

        <div v-if="error" class="error-msg">
          {{ error }}
        </div>

        <button type="submit" class="btn-submit">Sartu</button>
      </form>

      <div style="margin-top: 10px; font-size: 14px;">
        <a href="#" @click.prevent="pasahitzaBerreskuratu" style="color: #ffeb3b; text-decoration: none;">Pasahitza ahaztu duzu?</a>
      </div>

      <div class="switch-link">
        Ez duzu konturik? <a href="#" @click.prevent="router.push('/erregistroa')">Erregistratu</a>
      </div>
    </div>
  </div>
</template>

