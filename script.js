// LINE 148: REPLACE THIS VALUE WITH YOUR DEPLOYED WEB APP URL
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyzusU7GIuTu_b50iOdOMoiBjzc79e1X5XFCEUr5A1KJlvsOXfk6sEUnIQNuwBs0rWLnw/exec";

let name = "";
let score = 0;
let streak = 0;
let roundTime = 5000; // 5 seconds per round
let timerInterval = null;
let startTime = null;
let correctCardIndex = -1;

const COLORS = [
  { name: "RED", hex: "#f85149", cssName: "red" },
  { name: "BLUE", hex: "#58a6ff", cssName: "blue" },
  { name: "GREEN", hex: "#3fb950", cssName: "green" },
  { name: "YELLOW", hex: "#d29922", cssName: "yellow" },
];

function startGame() {
  name = document.getElementById("username").value.trim();
  if (!name) return alert("Identify yourself, dev.");
  score = 0;
  streak = 0;
  switchScreen("screen-game");
  nextRound();
}

function nextRound() {
  document.getElementById("current-score").innerText = score;
  document.getElementById("current-streak").innerText = streak;

  // Pick a rule type: 0 = Background color, 1 = Text color, 2 = Text meaning word
  const ruleType = Math.floor(Math.random() * 3);

  // Pick target color object
  const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];

  if (ruleType === 0) {
    document.getElementById("instruction").innerText =
      `CLICK FRAME WITH BACKGROUND: ${targetColor.name}`;
  } else if (ruleType === 1) {
    document.getElementById("instruction").innerText =
      `CLICK FRAME WITH TEXT COLOR: ${targetColor.name}`;
  } else {
    document.getElementById("instruction").innerText =
      `CLICK FRAME WITH WORD: ${targetColor.name}`;
  }

  // Generate properties for 4 cards ensuring one is correct and others are distractors
  correctCardIndex = Math.floor(Math.random() * 4);
  let cardData = [];

  for (let i = 0; i < 4; i++) {
    if (i === correctCardIndex) {
      if (ruleType === 0) {
        cardData.push({
          bg: targetColor.hex,
          text: COLORS[Math.floor(Math.random() * COLORS.length)].name,
          textColor: COLORS[Math.floor(Math.random() * COLORS.length)].hex,
        });
      } else if (ruleType === 1) {
        cardData.push({
          bg: COLORS[Math.floor(Math.random() * COLORS.length)].hex,
          text: COLORS[Math.floor(Math.random() * COLORS.length)].name,
          textColor: targetColor.hex,
        });
      } else {
        cardData.push({
          bg: COLORS[Math.floor(Math.random() * COLORS.length)].hex,
          text: targetColor.name,
          textColor: COLORS[Math.floor(Math.random() * COLORS.length)].hex,
        });
      }
    } else {
      let dBg, dText, dTextCol;
      do {
        dBg = COLORS[Math.floor(Math.random() * COLORS.length)].hex;
        dText = COLORS[Math.floor(Math.random() * COLORS.length)].name;
        dTextCol = COLORS[Math.floor(Math.random() * COLORS.length)].hex;
      } while (
        (ruleType === 0 && dBg === targetColor.hex) ||
        (ruleType === 1 && dTextCol === targetColor.hex) ||
        (ruleType === 2 && dText === targetColor.name)
      );
      cardData.push({ bg: dBg, text: dText, textColor: dTextCol });
    }
  }

  // Render cards to UI
  for (let i = 0; i < 4; i++) {
    const cardEl = document.getElementById(`card-${i}`);
    cardEl.style.backgroundColor = cardData[i].bg;
    cardEl.style.color = cardData[i].textColor;
    cardEl.innerText = cardData[i].text;
  }

  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  startTime = Date.now();
  const bar = document.getElementById("timerBar");
  bar.style.width = "100%";

  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = roundTime - elapsed;
    const pct = Math.max(0, (remaining / roundTime) * 100);
    bar.style.width = pct + "%";

    if (remaining <= 0) {
      clearInterval(timerInterval);
      gameOver();
    }
  }, 50);
}

function handleCardClick(index) {
  clearInterval(timerInterval);
  if (index === correctCardIndex) {
    score += 100 + streak * 10;
    streak++;
    if (roundTime > 2500) roundTime -= 150;
    nextRound();
  } else {
    gameOver();
  }
}

function gameOver() {
  clearInterval(timerInterval);
  switchScreen("screen-result");
  document.getElementById("final-score").innerText = score;

  const title = document.getElementById("result-title");
  if (score > 1500) title.innerText = "AI OVERLORD";
  else if (score > 800) title.innerText = "STAFF ENGINEER";
  else if (score > 300) title.innerText = "JUNIOR DEV";
  else title.innerText = "INTERN BUG";

  saveScore(score);
}

function saveScore(finalScore) {
  fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({
      name: name,
      stoppedAt: finalScore,
      diff: "Score",
    }),
  })
    .then(() => fetchLeaderboard())
    .catch((err) => console.error(err));
}

function fetchLeaderboard() {
  fetch(SCRIPT_URL)
    .then((res) => res.json())
    .then((data) => {
      const list = document.getElementById("leaderboard-list");
      let html = "";
      data.sort((a, b) => b.stoppedAt - a.stoppedAt);
      data.slice(0, 5).forEach((p) => {
        html += `<li><span>${escapeHtml(p.name)}</span> <strong>${p.stoppedAt} pts</strong></li>`;
      });
      list.innerHTML = html;
    })
    .catch(() => {
      document.getElementById("leaderboard-list").innerHTML =
        `<li style="justify-content:center;">Score saved locally!</li>`;
    });
}

function resetGame() {
  roundTime = 5000;
  switchScreen("screen-login");
}

function switchScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[m];
  });
}
