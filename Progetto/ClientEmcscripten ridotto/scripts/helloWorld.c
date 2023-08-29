#include <emscripten.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include "../include/cJSON.h"
#include "emscripten/websocket.h"

typedef struct
{
	char * mittente;
	char *destinatario;
	char *testo;
} Messaggio;

typedef struct
{
	char *utente;
} Utente;

typedef struct
{
	char *stato;
} Stato;

EMSCRIPTEN_WEBSOCKET_T socket;

Messaggio mes;
extern void sendJSMes(Messaggio * mes);
Utente u;
extern void sendJSUtente(Utente u);
Stato s;
extern void sendJSStato(Stato s);

EM_BOOL init();


EMSCRIPTEN_KEEPALIVE
EM_BOOL WebSocketOpen(int eventType, const EmscriptenWebSocketOpenEvent *e, void *userData)
{

	printf("open(eventType=%d, userData=%ld)\n", eventType, (long)userData);
	return 0;
}
EMSCRIPTEN_KEEPALIVE
EM_BOOL WebSocketClose(int eventType, const EmscriptenWebSocketCloseEvent *e, void *userData)
{
	emscripten_websocket_close(e->socket, 0, 0);
	printf("close(eventType=%d, wasClean=%d, code=%d, reason=%s, userData=%ld)\n", eventType, e->wasClean, e->code, e->reason, (long)userData);
	return 0;
}
EMSCRIPTEN_KEEPALIVE
EM_BOOL WebSocketError(int eventType, const EmscriptenWebSocketErrorEvent *e, void *userData)
{
	printf("error(eventType=%d, userData=%ld)\n", eventType, (long)userData);
	return 0;
}

EMSCRIPTEN_KEEPALIVE
EM_BOOL WebSocketSendUtente(Utente * utente)
{
	cJSON *json = cJSON_CreateObject();
	cJSON_AddStringToObject(json, "utente", utente->utente);

	printf("text data: \"%s\"\n", utente->utente);

	emscripten_websocket_send_utf8_text(socket, cJSON_Print(json));
	return 0;
}

EMSCRIPTEN_KEEPALIVE
EM_BOOL WebSocketSendMessaggio(Messaggio * messaggio)
{
	
	cJSON *json = cJSON_CreateObject();
	//cJSON_AddStringToObject(json, "mittente", num);
	cJSON_AddStringToObject(json, "mittente", messaggio->mittente);
	cJSON_AddStringToObject(json, "destinatario", messaggio->destinatario);
	cJSON_AddStringToObject(json, "testo", messaggio->testo);
	printf("text data send: Da \"%s\" A \"%s\" messaggio \"%s\"\n", messaggio->mittente,messaggio->destinatario,messaggio->testo);

	emscripten_websocket_send_utf8_text(socket, cJSON_Print(json));
	return 0;
}

EMSCRIPTEN_KEEPALIVE
EM_BOOL WebSocketMessage(int eventType, const EmscriptenWebSocketMessageEvent *e, void *userData)
{
	printf("message(eventType=%d, userData=%ld, data=%p, numBytes=%d, isText=%d)\n", eventType, (long)userData, e->data, e->numBytes, e->isText);
	if (e->isText)
	{
		if (strstr((char *)e->data,"utente") != NULL) {
		cJSON *json = cJSON_Parse((char *) e->data);
		u.utente = cJSON_GetObjectItemCaseSensitive(json, "utente")->valuestring;
		printf("text data receiv: \"%s\"\n obj: utente %s \n", e->data, u.utente);
		sendJSUtente(u);
		}
		if (strstr((char *)e->data,"mittente") != NULL) {
		cJSON *json = cJSON_Parse((char *) e->data);
		mes.mittente = cJSON_GetObjectItemCaseSensitive(json, "mittente")->valuestring;
		mes.destinatario = cJSON_GetObjectItemCaseSensitive(json, "destinatario")->valuestring;
		mes.testo = cJSON_GetObjectItemCaseSensitive(json, "testo")->valuestring;
		printf("text data receiv: \"%s\"\n obj: Da \"%s\" A \"%s\" messaggio \"%s\"\n", e->data, mes.mittente, mes.destinatario, mes.testo);
		sendJSMes(&mes);
		}
		if (strstr((char *)e->data,"stato") != NULL) {
		cJSON *json = cJSON_Parse((char *) e->data);
		s.stato = cJSON_GetObjectItemCaseSensitive(json, "stato")->valuestring;
		printf("text data receiv: \"%s\"\n obj: stato \"%s\" \n", e->data,s.stato);
		sendJSStato(s);
		}
	}
	// else
	// {
	// 	printf("binary data:");
	// 	for (int i = 0; i < e->numBytes; ++i)
	// 		printf(" %02X", e->data[i]);
	// 	printf("\n");

	// 	// emscripten_websocket_delete(e->socket);
	// 	exit(0);
	// }
	return 0;
}

EMSCRIPTEN_KEEPALIVE
int main()
{
	init();
	emscripten_websocket_set_onopen_callback(socket, (void *)42, WebSocketOpen);
	emscripten_websocket_set_onmessage_callback(socket, (void *)43, WebSocketMessage);
	emscripten_websocket_set_onclose_callback(socket, (void *)44, WebSocketClose);
	emscripten_websocket_set_onerror_callback(socket, (void *)45, WebSocketError);
	return 0;
}

EMSCRIPTEN_KEEPALIVE
EM_BOOL init(){

	if (!emscripten_websocket_is_supported())
	{
		printf("WebSockets are not supported, cannot continue!\n");
		exit(1);
	}
	EmscriptenWebSocketCreateAttributes attr;
	emscripten_websocket_init_create_attributes(&attr);

	attr.url = "ws://localhost:8080";

	socket = emscripten_websocket_new(&attr);
	if (socket <= 0)
	{
		printf("WebSocket creation failed, error code %d!\n", (EMSCRIPTEN_RESULT)socket);
		exit(1);
	}
	return 0;
}

EMSCRIPTEN_KEEPALIVE
void *wasmmalloc(int size)
{
    return malloc(size);
}

EMSCRIPTEN_KEEPALIVE
void wasmfree(void *ptr)
{
    free(ptr);
}
