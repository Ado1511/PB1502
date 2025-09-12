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

// ===== Helper: abrir WhatsApp con número normalizado =====
function openWhatsApp(rawNumber, text) {
  let n = String(rawNumber).replace(/[^\d]/g, '');
  if (n.startsWith('00')) n = n.slice(2);
  const msg = encodeURIComponent(text || '');
  const url = `https://wa.me/${n}?text=${msg}`;
  const fb  = `https://api.whatsapp.com/send?phone=${n}&text=${msg}`;
  const w = window.open(url, '_blank');
  setTimeout(() => { if (!w || w.closed) window.open(fb, '_blank'); }, 800);
}

// ===== Helpers de validación =====
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function setFieldError(input, msg) {
  let hint = input.parentElement.querySelector('.field-error');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'field-error';
    input.parentElement.appendChild(hint);
  }
  hint.textContent = msg;
  input.classList.add('is-invalid');
}

function clearFieldError(input) {
  const hint = input.parentElement.querySelector('.field-error');
  if (hint) hint.textContent = '';
  input.classList.remove('is-invalid');
}

function validateForm(form) {
  let ok = true;
  const errors = [];

  // Nombre (requerido, min 2 chars)
  const nombre = form.nombre;
  clearFieldError(nombre);
  if (!nombre.value.trim() || nombre.value.trim().length < 2) {
    setFieldError(nombre, 'Ingresá tu nombre (mínimo 2 caracteres).');
    errors.push('Nombre inválido.');
    ok = false;
  }

  // Email
  const email = form.email;
  clearFieldError(email);
  if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
    setFieldError(email, 'Ingresá un email válido.');
    errors.push('Email inválido.');
    ok = false;
  }

  // Acompañantes (0–10)
  const acomp = form.acompanantes;
  clearFieldError(acomp);
  const n = Number(acomp.value);
  if (Number.isNaN(n) || n < 0 || n > 10) {
    setFieldError(acomp, 'Cantidad entre 0 y 10.');
    errors.push('Acompañantes fuera de rango.');
    ok = false;
  }

  // Asistencia
  const asis = form.asistencia;
  clearFieldError(asis);
  if (!asis.value) {
    setFieldError(asis, 'Seleccioná una opción.');
    errors.push('Falta asistencia.');
    ok = false;
  }

  return { ok, errors };
}

// ===== Form: RSVP → Google Sheet + WhatsApp con validación =====
function rsvpSubmit(e){
  e.preventDefault();
  const form = e.target;

  // Limpia mensajes globales
  const msgBox = document.getElementById('rsvp-msg');
  msgBox.textContent = '';

  // Validar
  const { ok, errors } = validateForm(form);
  if (!ok) {
    // foco al primer campo con error
    const firstInvalid = form.querySelector('.is-invalid');
    if (firstInvalid) firstInvalid.focus();
    msgBox.textContent = 'Revisá los campos marcados en rojo.';
    msgBox.className = 'ok-msg error-msg';
    return false;
  }

  // Deshabilitar botón y mostrar "Enviando…"
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.classList.add('is-loading');
  submitBtn.textContent = 'Enviando…';

  // Payload
  const data = Object.fromEntries(new FormData(form).entries());
  const payload = {
    nombre:        data.nombre?.trim() || '',
    email:         data.email?.trim() || '',
    asistencia:    data.asistencia || '',
    acompanantes:  data.acompanantes || '0',
    comentarios:   data.comentarios?.trim() || '',
    ua:            navigator.userAgent,
    ref:           document.referrer || ''
  };

  // 1) Enviar a Google Sheet (no bloquea el flujo)
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYPSbb93V0whqbtsgoYG1nAUzKgNZNgvz1eYLTBJbxhd3lBmPl7BCYaJDrR6wN36w7rQ/exec';
  const body = 'payload=' + encodeURIComponent(JSON.stringify(payload));

  fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  .then(() => {
    // opcional: podríamos marcar "guardado ok"
  })
  .catch(() => {
    // opcional: mostrar un aviso no bloqueante
    console.warn('No se pudo registrar en Sheets, se continúa con WhatsApp.');
  })
  .finally(() => {
    // 2) Armar mensaje y abrir WhatsApp
    const lines = [
      '✈️ *RSVP – Pame & Beto Airlines*',
      `👤 Nombre: ${payload.nombre || '-'}`,
      `📧 Email: ${payload.email || '-'}`,
      `✅ Asistencia: ${payload.asistencia === 'si' ? 'Sí, confirmo' : 'No podré'}`,
      `🗓️ Vuelo PB2026 – Corrientes 2026`
    ];
    if (payload.acompanantes && payload.acompanantes !== '0') {
      lines.splice(4, 0, `👥 Acompañantes: ${payload.acompanantes}`);
    }
    if (payload.comentarios)  lines.push(`💬 Comentarios: ${payload.comentarios}`);

    const numeroWhatsApp = '972508840083'; // 050-884-0083 en formato internacional
    openWhatsApp(numeroWhatsApp, lines.join('\n'));

    // Feedback visual y reset
    msgBox.textContent = `¡Gracias ${payload.nombre || ''}! Recibimos tu check-in.`;
    msgBox.className = 'ok-msg';
    form.reset();

    // Restaurar botón
    submitBtn.disabled = false;
    submitBtn.classList.remove('is-loading');
    submitBtn.textContent = originalBtnText;
  });

  return false;
}
