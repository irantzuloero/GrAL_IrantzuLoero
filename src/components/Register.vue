<script setup>
import { ref } from 'vue';
import { auth, db } from '../firebase.js'; 
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';

const router = useRouter();
const izena = ref('');
const email = ref('');
const pasahitza = ref('');
const pasahitzaBi = ref('');
const error = ref('');

async function erregistratu() {
  error.value = ''; 

  if (pasahitza.value !== pasahitzaBi.value) {
    error.value = 'Pasahitzak ez datoz bat';
    return;
  }

  try {
    //erabiltzailea sortu firebasean
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, pasahitza.value);
    const user = userCredential.user;

    //erabiltzailearen izena gorde
    await updateProfile(user, { displayName: izena.value });

    await setDoc(doc(db, "erabiltzaileak", user.uid), {
      izena: izena.value,
      email: email.value,
      rol: 'nekazaria'
    });

    console.log("Erabiltzailea sortuta!", user);
    router.push('/mapa');

  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      error.value = 'Email hau jada erabiltzen ari da.';
    } else if (err.code === 'auth/weak-password') {
      error.value = 'Pasahitza ahulegia da (gutxienez 6 karaktere).';
    } else {
      error.value = 'Errorea erregistratzean: ' + err.message;
    }
  }
}
</script>

<template>
  <div class="fondo"> 
    <div class="form-kutxa">
      <h1>Erregistratu</h1>

      <form @submit.prevent="erregistratu">
        <div class="form-group">
          <label>Izena:</label>
          <input type="text" v-model="izena" required>
        </div>

        <div class="form-group">
          <label>Email:</label>
          <input type="email" v-model="email" required>
        </div>

        <div class="form-group">
          <label>Pasahitza:</label>
          <input type="password" v-model="pasahitza" required>
        </div>

        <div class="form-group">
          <label>Pasahitza errepikatu:</label>
          <input type="password" v-model="pasahitzaBi" required>
        </div>

        <div v-if="error" class="error-msg">
          {{ error }}
        </div>

        <button type="submit" class="btn-submit">Erregistratu</button>
      </form>

      <div class="switch-link">
        Dagoeneko baduzu kontua? <a href="#" @click.prevent="router.push('/login')">Saioa hasi</a>
      </div>
    </div>
  </div>
</template>

