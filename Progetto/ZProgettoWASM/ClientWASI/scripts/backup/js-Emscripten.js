import { riceviUtente, riceviStato, riceviMessaggio } from "./scriptsWASI.js";
// Wasm globals
var wasmMemory = new WebAssembly.Memory({
  initial: 256,
});

var wasmExports;
export function wasmLoad() {
  WebAssembly.instantiateStreaming(
      fetch("js-Emscripten.wasm"), {
      wasi_snapshot_preview1: { fd_write: _fd_write },
      env: {
          emscripten_memcpy_big: _emscripten_memcpy_big,
          emscripten_resize_heap: wasmMemory.grow,
          emscripten_websocket_close: _emscripten_websocket_close,
          emscripten_websocket_is_supported: _emscripten_websocket_is_supported,
          emscripten_websocket_new: _emscripten_websocket_new,
          emscripten_websocket_send_utf8_text: _emscripten_websocket_send_utf8_text,
          emscripten_websocket_set_onclose_callback_on_thread: _emscripten_websocket_set_onclose_callback_on_thread,
          emscripten_websocket_set_onerror_callback_on_thread: _emscripten_websocket_set_onerror_callback_on_thread,
          emscripten_websocket_set_onmessage_callback_on_thread: _emscripten_websocket_set_onmessage_callback_on_thread,
          emscripten_websocket_set_onopen_callback_on_thread: _emscripten_websocket_set_onopen_callback_on_thread,
          exit: _exit,
          sendJSMes: _sendJSMes,
          sendJSStato: _sendJSStato,
          sendJSUtente: _sendJSUtente
      }
  }
  ).then((results) => {
    wasmExports = results.instance.exports;
    console.log(wasmExports);
    wasmMemory = wasmExports['memory'];
    updateMemoryViews();
    wasmExports.main();

  });

}

function encodePointer(type, obj, memory, malloc) {
  var n=((type=="messaggio") ? 12 : 4);
  var pointer = malloc(n);
  // HEAPU8 
  const buf = new Uint8Array(memory.buffer, pointer, n);

   //encodeStruct(type, obj, buffer, memory, malloc, cursor, pointer);
    //encodeStruct
    var cursor=0;
    for (var name of Object.values(obj)) {
      var type=typeof name;
      var ptr = encodeArray(type,name, memory, malloc);
      //encodeInt()
      for (var i = 0; i < 4; i++) {
        buf[i + cursor] = ptr & 0xff;
        ptr >>= 8;
      }
      cursor += 4;
    }
  return pointer;
}

function encodeArray(type, obj, memory, malloc) {
  if (!obj) {
      return 0; // NULL
  }
  const n = (obj.length + 1) * 4;
  const ptr = wasmExports.wasmmalloc(n);
  const buf = new Uint8Array(memory.buffer, ptr, n);
  if (type === 'string') {
      for (var i = 0; i < obj.length; i++) {
          buf[i] = obj.charCodeAt(i);
      }
      buf[obj.length] = 0;
  } 
  return ptr;
}
export function inviaMessaggioWasi(messaggio) {
//export async function inviaMessaggioWasi(messaggio) {
  var messaggioWASM = encodePointer("messaggio", messaggio, wasmMemory, wasmExports.wasmmalloc);
  wasmExports.WebSocketSendMessaggio(messaggioWASM);
  wasmExports.wasmfree(messaggioWASM);
}

export function inviaUtenteWasi(utente) {
//export async function inviaUtenteWasi(utente) {
  var utenteWASM = encodePointer("utente", utente, wasmMemory, wasmExports.wasmmalloc);
  wasmExports.WebSocketSendUtente(utenteWASM);
  wasmExports.wasmfree(utenteWASM);
}

// Memory management

var HEAP8,
  /** @type {!Uint8Array} */
  HEAPU8,
  /** @type {!Int16Array} */
  HEAP16,
  /** @type {!Uint16Array} */
  HEAPU16,
  /** @type {!Int32Array} */
  HEAP32,
  /** @type {!Uint32Array} */
  HEAPU32,
  /** @type {!Float32Array} */
  HEAPF32,
  /** @type {!Float64Array} */
  HEAPF64;

function updateMemoryViews() {
  var b = wasmMemory.buffer;
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
}
// include: runtime_exceptions.js
// end include: runtime_exceptions.js
var wasmBinaryFile;
wasmBinaryFile = 'js-Emscripten.wasm';

var exports;
// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  };
  
  function receiveInstance(instance, module) {
    exports = instance.exports;

    wasmExports = exports;

    wasmMemory = wasmExports['memory'];


    return exports;
  }
}
var _emscripten_memcpy_big = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);

var WS = {
  sockets: [null],
  socketEvent: null,
};
var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : undefined;

var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on
  // null terminator by itself.  Also, use the length info to avoid running tiny
  // strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation,
  // so that undefined means Infinity)
  while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
  }

  var str = '';
  // If building with TextDecoder, we have already computed the string length
  // above, so test loop end condition against that
  while (idx < endPtr) {
    // For UTF8 byte structure, see:
    // http://en.wikipedia.org/wiki/UTF-8#Description
    // https://www.ietf.org/rfc/rfc2279.txt
    // https://tools.ietf.org/html/rfc3629
    var u0 = heapOrArray[idx++];
    if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 0xF0) == 0xE0) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte ' + ptrToString(u0) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
      u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
    }

    if (u0 < 0x10000) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    }
  }
  return str;
};

var UTF8ToString = (ptr, maxBytesToRead) => {
  if(typeof ptr == 'number')
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
};
function _emscripten_websocket_close(socketId, code, reason) {
  var socket = WS.sockets[socketId];
  if (!socket) {
    return -3;
  }

  var reasonStr = reason ? UTF8ToString(reason) : undefined;
  // According to WebSocket specification, only close codes that are recognized have integer values
  // 1000-4999, with 3000-3999 and 4000-4999 denoting user-specified close codes:
  // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
  // Therefore be careful to call the .close() function with exact number and types of parameters.
  // Coerce code==0 to undefined, since Wasm->JS call can only marshal integers, and 0 is not allowed.
  if (reason) socket.close(code || undefined, UTF8ToString(reason));
  else if (code) socket.close(code);
  else socket.close();
  return 0;
}

function _emscripten_websocket_is_supported() {
  return typeof WebSocket != 'undefined';
}


function _emscripten_websocket_new(createAttributes) {
  if (typeof WebSocket == 'undefined') {
    return -1;
  }
  if (!createAttributes) {
    return -5;
  }

  var createAttrs = createAttributes >> 2;
  var url = UTF8ToString(HEAP32[createAttrs]);
  var protocols = HEAP32[createAttrs + 1];
  // TODO: Add support for createOnMainThread==false; currently all WebSocket connections are created on the main thread.
  // var createOnMainThread = HEAP32[createAttrs+2];

  var socket = protocols ? new WebSocket(url, UTF8ToString(protocols).split(',')) : new WebSocket(url);
  // We always marshal received WebSocket data back to Wasm, so enable receiving the data as arraybuffers for easy marshalling.
  socket.binaryType = 'arraybuffer';
  // TODO: While strictly not necessary, this ID would be good to be unique across all threads to avoid confusion.
  var socketId = WS.sockets.length;
  WS.sockets[socketId] = socket;

  return socketId;
}


function _emscripten_websocket_send_utf8_text(socketId, textData) {
  var socket = WS.sockets[socketId];
  if (!socket) {
    return -3;
  }

  var str = UTF8ToString(textData);
  socket.send(str);
  return 0;
}


var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
  if(typeof str === 'string')
  // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
  // undefined and false each don't write out any bytes.
  if (!(maxBytesToWrite > 0))
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
    // unit, not a Unicode code point of the character! So decode
    // UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
    // and https://www.ietf.org/rfc/rfc2279.txt
    // and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 0xC0 | (u >> 6);
      heap[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 0xE0 | (u >> 12);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u > 0x10FFFF) warnOnce('Invalid Unicode code point ' + ptrToString(u) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).');
      heap[outIdx++] = 0xF0 | (u >> 18);
      heap[outIdx++] = 0x80 | ((u >> 12) & 63);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx] = 0;
  return outIdx - startIdx;
};
var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
  if(typeof maxBytesToWrite == 'number')
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
};

function _emscripten_websocket_set_onclose_callback_on_thread(socketId, userData, callbackFunc, thread) {
  if (!WS.socketEvent) WS.socketEvent = wasmExports.wasmmalloc(1024); // TODO: sizeof(EmscriptenWebSocketCloseEvent), which is the largest event struct

  var socket = WS.sockets[socketId];
  if (!socket) {
    return -3;
  }

  socket.onclose = function (e) {
    HEAPU32[WS.socketEvent >> 2] = socketId;
    HEAPU32[(WS.socketEvent + 4) >> 2] = e.wasClean;
    HEAPU32[(WS.socketEvent + 8) >> 2] = e.code;
    stringToUTF8(e.reason, WS.socketEvent + 10, 512);
    wasmExports.WebSocketClose(0, WS.socketEvent, userData);
  }
  return 0;
}

function _emscripten_websocket_set_onerror_callback_on_thread(socketId, userData, callbackFunc, thread) {
  if (!WS.socketEvent) WS.socketEvent = wasmExports.wasmmalloc(1024); // TODO: sizeof(EmscriptenWebSocketCloseEvent), which is the largest event struct

  var socket = WS.sockets[socketId];
  if (!socket) {
    return -3;
  }

  socket.onerror = function (e) {
    HEAPU32[WS.socketEvent >> 2] = socketId;
    wasmExports.WebSocketError(0, WS.socketEvent, userData);
  }
  return 0;
}

function _emscripten_websocket_set_onmessage_callback_on_thread(socketId, userData, callbackFunc, thread) {
  if (!WS.socketEvent) WS.socketEvent = wasmExports.wasmmalloc(1024);

  var socket = WS.sockets[socketId];
  if (!socket) {
    return -3;
  }

  socket.onmessage = function (e) {
    HEAPU32[WS.socketEvent >> 2] = socketId;
    // if (typeof e.data == 'string') {
      var len = 0;
      while(len <= e.data.length) len++;
      
      var ret = wasmExports.wasmmalloc(len);
      stringToUTF8(e.data,ret,len);
      HEAPU32[(WS.socketEvent + 12) >> 2] = 1; // text data
    // } else {
    //   var size = e.data.byteLength;
    //   var ret = wasmExports.wasmmalloc(size);
    //   HEAP8.set(new Uint8Array(e.data), ret);
    //   HEAPU32[(WS.socketEvent + 12) >> 2] = 0; // binary data
    // }
    HEAPU32[(WS.socketEvent + 4) >> 2] = ret;
    HEAPU32[(WS.socketEvent + 8) >> 2] = len;
    wasmExports.WebSocketMessage(0, WS.socketEvent, userData);
    wasmExports.wasmfree(ret);
  }
  return 0;
}


function _emscripten_websocket_set_onopen_callback_on_thread(socketId, userData, callbackFunc, thread) {

  if (!WS.socketEvent) WS.socketEvent = wasmExports.wasmmalloc(1024);

  var socket = WS.sockets[socketId];
  if (!socket) {
    return -3;
  }

  socket.onopen = function (e) {
    HEAPU32[WS.socketEvent >> 2] = socketId;
    wasmExports.WebSocketOpen(0, WS.socketEvent, userData);
  }
  return 0;
}

var _proc_exit = (code) => {
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    if (Module['onExit']) Module['onExit'](code);
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
};

var exitJS = (status, implicit) => {
  EXITSTATUS = status;
  if (keepRuntimeAlive() && !implicit) {
    var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
    err(msg);
  }

  _proc_exit(status);
};
var _exit = exitJS;

var printCharBuffers = [null, [], []];

var printChar = (stream, curr) => {
  var buffer = printCharBuffers[stream];
  if(buffer)
  if (curr === 0 || curr === 10) {
    (stream === 1 ? console.log.bind(console): console.error.bind(console))(UTF8ArrayToString(buffer, 0));
    buffer.length = 0;
  } else {
    buffer.push(curr);
  }
};


var _fd_write = (fd, iov, iovcnt, pnum) => {
  // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
  var num = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = HEAPU32[((iov) >> 2)];
    var len = HEAPU32[(((iov) + (4)) >> 2)];
    iov += 8;
    for (var j = 0; j < len; j++) {
      printChar(fd, HEAPU8[ptr + j]);
    }
    num += len;
  }
  HEAPU32[((pnum) >> 2)] = num;
  return 0;
};

var mes = class Messaggio {
  constructor(mittente, destinatario, testo) {
    this.mittente = mittente;
    this.destinatario = destinatario;
    this.testo = testo;
  }
};
mes.mittente = "";
mes.destinatario = "";
mes.testo = "";

var u = class Utente {
  constructor(utente) {
    this.utente = utente;
  }
};
u.utente = "";

var s = class Stato {
  constructor(stato) {
    this.stato = stato;
  }
};
s.stato = "";

function decodeString(ptr) {
  var bytes = new Int8Array(wasmMemory.buffer, ptr);
  var strlen = 0;
  while (bytes[strlen] != 0) strlen++;

  return new TextDecoder("utf8").decode(bytes.slice(0, strlen));
}
export function _sendJSMes(messaggio) {
  var createAttrs = messaggio >> 2;
  mes.mittente = UTF8ToString(HEAP32[createAttrs]);
  mes.destinatario = UTF8ToString(HEAP32[createAttrs + 1]);
  mes.testo = UTF8ToString(HEAP32[createAttrs + 2]);
  console.log("Messaggio Ricevuto " + mes.mittente + " " + mes.destinatario + " " + mes.testo);
  riceviMessaggio(mes);
}

export function _sendJSUtente(utente) {
  u.utente = decodeString
(utente);
  console.log("Utente Ricevuto " + u.utente);
  riceviUtente(u);
}

export function _sendJSStato(stato) {
  s.stato = decodeString
(stato);
  console.log("Stato Ricevuto " + s.stato);
  riceviStato(s);
}

wasmLoad();