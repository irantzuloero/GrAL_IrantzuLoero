<script setup>
import { ref, onMounted } from 'vue';
import { db, auth } from '../firebase.js';
import DatuakBista from './Datuak.vue';
import UztaBista from './Uzta.vue';
import TratamenduakBista from './Tratamenduak.vue';
import OharrakBista from './Oharrak.vue';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useRouter, useRoute} from 'vue-router';

const router = useRouter();
const route = useRoute();

const datuak = ref(null);
const bistaAktiboa = ref('menua');

const nireMotak = ref([]);

onMounted(async () => {
  const user = auth.currentUser;
  const mahastiId = route.params.id;
  if (user && mahastiId) {
    try {
      const mahastiRef = doc(db, "partzelak", mahastiId);
      const mahastia = await getDoc(mahastiRef);
      if (mahastia.exists()) {
        datuak.value = { id: mahastia.id, ...mahastia.data() };
      } else {
        console.error("Ez da mahastia aurkitu!");
        router.push('/mapa');
      }

      const q = query(collection(db, "motak"), where("erabiltzaileaId", "==", user.uid));
      const docs = await getDocs(q);
      const temp = [];
      docs.forEach(doc => {
        temp.push({ _id: doc.id, izena: doc.data().izena });
      });
      nireMotak.value = temp;
    } catch(e) {
      console.error("Errorea motak kargatzean:", e);
    }
  }
});
</script>

<template>
  <div class="aukerak" v-if="datuak">
    
    <header class="header-mahastia">
      
      <div class="header-botoia">
        <button class="btn-itzuli-ikonoa" 
                @click="bistaAktiboa === 'menua' ? router.push('/mapa') : bistaAktiboa = 'menua'" 
                :title="bistaAktiboa === 'menua' ? 'Mapara itzuli' : 'Menura itzuli'">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
      </div>

      <div class="titulu-multzoa">
        <h1>
          <span v-if="bistaAktiboa === 'menua'">{{ datuak.izena }}</span>
          <span v-else-if="bistaAktiboa === 'datuak'">Datuak</span>
          <span v-else-if="bistaAktiboa === 'uzta'">Uzta</span>
          <span v-else-if="bistaAktiboa === 'tratamenduak'">Tratamenduak</span>
          <span v-else-if="bistaAktiboa === 'oharrak'">Oharrak</span>
        </h1>
        <p class="azpititulua-header">
          <span v-if="bistaAktiboa === 'menua'">Erref: {{ datuak.erreferentzia }}</span>
          <span v-else>{{ datuak.izena }} &bull; Erref: {{ datuak.erreferentzia }}</span>
        </p>
      </div>

      <div class="header-hutsunea"></div>

    </header>

    <div class="grid-aukerak" v-if="bistaAktiboa === 'menua'">
      
      <div class="opzio-item" @click="bistaAktiboa = 'datuak'" style="cursor: pointer;">
        <div class="borobila-aukera"> 
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-list-icon lucide-clipboard-list"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg> 
        </div>
        <span>Datuak</span>
      </div>

      <div class="opzio-item" @click="bistaAktiboa = 'uzta'" style="cursor: pointer;">
        <div class="borobila-aukera">
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grape-icon lucide-grape"><path d="M22 5V2l-5.89 5.89"/><circle cx="16.6" cy="15.89" r="3"/><circle cx="8.11" cy="7.4" r="3"/><circle cx="12.35" cy="11.65" r="3"/><circle cx="13.91" cy="5.85" r="3"/><circle cx="18.15" cy="10.09" r="3"/><circle cx="6.56" cy="13.2" r="3"/><circle cx="10.8" cy="17.44" r="3"/><circle cx="5" cy="19" r="3"/></svg>
        </div>
        <span>Uzta</span>
      </div>

      <div class="opzio-item" @click="bistaAktiboa = 'tratamenduak'" style="cursor: pointer;">
        <div class="borobila-aukera">
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-soap-dispenser-droplet-icon lucide-soap-dispenser-droplet"><path d="M10.5 2v4"/><path d="M14 2H7a2 2 0 0 0-2 2"/><path d="M19.29 14.76A6.67 6.67 0 0 1 17 11a6.6 6.6 0 0 1-2.29 3.76c-1.15.92-1.71 2.04-1.71 3.19 0 2.22 1.8 4.05 4 4.05s4-1.83 4-4.05c0-1.16-.57-2.26-1.71-3.19"/><path d="M9.607 21H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h7V7a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>
        </div>
        <span>Tratamenduak</span>
      </div>

      <div class="opzio-item" @click="bistaAktiboa = 'oharrak'" style="cursor: pointer;">
        <div class="borobila-aukera">
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-notebook-pen-icon lucide-notebook-pen"><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/></svg>
        </div>
        <span>Oharrak</span>
      </div>

      <div class="opzio-item">
        <div class="borobila-aukera">
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-round-icon lucide-users-round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>
        </div>
        <span>Langile orduak</span>
      </div>

      <div class="opzio-item">
        <div class="borobila-aukera"><svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell-ring-icon lucide-bell-ring"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M22 8c0-2.3-.8-4.3-2-6"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/><path d="M4 2C2.8 3.7 2 5.7 2 8"/></svg></div>
        <span>Abisuak</span>
      </div>

    </div>

    <DatuakBista 
      v-if="bistaAktiboa === 'datuak'" 
      :datuak="datuak" 
      :motak="nireMotak"
      @itzuli="bistaAktiboa = 'menua'" 
    />

    <UztaBista 
      v-if="bistaAktiboa === 'uzta'" 
      :datuak="datuak" 
      @itzuli="bistaAktiboa = 'menua'" 
    />

    <TratamenduakBista 
      v-if="bistaAktiboa === 'tratamenduak'" 
      :datuak="datuak" 
      @itzuli="bistaAktiboa = 'menua'" 
    />

    <OharrakBista
      v-if="bistaAktiboa === 'oharrak'"
      :datuak="datuak" 
      @itzuli="bistaAktiboa = 'menua'"
    />
  </div>
  
  <div v-else class="kargatzen">
    <p>Kargatzen...</p>
  </div>
</template>

<style scoped>


.header-mahastia {
  width: 100%;
  padding: 15px 5%; 
  background-color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  margin-bottom: 30px;
  position: sticky;
  top: 0;
  z-index: 100;
  
  display: grid;
  grid-template-columns: 1fr auto 1fr; 
  align-items: center;
}

.header-botoia {
  justify-self: start;
}

.titulu-multzoa {
  text-align: center;
  justify-self: center;
}

.titulu-multzoa h1 {
  margin: 0;
  font-size: 1.8rem; 
  color: var(--color-granate);
  line-height: 1.2;
}

.azpititulua-header {
  margin: 4px 0 0 0;
  font-size: 0.95rem;
  color: #777;
}

.btn-itzuli-ikonoa {
  background: #f5f5f5;
  border: none;
  color: var(--color-texto);
  cursor: pointer;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  margin-left: 30px;
}

.btn-itzuli-ikonoa:hover {
  background: var(--color-granate);
  color: white;
  transform: translateX(-4px);
}

.aukerak {
  display: flex;
  flex-direction: column;
  align-items: center;
  
  height: 100vh; 
  overflow-y: hidden; 
  padding-bottom: 60px; 
  
  width: 100%;
  background-color: #fcfcfc;
}

.grid-aukerak {
  display: grid;
  gap: 40px; 
  padding: 20px;
  width: 100%;
  margin-top: 8vh; 
}

/* MUGIKORRA */
@media (max-width: 767px) {
  .grid-aukerak {
    grid-template-columns: repeat(2, 1fr);
    max-width: 400px;
  }
}

/* ORDENAGAILUA */
@media (min-width: 768px) {
  .grid-aukerak {
    grid-template-columns: repeat(3, 1fr);
    max-width: 650px; 
  }
}

.opzio-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.opzio-item:active {
  transform: scale(0.95);
}

.opzio-item span {
  font-weight: 600;
  color: #444;
  font-size: 1.1rem;
  margin-top: 5px; 
}

.borobila-aukera {
  width: 105px;
  height: 105px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 45px;
  margin-bottom: 10px;
  background-color: #86123b;
  box-shadow: 0 6px 18px rgba(134, 18, 59, 0.2); 
}

.ikono-irudia {
  width: 50%;  
  height: 50%;
  object-fit: contain;
}
</style>