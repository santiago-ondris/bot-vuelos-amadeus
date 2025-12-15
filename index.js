require('dotenv').config();
const Amadeus = require('amadeus');
const TelegramBot = require('node-telegram-bot-api');

const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET
});

const telegramToken = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
let bot = null;

if(telegramToken) {
    bot = new TelegramBot(telegramToken, {polling: false});
}

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

async function enviarNotificacion(mensaje) {
    if(bot && chatId) {
        try {
            await bot.sendMessage(chatId, mensaje, {parse_mode: 'Markdown'});
        } catch (error) {
            console.error("error enviando telegram:", error.message);
        }
    }else {
        console.log("telegram no configurado, notificacion salteada");
    }
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
            const aerolinea = oferta.itineraries[0].segments[0].carrierCode;
            const precio = parseFloat(oferta.price.total);
            const moneda = oferta.price.currency;

            const link = `http://googleusercontent.com/google.com/travel/flights?tfs=CBwQAA&q=Flights%20to%20${destino}%20from%20${origen}%20on%20${fecha}`;

            const mensaje = `✈️ *Vuelo Detectado*\n\n` +
                `🛫 *${origen}* ➡️ *${destino}*\n` +
                `📅 Fecha: ${fecha}\n` +
                `💰 Precio: *${precio} ${moneda}*\n` +
                `🏢 Aerolínea: ${aerolinea}\n\n` +
                `🔗 [Ver en Google Flights](${link})`;
            
            await enviarNotificacion(mensaje);
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
    console.log('--- iniciando reporte ---');
    await enviarNotificacion("El bot de vuelos empieza su ronda diaria");

    for (const origen of CONFIG.origenes) {
        for (const destino of CONFIG.destinos) {
            for(const mes of CONFIG.mesesAFuturo) {
                const fechaObjetivo = obtenerFechaFutura(mes);
                await buscarYGuardarVuelo(origen, destino, fechaObjetivo);
            }
        }
    }
    await enviarNotificacion("Ronda terminada");
    console.log("fin");
}

main();