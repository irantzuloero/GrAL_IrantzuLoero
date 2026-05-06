<script setup>
import { ref, onMounted } from 'vue';
import { db, auth } from '../firebase.js'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 

const emit = defineEmits(['itzuli','aldaketa']);

const kargatzen = ref(true); 
const email = ref('');
const izena = ref('');
const pac = ref(false);

onMounted(async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "erabiltzaileak", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        email.value = data.email || user.email; 
        izena.value = data.izena || '';
        pac.value = data.pac || false;
      }
    }
  } catch (error) {
    console.error("Errorea datuak kargatzean:", error);
  } finally {
    kargatzen.value = false; 
  }
});

async function gordeAldaketak() {
  try {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "erabiltzaileak", user.uid);
      await updateDoc(userRef, {
        izena: izena.value,
        pac: pac.value
      });
      alert("Profila ondo gorde da!");
      emit('aldaketa', pac.value);
    }
  } catch (error) {
    console.error("Errorea gordetzean:", error);
    alert("Errore bat egon da gordetzean.");
  }
}
</script>

<template>
  <div class="profila-kaxa" style="max-width: 500px; margin: 0 auto; padding: 20px;">
    
    <button class="btn-itzuli-ikonoa" @click="emit('itzuli')" style="margin-left: -140px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
    </button>

    <h2 style="margin-bottom:20px; font-size: 1.8rem; color: var(--color-granate);">Nire Profila</h2>

    <div v-if="kargatzen" style="text-align: center; color: gray;">
      <p>Datuak kargatzen...</p>
    </div>

    <div v-else>
      <div class="datu-finkoak" style="margin-bottom: 15px;">
          <label>Email:</label>
          <input type="text" readonly style="width: 100%; padding: 8px; background-color: #e9ecef; border: 1px solid #ccc; border-radius: 4px;" v-model="email">
      </div>
      
      <div class="datu-aldakorrak">
          <label>Izena:</label>
          <input type="text" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;" v-model="izena">
          
          <div class="form-group checkbox-group" style="margin-bottom: 20px;">
              <label class="checkbox-label" style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" v-model="pac" style="width: 18px; height: 18px;"/>
                <span style="color: #333; font-weight: 500;">PAC sistemako lursailak erakutsi</span>
              </label>
          </div>
          
          <button class="btn-nagusia" @click="gordeAldaketak" style="width: 100%; margin-bottom: 15px;">Aldaketak gorde</button>
          
          <button class="btn-bigarren" style="width: 100%;">Pasahitza aldatu</button>
      </div>
    </div>

  </div>
</template>