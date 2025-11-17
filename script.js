const salaryInput = document.getElementById('salary');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const displayValue = document.getElementById('displayValue');
const ppsInfo = document.getElementById('ppsInfo');

let running = false;
let lastTick = 0;
let accumulated = 0;
let raf = null;

// --- Arbetstid: må–fre 08–16 ---
function isWorkingTime() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  return day >= 1 && day <= 5 && hour >= 8 && hour < 16;
}

// --- Beräkna kronor per sekund ---
function monthlyPPS() {
  const salary = parseFloat(salaryInput.value) || 0;
  // Beräkna antal arbetsdagar i aktuell månad
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  let workDays = 0;
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const day = new Date(year, month, d).getDay();
    if (day >= 1 && day <= 5) workDays++;
  }

  const secondsPerWorkday = 8 * 3600; // 8h/dag
  const totalWorkSeconds = workDays * secondsPerWorkday;

  return salary / totalWorkSeconds;
}

// --- Räkna startbelopp sedan senaste löning ---
function calculateStartAmount() {
  const salary = parseFloat(salaryInput.value) || 0;
  const today = new Date();
  const lonnDag = 25;

  // Bestäm senaste löning
  let startMonth = today.getMonth();
  let startYear = today.getFullYear();
  if (today.getDate() < lonnDag) {
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }
  const lastPayday = new Date(startYear, startMonth, lonnDag);

  // Räkna arbetsdagar mellan löning och idag
  let workDaysSince = 0;
  let date = new Date(lastPayday);
  date.setDate(date.getDate() + 1); // Börja dagen efter löning
  while (date <= today) {
    const day = date.getDay();
    if (day >= 1 && day <= 5) workDaysSince++;
    date.setDate(date.getDate() + 1);
  }

  // Beräkna kr per arbetsdag i månadslönen
  const workDaysInMonth = (() => {
    const y = lastPayday.getFullYear();
    const m = lastPayday.getMonth();
    const total = new Date(y, m + 1, 0).getDate();
    let wd = 0;
    for (let d = 1; d <= total; d++) {
      const day = new Date(y, m, d).getDay();
      if (day >= 1 && day <= 5) wd++;
    }
    return wd;
  })();

  const krPerWorkDay = salary / workDaysInMonth;
  return krPerWorkDay * workDaysSince;
}

// --- Spara/Återställ ---
function saveState() {
  localStorage.setItem('pps_correct_state', JSON.stringify({ salary: salaryInput.value, accumulated }));
}
function loadState() {
  const raw = localStorage.getItem('pps_correct_state');
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    if (s.salary) salaryInput.value = s.salary;
    if (typeof s.accumulated === 'number') accumulated = s.accumulated;
  } catch {}
}

// --- Uppdatera display ---
function updateDisplay() {
  displayValue.textContent = accumulated.toFixed(2) + ' kr';
  ppsInfo.textContent = '';
}

// --- Loop ---
function loop(now) {
  if (!running) return;
  if (!lastTick) lastTick = now;
  const delta = (now - lastTick) / 1000;
  lastTick = now;

  if (isWorkingTime()) {
    accumulated += monthlyPPS() * delta;
  }
  updateDisplay();

  if (Math.floor(now / 2000) !== Math.floor((now - delta * 1000) / 2000)) saveState();

  raf = requestAnimationFrame(loop);
}

// --- Eventer ---
startBtn.onclick = () => { if (!running) { running = true; lastTick = 0; raf = requestAnimationFrame(loop); } };
stopBtn.onclick = () => { running = false; cancelAnimationFrame(raf); };
resetBtn.onclick = () => { accumulated = calculateStartAmount(); updateDisplay(); saveState(); };
salaryInput.oninput = () => { accumulated = calculateStartAmount(); updateDisplay(); saveState(); };

window.onbeforeunload = saveState;

// --- Initiering ---
loadState();
accumulated = calculateStartAmount();
updateDisplay();
