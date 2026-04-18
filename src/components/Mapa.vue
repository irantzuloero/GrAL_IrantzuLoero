<script setup>
import { ref, onMounted, computed } from 'vue';
import { mapaHasieratu, zentratu, eguneratuNireMahastiak, joanMahastira } from '../lib/mapa.js';

import { db, auth } from '../firebase.js';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'vue-router';

const router = useRouter();

// ALDAGAIAK
const kargatzenMahastiak = ref(true);
const nireMahastiak = ref([]);
const erroreaBesteMota = ref(false);
const nireMotak = ref([]);
const panelaIrekita = ref(false);

// MAHASTIA GEHITU LEHIOA (DATUAK HASIERATU)
const erakutsiLehioa = ref(false);
const formData = ref({
  erreferentzia: '',
  udalerria: '',
  poligonoa: '',
  partzela: '',
  azalera: '',
  izena: '',
  urtea: '',
  mahatsMota: 'Tempranillo',
  mahatsMotaPertsonalizatua: '',
  geometry: null
});

// UDALERRI BILATZAILEA 
const bilatzailea = ref('');
const koordenatuak = {
  "Baños de Ebro": [42.530, -2.679], "Kripan": [42.591, -2.516], "Elciego": [42.517, -2.618],
  "Elvillar": [42.570, -2.545], "Labastida": [42.588, -2.794], "Laguardia": [42.551, -2.584],
  "Lanciego": [42.562, -2.512], "Lapuebla de Labarca": [42.495, -2.571], "Leza": [42.566, -2.633],
  "Moreda de Álava": [42.525, -2.408], "Navaridas": [42.546, -2.623], "Oyón": [42.505, -2.436],
  "Samaniego": [42.568, -2.679], "Villabuena de Álava": [42.547, -2.665], "Yécora": [42.567, -2.470]
};

const herriIragaziak = computed(() => {
  if (bilatzailea.value.trim() === '') {
    return [];
  }
  
  const testua = bilatzailea.value.toLowerCase();
  return Object.keys(koordenatuak).filter(herria => 
    herria.toLowerCase().includes(testua)
  );
});

function hautatuHerria(herria) {
  const coords = koordenatuak[herria];
  if (coords) {
    const [lat, long] = coords;
    zentratu(lat, long);
    bilatzailea.value = ''; 
  }
}

async function gordeMahastia() {
  try {
    const user = auth.currentUser;
    if (!user) return alert("Saioa hasi behar duzu!");

    if (!formData.value.izena || formData.value.izena.trim() === '') {
      formData.value.izena = formData.value.erreferentzia;
    }

    let motaDefinitiboa = formData.value.mahatsMota;

    if (motaDefinitiboa === 'BesteBat') {
      const motaBerria = formData.value.mahatsMotaPertsonalizatua.trim();

      if (motaBerria === '') {
        erroreaBesteMota.value = true;
        return;
      }

      erroreaBesteMota.value = false;
      motaDefinitiboa = motaBerria;

      await addDoc(collection(db, 'motak'), {
        izena: motaDefinitiboa,
        erabiltzaileaId: user.uid
      });

      kargatuMotak();
    }

    const geometriaTextua = JSON.stringify(formData.value.geometry);

    const partzelaBerria = {
      ...formData.value,
      mahatsMota: motaDefinitiboa,
      geometry: geometriaTextua,
      erabiltzaileaId: user.uid
    };

    delete partzelaBerria.mahatsMotaPertsonalizatua;

    await addDoc(collection(db, 'partzelak'), partzelaBerria);

    itxiLehioa();
    kargatuNireMahastiak();
  } catch (err) {
    console.error("Errorea gordetzean:", err);
    alert('Ezin izan da gorde');
  }
}

async function saioaItxi() {
  try {
    await signOut(auth);
    router.push('/mapa');
  } catch (err) {
    console.error('Errorea saioa ixtean', err);
  }
}

async function kargatuNireMahastiak() {
  try {
    kargatzenMahastiak.value = true;
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "partzelak"), where("erabiltzaileaId", "==", user.uid));
    const partzelak = await getDocs(q);

    const m = [];
    partzelak.forEach((p) => {
      const datuak = p.data();
      if (typeof datuak.geometry === 'string') {
        datuak.geometry = JSON.parse(datuak.geometry);
      }
      m.push({ id: p.id, ...datuak });
    });

    nireMahastiak.value = m;
    eguneratuNireMahastiak(m);
  } catch (err) {
    console.error("Errorea kargatzean:", err);
  } finally {
    kargatzenMahastiak.value = false;
  }
}

async function kargatuMotak() {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "motak"), where("erabiltzaileaId", "==", user.uid));
    const docs = await getDocs(q);

    const motak = [];
    docs.forEach(doc => {
      motak.push({ _id: doc.id, izena: doc.data().izena });
    });

    nireMotak.value = motak;
  } catch (e) {
    console.error("Errorea motak kargatzean:", e);
  }
}

function itxiLehioa() {
  erakutsiLehioa.value = false;
  formData.value = {
    erreferentzia: '',
    udalerria: '',
    poligonoa: '',
    partzela: '',
    azalera: '',
    izena: '',
    urtea: new Date().getFullYear(), 
    mahatsMota: 'Tempranillo',
    mahatsMotaPertsonalizatua: '',
    geometry: null
  };
  erroreaBesteMota.value = false;
}

function berriaFormularioaIreki(e) {
  const d = e.detail;
  formData.value = { ...formData.value, erreferentzia: d.erref, udalerria: d.udalerria, poligonoa: d.poligonoa, partzela: d.partzela, azalera: d.azalera, geometry: d.geometry };
  erakutsiLehioa.value = true;
}

function nireaMenuaIreki(e) {
  const mahastiId = e.detail.id; 
  router.push(`/mahastia/${mahastiId}`);
}

onMounted(() => {
  const nireMapa = mapaHasieratu('map');

  //Mapa ondo marrazteko denbora
  setTimeout(() => {
    if (nireMapa) nireMapa.invalidateSize();
  }, 400);

  window.addEventListener('berriaFormularioaIreki', berriaFormularioaIreki);
  window.addEventListener('nireaMenuaIreki', nireaMenuaIreki);

  auth.onAuthStateChanged((user) => {
    if (user) {
      kargatuNireMahastiak();
      kargatuMotak();
    }
  });
});
</script>

<template>
  <div class="d-flex flex-column flex-md-row vh-100 w-100 overflow-hidden position-relative">

    <button class="btn-toggle-panel" @click="panelaIrekita = true">
       Nire Mahastiak
    </button>

    <div id="panel-lateral" class="panel-lateral d-flex flex-column p-3" :class="{ 'irekita': panelaIrekita }">
      
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="app-logo">LOGOA</h2> <button class="btn-close-panel d-md-none" @click="panelaIrekita = false">✖</button>
      </div>

      <div class="menu-orokorra mb-2">
        <div class="titulu-sekzioa">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-granate)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sprout-icon lucide-sprout"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg>
          Nire Mahastiak
        </div>
      </div>

      <div class="kaxa-zerrenda">
        <div class="tresnak-mahastiak">
          <div class="bilatzaile-txikia">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" v-model="bilaketaTestua" placeholder="Bilatu izena...">
          </div>
          <select v-model="ordenatzekoIrizpidea" class="select-ordena">
            <option value="izena">A-Z (Izenaren arabera)</option>
            <option value="udalerria">Udalerriaren arabera</option>
          </select>
        </div>

        <ul id="lista-mahastiak">
          <li v-if="kargatzenMahastiak">Kargatzen...</li>
          <li v-else-if="nireMahastiak.length === 0">Ez daukazu mahastirik</li>
          <li v-for="m in nireMahastiak" :key="m._id" @click="joanMahastira(m); panelaIrekita = false">
            <strong>{{ m.izena }}</strong><br>
          </li>
        </ul>
      </div>
      <div class="menu-orokorra">
        <button class="btn-menu-lateral">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-granate)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Estatistika Orokorrak
        </button>
      </div>
      <div class="logout-kutxa mt-auto">
        <button class="btn-menu-lateral">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-granate)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Nire Profila
        </button>
        <button @click="saioaItxi" class="btn-logout">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Saioa itxi
        </button>
      </div>

    </div>

    <div class="mapa-wrapper flex-grow-1 position-relative w-100 h-100">
      <div class="bilatzailea">
        <input 
          type="text" 
          v-model="bilatzailea" 
          placeholder="Bilatu udalerria..."
        >
        
        <ul v-if="herriIragaziak.length > 0" class="autocompletar-lista">
          <li 
            v-for="herria in herriIragaziak" 
            :key="herria" 
            @click="hautatuHerria(herria)"
          >
            {{ herria }}
          </li>
        </ul>
      </div>
      <div id="map"></div>
    </div>

    <div v-if="erakutsiLehioa" id="berria-datuak" class="lehioa-gehitu">
      <div class="datuak-kutxa">
        <h3>Mahastia gorde</h3>
        <div class="lehioa-edukia">
          <div class="datu-finkoak">
            <label>Erreferentzia:</label><input type="text" v-model="formData.erreferentzia" readonly>
            <label>Udalerria:</label><input type="text" v-model="formData.udalerria" readonly>
            <label>Poligonoa:</label><input type="number" v-model="formData.poligonoa" readonly>
            <label>Partzela:</label><input type="number" v-model="formData.partzela" readonly>
            <label>Azalera (m²):</label><input type="text" v-model="formData.azalera" readonly>
          </div>
          <div class="datu-aldakorrak">
            <label>Mahastiaren izena:</label><input type="text" v-model="formData.izena">
            <label>Landaketa urtea:</label><input type="number" v-model="formData.urtea" min="1900"
              :max="new Date().getFullYear()">
            <label>Mahats mota:</label>
            <select v-model="formData.mahatsMota">
              <option value="Tempranillo">Tempranillo</option>
              <option value="Garnatxa">Garnatxa</option>
              <option value="Viura">Viura</option>
              <option value="Mazuelo">Mazuelo</option>
              <option v-for="mota in nireMotak" :key="mota._id" :value="mota.izena">
                {{ mota.izena.charAt(0).toUpperCase() + mota.izena.slice(1).toLowerCase() }}
              </option>
              <option value="BesteBat">Beste bat...</option>
            </select>

            <div v-if="formData.mahatsMota === 'BesteBat'" style="margin-top: 10px;">
              <input type="text" v-model="formData.mahatsMotaPertsonalizatua" placeholder="Mota" required
                :style="erroreaBesteMota ? 'border: 2px solid red;' : ''">
              <span v-if="erroreaBesteMota" style="color: red; font-size: 12px; display: block; margin-top: 5px;">
                Mesedez, idatzi mahats motaren izena.
              </span>
            </div>
          </div>
        </div>
        <div class="botoiak-kutxa">
          <button class="btn-bigarren" @click="itxiLehioa">Utzi</button>
          <button class="btn-nagusia" @click="gordeMahastia">Gorde</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================================
   EZKERREKO PANELA 
   ========================================================================== */
.cabecera-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  margin-bottom: 10px;
  padding-bottom: 10px;
}

.cabecera-panel h3 {
  margin: 0;
  color: var(--color-granate);
  font-size: 1.2rem;
}

.menu-orokorra {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.btn-menu-lateral {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--color-texto);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.btn-menu-lateral:hover {
  background-color: #fce4ec; 
  color: var(--color-granate);
}

.separador-menua {
  border: 0;
  height: 1px;
  background-color: #eaeaea;
  margin: 10px 0 15px 0;
}

.tresnak-mahastiak {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.bilatzaile-txikia {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 0 12px;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.bilatzaile-txikia:focus-within {
  border-color: var(--color-granate);
  background: white;
}

.bilatzaile-txikia svg {
  color: #888;
  margin-right: 8px;
}

.bilatzaile-txikia input {
  width: 100%;
  background: transparent;
  border: none;
  padding: 10px 0;
  outline: none;
  font-size: 0.9rem;
}

.select-ordena {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #555;
  outline: none;
  cursor: pointer;
  background-color: white;
}

.hutsik-mezua {
  color: #888;
  font-style: italic;
  padding: 10px;
}

.herria-etiketa {
  display: block;
  font-size: 0.8rem;
  color: #888;
  margin-top: 4px;
}

#lista-mahastiak {
  padding: 0; 
  margin: 0;
  list-style: none;
}

#lista-mahastiak li {
  padding: 12px;
  border-bottom: 1px solid #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
}

#lista-mahastiak li strong {
  display: block;
  font-size: 1rem;
}

#lista-mahastiak li:hover {
  background-color: #fce4ec;
}

.logout-kutxa {
  padding-top: 15px;
  border-top: 1px solid #eaeaea;
}

.btn-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  background-color: white;
  color: #d32f2f; 
  border: 1px solid #d32f2f;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
}

.btn-logout:hover {
  background-color: #d32f2f;
  color: white;
}

.app-logo {
  margin-bottom: 30px;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-granate);
  display: flex;
  align-items: center;
  gap: 8px;
}
.app-logo span {
  font-size: 1.8rem;
}

.titulu-sekzioa {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 5px 12px;
  color: var(--color-texto-suave);
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
}

.kaxa-zerrenda {
  background-color: #fcfcfc;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 12px;
  flex-grow: 1; 
  display: flex;
  flex-direction: column;
  overflow: hidden; 
}

#lista-mahastiak {
  flex-grow: 1;
  overflow-y: auto; 
  padding: 0; 
  margin: 0;
  list-style: none;
  padding-right: 5px; 
}

#lista-mahastiak li {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  background-color: white; 
  margin-bottom: 8px;
  transition: all 0.2s;
}

#lista-mahastiak li:hover {
  background-color: #fce4ec;
  border-color: #fce4ec;
  transform: translateX(4px); 
}

/* ==========================================================================
   MAPA BILATZAILEA 
   ========================================================================== */
.bilatzailea input {
  width: 100%;
  padding: 10px 15px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: var(--borde-radio);
  font-size: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  outline: none;
  transition: var(--transicion);
  background-color: rgba(255, 255, 255, 0.95);
}

.bilatzailea input:focus {
  border-color: var(--color-granate);
}

.autocompletar-lista {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin: 5px 0 0 0;
  padding: 0;
  list-style: none;
  background-color: white;
  border-radius: var(--borde-radio);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  max-height: 200px;
  overflow-y: auto; 
  z-index: 1001; 
}

.autocompletar-lista li {
  padding: 12px 15px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  font-size: 15px;
  transition: all 0.2s;
}

.autocompletar-lista li:hover {
  background-color: #fce4ec;
  color: var(--color-granate);
}

/* ==========================================================================
   ORDENAGAILUA
   ========================================================================== */
@media (min-width: 768px) {
  .btn-toggle-panel,
  .btn-close-panel {
    display: none;
  }
  .panel-lateral {
    width: 320px; /* Pixka bat zabalagoa dena ondo kabitzeko */
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  }
  .bilatzailea {
    position: absolute;
    top: 20px;
    left: 340px;
    z-index: 1000;
    width: 250px;
  }
  #map {
    left: 320px;
  }
}

/* ==========================================================================
   MUGIKORRA
   ========================================================================== */
@media (max-width: 767px) {
  .btn-toggle-panel {
    display: block;
    position: fixed;
    bottom: 25px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1500;
    background-color: var(--color-granate);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 50px;
    font-weight: bold;
    font-size: 16px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    cursor: pointer;
  }
  .btn-close-panel {
    display: block;
    background: transparent;
    border: none;
    color: var(--color-granate);
    font-size: 1.5rem;
    cursor: pointer;
  }
  .panel-lateral {
    position: fixed;
    top: 0;
    left: -100%;
    width: 85%;
    max-width: 320px;
    height: 100dvh;
    padding-bottom: 30px;
    box-shadow: 5px 0 15px rgba(0, 0, 0, 0.5);
    transition: left 0.3s ease-in-out;
  }
  .panel-lateral.irekita {
    left: 0;
  }
  .bilatzailea {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 350px;
    z-index: 1000;
  }
}

</style>