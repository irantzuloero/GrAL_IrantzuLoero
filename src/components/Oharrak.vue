<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { db, auth } from '../firebase.js'; 
    import { query, where, getDocs, doc, updateDoc, collection, addDoc, deleteDoc } from 'firebase/firestore'; 

    const info = defineProps(['datuak']);

    const oharrakGuztiak = ref([]);
    const erakutsiDialogoa = ref(false);
    const oharraEditatzenId = ref(null);

    const oharraFormData = ref({
        data: '',
        testua: ''
    });

    async function kargatuOharrak(){
        try {
            const q = query(collection(db, "oharrak"), where("mahastiId", "==", info.datuak.id));
            const docs = await getDocs(q);
            const oharLista = [];
            docs.forEach(doc => { oharLista.push({ id: doc.id, ...doc.data() }); });
            oharrakGuztiak.value = oharLista.sort((a, b) => new Date(b.data) - new Date(a.data));
        } catch(e) {
            console.error("Errorea oharrak kargatzean: ",e);
        }
    }

    async function gordeOharra(){
        const oharBerria = {
            mahastiId: info.datuak.id,
            data: oharraFormData.value.data,
            testua: oharraFormData.value.testua,
            userId: auth.currentUser.uid
        };
        try {
            if (oharraEditatzenId.value == null){
                await addDoc(collection(db, "oharrak"), oharBerria);
            }else {
                await updateDoc(doc(db, "oharrak", oharraEditatzenId.value), oharBerria);
            }
            await kargatuOharrak(); 
            itxiOharraModal();
        } catch(e){
            console.error("Errorea oharra gordetzen: ",e);
        }
    }

    function irekiOharraModal(){
        const data = new Date();
        oharraFormData.value.data = (new Date(data - data.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        erakutsiDialogoa.value = true;
    }

    function itxiOharraModal(){
        erakutsiDialogoa.value = false;
        oharraFormData.value = { data: '', testua: ''};
        oharraEditatzenId.value = null;
    }

    function oharraEditatu(oharra){
        oharraEditatzenId.value = oharra.id;
        oharraFormData.value = { data: oharra.data, testua: oharra.testua };
        erakutsiDialogoa.value = true;
    }

    async function oharraEzabatu(oharraId){
        if (confirm("Ziur zaude tratamendu hau ezabatu nahi duzula? Ekintza hau ezin da desegin.")) {
            try {
                await deleteDoc(doc(db, "oharrak", oharraId));
                await kargatuOharrak(); 
            } catch (e) {
                console.error("Errorea ezabatzean:", e);
            }
        }
    }

    onMounted( async() => {
        await kargatuOharrak();
    });
</script>

<template>
    <div class="zerrenda-goiburua">
        <button class="btn-nagusia" @click="irekiOharraModal()">+ Gehitu oharra</button>
    </div>
    
    <div>
        <div class="txartela-item" v-for="oharra in oharrakGuztiak" :key="oharra.id" style="width: 100%; box-sizing: border-box; flex-direction: column; align-items: flex-start; gap: 10px; border-left: 4px solid #f59e0b;">
            <span style="font-size: 0.85rem; color: #888; font-weight: bold;">{{ oharra.data }}</span>
            
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.5; color: #333;">{{ oharra.testua }}</p>
            
            <div style="width: 100%; text-align: right; margin-top: 5px;">
                <button class="btn-ikono" title="Editatu" @click="oharraEditatu(oharra)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
                <button class="btn-ikono btn-ezabatu" @click="oharraEzabatu(oharra.id)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
        </div>
    </div>

    <div class="dialogo-hondoa" v-if="erakutsiDialogoa">
        <div class="datuak-kutxa">
            <h3>Ohar berria gehitu</h3>
            
            <div class="lehioa-edukia">
                <div>
                    <label>Data eta ordua:</label>
                    <input type="datetime-local" v-model="oharraFormData.data">
                </div>
                <div style="flex: 1;"> <label>Testua:</label>
                    <textarea v-model="oharraFormData.testua" rows="5" placeholder="Idatzi oharra hemen..."></textarea>
                </div>
            </div>

            <div class="dialogo-botoiak">
                <button class="btn-bigarren" @click="erakutsiDialogoa = false">Utzi</button>
                <button class="btn-nagusia" @click="gordeOharra()">Gorde</button>
            </div>
        </div>
    </div>
</template>