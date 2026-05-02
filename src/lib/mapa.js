import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

let mapa = null;
let partzelaGeruza = null;
let etiketak = [];
let aukeratutakoa = null;
let nireMahastiakZerrenda = []; 
let mahastiAukeratua = null;
let erabiltzaileakPacDu = false;

export function mapaHasieratu(idContenedor) {
    mapa = L.map(idContenedor, {
        center: [42.58, -2.51], 
        zoom: 17
    });

    mapa.zoomControl.setPosition('bottomleft');

    L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
        { maxZoom: 19, minZoom: 17, attribution: 'Tiles © Esri' }
    ).addTo(mapa);

    mapa.on('moveend', partzelakKargatu);
    return mapa;
}

export function zentratu(lat, lng) {
    if(mapa) mapa.setView([lat, lng], 17);
}

export function eguneratuNireMahastiak(mahastiak) {
    nireMahastiakZerrenda = mahastiak;
    partzelakKargatu(erabiltzaileakPacDu);
}

export function partzelakKargatu(pac) {
    if (typeof pac === 'boolean') {
        erabiltzaileakPacDu = pac;
    }
    if(!mapa) return;
    
    const bounds = mapa.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(',');
    
    let url='';

    if(erabiltzaileakPacDu){
        url = `https://sigpac-hubcloud.es/ogcapi/collections/cultivo_declarado/items?bbox=${bbox}&parc_producto=102&limit=500&f=json`;
    } else {
        url = `https://sigpac-hubcloud.es/ogcapi/collections/recintos/items?bbox=${bbox}&limit=500&f=json`;
    }

    fetch(url)
        .then(res => res.json())
        .then(data => {
            // Recintoak kendu
            const datuakAgrupados = { type: "FeatureCollection", features: [] };
            const mapaParcelas = {};

            data.features.forEach(feature => {
                const props = feature.properties || {};
                if (!props.municipio) return;

                const muni = props.municipio.toString().padStart(2, '0');
                const poli = props.poligono.toString().padStart(2, '0');
                const parc = props.parcela.toString();
                const ref = muni + poli + parc;

                if (!mapaParcelas[ref]) {
                    mapaParcelas[ref] = {
                        type: "Feature",
                        properties: { ...props, dn_surface: props.dn_surface || 0 },
                        geometry: {
                            type: "MultiPolygon", 
                            coordinates: []
                        }
                    };
                    datuakAgrupados.features.push(mapaParcelas[ref]);
                } else {
                    // Si ya existía este número de parcela, le SUMAMOS el área del nuevo trozo
                    mapaParcelas[ref].properties.dn_surface += (props.dn_surface || 0);
                }

                // Metemos las coordenadas del trozo dentro de la geometría unificada
                if (feature.geometry.type === "Polygon") {
                    mapaParcelas[ref].geometry.coordinates.push(feature.geometry.coordinates);
                } else if (feature.geometry.type === "MultiPolygon") {
                    mapaParcelas[ref].geometry.coordinates.push(...feature.geometry.coordinates);
                }
            });
            
            if (partzelaGeruza) mapa.removeLayer(partzelaGeruza);
            etiketak.forEach(e => mapa.removeLayer(e));
            etiketak = [];
            
            partzelaGeruza = L.geoJSON(datuakAgrupados, {
                style: lortuEstiloa,           
                onEachFeature: konfiguratuGeruza
            }).addTo(mapa);
        })
        .catch(err => console.error('Errorea partzelak kargatzean:', err));
}


function sortuErreferentzia(props) {
    if (!props || !props.municipio) return '—';
    const muni = props.municipio.toString().padStart(2, '0'); 
    const poli = props.poligono.toString().padStart(2, '0');  
    const parc = props.parcela.toString();                    
    return muni + poli + parc;
}

function lortuEstiloa(feature) {
    const props = feature.properties || {};
    const ref = sortuErreferentzia(props);
    
    const nireMahastia = nireMahastiakZerrenda.find(m => m.erref === ref || m.erreferentzia === ref);

    if (nireMahastia) {
        return { color: '#95bd54', weight: 3, fillOpacity: 0.5 }; // Nirea (Berdea)
    } else {
        return { color: '#f6fa11', weight: 2, fillOpacity: 0.1 }; // Besteak (Horia)
    }
}

function konfiguratuGeruza(feature, layer) {
    const props = feature.properties || {};
    const ref = sortuErreferentzia(props);
    
    const area = props.dn_surface || "-"; 
    const altitud = props.altitud || "-";

    const izenakUdalerriak = {
        "11":"Baños de Ebro", "19": "Kripan", "22":"Elciego", 
        "23": "Elvillar", "28":"Labastida", "31":"Laguardia", 
        "32":"Lanciego", "33":"Lapuebla de Labarca", "34":"Leza", 
        "39":"Moreda de Álava", "41":"Navaridas", "43":"Oyón", 
        "52":"Samaniego", "57":"Villabuena de Álava", "60":"Yécora"
    };

    let municipio = ""; let poligono = ""; let parcela = "";

    if (props.municipio) {
        const udalerriKodea = props.municipio.toString().padStart(2, '0');
        municipio = izenakUdalerriak[udalerriKodea] || "Ezezaguna";
        poligono = props.poligono.toString();  
        parcela = props.parcela.toString(); 
    }

    const mahastiaGordeta = nireMahastiakZerrenda.find(m => m.erref === ref || m.erreferentzia === ref);
    
    let popupHtml = mahastiaGordeta 
        ? sortuPopup('gordeta', mahastiaGordeta) 
        : sortuPopup('berria', { ref: ref, area: area, altuera: altitud});
        
    layer.bindPopup(popupHtml);

    if (parcela) {
        layer.bindTooltip(parcela, {
            permanent: true,        
            direction: 'center',    
            className: 'etiketa-partzela' 
        });
    }

    layer.on('click', () => {
        if (mahastiAukeratua) {
            mapa.removeLayer(mahastiAukeratua);
            mahastiAukeratua = null; 
        }
        partzelaGeruza.resetStyle();
        
        layer.setStyle({ color: '#ffffff', weight: 3, fillOpacity: 0.15, className: 'efecto-neon' }); 
        
        aukeratutakoa = { erref: ref, udalerria: municipio, poligonoa: poligono, partzela: parcela, azalera: area,altuera:altitud, geometry: feature.geometry };
    });
    
    layer.on('mouseover', () => {
        layer.setStyle({ fillOpacity: 0.4 });
    });
    
    layer.on('mouseout', () => {
        partzelaGeruza.resetStyle(layer); 
    });
}

function sortuPopup(mota, datuak) {
    const ref = datuak.erreferentzia || datuak.ref;
    const azalera = datuak.azalera || datuak.area;
    const altuera = datuak.altuera;
    
    if (mota === 'gordeta') {
        const datuakJson = JSON.stringify(datuak).replace(/'/g, "&#39;");
        return `
            <div class="popup">
                <h4>${datuak.izena}</h4>
                <p><b>Erref.:</b> ${ref}</p>
                <p><b>Azalera:</b> ${azalera} m²</p>
                <p><b>Altuera:</b> ${altuera} m</p>
                <button class="btn-popup ikusi btn-ikusi-xehetasunak" data-datos='${datuakJson}'>
                    Ikusi xehetasunak
                </button>
            </div>
        `;
    } else if (mota === 'berria') {
        return `
            <div class="popup">
                <p><b>Erref.:</b> ${ref}</p>
                <p><b>Azalera:</b> ${azalera} m²</p>
                <p><b>Altuera:</b> ${altuera} m</p>
                <button class="btn-popup gehitu btn-gehitu-mapa" data-ref="${ref}" data-area="${azalera}">
                    + Mahastia gehitu
                </button>
            </div>
        `;
    }
}

export function joanMahastira(m) {
  try {
    if (!m || !m.geometry) return;

    if (mahastiAukeratua) {
      mapa.removeLayer(mahastiAukeratua);
    }
    if (partzelaGeruza) {
      partzelaGeruza.resetStyle();
    }

    let geo = typeof m.geometry === 'string' ? JSON.parse(m.geometry) : m.geometry;

    const popupDatuak = sortuPopup('gordeta', m);

    mahastiAukeratua = L.geoJSON(geo, {
        style: {
            color: '#ff0000',      
            weight: 3,             
            fillColor: '#ffcc00',  
            fillOpacity: 0.5       
        }
    }).bindPopup(popupDatuak, { autoPan: false }).addTo(mapa);

    const bounds = mahastiAukeratua.getBounds();
    const centro = bounds.getCenter();

    zentratu(centro.lat, centro.lng);

    mahastiAukeratua.openPopup();

  } catch (error) {
    console.error("Errorea mapan zentratzean:", error);
  }
}


document.addEventListener('click', function(e) {
    // Gehitu botoia sakatzean
    if (e.target && e.target.classList.contains('btn-gehitu-mapa')) {
        const evt = new CustomEvent('berriaFormularioaIreki', { detail: aukeratutakoa });
        window.dispatchEvent(evt);
    }
    // Menua agertu mahastia erabiltzailearena bada
    else if (e.target && e.target.classList.contains('btn-ikusi-xehetasunak')) {
        const datosCompletos = JSON.parse(e.target.getAttribute('data-datos'));
        console.log(datosCompletos);
        const evt = new CustomEvent('nireaMenuaIreki', { detail: datosCompletos });
        window.dispatchEvent(evt);
    }
});