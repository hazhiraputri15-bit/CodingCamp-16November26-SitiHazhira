/* ═══════════════════════════════════════════════
   ZhiraTab — app.js
   Features:
     • Clock & date-based greeting
     • Custom name (Challenge)
     • Light / Dark mode (Challenge)
     • Focus timer with custom duration (Challenge)
     • To-Do list — add, edit, done, delete
         + prevent duplicate tasks (Challenge)
         + sort tasks (Challenge)
     • Quick Links — add, open, delete
   All data persisted in localStorage.
   ═══════════════════════════════════════════════ */

'use strict';

/* ─── LocalStorage helpers ───────────────────── */
const store = {
  get: (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

/* ═══════════════════════════════════════════════
   1. CLOCK & DATE
   ═══════════════════════════════════════════════ */
const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');

function updateClock() {
  const now    = new Date();
  let   hours  = now.getHours();
  const ampm   = hours >= 12 ? 'PM' : 'AM';
  hours        = hours % 12 || 12;
  const mm     = String(now.getMinutes()).padStart(2, '0');
  timeEl.innerHTML = `${hours}<span class="time-colon">:</span>${mm} <span class="time-ampm">${ampm}</span>`;

  dateEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

updateClock();
setInterval(updateClock, 1000);

/* ═══════════════════════════════════════════════
   2. GREETING + CUSTOM NAME
   ═══════════════════════════════════════════════ */
const greetingText = document.getElementById('greeting-text');
const greetingSub  = document.getElementById('greeting-sub');
const nameInput    = document.getElementById('name-input');
const nameSaveBtn  = document.getElementById('name-save-btn');

let userName = store.get('userName', '');

function getGreetingPhrase() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function renderGreeting() {
  const phrase = getGreetingPhrase();
  greetingText.textContent = userName
    ? `${phrase}, ${userName}! 👋`
    : `${phrase}! 👋`;
}

function initGreeting() {
  nameInput.value = userName;
  renderGreeting();
  updateGreetingSub();
}

function updateGreetingSub() {
  const subs = [
    'What will you accomplish today?',
    'Stay focused. You\'ve got this.',
    'One task at a time.',
    'Make today count.',
    'Deep work starts now.'
  ];
  const idx = new Date().getDate() % subs.length;
  greetingSub.textContent = subs[idx];
}

nameSaveBtn.addEventListener('click', () => {
  userName = nameInput.value.trim();
  store.set('userName', userName);
  renderGreeting();
  nameInput.blur();
});

nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') nameSaveBtn.click();
});

initGreeting();
// Re-render greeting every minute in case time-of-day band changes
setInterval(renderGreeting, 60_000);

/* ═══════════════════════════════════════════════
   3. LIGHT / DARK MODE
   ═══════════════════════════════════════════════ */
const themeToggle = document.getElementById('theme-toggle');
let isDark = store.get('isDark', true);

function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeToggle.textContent = isDark ? '🌙' : '☀️';
  themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
}

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  store.set('isDark', isDark);
  applyTheme();
});

applyTheme();

/* ═══════════════════════════════════════════════
   4. FOCUS TIMER  (custom duration — Challenge)
   ═══════════════════════════════════════════════ */
const timerDisplay  = document.getElementById('timer-display');
const timerRingWrap = document.getElementById('timer-ring-wrap');
const timerRingProg = document.getElementById('timer-ring-progress');
const timerMinInput = document.getElementById('timer-minutes');
const startBtn      = document.getElementById('timer-start');
const stopBtn       = document.getElementById('timer-stop');
const resetBtn      = document.getElementById('timer-reset');

let timerInterval    = null;
let totalSeconds     = 25 * 60;
let remainingSeconds = totalSeconds;
let timerRunning     = false;

// SVG circumference: 2π × 70 ≈ 439.82
const CIRCUMFERENCE = 2 * Math.PI * 70;

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(remainingSeconds);
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  timerRingProg.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
}

function setTimerState(running) {
  timerRunning = running;
  startBtn.disabled = running;
  stopBtn.disabled  = !running;
  timerMinInput.disabled = running;
  timerDisplay.classList.toggle('running', running);
  timerRingWrap.classList.toggle('running', running);
}

startBtn.addEventListener('click', () => {
  if (timerRunning) return;

  // If fresh start, read the custom minutes field
  if (remainingSeconds === totalSeconds) {
    const mins = parseInt(timerMinInput.value, 10);
    if (!isNaN(mins) && mins >= 1 && mins <= 120) {
      totalSeconds    = mins * 60;
      remainingSeconds = totalSeconds;
    }
  }

  setTimerState(true);
  timerDisplay.classList.remove('finished');

  timerInterval = setInterval(() => {
    remainingSeconds--;
    renderTimer();

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      startBtn.disabled = false;
      stopBtn.disabled  = true;
      timerMinInput.disabled = false;
      timerDisplay.classList.remove('running');
      timerDisplay.classList.add('finished');
      timerRingWrap.classList.remove('running');
      timerRingWrap.classList.add('finished');
      timerDisplay.textContent = '00:00';
      timerRingProg.style.strokeDashoffset = CIRCUMFERENCE;
      showToast('⏰ Focus session complete!', 'success');
    }
  }, 1000);
});

stopBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  setTimerState(false);
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  const mins = parseInt(timerMinInput.value, 10);
  if (!isNaN(mins) && mins >= 1 && mins <= 120) {
    totalSeconds = mins * 60;
  }
  remainingSeconds = totalSeconds;
  setTimerState(false);
  timerDisplay.classList.remove('finished');
  timerRingWrap.classList.remove('finished');
  renderTimer();
});

timerMinInput.addEventListener('change', () => {
  if (!timerRunning) {
    const mins = parseInt(timerMinInput.value, 10);
    if (!isNaN(mins) && mins >= 1 && mins <= 120) {
      totalSeconds    = mins * 60;
      remainingSeconds = totalSeconds;
      renderTimer();
    }
  }
});

timerRingProg.style.strokeDasharray  = CIRCUMFERENCE;
timerRingProg.style.strokeDashoffset = 0;
renderTimer();

/* ═══════════════════════════════════════════════
   5. TO-DO LIST
   Challenges implemented:
     • Prevent duplicate tasks (case-insensitive)
     • Sort tasks (A-Z, Z-A, done-last)
   ═══════════════════════════════════════════════ */
const todoInput  = document.getElementById('todo-input');
const todoAddBtn = document.getElementById('todo-add-btn');
const todoList   = document.getElementById('todo-list');
const sortSelect = document.getElementById('sort-select');

let tasks = store.get('tasks', []); // [{id, text, done}]

function saveTasks() { store.set('tasks', tasks); }

function getSortedTasks() {
  const copy = [...tasks];
  const mode = sortSelect.value;
  if (mode === 'az')   copy.sort((a, b) => a.text.localeCompare(b.text));
  if (mode === 'za')   copy.sort((a, b) => b.text.localeCompare(a.text));
  if (mode === 'done') copy.sort((a, b) => Number(a.done) - Number(b.done));
  return copy;
}

function renderTasks() {
  todoList.innerHTML = '';
  const sorted = getSortedTasks();

  if (sorted.length === 0) {
    todoList.innerHTML = '<li class="empty-hint">No tasks yet. Add one above!</li>';
    return;
  }

  sorted.forEach(task => {
    const li = document.createElement('li');
    li.className = `todo-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <input type="checkbox" class="todo-check" ${task.done ? 'checked' : ''} title="Mark done" />
      <span class="todo-text">${escapeHTML(task.text)}</span>
      <div class="todo-actions">
        <button class="btn-icon edit-btn" title="Edit">✏️</button>
        <button class="btn-icon delete btn-delete" title="Delete">🗑️</button>
      </div>
    `;

    // Toggle done
    li.querySelector('.todo-check').addEventListener('change', e => {
      const t = tasks.find(t => t.id === task.id);
      if (t) { t.done = e.target.checked; saveTasks(); renderTasks(); }
    });

    // Delete
    li.querySelector('.btn-delete').addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    // Edit
    li.querySelector('.edit-btn').addEventListener('click', () => {
      const span = li.querySelector('.todo-text');
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'todo-text-edit';
      editInput.value = task.text;
      editInput.maxLength = 100;
      span.replaceWith(editInput);
      editInput.focus();

      const commitEdit = () => {
        const newText = editInput.value.trim();
        if (!newText) { renderTasks(); return; }

        // Duplicate check (excluding the current task)
        const isDuplicate = tasks.some(
          t => t.id !== task.id && t.text.toLowerCase() === newText.toLowerCase()
        );
        if (isDuplicate) {
          showToast('⚠️ A task with that name already exists.', 'warn');
          renderTasks();
          return;
        }

        const t = tasks.find(t => t.id === task.id);
        if (t) { t.text = newText; saveTasks(); }
        renderTasks();
      };

      editInput.addEventListener('blur',  commitEdit);
      editInput.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { editInput.blur(); }
        if (e.key === 'Escape') { renderTasks(); }
      });
    });

    todoList.appendChild(li);
  });
}

function addTask() {
  const text = todoInput.value.trim();
  if (!text) return;

  // Prevent duplicate (Challenge)
  const isDuplicate = tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
  if (isDuplicate) {
    showToast('⚠️ That task already exists!', 'warn');
    return;
  }

  tasks.push({ id: Date.now(), text, done: false });
  saveTasks();
  todoInput.value = '';
  renderTasks();
}

todoAddBtn.addEventListener('click', addTask);
todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
sortSelect.addEventListener('change', renderTasks);

renderTasks();

/* ═══════════════════════════════════════════════
   6. QUICK LINKS
   ═══════════════════════════════════════════════ */
const linkNameInput = document.getElementById('link-name');
const linkUrlInput  = document.getElementById('link-url');
const linkAddBtn    = document.getElementById('link-add-btn');
const linksGrid     = document.getElementById('links-grid');

let links = store.get('links', []); // [{id, name, url}]

function saveLinks() { store.set('links', links); }

function getFavicon(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=16`;
  } catch { return ''; }
}

function renderLinks() {
  linksGrid.innerHTML = '';

  if (links.length === 0) {
    linksGrid.innerHTML = '<p class="empty-hint">No links yet. Add one above!</p>';
    return;
  }

  links.forEach(link => {
    const chip = document.createElement('div');
    chip.className = 'link-chip';

    const favicon = getFavicon(link.url);
    chip.innerHTML = `
      ${favicon ? `<img src="${favicon}" width="16" height="16" alt="" style="border-radius:3px;" onerror="this.style.display='none'" />` : ''}
      <a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(link.name)}</a>
      <button class="btn-icon delete btn-remove-link" title="Remove">✕</button>
    `;

    chip.querySelector('.btn-remove-link').addEventListener('click', () => {
      links = links.filter(l => l.id !== link.id);
      saveLinks();
      renderLinks();
    });

    linksGrid.appendChild(chip);
  });
}

function addLink() {
  const name = linkNameInput.value.trim();
  const rawUrl = linkUrlInput.value.trim();
  if (!name || !rawUrl) { showToast('⚠️ Please fill in both label and URL.', 'warn'); return; }

  let url = rawUrl;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  try { new URL(url); } catch {
    showToast('⚠️ Please enter a valid URL.', 'warn');
    return;
  }

  links.push({ id: Date.now(), name, url });
  saveLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  renderLinks();
}

linkAddBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });

renderLinks();

/* ═══════════════════════════════════════════════
   7. ALARMS
   ═══════════════════════════════════════════════ */
const alarmTimeInput  = document.getElementById('alarm-time');
const alarmLabelInput = document.getElementById('alarm-label');
const alarmAddBtn     = document.getElementById('alarm-add-btn');
const alarmList       = document.getElementById('alarm-list');
const alarmModal      = document.getElementById('alarm-modal');
const alarmModalLabel = document.getElementById('alarm-modal-label');
const alarmModalTime  = document.getElementById('alarm-modal-time');
const alarmDismissBtn = document.getElementById('alarm-dismiss-btn');

// alarms: [{id, time:"HH:MM", label, on:true}]
let alarms = store.get('alarms', []);
let ringingAlarmId = null;
let alarmBeep = null;

function saveAlarms() { store.set('alarms', alarms); }

/* ── Format "HH:MM" (24h) → "H:MM AM/PM" ──── */
function fmt12(time24) {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
}

/* ── Render list ─────────────────────────────── */
function renderAlarms() {
  alarmList.innerHTML = '';

  if (alarms.length === 0) {
    alarmList.innerHTML = '<li class="empty-hint">No alarms yet. Add one above!</li>';
    return;
  }

  // Sort by time
  const sorted = [...alarms].sort((a, b) => a.time.localeCompare(b.time));

  sorted.forEach(alarm => {
    const li = document.createElement('li');
    li.className = `alarm-item${alarm.on ? '' : ' off'}`;

    li.innerHTML = `
      <span class="alarm-time-display">${fmt12(alarm.time)}</span>
      <span class="alarm-label-text">${escapeHTML(alarm.label || '')}</span>
      <div class="alarm-actions">
        <label class="alarm-toggle" title="${alarm.on ? 'Turn off' : 'Turn on'}">
          <input type="checkbox" class="alarm-on-toggle" ${alarm.on ? 'checked' : ''} />
          <span class="alarm-slider"></span>
        </label>
        <button class="btn-icon delete alarm-delete-btn" title="Delete">🗑️</button>
      </div>
    `;

    li.querySelector('.alarm-on-toggle').addEventListener('change', e => {
      const a = alarms.find(a => a.id === alarm.id);
      if (a) { a.on = e.target.checked; saveAlarms(); renderAlarms(); }
    });

    li.querySelector('.alarm-delete-btn').addEventListener('click', () => {
      alarms = alarms.filter(a => a.id !== alarm.id);
      saveAlarms();
      renderAlarms();
    });

    alarmList.appendChild(li);
  });
}

/* ── Add alarm ───────────────────────────────── */
function addAlarm() {
  const time  = alarmTimeInput.value;
  const label = alarmLabelInput.value.trim();

  if (!time) { showToast('⚠️ Please pick a time for the alarm.', 'warn'); return; }

  // Prevent duplicate time+label combo
  const dup = alarms.some(a => a.time === time && (a.label || '') === label);
  if (dup) { showToast('⚠️ That alarm already exists.', 'warn'); return; }

  alarms.push({ id: Date.now(), time, label, on: true });
  saveAlarms();
  alarmLabelInput.value = '';
  renderAlarms();
  showToast(`✅ Alarm set for ${fmt12(time)}`, 'success');
}

alarmAddBtn.addEventListener('click', addAlarm);
alarmLabelInput.addEventListener('keydown', e => { if (e.key === 'Enter') addAlarm(); });

/* ── Web Audio beep ──────────────────────────── */
function startBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let playing = true;

    function beepOnce() {
      if (!playing) return;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
      setTimeout(() => { if (playing) beepOnce(); }, 900);
    }

    beepOnce();
    // return a stop function
    alarmBeep = () => { playing = false; ctx.close(); };
  } catch {
    alarmBeep = () => {};
  }
}

/* ── Ring modal ──────────────────────────────── */
function ringAlarm(alarm) {
  ringingAlarmId = alarm.id;
  alarmModalLabel.textContent = alarm.label || 'Alarm!';
  alarmModalTime.textContent  = fmt12(alarm.time);
  alarmModal.classList.remove('hidden');
  startBeep();
}

alarmDismissBtn.addEventListener('click', () => {
  alarmModal.classList.add('hidden');
  if (alarmBeep) { alarmBeep(); alarmBeep = null; }

  // Turn off the alarm after it rings so it doesn't re-fire same minute
  if (ringingAlarmId !== null) {
    const a = alarms.find(a => a.id === ringingAlarmId);
    if (a) { a.on = false; saveAlarms(); renderAlarms(); }
    ringingAlarmId = null;
  }
});

/* ── Check alarms every second ──────────────── */
let lastAlarmMinute = null;

function checkAlarms() {
  const now  = new Date();
  const hh   = String(now.getHours())  .padStart(2, '0');
  const mm   = String(now.getMinutes()).padStart(2, '0');
  const hhmm = `${hh}:${mm}`;

  // Only fire once per minute
  if (hhmm === lastAlarmMinute) return;

  const hit = alarms.find(a => a.on && a.time === hhmm);
  if (hit) {
    lastAlarmMinute = hhmm;
    ringAlarm(hit);
  }
}

setInterval(checkAlarms, 1000);

renderAlarms();

/* ═══════════════════════════════════════════════
   8. TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════ */
function showToast(message, type = 'info') {
  // Remove any existing toast first
  const existing = document.getElementById('kiro-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'kiro-toast';
  toast.textContent = message;

  const colors = { info: '#f5d84a', warn: '#fb923c', success: '#34d399' };
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%) translateY(0)',
    background: colors[type] || colors.info,
    color: type === 'info' ? '#1a1800' : '#fff',
    padding: '10px 22px',
    borderRadius: '20px',
    fontWeight: '600',
    fontSize: '.9rem',
    boxShadow: '0 4px 20px rgba(0,0,0,.35)',
    zIndex: '9999',
    opacity: '1',
    transition: 'opacity .4s ease',
    whiteSpace: 'nowrap'
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 450);
  }, 2800);
}

/* ═══════════════════════════════════════════════
   9. UTILITY
   ═══════════════════════════════════════════════ */
function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function escapeAttr(str) {
  return str.replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ═══════════════════════════════════════════════
   10. INTERACTIVE BACKGROUND
   — floating particles that drift and react to
     the mouse cursor with a repulsion force
   ═══════════════════════════════════════════════ */
(function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');

  /* ── config ──────────────────────────────── */
  const CFG = {
    COUNT:        72,    // particle count
    RADIUS_MIN:   1.2,
    RADIUS_MAX:   3.0,
    SPEED_MAX:    0.45,
    REPEL_DIST:   120,   // px — cursor influence radius
    REPEL_FORCE:  5.5,
    CONNECT_DIST: 130,   // px — draw connecting lines
    BURST_COUNT:  12,    // extra particles on click
  };

  /* ── state ───────────────────────────────── */
  let W, H;
  let mouse   = { x: -9999, y: -9999 };
  let isDarkMode = document.documentElement.getAttribute('data-theme') !== 'light';

  /* ── colour helpers ──────────────────────── */
  function accentColor(alpha) {
    return isDarkMode
      ? `rgba(240,212,74,${alpha})`
      : `rgba(192,138,0,${alpha})`;
  }

  /* ── Particle class ──────────────────────── */
  class Particle {
    constructor(burst = false) {
      this.reset(burst);
    }

    reset(burst = false) {
      this.x  = burst ? mouse.x + (Math.random() - .5) * 40
                      : Math.random() * W;
      this.y  = burst ? mouse.y + (Math.random() - .5) * 40
                      : Math.random() * H;
      const angle = Math.random() * Math.PI * 2;
      const speed = (.1 + Math.random() * CFG.SPEED_MAX) * (burst ? 2 : 1);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.r  = CFG.RADIUS_MIN + Math.random() * (CFG.RADIUS_MAX - CFG.RADIUS_MIN);
      this.baseAlpha = .18 + Math.random() * .32;
      this.alpha     = this.baseAlpha;
      // gentle pulse
      this.pulseSpeed = .004 + Math.random() * .008;
      this.pulseT     = Math.random() * Math.PI * 2;
      // burst particles fade out
      this.burst = burst;
      this.life  = burst ? 1 : -1;
    }

    update() {
      this.pulseT += this.pulseSpeed;
      this.alpha   = this.baseAlpha + Math.sin(this.pulseT) * .08;

      /* repulsion from cursor */
      const dx   = this.x - mouse.x;
      const dy   = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CFG.REPEL_DIST && dist > 0) {
        const force = (CFG.REPEL_DIST - dist) / CFG.REPEL_DIST;
        this.vx += (dx / dist) * force * CFG.REPEL_FORCE * .015;
        this.vy += (dy / dist) * force * CFG.REPEL_FORCE * .015;
      }

      /* speed cap */
      const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const max = CFG.SPEED_MAX * (this.burst ? 3 : 1);
      if (spd > max) { this.vx = this.vx / spd * max; this.vy = this.vy / spd * max; }

      /* drift friction */
      this.vx *= .992;
      this.vy *= .992;

      this.x += this.vx;
      this.y += this.vy;

      /* burst fade */
      if (this.burst) {
        this.life -= .012;
        this.alpha  = this.baseAlpha * this.life;
      }

      /* wrap edges */
      if (!this.burst) {
        const pad = this.r + 2;
        if (this.x < -pad)  this.x = W + pad;
        if (this.x > W + pad) this.x = -pad;
        if (this.y < -pad)  this.y = H + pad;
        if (this.y > H + pad) this.y = -pad;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = accentColor(Math.max(0, this.alpha));
      ctx.fill();
    }
  }

  /* ── pool ────────────────────────────────── */
  let particles = [];

  function spawn(count, burst = false) {
    for (let i = 0; i < count; i++) particles.push(new Particle(burst));
  }

  /* ── resize ──────────────────────────────── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* ── draw connections ────────────────────── */
  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      if (a.life !== -1 && a.life <= 0) continue;
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        if (b.life !== -1 && b.life <= 0) continue;
        const dx   = a.x - b.x;
        const dy   = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CFG.CONNECT_DIST) {
          const lineAlpha = (1 - dist / CFG.CONNECT_DIST) * .12;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = accentColor(lineAlpha);
          ctx.lineWidth   = .8;
          ctx.stroke();
        }
      }
    }
  }

  /* ── cursor glow ─────────────────────────── */
  function drawCursorGlow() {
    if (mouse.x < 0) return;
    const grad = ctx.createRadialGradient(
      mouse.x, mouse.y, 0,
      mouse.x, mouse.y, CFG.REPEL_DIST
    );
    grad.addColorStop(0,   accentColor(.07));
    grad.addColorStop(0.5, accentColor(.025));
    grad.addColorStop(1,   accentColor(0));
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, CFG.REPEL_DIST, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  /* ── main loop ───────────────────────────── */
  function loop() {
    ctx.clearRect(0, 0, W, H);

    /* background gradient */
    const bgGrad = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * .9);
    if (isDarkMode) {
      bgGrad.addColorStop(0,   'rgba(240,212,74,.045)');
      bgGrad.addColorStop(.5,  'rgba(240,212,74,.012)');
      bgGrad.addColorStop(1,   'rgba(0,0,0,0)');
    } else {
      bgGrad.addColorStop(0,   'rgba(240,212,74,.14)');
      bgGrad.addColorStop(.5,  'rgba(240,212,74,.04)');
      bgGrad.addColorStop(1,   'rgba(0,0,0,0)');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    drawCursorGlow();
    drawLines();

    // cull dead burst particles
    particles = particles.filter(p => p.life === -1 || p.life > 0);
    particles.forEach(p => { p.update(); p.draw(); });

    requestAnimationFrame(loop);
  }

  /* ── events ──────────────────────────────── */
  window.addEventListener('resize', resize);

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  /* click burst */
  window.addEventListener('click', e => {
    // only burst on background clicks, not card clicks
    if (!e.target.closest('.card') && !e.target.closest('.top-bar')) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      spawn(CFG.BURST_COUNT, true);
    }
  });

  /* sync theme changes */
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      setTimeout(() => {
        isDarkMode = document.documentElement.getAttribute('data-theme') !== 'light';
      }, 50);
    });
  }

  /* ── init ────────────────────────────────── */
  resize();
  spawn(CFG.COUNT);
  loop();
})();
