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

// Reloj LCD de cuenta regresiva (dígitos de 7 segmentos)
const SEGP = { a: '4,1 16,1 18,3 16,5 4,5 2,3', b: '18,4 20,6 20,16 18,18 16,16 16,6', c: '18,18 20,20 20,30 18,32 16,30 16,20', d: '4,31 16,31 18,33 16,35 4,35 2,33', e: '2,18 4,20 4,30 2,32 0,30 0,20', f: '2,4 4,6 4,16 2,18 0,16 0,6', g: '4,16 16,16 18,18 16,20 4,20 2,18' };
const SEGD = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abfgcd' };
const OFF = 'rgba(21,26,16,0.10)', ON = '#151A10';
const dig = (iso, u, i) => `<svg aria-hidden="true" width="17" height="30" viewBox="-1 0 22 36" style="display:block"><g transform="skewX(-7) translate(2,0)">${Object.entries(SEGP).map(([k, pts]) => `<polygon points="${pts}" fill="${OFF}" data-seg="${u}${i}${k}" data-iso="${iso}"/>`).join('')}</g></svg>`;
const uni = (iso, u, l) => `<span style="display:flex;flex-direction:column;align-items:center;gap:1px"><span style="display:flex;gap:2px">${dig(iso, u, 0)}${dig(iso, u, 1)}</span><span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:10px;letter-spacing:1px;color:#3A4430">${l}</span></span>`;
const col = '<span aria-hidden="true" style="display:flex;flex-direction:column;gap:6px;padding:0 2px;margin-bottom:12px"><span style="width:4px;height:4px;background:#1A1F14"></span><span style="width:4px;height:4px;background:#1A1F14"></span></span>';
export const lcd = (iso) => `<div role="timer" aria-label="Cuenta regresiva para el partido" style="display:flex;align-items:center;gap:3px;padding:6px 10px 4px;background:#B7C4A0;border:3px solid #1E2419;border-radius:6px;box-shadow:inset 0 2px 6px rgba(0,0,0,0.35)">${uni(iso, 'd', 'DÍAS')}${col}${uni(iso, 'h', 'HRS')}${col}${uni(iso, 'm', 'MIN')}${col}${uni(iso, 's', 'SEG')}</div>`;
export const tickLCD = () => document.querySelectorAll('[data-seg]').forEach((el) => {
  const k = el.getAttribute('data-seg'), ms = Math.max(0, new Date(el.getAttribute('data-iso')) - Date.now());
  const v = { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60 }[k[0]];
  const str = String(v).padStart(2, '0').slice(-2); el.setAttribute('fill', SEGD[str[+k[1]]].includes(k[2]) ? ON : OFF);
});
