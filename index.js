require('dotenv').config();
const Amadeus = require('amadeus');
const db = require('./database');

const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET
});

const CONFIG = {
    origenes: ['COR', 'EZE'],
    destinos: ['MIA', 'JFK', 'SFO'],
    mesesAFuturo: [5, 6, 7]
};

function obtenerFechaFutura(mesesAdicionales) {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() + mesesAdicionales);
    return fecha.toISOString().split('T')[0];
}

async function buscarYGuardarVuelo(origen, destino, fecha) {
    try {
        const pausa = Math.floor(Math.random() * 3000) + 2000;
        console.log(`Buscando ${origen} -> ${destino} para ${fecha}...`);
        await new Promise(resolve => setTimeout(resolve, pausa));

        const response = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: origen,
            destinationLocationCode: destino,
            departureDate: fecha,
            adults: '1',
            max: '1',
            currencyCode: 'USD'
        });

        if (response.data.length > 0) {
            const oferta = response.data[0];

            const aerolineaCode = oferta.itineraries[0].segments[0].carrierCode;

            const datosVuelo = {
                recorded_at: new Date().toISOString(),
                origin: origen,
                destination: destino,
                departure_date: fecha,
                airline: aerolineaCode,
                price: parseFloat(oferta.price.total),
                currency: oferta.price.currency
            };

            db.savePrice(datosVuelo);
        } else {
            console.log("no se encontraron vuelos")
        }
    } catch (error) {
        if(error.response) {
            console.error("error de la api", error.response.result);
        } else {
            console.error("error desconocido", error);
        }
    }
}

async function main() {
    console.log('⏰ --- INICIANDO RONDA DE BÚSQUEDA AUTOMÁTICA ---');

    for (const origen of CONFIG.origenes) {
        for (const destino of CONFIG.destinos) {
            for(const mes of CONFIG.mesesAFuturo) {
                const fechaObjetivo = obtenerFechaFutura(mes);
                await buscarYGuardarVuelo(origen, destino, fechaObjetivo);
            }
        }
    }
}

main();