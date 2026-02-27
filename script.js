const salaryInput = document.getElementById("salary");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const displayValue = document.getElementById("displayValue");
const ppsInfo = document.getElementById("ppsInfo");

let running = false;
let lastTick = 0;
let accumulated = 0;
let raf = null;
let lastSave = 0;

/* ------------------ Konfetti ------------------ */
function launchConfetti() {
  // Skapa ett container-element om det inte finns
  let confettiContainer = document.getElementById("confettiContainer");
  if (!confettiContainer) {
    confettiContainer = document.createElement("div");
    confettiContainer.id = "confettiContainer";
    confettiContainer.style.position = "fixed";
    confettiContainer.style.top = 0;
    confettiContainer.style.left = 0;
    confettiContainer.style.width = "100%";
    confettiContainer.style.height = "100%";
    confettiContainer.style.pointerEvents = "none";
    confettiContainer.style.overflow = "hidden";
    document.body.appendChild(confettiContainer);
  }

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement("div");
    confetti.style.position = "absolute";
    confetti.style.width = "8px";
    confetti.style.height = "8px";
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    confetti.style.top = "-10px";
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.opacity = Math.random();
    confetti.style.borderRadius = "50%";
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    confettiContainer.appendChild(confetti);

    // Animering
    const duration = 3000 + Math.random() * 2000;
    confetti.animate(
      [
        { transform: `translateY(0) rotate(0deg)`, opacity: confetti.style.opacity },
        { transform: `translateY(100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
      ],
      { duration: duration, easing: "linear", iterations: 1 }
    );

    // Ta bort efter animation
    setTimeout(() => confetti.remove(), duration);
  }
}
/* ------------------ Arbetstid: må–fre 08–17 med 12–13 lunch ------------------ */
function isWorkingTime() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  const isWeekday = day >= 1 && day <= 5;
  const isWorkingHours = (hour >= 8 && hour < 12) || (hour >= 13 && hour < 17);

  return isWeekday && isWorkingHours;
}

/* ------------------ Räkna arbetsdagar i månad ------------------ */
function getWorkDays(year, month) {
  const totalDays = new Date(year, month + 1, 0).getDate();
  let workDays = 0;

  for (let d = 1; d <= totalDays; d++) {
    const day = new Date(year, month, d).getDay();
    if (day >= 1 && day <= 5) workDays++;
  }

  return workDays;
}

/* ------------------ Kronor per sekund ------------------ */
function monthlyPPS() {
  const salary = parseFloat(salaryInput.value) || 0;
  const today = new Date();
  const workDays = getWorkDays(today.getFullYear(), today.getMonth());

  const secondsPerWorkday = 8 * 3600;
  const totalWorkSeconds = workDays * secondsPerWorkday;

  return totalWorkSeconds > 0 ? salary / totalWorkSeconds : 0;
}

/* ------------------ Startbelopp sedan senaste löning (25:e) ------------------ */
function calculateStartAmount() {
  const salary = parseFloat(salaryInput.value) || 0;
  const today = new Date();
  const payDay = 25;

  let startMonth = today.getMonth();
  let startYear = today.getFullYear();

  if (today.getDate() < payDay) {
    startMonth--;
    if (startMonth < 0) {
      startMonth = 11;
      startYear--;
    }
  }

  const lastPayday = new Date(startYear, startMonth, payDay);

  let workDaysSince = 0;
  let date = new Date(lastPayday);
  date.setDate(date.getDate() + 1);

  while (date <= today) {
    const day = date.getDay();
    if (day >= 1 && day <= 5) workDaysSince++;
    date.setDate(date.getDate() + 1);
  }

  const workDaysInMonth = getWorkDays(lastPayday.getFullYear(), lastPayday.getMonth());
  const krPerWorkDay = workDaysInMonth > 0 ? salary / workDaysInMonth : 0;

  return krPerWorkDay * workDaysSince;
}

/* ------------------ Spara / Ladda ------------------ */
function saveState() {
  localStorage.setItem(
    "pps_correct_state",
    JSON.stringify({ salary: salaryInput.value, accumulated })
  );
}

function loadState() {
  const raw = localStorage.getItem("pps_correct_state");
  if (!raw) return false;

  try {
    const state = JSON.parse(raw);
    if (state.salary) salaryInput.value = state.salary;
    if (typeof state.accumulated === "number") accumulated = state.accumulated;
    return true;
  } catch {
    console.error("Fel vid laddning av sparad data.");
    return false;
  }
}

/* ------------------ Uppdatera display ------------------ */
function updateDisplay() {
  displayValue.textContent = accumulated.toFixed(2) + " kr";

  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  if (!(day >= 1 && day <= 5 && hour >= 8 && hour < 17)) {
    ppsInfo.textContent = "...";
  } else if (hour >= 12 && hour < 13) {
    ppsInfo.textContent = "Lunchpaus 12:00–13:00";
  } else {
    ppsInfo.textContent = "";
  }
}

/* ------------------ Animation loop ------------------ */
function loop(timestamp) {
  if (!running) return;

  if (!lastTick) lastTick = timestamp;
  const delta = (timestamp - lastTick) / 1000;
  lastTick = timestamp;

  if (isWorkingTime()) {
    accumulated += monthlyPPS() * delta;
  }

  if (timestamp - lastSave > 2000) {
    saveState();
    lastSave = timestamp;
  }

  updateDisplay();
  raf = requestAnimationFrame(loop);
}

/* ------------------ Event listeners ------------------ */
startBtn.addEventListener("click", () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  if (!(day >= 1 && day <= 5 && hour >= 8 && hour < 17)) {
    alert("Räknaren kan bara startas må–fre mellan 08:00–17:00.");
    return;
  }

  if (!running) {
    running = true;
    lastTick = 0;
    raf = requestAnimationFrame(loop);
  }
  // Konfetti om det är den 25:e
  if (now.getDate() === 27) {
    launchConfetti();
  }

  if (!running) {
    running = true;
    lastTick = 0;
    raf = requestAnimationFrame(loop);
  }
});

stopBtn.addEventListener("click", () => {
  running = false;
  if (raf) cancelAnimationFrame(raf);
});

resetBtn.addEventListener("click", () => {
  salaryInput.value = "";
  accumulated = 0;
  updateDisplay();
  saveState();
  lastTick = 0;
});

salaryInput.addEventListener("input", () => {
  accumulated = calculateStartAmount();
  updateDisplay();
  saveState();
});

window.addEventListener("beforeunload", saveState);

/* ------------------ Init ------------------ */
const hadSavedState = loadState();
if (!hadSavedState) {
  accumulated = calculateStartAmount();
}
updateDisplay();