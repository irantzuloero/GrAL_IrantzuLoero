<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { db, auth } from '../firebase.js'; 
    import { query, where, getDocs, doc, updateDoc, collection, addDoc, deleteDoc } from 'firebase/firestore'; 

    const info = defineProps(['datuak']);
    const emit = defineEmits(['itzuli']);

    const erakutsiDialogoa = ref(false);
    const tratamenduaEditatzenId = ref(null);
    const unekoUrtea = new Date().getFullYear();
    const tratamenduUrte = ref(unekoUrtea);
    const tratamenduGuztiak = ref([]);

    const tratamenduaFormData = ref({
        data: '',
        izena: null,
        kantitatea: null
    });

    const urteenZerrenda = computed(() => {

        const urteak = new Set();
        urteak.add(unekoUrtea);
        
        tratamenduGuztiak.value.forEach(t => {
            if (t.data) {
                const urtea = new Date(t.data).getFullYear();
                urteak.add(urtea);
            }
        });
        return Array.from(urteak).sort((a, b) => b - a);
    });

    const aurtengoTratamenduak = computed(() => {
        return tratamenduGuztiak.value.filter(t => {
            if (!t.data) return false;
            const urtea = new Date(t.data).getFullYear();
            return urtea === tratamenduUrte.value; 
        });
    });

    function irekiTratamenduModal(){
        const data = new Date();
        tratamenduaFormData.value.data = (new Date(data - data.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        erakutsiDialogoa.value = true;
    }

    function tratamenduaEditatu(tratamendua){
        tratamenduaEditatzenId.value = tratamendua.id;
        tratamenduaFormData.value = { data: tratamendua.data, izena: tratamendua.izena, kantitatea: tratamendua.kantitatea };
        erakutsiDialogoa.value = true;
    }

    async function tratamenduaEzabatu(tratamenduaId){
        if (confirm("Ziur zaude tratamendu hau ezabatu nahi duzula? Ekintza hau ezin da desegin.")) {
            try {
                await deleteDoc(doc(db, "tratamenduak", tratamenduaId));
                await kargatuTratamenduak(); 
            } catch (error) {
                console.error("Errorea ezabatzean:", error);
            }
        }
    }

    async function gordeTratamendua(){
        const tratamenduBerria = {
            mahastiId: info.datuak.id,
            data: tratamenduaFormData.value.data,
            izena: tratamenduaFormData.value.izena,
            kantitatea: tratamenduaFormData.value.kantitatea,
            userId: auth.currentUser.uid
        };
        try {
            if (tratamenduaEditatzenId.value == null) {
                await addDoc(collection(db, "tratamenduak"), tratamenduBerria);
            } else {
                await updateDoc(doc(db, "tratamenduak", tratamenduaEditatzenId.value), tratamenduBerria);
            }
            
            await kargatuTratamenduak(); 
            itxiTratamenduModal();
        } catch (e) {
            console.error("Errorea gordetzean: ", e);
        }
    }

    const itxiTratamenduModal = () => {
        erakutsiDialogoa.value = false;
        tratamenduaFormData.value = { data: '', izena: null, kantitatea: null };
        tratamenduaEditatzenId.value = null;
    };

    async function kargatuTratamenduak(){
        if (info.datuak && info.datuak.id) {
            try {
                const q = query(collection(db, "tratamenduak"), where("mahastiId", "==", info.datuak.id));
                const docs = await getDocs(q);
                const temp = [];
                docs.forEach(doc => { temp.push({ id: doc.id, ...doc.data() }); });
                
                tratamenduGuztiak.value = temp.sort((a, b) => new Date(b.data) - new Date(a.data)); 

            } catch (e) {
                console.error("Errorea tratamenduak kargatzean:", e);
            }
        }
    }

    onMounted( async() => {
        await kargatuTratamenduak();
    });
</script>

<template>
    <div class="aukeren-bista">

        <div class="bidaiak-zerrenda">
            <div class="zerrenda-goiburua">
                <select v-model="tratamenduUrte">
                    <option v-for="urtea in urteenZerrenda" :key="urtea" :value="urtea">
                        {{ urtea }}
                    </option>
                </select>
                <button class="btn-nagusia" @click="irekiTratamenduModal()">+ Gehitu tratamendua</button>
            </div>
            <div class="zerrenda-scroll">
                <div v-if="aurtengoTratamenduak.length === 0" style="text-align: center; color: #666; margin-top: 20px;">
                    <p>Oraindik ez dago tratamendurik erregistratuta mahasti honetan.</p>
                </div>
                
                <div class="txartela-item" v-for="tratamendua in aurtengoTratamenduak" :key="tratamendua.id">
                    <div class="txartela-info-blokea">
                        <div class="bidaia-info">
                            <p class="bidaia-data">{{ tratamendua.data }}</p>
                            <p class="bidaia-kg">{{ tratamendua.izena }} <span>kg</span></p>
                        </div>
                        <div class="bidaia-puntuazioa">
                            <p>Puntuazioa: <strong>{{ tratamendua.kantitatea }}</strong></p>
                        </div>
                    </div>
                    <div class="txartela-ekintzak">
                        <button class="btn-ikono" title="Editatu" @click="tratamenduaEditatu(tratamendua)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
                        <button class="btn-ikono btn-ezabatu" title="Ezabatu" @click="tratamenduaEzabatu(tratamendua.id)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    </div>
                </div>
            </div>
        </div>

        <div class="dialogo-hondoa" v-if="erakutsiDialogoa">
            <div class="datuak-kutxa">
                <h3>Tratamendu berria gehitu</h3>
                
                <div class="lehioa-edukia">
                    <div>
                        <label>Data eta ordua:</label>
                        <input type="datetime-local" v-model="tratamenduaFormData.data">
                    </div>
                    <div>
                        <label>Izena:</label>
                        <input type="text" v-model="tratamenduaFormData.izena">
                    </div>
                    <div>
                        <label>Kantitatea:</label>
                        <input type="number" v-model="tratamenduaFormData.kantitatea">
                    </div>
                </div>

                <div class="dialogo-botoiak">
                    <button class="btn-bigarren" @click="erakutsiDialogoa = false">Utzi</button>
                    <button class="btn-nagusia" @click="gordeTratamendua()">Gorde</button>
                </div>
            </div>
        </div>
    </div>
</template>