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

// ===== Estados del FIDS - todos ON TIME parpadeando =====
function updateFIDS(){
  const cells = document.querySelectorAll("#fids-body td.status");
  cells.forEach((cell)=>{
    const span = document.createElement('span');
    span.className = 'flip';
    span.textContent = 'ON TIME';
    cell.innerHTML = "";
    cell.appendChild(span);
    cell.setAttribute('data-status', 'ON TIME');
  });
}
document.addEventListener('DOMContentLoaded', updateFIDS);
setInterval(updateFIDS, 4000);

// ===== Helper: abrir WhatsApp =====
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
  const nombre = form.nombre;
  clearFieldError(nombre);
  if (!nombre.value.trim() || nombre.value.trim().length < 2) {
    setFieldError(nombre, 'Ingresá tu nombre (mínimo 2 caracteres).');
    ok = false;
  }
  const email = form.email;
  clearFieldError(email);
  if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
    setFieldError(email, 'Ingresá un email válido.');
    ok = false;
  }
  const acomp = form.acompanantes;
  clearFieldError(acomp);
  const n = Number(acomp.value);
  if (Number.isNaN(n) || n < 0 || n > 10) {
    setFieldError(acomp, 'Cantidad de pasajeros entre 0 y 10.');
    ok = false;
  }
  const asis = form.asistencia;
  clearFieldError(asis);
  if (!asis.value) {
    setFieldError(asis, 'Seleccioná una opción.');
    ok = false;
  }
  return ok;
}

// ===== Formulario RSVP → WhatsApp =====
// Mostrar/ocultar el campo "Otra…" según la selección del menú
function toggleOtraComida(selectEl){
  const wrap = document.getElementById('restricciones-otra-wrap');
  if(selectEl.value === 'Otra'){
    wrap.style.display = 'block';
  } else {
    wrap.style.display = 'none';
    const otro = document.getElementById('restricciones-otra');
    if (otro) otro.value = '';
  }
}

// Helper: abrir WhatsApp (ya lo tienes; inclúyelo si no está)
function openWhatsApp(rawNumber, text) {
  let n = String(rawNumber).replace(/[^\d]/g, '');
  if (n.startsWith('00')) n = n.slice(2);
  const msg = encodeURIComponent(text || '');
  const url = `https://wa.me/${n}?text=${msg}`;
  const fb  = `https://api.whatsapp.com/send?phone=${n}&text=${msg}`;
  const w = window.open(url, '_blank');
  setTimeout(() => { if (!w || w.closed) window.open(fb, '_blank'); }, 800);
}

// Validación mínima (sin email)
function validateForm(form) {
  let ok = true;

  const nombre = form.nombre;
  nombre.classList.remove('is-invalid');
  if (!nombre.value.trim() || nombre.value.trim().length < 2) {
    nombre.classList.add('is-invalid');
    ok = false;
  }

  const acomp = form.acompanantes;
  acomp.classList.remove('is-invalid');
  const n = Number(acomp.value);
  if (Number.isNaN(n) || n < 0 || n > 10) {
    acomp.classList.add('is-invalid');
    ok = false;
  }

  const asis = form.asistencia;
  asis.classList.remove('is-invalid');
  if (!asis.value) {
    asis.classList.add('is-invalid');
    ok = false;
  }

  return ok;
}

// ===== Envío RSVP → WhatsApp (sin Sheets, sin email)
function rsvpSubmit(e){
  e.preventDefault();
  const form = e.target;
  const msgBox = document.getElementById('rsvp-msg');
  msgBox.textContent = '';

  if (!validateForm(form)) {
    msgBox.textContent = 'Revisá los campos marcados en rojo.';
    msgBox.className = 'ok-msg error-msg';
    return false;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.classList.add('is-loading');
  submitBtn.textContent = 'Enviando…';

  // Tomar datos del form
  const data = Object.fromEntries(new FormData(form).entries());
  const seleccion = data.restricciones || '';
  const otra      = (data.restricciones_otra || '').trim();
  const preferencia = (seleccion === 'Otra') ? (otra || 'Sin especificar') : (seleccion || 'Sin preferencia');

  const payload = {
    nombre:        (data.nombre || '').trim(),
    asistencia:    data.asistencia || '',
    acompanantes:  data.acompanantes || '0',
    restricciones: preferencia
  };

  // Mensaje de WhatsApp (integrado con tus líneas originales)
  const lines = [
    '✈️ *RSVP – Pame & Beto Airlines*',
    `👤 Nombre: ${payload.nombre || '-'}`,
    `🧳 Cantidad de pasajeros: ${payload.acompanantes || '0'}`,
    `🍽️ Preferencias de comida a bordo: ${payload.restricciones}`,
    `✅ Asistencia: ${payload.asistencia === 'si' ? 'Sí, confirmo' : 'No podré'}`,
    `🗓️ Vuelo PB1502 – Corrientes 2026`
  ];

  const numeroWhatsApp = '972508840083';
  openWhatsApp(numeroWhatsApp, lines.join('\n'));

  msgBox.textContent = `¡Gracias ${payload.nombre || ''}! Recibimos tu check-in.`;
  msgBox.className = 'ok-msg';
  form.reset();

  submitBtn.disabled = false;
  submitBtn.classList.remove('is-loading');
  submitBtn.textContent = originalBtnText;

  // Ocultar el campo "Otra…" si quedó abierto
  toggleOtraComida(document.getElementById('restricciones'));

  return false;
}

// ===== Toggle de Turismo =====
function toggleTurismo() {
  const cont = document.getElementById("turismo-content");
  cont.classList.toggle("open");
}

// ===== Toggle de otra comida =====
function toggleOtraComida(selectEl){
  const wrap = document.getElementById('restricciones-otra-wrap');
  if(selectEl.value === 'Otra'){
    wrap.style.display = 'block';
  } else {
    wrap.style.display = 'none';
    const otro = document.getElementById('restricciones-otra');
    if (otro) otro.value = '';
  }
}