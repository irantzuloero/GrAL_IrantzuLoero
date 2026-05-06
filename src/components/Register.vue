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
const pacAukeratuta = ref(false);
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
      pac: pacAukeratuta.value,
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

        <div class="pac-container">
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="pacAukeratuta"/>
              <span style="color: #666">PAC sistemako lursailak</span>
            </label>
          </div>

          <p class="info-note">
            <small class="note-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info-icon lucide-info">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              <span><b>Oharra:</b> Aukera honek mapa-mota bat edo bestea (PAC edo normala) bistaratzeko balio du zure lursailak hautatzerakoan.</span>
            </small>
          </p>
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

<style scoped>
.pac-container {
  margin: 10px 0 10px 0;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  text-align: left
}

.info-note {
  margin-top: 10px;
  color: #666;
  font-size: 0.9em;
  line-height: 1.4;
}

.note-content {
  display: flex;
  align-items: flex-start; 
  gap: 6px;
}

.note-content svg {
  flex-shrink: 0; 
  margin-top: 2px;
}
</style>

