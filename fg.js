// Conexión compartida con Firebase para Falta Gente
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const cfg = { apiKey: "AIzaSyA9YJEk1XIsZibppMATtIDeAwRa6-8ab5w", authDomain: "faltagente.firebaseapp.com", projectId: "faltagente", storageBucket: "faltagente.firebasestorage.app", messagingSenderId: "540133272356", appId: "1:540133272356:web:4345443a9be6174b6ae1b1" };
export const app = getApps().length ? getApp() : initializeApp(cfg);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const esperarUsuario = () => new Promise((res) => { const off = auth.onAuthStateChanged((u) => { off(); res(u); }); });
