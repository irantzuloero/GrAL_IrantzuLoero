<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { db, auth } from '../firebase.js'; 
    import { query, where, getDocs, doc, updateDoc, collection, addDoc, deleteDoc } from 'firebase/firestore'; 
    import apexchart from 'vue3-apexcharts';

    const info = defineProps(['datuak']);
    const emit = defineEmits(['itzuli']);

    const erakutsiDialogoa = ref(false);
    const bidaiaEditatzenId = ref(null);
    const aukeraBista = ref('bidaiak');
    
    const unekoUrtea = new Date().getFullYear();

    const bidaiakGuztiak = ref([]);
    
    const bidaiaFormData = ref({
        data: '',
        kiloak: null,
        puntuazioa: null
    });

    const aurtengoBidaiak = computed(() => {
        return bidaiakGuztiak.value.filter(b => b.kanpaina === unekoUrtea);
    });

    const totalKg = computed(() => {
        return aurtengoBidaiak.value.reduce((batuketa, b) => batuketa + b.kiloak, 0);
    });

    const batezbestekoPuntuazioa = computed(() => {
        if (totalKg.value === 0) return 0;
        const pisuTotala = aurtengoBidaiak.value.reduce((bat, b) => bat + (b.kiloak * b.puntuazioa), 0);
        return (pisuTotala / totalKg.value).toFixed(2);
    });

    const urtekoDatuak = computed(() => {
        const batuketak = {}; 
        bidaiakGuztiak.value.forEach((b) => {
            if (!batuketak[b.kanpaina]) {
                batuketak[b.kanpaina] = { urtea: b.kanpaina, kiloak: 0, sumaPisuPuntuazioa: 0 };
            }
            batuketak[b.kanpaina].kiloak += Number(b.kiloak);
            batuketak[b.kanpaina].sumaPisuPuntuazioa += (Number(b.kiloak) * Number(b.puntuazioa)); 
        });

        return Object.values(batuketak).map(urteko => {
            let azkenNota = urteko.kiloak > 0 ? (urteko.sumaPisuPuntuazioa / urteko.kiloak).toFixed(2) : 0;
            return { urtea: urteko.urtea, kiloak: urteko.kiloak, puntuazioa: azkenNota };
        }).sort((a, b) => b.urtea - a.urtea); 
    });

    const grafikoDatuak = ref([{ name: 'Jasotako Kiloak', data: [] }]);
    
    const grafikoAukerak = ref({
        chart: { type: 'line', toolbar: { show: false }, fontFamily: 'inherit' },
        colors: ['#4CAF50', '#FF9800'],
        plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
        dataLabels: { enabled: true, enabledOnSeries: ''}, 
        xaxis: { categories: [], title: { text: 'Urteak' } },
        yaxis: [
            { title: { text: 'Kiloak (kg)' } },
            { opposite: true, title: { text: 'Puntuazioa' }, min: 50, max: 100 }
        ],
        tooltip: {
            theme: 'light', shared: true, intersect: false,
            y: [ { formatter: function (val) { return val + " kg" } }, { formatter: function (val) { return val + " / 10" } } ]
        }
    });

    const eguneratuGrafikoa = () => {
        const datuakOrdenatuta = [...urtekoDatuak.value].reverse();
        
        grafikoAukerak.value = {
            ...grafikoAukerak.value,
            xaxis: { ...grafikoAukerak.value.xaxis, categories: datuakOrdenatuta.map(d => d.urtea) }
        };

        grafikoDatuak.value = [
            { name: 'Jasotako Kiloak', type: 'column', data: datuakOrdenatuta.map(d => d.kiloak) }, 
            { name: 'Batezbesteko Puntuazioa', type: 'line', data: datuakOrdenatuta.map(d => parseFloat(d.puntuazioa)) }
        ];
    };

    const kargatuDatuGuztiak = async () => {
        if (info.datuak && info.datuak.id) {
            try {
                const q = query(collection(db, "uztaBidaiak"), where("mahastiId", "==", info.datuak.id));
                const docs = await getDocs(q);
                const temp = [];
                docs.forEach(doc => { temp.push({ id: doc.id, ...doc.data() }); });
                
                bidaiakGuztiak.value = temp.sort((a, b) => new Date(b.data) - new Date(a.data)); 
                
                eguneratuGrafikoa();
            } catch (e) {
                console.error("Errorea bidaiak kargatzean:", e);
            }
        }
    };

    const gordeBidaia = async () => {
        const bidaiaBerria = {
            mahastiId: info.datuak.id,
            data: bidaiaFormData.value.data,
            kiloak: Number(bidaiaFormData.value.kiloak),
            puntuazioa: Number(bidaiaFormData.value.puntuazioa),
            kanpaina: new Date(bidaiaFormData.value.data).getFullYear(),
            userId: auth.currentUser.uid
        };
        try {
            if (bidaiaEditatzenId.value == null) {
                await addDoc(collection(db, "uztaBidaiak"), bidaiaBerria);
            } else {
                await updateDoc(doc(db, "uztaBidaiak", bidaiaEditatzenId.value), bidaiaBerria);
            }
            
            await kargatuDatuGuztiak(); 
            itxiBidaiaModal();
        } catch (e) {
            console.error("Errorea gordetzean: ", e);
        }
    };

    const bidaiaEditatu = (bidaia) => {
        bidaiaEditatzenId.value = bidaia.id;
        bidaiaFormData.value = { data: bidaia.data, kiloak: bidaia.kiloak, puntuazioa: bidaia.puntuazioa };
        erakutsiDialogoa.value = true;
    };

    const bidaiaEzabatu = async (bidaiaId) => {
        if (confirm("Ziur zaude bidaia hau ezabatu nahi duzula? Ekintza hau ezin da desegin.")) {
            try {
                await deleteDoc(doc(db, "uztaBidaiak", bidaiaId));
                await kargatuDatuGuztiak(); 
            } catch (error) {
                console.error("Errorea ezabatzean:", error);
            }
        }
    };

    const irekiBidaiaModal = () => {
        const data = new Date();
        bidaiaFormData.value.data = (new Date(data - data.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        erakutsiDialogoa.value = true;
    };

    const itxiBidaiaModal = () => {
        erakutsiDialogoa.value = false;
        bidaiaFormData.value = { data: '', kiloak: null, puntuazioa: null };
        bidaiaEditatzenId.value = null;
    };

    onMounted( async() => {
        await kargatuDatuGuztiak();
    });
</script>

<template>
    <div class="aukeren-bista">
        <div class="pestainak-kutxa">
            <button 
                :class="['btn-pestaina', { 'aktiboa': aukeraBista === 'bidaiak' }]"
                @click="aukeraBista = 'bidaiak'">
                Aurtengo Kanpaina
            </button>
            <button 
                :class="['btn-pestaina', { 'aktiboa': aukeraBista === 'grafikoak' }]"
                @click="aukeraBista = 'grafikoak'">
                Historikoa
            </button>
        </div>

        <div v-if="aukeraBista === 'bidaiak'" class="pestaina-edukia">
            
            <div class="estatistikak-kutxa">
                <div class="totala-txartela">
                    <p class="datu-etiketa">Jasotako totala</p>
                    <p class="datu-zenbakia">{{totalKg}} <span>kg</span></p>
                </div>
                <div class="totala-txartela">
                    <p class="datu-etiketa">Batezbesteko puntuazioa</p>
                    <p class="datu-zenbakia">{{batezbestekoPuntuazioa}} <span>pt</span></p>
                </div>
            </div>
            <div class="bidaiak-zerrenda">
                <div class="zerrenda-goiburua">
                    <h3 class="azpititulua">Egindako bidaiak</h3>
                    <button class="btn-nagusia" @click="irekiBidaiaModal()">+ Gehitu bidaia</button>
                </div>
                <div class="zerrenda-scroll">
                    <div v-if="aurtengoBidaiak.length === 0" style="text-align: center; color: #666; margin-top: 20px;">
                        <p>Oraindik ez dago bidaiarik erregistratuta mahasti honetan.</p>
                    </div>
                    
                    <div class="txartela-item" v-for="bidaia in aurtengoBidaiak" :key="bidaia.id">
                        <div class="txartela-info-blokea">
                            <div class="bidaia-info">
                                <p class="bidaia-data">{{ bidaia.data }}</p>
                                <p class="bidaia-kg">{{ bidaia.kiloak }} <span>kg</span></p>
                            </div>
                            <div class="bidaia-puntuazioa">
                                <p>Puntuazioa: <strong>{{ bidaia.puntuazioa }}</strong></p>
                            </div>
                        </div>
                        <div class="txartela-ekintzak">
                            <button class="btn-ikono" title="Editatu" @click="bidaiaEditatu(bidaia)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
                            <button class="btn-ikono btn-ezabatu" title="Ezabatu" @click="bidaiaEzabatu(bidaia.id)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="aukeraBista === 'grafikoak'" class="pestaina-edukia">
            
            <div class="layout-bikoitza">
                
                <div class="ezker-zutabea">
                    <h3 class="azpititulua">Urteko laburpenak</h3>
                    <div class="zerrenda-scroll">
                        
                        <div v-if="urtekoDatuak.length === 0" class="datu-gabe">
                            <p>Oraindik ez dago daturik erregistratuta.</p>
                        </div>
                        
                        <div class="txartela-item" v-for="urteko in urtekoDatuak" :key="urteko.urtea">
                            <div class="txartela-info-blokea">
                                <div class="bidaia-info">
                                    <p class="bidaia-data">{{ urteko.urtea }}</p>
                                    <p class="bidaia-kg">{{ urteko.kiloak }} <span>kg</span></p>
                                </div>
                                <div class="bidaia-puntuazioa">
                                    <p>Puntuazioa: <strong>{{ urteko.puntuazioa }}</strong></p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                
                <div class="eskuin-zutabea">
                    <div class="grafiko-kaxa" style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        
                        <div v-if="urtekoDatuak.length > 0">
                            <apexchart 
                                type="line" 
                                height="350" 
                                :options="grafikoAukerak" 
                                :series="grafikoDatuak">
                            </apexchart>
                        </div>
                        
                        <div v-else style="padding: 60px 0; text-align: center; color: #888;">
                            <p>Ez dago datu nahikorik grafikoa sortzeko.</p>
                        </div>
                        
                    </div>
                </div>

            </div>
        </div>

        <div class="dialogo-hondoa" v-if="erakutsiDialogoa">
            <div class="datuak-kutxa">
                <h3>Bidaia berria gehitu</h3>
                
                <div class="lehioa-edukia">
                    <div>
                        <label>Data eta ordua:</label>
                        <input type="datetime-local" v-model="bidaiaFormData.data">
                    </div>
                    <div>
                        <label>Kg kopurua:</label>
                        <input type="number" v-model="bidaiaFormData.kiloak">
                    </div>
                    <div>
                        <label>Puntuazioa:</label>
                        <input type="number" v-model="bidaiaFormData.puntuazioa">
                    </div>
                </div>

                <div class="dialogo-botoiak">
                    <button class="btn-bigarren" @click="erakutsiDialogoa = false">Utzi</button>
                    <button class="btn-nagusia" @click=gordeBidaia()>Gorde</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.zerrenda-goiburua {
    display: flex;
    justify-content: space-between; /* Empuja el h3 a la izquierda y el botón a la derecha */
    align-items: center; /* Los alinea verticalmente para que queden rectos */
    margin-bottom: 15px; /* Deja un poco de aire antes de la lista */
}

.zerrenda-goiburua .azpititulua {
    margin-bottom: 0; 
}

/* RESUMEN (Cajas arriba) */
.estatistikak-kutxa {
    display: flex;
    gap: 15px; 
    margin-bottom: 30px;
}

.totala-txartela {
    flex: 1; 
    background-color: #ca5980; 
    border-radius: var(--borde-radio, 8px);
    padding: 15px;
    color: white; 
    text-align: center;
}

.datu-etiketa {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.8; 
}

.datu-zenbakia {
    margin: 5px 0 0 0;
    font-size: 1.8rem;
    font-weight: bold;
}

.datu-zenbakia span {
    font-size: 1rem; 
    font-weight: normal;
}

.bidaia-data {
    margin: 0;
    color: #666;
    font-size: 0.85rem;
}

.bidaia-kg {
    margin: 5px 0 0 0;
    font-size: 1.2rem;
    font-weight: bold;
    color: #ca5980; 
}

.bidaia-puntuazioa p {
    margin: 0;
    font-size: 0.9rem;
}
/* ==========================================================================
   DIÁLOGO EMERGENTE (MODAL)
   ========================================================================== */

.dialogo-kutxa h3 {
    margin-top: 0;
    color: var(--color-texto);
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 20px;
}

/* Grafikoaren kaxari apur bat itxura emateko */
.grafiko-kaxa {
    padding: 40px; 
    text-align: center; 
    color: #888; 
    background: #f9f9f9; 
    border-radius: 12px;
    border: 1px dashed #ccc;
    height: 100%; /* Ezkerrekoarekin parekatzeko */
    min-height: 300px;
}
</style>