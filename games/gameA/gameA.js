const pads = document.querySelectorAll('.simon-pad');
const startBtn = document.getElementById('start-btn');
const scoreDisplay = document.getElementById('score');

const colors = ['green', 'red', 'yellow', 'blue'];
let sequence = [];
let playerSequence = [];
let score = 0;
let sequenceTurn = false;

startBtn.addEventListener('click', startGame);

function startGame() {
    sequence = [];
    playerSequence = [];
    score = 0;
    updateScore(0);
    nextTurn();
}

function nextTurn() {
    playerSequence = [];
    sequenceTurn = true;
    const nextColor = colors[Math.floor(Math.random() * colors.length)];
    sequence.push(nextColor);

    playSequence();
}

async function playSequence() {
    await new Promise(resolve => setTimeout(resolve, 500)); // Pause before showing next sequence
    for (const color of sequence) {
        await flashPad(color);
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    sequenceTurn = false;
}

function flashPad(color) {
    return new Promise(resolve => {
        const pad = document.querySelector(`.simon-pad[data-color="${color}"]`);
        pad.classList.add('active');
        setTimeout(() => {
            pad.classList.remove('active');
            resolve();
        }, 600);
    });
}

pads.forEach(pad => {
    pad.addEventListener('click', () => {
        if (sequenceTurn) return; // Don't allow clicks while sequence is playing

        const clickedColor = pad.dataset.color;
        flashPad(clickedColor);
        playerSequence.push(clickedColor);
        checkPlayerInput();
    });
});

function checkPlayerInput() {
    const currentStep = playerSequence.length - 1;

    if (playerSequence[currentStep] !== sequence[currentStep]) {
        alert(`Game Over! Your score: ${score}`);
        // Here we will call the score service later
        return;
    }

    if (playerSequence.length === sequence.length) {
        updateScore(score + 1);
        setTimeout(nextTurn, 1000);
    }
}

function updateScore(newScore) {
    score = newScore;
    scoreDisplay.textContent = score;
}
