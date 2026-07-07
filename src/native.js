// Puente entre la interfaz JARVIS (index.html) y los plugins nativos de Capacitor.
// Se compila con esbuild a www/native-bundle.js y se carga con <script> normal,
// exponiendo todo bajo window.Native para que el script inline de index.html
// pueda usarlo sin necesidad de imports ES module.

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Geolocation } from '@capacitor/geolocation';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Contacts } from '@capacitor-community/contacts';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { App } from '@capacitor/app';

const isNative = Capacitor.isNativePlatform();

// ---------- Permisos: pide todo de una vez al arrancar ----------
async function requestAllPermissions() {
  const results = {};
  if (!isNative) return results;

  try { results.mic = (await SpeechRecognition.requestPermissions()).speechRecognition; } catch (e) { results.mic = 'error'; }
  try { results.camera = (await Camera.requestPermissions()).camera; } catch (e) { results.camera = 'error'; }
  try { results.contacts = (await Contacts.requestPermissions()).contacts; } catch (e) { results.contacts = 'error'; }
  try { results.location = (await Geolocation.requestPermissions()).location; } catch (e) { results.location = 'error'; }
  try { results.calendar = (await CapacitorCalendar.requestFullCalendarAccess()).result; } catch (e) { results.calendar = 'error'; }

  return results;
}

// ---------- Reconocimiento de voz nativo ----------
let listeners = [];
async function speechAvailable() {
  if (!isNative) return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  try { return (await SpeechRecognition.available()).available; } catch (e) { return false; }
}

async function startListening(onFinalResult, onEnd) {
  if (!isNative) return false; // el index.html usa Web Speech API como fallback en navegador
  try {
    listeners.forEach(l => l.remove());
    listeners = [];
    const l1 = await SpeechRecognition.addListener('partialResults', (data) => {
      if (data && data.matches && data.matches.length) {
        onFinalResult(data.matches[0]);
      }
    });
    const l2 = await SpeechRecognition.addListener('listeningState', (data) => {
      if (data && data.status === 'stopped') onEnd();
    });
    listeners.push(l1, l2);
    await SpeechRecognition.start({
      language: 'es-ES',
      partialResults: true,
      popup: false,
    });
    return true;
  } catch (e) {
    console.warn('No se pudo iniciar el reconocimiento nativo:', e);
    onEnd();
    return false;
  }
}

async function stopListening() {
  if (!isNative) return;
  try { await SpeechRecognition.stop(); } catch (e) {}
}

// ---------- Texto a voz nativo ----------
async function speakNative(text) {
  if (!isNative) return false;
  try {
    await TextToSpeech.speak({ text, lang: 'es-ES', rate: 0.95, pitch: 0.75, volume: 1.0 });
    return true;
  } catch (e) {
    console.warn('TTS nativo falló:', e);
    return false;
  }
}
async function stopSpeakingNative() {
  if (!isNative) return;
  try { await TextToSpeech.stop(); } catch (e) {}
}

// ---------- Cámara y archivos ----------
async function takePhoto() {
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.Uri,
    source: CameraSource.Prompt,
    quality: 80,
  });
  return photo.webPath;
}

async function saveNote(filename, content) {
  await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });
  return filename;
}

async function listDocuments() {
  const res = await Filesystem.readdir({ path: '', directory: Directory.Documents });
  return res.files.map(f => f.name);
}

// ---------- Ubicación ----------
async function getLocation() {
  const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

// ---------- Contactos y llamadas ----------
async function findContact(name) {
  const { contacts } = await Contacts.getContacts({
    projection: { name: true, phones: true },
  });
  const n = name.toLowerCase();
  return contacts.find(c => (c.name && c.name.display && c.name.display.toLowerCase().includes(n)));
}

function callNumber(number) {
  // Abre el marcador nativo con el número precargado.
  // Ni Android ni iOS permiten marcar una llamada real sin que el usuario
  // pulse el botón "Llamar" en el marcador; es una restricción del sistema
  // operativo, no de esta app.
  window.location.href = 'tel:' + number.replace(/[^0-9+]/g, '');
}

// ---------- Calendario ----------
async function createEvent(title, startDate, endDate) {
  const id = await CapacitorCalendar.createEvent({
    title,
    startDate: startDate.getTime(),
    endDate: endDate.getTime(),
    alerts: [-30],
  });
  return id;
}

// ---------- Ciclo de vida de la app ----------
function onAppReady(cb) {
  if (isNative) {
    App.addListener('appStateChange', () => {});
    document.addEventListener('deviceready', cb, false);
    // Capacitor no siempre dispara deviceready; también disparamos en DOMContentLoaded.
    if (document.readyState !== 'loading') cb();
  } else {
    cb();
  }
}

window.Native = {
  isNative,
  requestAllPermissions,
  speechAvailable,
  startListening,
  stopListening,
  speakNative,
  stopSpeakingNative,
  takePhoto,
  saveNote,
  listDocuments,
  getLocation,
  findContact,
  callNumber,
  createEvent,
  onAppReady,
};
