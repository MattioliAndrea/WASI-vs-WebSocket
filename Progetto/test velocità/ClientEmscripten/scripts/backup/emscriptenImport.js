var wasmExports;
export function wasmLoad() {
  WebAssembly.instantiateStreaming(
      fetch("js-Emscripten.wasm"), {
      wasi_snapshot_preview1: { fd_write: _fd_write },
      env: {
          emscripten_memcpy_big: _emscripten_memcpy_big,
          emscripten_resize_heap: _emscripten_resize_heap,
          emscripten_websocket_close: _emscripten_websocket_close,
          emscripten_websocket_is_supported: _emscripten_websocket_is_supported,
          emscripten_websocket_new: _emscripten_websocket_new,
          emscripten_websocket_send_utf8_text: _emscripten_websocket_send_utf8_text,
          emscripten_websocket_set_onclose_callback_on_thread: _emscripten_websocket_set_onclose_callback_on_thread,
          emscripten_websocket_set_onerror_callback_on_thread: _emscripten_websocket_set_onerror_callback_on_thread,
          emscripten_websocket_set_onmessage_callback_on_thread: _emscripten_websocket_set_onmessage_callback_on_thread,
          emscripten_websocket_set_onopen_callback_on_thread: _emscripten_websocket_set_onopen_callback_on_thread,
          exit: _exit,
          sendJSMes: sendJSMes,
          sendJSStato: sendJSStato,
          sendJSUtente: sendJSUtente
      }
  }
  ).then((results) => {
      wasmExports = results.instance.exports;
      console.log(wasmExports);
      wasmMemory = wasmExports['memory'];
    
    assert(wasmMemory, "memory not found in wasm exports");
    // This assertion doesn't hold when emscripten is run in --post-link
    // mode.
    // TODO(sbc): Read INITIAL_MEMORY out of the wasm file in post-link mode.
    //assert(wasmMemory.buffer.byteLength === 16777216);
    updateMemoryViews();

    wasmTable = wasmExports['__indirect_function_table'];
    
    assert(wasmTable, "table not found in wasm exports");

    addOnInit(wasmExports['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');
    
    wasmExports.init();

  });
  
}

export async function inviaMessaggioWasi(messaggio) {
  if (wasmExports == undefined) {
      wasmLoad();
  }
  wasmExports.WebSocketSendMessaggio(messaggio);
}

export async function inviaUtenteWasi(utente) {
  if (wasmExports == undefined) {
      wasmLoad();
  }
  wasmExports.WebSocketSendUtente(utente);
}

  



    var mes=class Messaggio{
      constructor(mittente, destinatario, testo) {
          this.mittente=mittente;
          this.destinatario=destinatario;
          this.testo=testo;
      }};
    mes.mittente="";
    mes.destinatario="";
    mes.testo="";
     
     var u=class Utente{
      constructor(utente) {
          this.utente=utente;
      }};
    u.utente="";
    
    var s=class Stato{
      constructor(stato) {
          this.stato=stato;
      }};
    s.stato="";
  
     function decodeString(ptr) {
              var bytes = new Int8Array(wasmMemory.buffer, ptr);
              var strlen = 0;
              while (bytes[strlen] != 0) strlen++;
  
              return new TextDecoder("utf8").decode(bytes.slice(0, strlen));
          }
    export function sendJSMes(messaggio) {
       var createAttrs = messaggio>>2;
       mes.mittente = UTF8ToString(HEAP32[createAttrs]);
       mes.destinatario = UTF8ToString(HEAP32[createAttrs+1]);
       mes.testo= UTF8ToString(HEAP32[createAttrs+2]);
    console.log("Messaggio Ricevuto "+mes.mittente+" "+mes.destinatario+" "+mes.testo);
      riceviMessaggio(mes);
     }
  
    export function sendJSUtente(utente) {
      u.utente=decodeString(utente);
    console.log("Utente Ricevuto "+u.utente);
      riceviUtente(u);
    }
  
    /** @type {function(...*):?} */
    export function sendJSStato(stato) {
      s.stato=decodeString(stato);
      console.log("Stato Ricevuto "+s.stato);
      riceviStato(s);
    }