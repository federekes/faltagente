// Foro de cada partido: lo lee cualquiera, escriben solo los anotados y el organizador.
import { db, auth, esc } from "./fg.js";
import { doc, getDoc, onSnapshot, collection, addDoc, deleteDoc, query, orderBy, limitToLast, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $ = (i) => document.getElementById(i);
const id = new URLSearchParams(location.search).get('id');
let P = null, user = null, msgs = [];
const fotos = {};
const hace = (t) => {
  if (!t) return 'recién';
  const s = Math.max(0, (Date.now() - t.toMillis()) / 1000);
  if (s < 60) return 'recién';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return t.toDate().toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' });
};
const foto = async (uid) => {
  if (uid in fotos) return fotos[uid];
  fotos[uid] = null;
  try { const s = await getDoc(doc(db, 'jugadores', uid)); fotos[uid] = (s.exists() && s.data().foto) || null; } catch (e) {}
  return fotos[uid];
};
const anotado = () => !!(user && P && ((P.jugadores && P.jugadores[user.uid]) || P.orgUid === user.uid));
const pintarForm = () => {
  const f = $('foro-form'), n = $('foro-nota');
  if (anotado()) { f.hidden = false; n.hidden = true; }
  else { f.hidden = true; n.hidden = false; n.textContent = user ? 'Anotate en el partido para escribir acá.' : 'Ingresá y anotate en el partido para escribir acá.'; }
};
const pintarLista = async () => {
  const l = $('foro-lista');
  if (!msgs.length) { l.innerHTML = '<p style="margin:0;color:#B8B8B8;font-size:18px">Todavía nadie escribió. ¡Arrancá vos!</p>'; return; }
  await Promise.all(msgs.map((m) => foto(m.uid)));
  l.innerHTML = msgs.map((m) => {
    const org = P && m.uid === P.orgUid, mio = user && m.uid === user.uid, puedo = mio || (user && P && user.uid === P.orgUid);
    const f = fotos[m.uid];
    const av = f ? `<span style="width:44px;height:55px;flex:none;border:2px solid ${org ? '#7CC4FF' : '#3DDC5A'};background:#2E3631 url('${f}') center/cover"></span>` : `<span style="width:44px;height:55px;flex:none;border:2px solid #5A6A60;background:#2E3631;display:flex;align-items:center;justify-content:center;font-family:Anton,sans-serif;font-size:22px">${esc((m.alias || '?').slice(0, 1))}</span>`;
    return `<div style="display:flex;gap:12px;align-items:flex-start;padding:12px;background:#0A0A0A;border:1px solid #2E3631">${av}<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px"><div style="display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline"><strong style="font-size:19px;letter-spacing:1px;color:${org ? '#7CC4FF' : '#fff'}">${esc(m.alias || 'Jugador')}</strong>${org ? '<span style="font-size:14px;font-weight:700;letter-spacing:2px;color:#7CC4FF">ORGANIZA</span>' : ''}<span style="font-size:15px;color:#8A9A90">${hace(m.t)}</span>${puedo ? `<button data-borrar="${esc(m.id)}" type="button" style="margin-left:auto;background:none;border:0;color:#8A9A90;font-size:15px;text-decoration:underline;cursor:pointer;min-height:32px">Borrar</button>` : ''}</div><p style="margin:0;font-size:20px;line-height:1.4;white-space:pre-wrap;overflow-wrap:anywhere">${esc(m.texto)}</p></div></div>`;
  }).join('');
  l.querySelectorAll('[data-borrar]').forEach((b) => b.onclick = async () => {
    try { await deleteDoc(doc(db, 'partidos', id, 'mensajes', b.dataset.borrar)); } catch (e) { $('foro-msg').textContent = 'No se pudo borrar.'; }
  });
};
if (id && $('foro')) {
  $('foro').hidden = false;
  auth.onAuthStateChanged((u) => { user = u; pintarForm(); pintarLista(); });
  onSnapshot(doc(db, 'partidos', id), (s) => { P = s.exists() ? s.data() : null; pintarForm(); });
  onSnapshot(query(collection(db, 'partidos', id, 'mensajes'), orderBy('t'), limitToLast(100)), (s) => {
    msgs = s.docs.map((d) => ({ id: d.id, ...d.data() })); pintarLista();
  }, (e) => console.warn('foro', e));
  const ta = $('foro-texto');
  ta.addEventListener('input', () => { $('foro-cuenta').textContent = `${ta.value.length}/280`; });
  $('foro-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const texto = ta.value.trim(); if (!texto || !user) return;
    const b = $('foro-btn'); b.disabled = true; $('foro-msg').textContent = '';
    try {
      let alias = (P.jugadores && P.jugadores[user.uid] && P.jugadores[user.uid].alias) || (P.orgUid === user.uid ? P.orgAlias : '') || '';
      if (!alias) { const s = await getDoc(doc(db, 'jugadores', user.uid)); alias = (s.exists() && s.data().alias) || 'Jugador'; }
      await addDoc(collection(db, 'partidos', id, 'mensajes'), { uid: user.uid, alias: alias.slice(0, 30), texto: texto.slice(0, 280), t: serverTimestamp() });
      ta.value = ''; $('foro-cuenta').textContent = '0/280';
    } catch (e) { $('foro-msg').textContent = 'No se pudo publicar. Probá de nuevo.'; console.warn(e); }
    b.disabled = false;
  });
}
