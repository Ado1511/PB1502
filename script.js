// ===== Cuenta regresiva al 15/02/2026 18:30 =====
const target = new Date("2026-02-15T18:30:00").getTime();
const el = document.getElementById("countdown");
function tick(){
  if(!el) return;
  const diff = target - Date.now();
  if(diff <= 0){ el.textContent = "¡Es hoy! 🎉"; return; }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  el.textContent = `${d}d ${h}h ${m}m ${s}s`;
}
tick(); setInterval(tick, 1000);

// ===== Mini flip aleatorio en estados del FIDS =====
function randomizeFIDS(){
  const statuses = ["ON TIME","GATE OPEN","BOARDING","SPECIAL","FEST"];
  const cells = document.querySelectorAll("#fids-body td.status");
  cells.forEach((cell)=>{
    const next = statuses[(Math.floor(Math.random()*statuses.length))];
    const span = document.createElement('span');
    span.className = 'flip';
    span.textContent = next;
    cell.innerHTML = "";
    cell.appendChild(span);
  });
}
setInterval(randomizeFIDS, 3500);

// ===== RSVP handler: Google Sheet + WhatsApp =====
function rsvpSubmit(e){
  e.preventDefault();

  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());

  // 1) Enviar a Google Sheet via Apps Script (tu URL)
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYPSbb93V0whqbtsgoYG1nAUzKgNZNgvz1eYLTBJbxhd3lBmPl7BCYaJDrR6wN36w7rQ/exec';

  const payload = {
    nombre:        data.nombre || '',
    email:         data.email || '',
    asistencia:    data.asistencia || '',
    acompanantes:  data.acompanantes || '',
    comentarios:   data.comentarios || '',
    ua:            navigator.userAgent,
    ref:           document.referrer || ''
  };

  const body = 'payload=' + encodeURIComponent(JSON.stringify(payload));

  fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  }).catch(()=>{ /* si falla, seguimos con WhatsApp igualmente */ });

  // 2) Abrir WhatsApp con mensaje prellenado
  const lines = [
    '✈️ *RSVP – Pame & Beto Airlines*',
    `👤 Nombre: ${payload.nombre || '-'}`,
    `📧 Email: ${payload.email || '-'}`,
    `✅ Asistencia: ${payload.asistencia === 'si' ? 'Sí, confirmo' : 'No podré'}`,
    `🗓️ Vuelo PB2026 – Corrientes 2026`
  ];
  if (payload.acompanantes) lines.splice(4,0,`👥 Acompañantes: ${payload.acompanantes}`);
  if (payload.comentarios)  lines.push(`💬 Comentarios: ${payload.comentarios}`);

  const message  = encodeURIComponent(lines.join('\n'));
  const waNumber = '972508840083'; // 050-884-0083 en formato internacional
  const waURL    = `https://wa.me/${waNumber}?text=${message}`;
  window.open(waURL, '_blank');

  // 3) Feedback visual
  const elMsg = document.getElementById('rsvp-msg');
  elMsg.textContent = `¡Gracias ${payload.nombre || ''}! Recibimos tu check-in.`;
  form.reset();

  return false;
}
