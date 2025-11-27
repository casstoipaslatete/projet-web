import { ScoreService } from "../../scripts/scoreService.js";

// Nombre de questions par partie
const TOTAL_QUESTIONS = 10;

// Difficulté cachée: 1 (simple) → 3 (plus dur)
let level = 1;
let localScore = 0;       // score de la partie (0 à 10)
let questionIndex = 0;
let correctStreak = 0;

let currentAnswer = null;
let timerId = null;
let timeLeftMs = 0;
let maxTimeMs = 7000;     // temps max pour une question

// --------- Récupération des éléments DOM ---------
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

const replayBtn = document.getElementById("md-replay");
const backMenuBtn = document.getElementById("btn-back-menu");
const backMenuBtn2 = document.getElementById("md-back-menu2");

// --------- Navigation vers le menu principal ---------
function goBackToMenu() {
  window.location.href = "/index.html#menu";
}

backMenuBtn.addEventListener("click", goBackToMenu);
backMenuBtn2.addEventListener("click", goBackToMenu);

// --------- Helpers et génération de questions ---------
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
    case "add": {
      if (level === 1) {
        a = randInt(1, 9);
        b = randInt(1, 9);
      } else if (level === 2) {
        a = randInt(3, 15);
        b = randInt(3, 15);
      } else {
        a = randInt(5, 30);
        b = randInt(5, 30);
      }
      answer = a + b;
      questionText = `${a} + ${b} = ?`;
      break;
    }

    case "sub": {
      if (level === 1) {
        a = randInt(2, 10);
        b = randInt(1, a);
      } else if (level === 2) {
        a = randInt(5, 20);
        b = randInt(1, a - 1);
      } else {
        a = randInt(10, 35);
        b = randInt(1, a - 1);
      }
      answer = a - b;
      questionText = `${a} − ${b} = ?`;
      break;
    }

    case "mul": {
      if (level === 2) {
        a = randInt(1, 5);
        b = randInt(1, 5);
      } else {
        a = randInt(2, 9);
        b = randInt(1, 10);
      }
      answer = a * b;
      questionText = `${a} × ${b} = ?`;
      break;
    }

    case "div": {
      const pairs = [
        [4, 2], [6, 2], [8, 2], [9, 3], [12, 3],
        [15, 5], [16, 4], [18, 3], [20, 5]
      ];
      const [num, den] = pairs[randInt(0, pairs.length - 1)];
      a = num;
      b = den;
      answer = num / den;
      questionText = `${a} ÷ ${b} = ?`;
      break;
    }

    default: {
      a = randInt(1, 9);
      b = randInt(1, 9);
      answer = a + b;
      questionText = `${a} + ${b} = ?`;
    }
  }

  // Générer 2 mauvaises réponses plausibles
  const choices = new Set();
  choices.add(answer);

  while (choices.size < 3) {
    let delta = randInt(-3, 3);
    if (delta === 0) delta = 1;
    const fake = answer + delta;
    if (fake >= 0) choices.add(fake);
  }

  const choiceArray = Array.from(choices);

  // Mélange
  for (let i = choiceArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choiceArray[i], choiceArray[j]] = [choiceArray[j], choiceArray[i]];
  }

  return { questionText, answer, choices: choiceArray };
}

// --------- Timer ---------
function startTimer() {
  clearInterval(timerId);

  if (level === 1) maxTimeMs = 7000;
  else if (level === 2) maxTimeMs = 5500;
  else maxTimeMs = 4500;

  timeLeftMs = maxTimeMs;
  timerBar.style.width = "100%";
  timerBar.style.backgroundColor = "#2ecc71";

  timerId = setInterval(() => {
    timeLeftMs -= 100;
    if (timeLeftMs <= 0) {
      clearInterval(timerId);
      timerBar.style.width = "0%";
      handleTimeout();
    } else {
      const ratio = timeLeftMs / maxTimeMs;
      timerBar.style.width = `${ratio * 100}%`;
      if (ratio < 0.3) {
        timerBar.style.backgroundColor = "#e74c3c";
      } else if (ratio < 0.6) {
        timerBar.style.backgroundColor = "#f1c40f";
      } else {
        timerBar.style.backgroundColor = "#2ecc71";
      }
    }
  }, 100);
}

// --------- Progression auto de la difficulté ---------
function updateLevel(isCorrect) {
  if (isCorrect) {
    correctStreak++;
  } else {
    correctStreak = Math.max(0, correctStreak - 1);
  }

  if (correctStreak >= 6) {
    level = 3;
  } else if (correctStreak >= 3) {
    level = 2;
  } else {
    level = 1;
  }

  level = Math.min(3, Math.max(1, level));
  levelSpan.textContent = level.toString();
}

// --------- Afficher une nouvelle question ---------
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

// --------- Gestion du clic sur une réponse ---------
function handleChoiceClick(event) {
  const btn = event.currentTarget;
  const value = Number(btn.dataset.value);

  clearInterval(timerId);

  const isCorrect = value === currentAnswer;
  updateLevel(isCorrect);
  choiceButtons.forEach(b => (b.disabled = true));

  if (isCorrect) {
    localScore++;
    scoreSpan.textContent = localScore.toString();
    btn.classList.add("correct");
    feedbackDiv.textContent = "Bravo !";
    feedbackDiv.classList.add("good");

    // Score global via ScoreService (1 point par bonne réponse)
    ScoreService.addPoints(1).catch((err) =>
      console.warn("Erreur addPoints MathDash:", err)
    );
  } else {
    btn.classList.add("wrong");
    const correctBtn = choiceButtons.find(
      b => Number(b.dataset.value) === currentAnswer
    );
    if (correctBtn) correctBtn.classList.add("correct");
    feedbackDiv.textContent = `La bonne réponse était ${currentAnswer}.`;
    feedbackDiv.classList.add("bad");
  }

  setTimeout(showQuestion, 2000);
}

choiceButtons.forEach(btn => {
  btn.addEventListener("click", handleChoiceClick);
});

// --------- Timeout ---------
function handleTimeout() {
  updateLevel(false);
  choiceButtons.forEach(b => (b.disabled = true));

  const correctBtn = choiceButtons.find(
    b => Number(b.dataset.value) === currentAnswer
  );
  if (correctBtn) correctBtn.classList.add("correct");

  feedbackDiv.textContent = `Temps écoulé! La bonne réponse était ${currentAnswer}.`;
  feedbackDiv.classList.add("bad");

  setTimeout(showQuestion, 1200);
}

// --------- Fin de partie ---------
async function endGame() {
  clearInterval(timerId);
  questionTextSpan.textContent = "Fin de la partie!";
  choiceButtons.forEach(b => (b.disabled = true));
  feedbackDiv.textContent = "";

  finalScoreSpan.textContent = localScore.toString();
  summarySection.classList.remove("hidden");

  // Sauvegarde pour le leaderboard global
  try {
    await ScoreService.saveScore("mathDash", localScore);
  } catch (e) {
    console.warn("Erreur saveScore MathDash:", e);
  }

  // Affichage d'un score global
  try {
    const globalScore = await ScoreService.getScore();
    bestScoreSpan.textContent = globalScore.toString();
    bestScoreRow.classList.remove("hidden");
  } catch (e) {
    console.warn("Erreur getScore MathDash:", e);
    bestScoreRow.classList.add("hidden");
  }
}

// --------- Rejouer ---------
function resetGame() {
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

  // Réinitialiser le score global de MathDash côté API
  ScoreService.resetScore().catch((err) =>
    console.warn("Erreur resetScore MathDash:", err)
  );

  showQuestion();
}

replayBtn.addEventListener("click", resetGame);

// --------- Initialisation ---------
function initMathDash() {
  ScoreService.init("mathDash");
  resetGame();
}

initMathDash();
