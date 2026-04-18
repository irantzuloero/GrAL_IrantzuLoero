<script setup>
    import { ref } from 'vue'; 
    import { db, auth } from '../firebase.js'; 
    import { doc, updateDoc, collection, addDoc } from 'firebase/firestore'; 

    const info = defineProps(['datuak','motak']);
    const emit = defineEmits(['itzuli']);

    const mahatsMotaPertsonalizatua = ref(''); 
    const erroreaBesteMota = ref(false);

    async function gordeAldaketak(){
        try{
            let motaDefinitiboa = info.datuak.mahatsMota;

            if (motaDefinitiboa === 'BesteBat') {
                const motaBerria = mahatsMotaPertsonalizatua.value.trim();
                
                if (motaBerria === '') {
                    erroreaBesteMota.value = true;
                    return; 
                }
                
                erroreaBesteMota.value = false;
                motaDefinitiboa = motaBerria; 

                const user = auth.currentUser;
                if(user) {
                    await addDoc(collection(db, 'motak'), {
                        izena: motaDefinitiboa,
                        erabiltzaileaId: user.uid
                    });
                }
            }
            const partzela = doc(db, 'partzelak', info.datuak.id);
            await updateDoc(partzela, {
                izena: info.datuak.izena,
                urtea: info.datuak.urtea,
                mahatsMota: motaDefinitiboa
            });
            alert("Aldaketak ondo gorde dira!");

        } catch(e) {
            console.error("Ezin izan dira aldaketak gorde: ", e);
        }
    }
</script>

<template>
    <div class="aukeren-bista">
        <div class="lehioa-edukia">
            <div class="datu-finkoak">
                <label>Erreferentzia:</label>
                <input type="text" v-model="info.datuak.erreferentzia" readonly>
                
                <label>Udalerria:</label>
                <input type="text" v-model="info.datuak.udalerria" readonly>
                
                <label>Poligonoa:</label>
                <input type="text" v-model="info.datuak.poligonoa" readonly>
                
                <label>Partzela:</label>
                <input type="text" v-model="info.datuak.partzela" readonly>
                
                <label>Azalera (m²)</label>
                <input type="text" v-model="info.datuak.azalera" readonly>
            </div>
            
            <div class="datu-aldakorrak">
                <div class="input-taldea">
                    <label>Mahastiaren izena:</label>
                    <input type="text" v-model="info.datuak.izena">
                </div>

                <div class="input-taldea">
                    <label>Landaketa urtea:</label>
                    <input type="number" v-model="info.datuak.urtea">
                </div>

                <label>Mahats mota:</label>
                <select v-model="info.datuak.mahatsMota">
                    <option value="Tempranillo">Tempranillo</option>
                    <option value="Garnatxa">Garnatxa</option>
                    <option value="Viura">Viura</option>
                    <option value="Mazuelo">Mazuelo</option>
                    <option v-for="mota in info.motak" :key="mota._id" :value="mota.izena">
                        {{ mota.izena.charAt(0).toUpperCase() + mota.izena.slice(1).toLowerCase() }}
                    </option>
                    <option value="BesteBat">Beste bat...</option>
                </select> 
                
                <div v-if="info.datuak.mahatsMota === 'BesteBat'" style="margin-top: 10px;">
                    <input 
                        type="text" 
                        v-model="info.datuak.mahatsMotaPertsonalizatua" 
                        placeholder="Mota" 
                        required
                        :style="erroreaBesteMota ? 'border: 2px solid red;' : ''"
                    >
                    <span v-if="erroreaBesteMota" style="color: red; font-size: 12px; display: block; margin-top: 5px;">
                        Mesedez, idatzi mahats motaren izena.
                    </span>
                </div>
            </div>
        </div>
        
        <div class="botoiak-kutxa">
            <button class="btn-nagusia" @click="gordeAldaketak()">Gorde</button>
        </div>
    </div>
</template>