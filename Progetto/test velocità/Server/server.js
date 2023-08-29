
const WebSocketServer = require('ws');
// Creating a new websocket server
const wss = new WebSocketServer.Server({ port: 8080 });
const clients = new Map();

var denominatoreConnection=0;
var sumConnection=0;
var denominatoreMessaggio=0;
var sumMessaggio=0;
var denominatoreUtente=0;
var sumUtente=0;


// Creating connection using websocket
wss.on("connection", (ws) => {
    //timer connessione inizio
    //console.time("connessione");
    var t0 = performance.now(); 
    
    var GSON = require('gson');
    var utente = ""+new Date().getTime();
    clients.set(ws, utente);
    //console.log("Nuovo utente connesso con codice " + clients.get(ws));
    let Utente= require('./class/utente.js');
    var UtenteJSON=GSON.stringify(new Utente(utente));
    //console.log('Inviato: ' + UtenteJSON);
    ws.send(UtenteJSON);

    //printStat();
    //timer connessione fine
    //console.timeEnd("connessione");
    var t1 = performance.now();
    denominatoreConnection ++;
    sumConnection+=(t1-t0);
    console.log("Connection avg is "+sumConnection/denominatoreConnection + "=" + sumConnection + "/" + denominatoreConnection +" ==> "+(t1-t0)+"ms");
    
    //sending message
    
    ws.on('message', function (messaggio) {
    	
        //console.log('Ricevuto: ' + messaggio);
        messaggio=messaggio+"";
        const word = 'utente';
        if (!messaggio.includes(word)) {
            //timer messaggio inizio
            //console.time("messaggio risposta");
            var t2 = performance.now(); 
            let Messaggio= require('./class/messaggio.js');
            var nuovoMessaggio=GSON.parse(messaggio);
            clients.forEach((value, key)=>
            {
                if (value == nuovoMessaggio.destinatario) {
                    var Grisultato=GSON.stringify(new Messaggio(nuovoMessaggio.mittente,nuovoMessaggio.destinatario,nuovoMessaggio.testo));
                    key.send(Grisultato);
                    //console.log('Inviato: ' + Grisultato);
                }
            });
             //timer messaggio fine
            //console.timeEnd("messaggio risposta");
            var t3 = performance.now();
    	    denominatoreMessaggio ++;
            sumMessaggio+=(t3-t2);
    	    console.log("Messaggio avg is "+sumMessaggio/denominatoreMessaggio + "=" + sumMessaggio + "/" + denominatoreMessaggio +" ==> "+(t3-t2)+"ms");
        }
        else {
            //timer utente inizio
            //console.time("Utente risposta");
            var t4 = performance.now(); 
            var nuovoUtente=GSON.parse(messaggio);
            var trovato=false;
            clients.forEach((value, key)=>
            {
                if(value == nuovoUtente.utente)
                {trovato=true;}
            });
             let Stato= require('./class/stato.js');
            if(!trovato)
            {
                //console.log("L'utente temp " + clients.get(ws)+" ha cambiato nome in \'"+nuovoUtente.utente+"\'");
                clients.set(ws, nuovoUtente.utente);
                //messaggio Confermato cambio nome utente
                var esito=GSON.stringify(new Stato("confermato"));

            }
            else
            {
                //console.log("L'utente temp " + clients.get(ws)+" non ha cambiato nome in \'"+nuovoUtente.utente+"\',perché esiste già");
            
                //messaggio Annullato cambio nome utente
                var esito=GSON.stringify(new Stato("annullato")); 
            }
            //console.log(esito);
            ws.send(esito);
            //timer utente fine
            //console.timeEnd("Utente risposta");
             var t5 = performance.now();
    	    denominatoreUtente ++;
            sumUtente+=(t5-t4);
    	    console.log("Utente avg is "+sumUtente/denominatoreUtente + "=" + sumUtente + "/" + denominatoreUtente +" ==> "+(t5-t4)+"ms");
        }
    });

    ws.on("close", () => {
        //console.log("L'utente " + clients.get(ws) + " si è disconnetto!");
        clients.delete(ws);
        //printStat();
    });

    ws.onerror = function () {
        console.log("Qualche errore è spuntato fuori")
    }
    //ws.send('You successfully connected to the websocket.');
});

function printStat() {
    console.log('numero clienti attivi ' + clients.size + ' e codici identificaviti');
    clients.forEach((ws, client) => console.log(`${ws}`));
}
