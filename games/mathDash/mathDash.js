import { ScoreService } from "../../scripts/scoreService.js";

// ===============================
// SONS ET MUSIQUE
// ===============================
let sfxClic, sfxSuccess, sfxError;
try {
  sfxClic = new Audio("sfx/clic.mp3");
  sfxSuccess = new Audio("sfx/success.mp3");
  sfxError = new Audio("sfx/error.mp3");
} catch (e) {
  console.warn("Audio non disponible:", e);
}

function playSfx(audio) {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}

function withClickSfx(handler) {
  return function (event) {
    playSfx(sfxClic);
    return handler(event);
  };
}

// Musique du jeu
const audio = new Audio("music/mathDashMusic.mp3");
audio.loop = true;
audio.volume = 0.25;
audio.play().catch(() => {});

// ===============================
// CONSTANTES ET ÉTAT DU JEU
// ===============================

const TOTAL_QUESTIONS = 10;

let level = 1;
let localScore = 0;
let questionIndex = 0;
let correctStreak = 0;

let currentAnswer = null;
let timerId = null;
let timeLeftMs = 0;
let maxTimeMs = 7000;

// ===============================
// ÉLÉMENTS DOM
// ===============================

const questionIndexSpan = document.getElementById("md-question-index");
const scoreSpan = document.getElementById("md-score");
const levelSpan = document.getElementById("md-level");
const questionTextSpan = document.getElementById("md-question-text");

const choiceButtons = Array.from(document.querySelectorAll(".choice-btn"));

const feedbackDiv = document.getElementById("md-feedback");
const timerBar = document.getElementById("md-timer-bar");

const summarySection = document.getElementById("md-summary");
const finalScoreSpan = document.getElementById("md-final-score");
const bestScoreRow = document.getElementById("md-best-score-row");
const bestScoreSpan = document.getElementById("md-best-score");

const startBtn = document.getElementById("md-start");
const replayBtn = document.getElementById("md-replay");
const backArcadeBtn = document.getElementById("btn-back");

// ===============================
// BOUTON RETOUR À L’ARCADE
// ===============================

if (backArcadeBtn) {
  backArcadeBtn.addEventListener(
    "click",
    withClickSfx(() => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}

      // Retour vers la sélection des jeux
      window.location.href = "/public/index.html#games";
    })
  );
}

// ===============================
// OUTILS / GÉNÉRATION DES QUESTIONS
// ===============================

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestionForLevel(level) {
  let opType;

  if (level === 1) {
    opType = Math.random() < 0.5 ? "add" : "sub";
  } else if (level === 2) {
    const r = Math.random();
    if (r < 0.4) opType = "add";
    else if (r < 0.8) opType = "sub";
    else opType = "mul";
  } else {
    const r = Math.random();
    if (r < 0.35) opType = "add";
    else if (r < 0.7) opType = "sub";
    else if (r < 0.9) opType = "mul";
    else opType = "div";
  }

  let a, b, questionText, answer;

  switch (opType) {
    case "add":
      a = randInt(1, 15);
      b = randInt(1, 15);
      answer = a + b;
      questionText = `${a} + ${b} = ?`;
      break;

    case "sub":
      a = randInt(2, 20);
      b = randInt(1, a);
      answer = a - b;
      questionText = `${a} − ${b} = ?`;
      break;

    case "mul":
      a = randInt(1, 9);
      b = randInt(1, 10);
      answer = a * b;
      questionText = `${a} × ${b} = ?`;
      break;

    case "div":
      const pairs = [
        [4, 2], [6, 2], [9, 3], [12, 3],
        [15, 5], [16, 4], [18, 3], [20, 5],
      ];
      const [num, den] = pairs[randInt(0, pairs.length - 1)];
      a = num;
      b = den;
      answer = num / den;
      questionText = `${a} ÷ ${b} = ?`;
      break;

    default:
      a = randInt(1, 9);
      b = randInt(1, 9);
      answer = a + b;
      questionText = `${a} + ${b} = ?`;
  }

  const choices = new Set();
  choices.add(answer);

  while (choices.size < 3) {
    let delta = randInt(-3, 3);
    if (delta === 0) delta = 1;
    const fake = answer + delta;
    if (fake >= 0) choices.add(fake);
  }

  const choiceArray = Array.from(choices);

  for (let i = choiceArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choiceArray[i], choiceArray[j]] = [choiceArray[j], choiceArray[i]];
  }

  return { questionText, answer, choices: choiceArray };
}

// ===============================
// TIMER
// ===============================

function startTimer() {
  clearInterval(timerId);

  maxTimeMs = level === 1 ? 7000 : level === 2 ? 5500 : 4500;

  timeLeftMs = maxTimeMs;
  timerBar.style.width = "100%";

  timerId = setInterval(() => {
    timeLeftMs -= 100;

    if (timeLeftMs <= 0) {
      clearInterval(timerId);
      timerBar.style.width = "0%";
      handleTimeout();
      return;
    }

    const ratio = timeLeftMs / maxTimeMs;
    timerBar.style.width = `${ratio * 100}%`;

    if (ratio < 0.3) timerBar.style.backgroundColor = "#e74c3c";
    else if (ratio < 0.6) timerBar.style.backgroundColor = "#f1c40f";
    else timerBar.style.backgroundColor = "#2ecc71";
  }, 100);
}

// ===============================
// LOGIQUE DE PROGRESSION
// ===============================

function updateLevel(correct) {
  if (correct) correctStreak++;
  else correctStreak = Math.max(0, correctStreak - 1);

  if (correctStreak >= 6) level = 3;
  else if (correctStreak >= 3) level = 2;
  else level = 1;

  levelSpan.textContent = level.toString();
}

// ===============================
// AFFICHAGE D'UNE QUESTION
// ===============================

function showQuestion() {
  questionIndex++;
  if (questionIndex > TOTAL_QUESTIONS) {
    endGame();
    return;
  }

  questionIndexSpan.textContent = questionIndex.toString();
  feedbackDiv.textContent = "";
  feedbackDiv.className = "";

  choiceButtons.forEach(btn => {
    btn.disabled = false;
    btn.classList.remove("correct", "wrong");
  });

  const { questionText, answer, choices } = generateQuestionForLevel(level);
  currentAnswer = answer;
  questionTextSpan.textContent = questionText;

  choices.forEach((val, idx) => {
    const btn = choiceButtons[idx];
    btn.textContent = val.toString();
    btn.dataset.value = val.toString();
  });

  startTimer();
}

// ===============================
// CLIC SUR UNE RÉPONSE
// ===============================

function handleChoiceClick(e) {
  const btn = e.currentTarget;
  const value = Number(btn.dataset.value);

  clearInterval(timerId);

  const correct = value === currentAnswer;
  updateLevel(correct);

  choiceButtons.forEach(b => (b.disabled = true));

  if (correct) {
    playSfx(sfxSuccess);
    localScore++;
    scoreSpan.textContent = localScore.toString();
    btn.classList.add("correct");
    feedbackDiv.textContent = "Bravo !";
    feedbackDiv.classList.add("good");

    ScoreService.addPoints(1).catch(() => {});
  } else {
    playSfx(sfxError);
    btn.classList.add("wrong");
    const goodBtn = choiceButtons.find(
      b => Number(b.dataset.value) === currentAnswer
    );
    if (goodBtn) goodBtn.classList.add("correct");

    feedbackDiv.textContent = `La bonne réponse était ${currentAnswer}.`;
    feedbackDiv.classList.add("bad");
  }

  setTimeout(showQuestion, 2000);
}

choiceButtons.forEach(btn =>
  btn.addEventListener("click", handleChoiceClick)
);

// ===============================
// TIMEOUT
// ===============================

function handleTimeout() {
  updateLevel(false);
  playSfx(sfxError);

  choiceButtons.forEach(b => (b.disabled = true));

  const goodBtn = choiceButtons.find(
    b => Number(b.dataset.value) === currentAnswer
  );
  if (goodBtn) goodBtn.classList.add("correct");

  feedbackDiv.textContent = `Temps écoulé! La bonne réponse était ${currentAnswer}.`;
  feedbackDiv.classList.add("bad");

  setTimeout(showQuestion, 2000);
}

// ===============================
// FIN DE PARTIE
// ===============================

async function endGame() {
  clearInterval(timerId);

  questionTextSpan.textContent = "Fin de la partie !";
  choiceButtons.forEach(b => (b.disabled = true));
  feedbackDiv.textContent = "";

  finalScoreSpan.textContent = localScore.toString();
  summarySection.classList.remove("hidden");
  replayBtn.classList.remove("hidden");
  startBtn.classList.add("hidden");

  try {
    await ScoreService.saveScore("mathDash", localScore);
    const globalScore = await ScoreService.getScore();
    bestScoreSpan.textContent = globalScore.toString();
    bestScoreRow.classList.remove("hidden");
  } catch {
    bestScoreRow.classList.add("hidden");
  }
}

// ===============================
// DÉMARRER / REJOUER
// ===============================

function startGame() {
  startBtn.classList.add("hidden");
  replayBtn.classList.add("hidden");

  clearInterval(timerId);

  level = 1;
  localScore = 0;
  questionIndex = 0;
  correctStreak = 0;

  scoreSpan.textContent = "0";
  levelSpan.textContent = "1";
  questionIndexSpan.textContent = "0";

  summarySection.classList.add("hidden");
  feedbackDiv.textContent = "";
  feedbackDiv.className = "";

  choiceButtons.forEach(btn => {
    btn.disabled = false;
    btn.classList.remove("correct", "wrong");
  });

  ScoreService.resetScore().catch(() => {});

  showQuestion();
}

startBtn.addEventListener("click", withClickSfx(startGame));
replayBtn.addEventListener("click", withClickSfx(startGame));

// ===============================
// INITIALISATION
// ===============================

function initMathDash() {
  ScoreService.init("mathDash");

  startBtn.classList.remove("hidden");
  replayBtn.classList.add("hidden");

  clearInterval(timerId);

  level = 1;
  localScore = 0;
  questionIndex = 0;
  correctStreak = 0;

  scoreSpan.textContent = "0";
  levelSpan.textContent = "1";
  questionIndexSpan.textContent = "0";

  summarySection.classList.add("hidden");

  feedbackDiv.className = "";
  feedbackDiv.textContent = "Clique sur « Commencer » pour commencer !";

  questionTextSpan.textContent = "Prépare-toi pour Math Dash !";

  choiceButtons.forEach(btn => {
    btn.disabled = true;
    btn.classList.remove("correct", "wrong");
    btn.textContent = "?";
    btn.dataset.value = "";
  });
}

initMathDash();
