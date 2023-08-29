var socket = new WebSocket("ws://localhost:8080/");

function send(data) {
	var json = JSON.stringify(data);
	socket.send(json);
}
var utente;
socket.onmessage = function (event) {

if(event.data.includes("utente"))
{
	var u = JSON.parse(event.data);
	utente=u.utente;
	document.getElementById("mittente").value=u.utente;
}
else if(event.data.includes("stato"))
{
	var s = JSON.parse(event.data);
	if(s.stato=="confermato")
	{
		document.getElementById("mittente").readOnly=true;
	}
	else
	{
		document.getElementById("mittente").readOnly=false;
		document.getElementById("mittente").value=utente;
		
	}
	
}
else{
	var message = JSON.parse(event.data);
	//creo div spazio
	var element = document.createElement("div");
	element.setAttribute("class", "space");
	element.id = Math.floor(Math.random() * 10000)*Date.now();
	document.getElementById('cronologia').appendChild(element);
	//creo div ricevuto
	var ricevuto = document.createElement("div");
	ricevuto.setAttribute("class", "ricevuto");
	ricevuto.id = Math.floor(Math.random() * 10000)*Date.now();
	document.getElementById(element.id).appendChild(ricevuto);
	//compilo la restante parte del messaggio
	cronologiaMessaggio(ricevuto,message);
}
}

function newUtente() {
	if (mittente.value.trim() == "" || mittente.value == null) {
		alert("mittente non specificato");
		return;
	}
	var utente=document.getElementById('mittente').value;
	var ute={utente: utente};
	utente.readOnly=true;
	
	var sum=0;
	var t0=0;
	var t1 =0;
	 for (var i=0;i<100;i++){
	 ute.utente=ute.utente+i;
	 t0 = performance.now();
	//console.time("js U");
	send(ute); 
	//console.timeEnd("js U");
	t1 = performance.now();
	 sum+=(t1-t0)
	 console.log("Call Utente took " + (t1 - t0) + " ms.")
	 }
	 console.log("Utente avg is "+sum/100);

}

function myFunction() {
	//controllo i dati immessi
	var mittente = document.getElementById('mittente').value;
	// mittente.readOnly = true;
	var destinatario = document.getElementById("destinatario").value;
	var testo = document.getElementById("messaggio").value;
	if (mittente.trim() == "") {
		alert("mittente non specificato");
		return;
	}
	if (destinatario.trim() == "") {
		alert("destinatario non specificato");
		return;
	}
	if (testo.trim() == "") {
		alert("messaggio vuoto");
		return;
	}

	var Message = {};
	Message.mittente = mittente;
	Message.destinatario = destinatario;
	Message.testo = testo;
	
	var sum=0;
	 var t0=0;
	 var t1 =0;
	
	 for (var i=0;i<100;i++){
	 t0 = performance.now();
	 //console.time("js Mes");
	 send(Message);
	 //console.timeEnd("js Mes");
	 t1 = performance.now();
	 sum+=(t1-t0)
	 console.log("Call Message took " + (t1 - t0) + " ms.")
	 }
	 console.log("Message avg is "+sum/100);


	//creo div spazio
	var element = document.createElement("div");
	element.setAttribute("class", "space");
	element.id = Math.floor(Math.random() * 10000)*Date.now();
	document.getElementById('cronologia').appendChild(element);
	//creo div inviato
	var inviato = document.createElement("div");
	inviato.setAttribute("class", "inviato");
	inviato.id = Math.floor(Math.random() * 10000)*Date.now();
	document.getElementById(element.id).appendChild(inviato);
	//compilo la restante parte del messaggio
	cronologiaMessaggio(inviato,Message);
}

function cronologiaMessaggio(div,messaggio,testo) {
	//creo div di info
	var info = document.createElement("div");
	info.setAttribute("class", "info");
	info.id = Math.floor(Math.random() * 10000)*Date.now();
	document.getElementById(div.id).appendChild(info);
	//creo div info sul nome
	var nome = document.createElement("div");
	nome.setAttribute("class", "nome");
	nome.id = Math.floor(Math.random() * 10000)*Date.now();
	nome.appendChild(document.createTextNode(messaggio.mittente));
	document.getElementById(info.id).appendChild(nome);
	//creo div orario
	var ora = document.createElement("div");
	ora.setAttribute("class", "ora");
	ora.id = Math.floor(Math.random() * 10000)*Date.now();
	var data = new Date();
	var orario = data.getHours() + ":" + data.getMinutes();
	ora.appendChild(document.createTextNode(orario));
	document.getElementById(info.id).appendChild(ora);
	//creo div di testo del messaggio
	var testo = document.createElement("div");
	testo.setAttribute("class", "testo");
	testo.id = Math.floor(Math.random() * 10000)*Date.now();
	testo.appendChild(document.createTextNode(messaggio.testo));
	document.getElementById(div.id).appendChild(testo);
}
