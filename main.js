import { Game } from './src/Game.js';

// DOM Elements
const startScreen = document.getElementById('start-screen');
const hud = document.getElementById('hud');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreDisplay = document.getElementById('score');
const speedDisplay = document.getElementById('speed');
const finalScoreDisplay = document.getElementById('final-score');
const gameContainer = document.getElementById('game-container');

// Customization Elements
const themeSelector = document.getElementById('theme-selector');
const playerModelSelect = document.getElementById('player-model');
const faceUpload = document.getElementById('face-upload');
const clearFaceBtn = document.getElementById('clear-face-btn');
const dogModelSelect = document.getElementById('dog-model');
const dogUpload = document.getElementById('dog-upload');
const clearDogBtn = document.getElementById('clear-dog-btn');

const settingsScreen = document.getElementById('settings-screen');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');

// Game State
let game;
let gameActive = false;
let score = 0;

// Initialize Game instance
function init() {
  game = new Game(document.getElementById('game-canvas'), {
    onGameOver: handleGameOver,
    onScoreUpdate: handleScoreUpdate
  });
  
  // Load Customizations
  loadCustomizations();
}

function loadCustomizations() {
  const savedTheme = localStorage.getItem('vp_theme');
  if (savedTheme) {
    themeSelector.value = savedTheme;
    game.setTheme(savedTheme);
  } else {
    game.setTheme('city_day'); // default
  }

  const savedPlayerModel = localStorage.getItem('vp_player_model') || 'man';
  playerModelSelect.value = savedPlayerModel;
  game.player.setModel(savedPlayerModel);

  const savedFace = localStorage.getItem('vp_face');
  if (savedFace) {
    game.player.setFace(savedFace);
    clearFaceBtn.style.display = 'block';
  } else {
    game.player.setFace('./default_human.png');
  }

  const savedDogModel = localStorage.getItem('vp_dog_model') || 'brown';
  dogModelSelect.value = savedDogModel;
  game.enemies.setDogModel(savedDogModel);

  const savedDogFace = localStorage.getItem('vp_dog_face');
  if (savedDogFace) {
    game.enemies.setDogFace(savedDogFace);
    clearDogBtn.style.display = 'block';
  } else {
    game.enemies.setDogFace('./default_dog.png');
  }
}

// Start Game
function startGame() {
  startScreen.classList.remove('active');
  gameOverScreen.classList.remove('active');
  hud.classList.add('active');
  
  score = 0;
  scoreDisplay.innerText = '0';
  
  game.start();
  gameActive = true;
}

// Game Over Handler
function handleGameOver() {
  gameActive = false;
  hud.classList.remove('active');
  gameOverScreen.classList.add('active');
  finalScoreDisplay.innerText = Math.floor(score);
  
  // Shake effect
  gameContainer.classList.add('shake');
  setTimeout(() => {
    gameContainer.classList.remove('shake');
  }, 500);
}

// Score Update Handler
function handleScoreUpdate(newScore, currentSpeed) {
  score = newScore;
  scoreDisplay.innerText = Math.floor(score);
  if (speedDisplay && currentSpeed) {
    speedDisplay.innerText = Math.floor(currentSpeed * 3.6); // roughly convert to km/h feel
  }
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

settingsBtn.addEventListener('click', () => {
  startScreen.classList.remove('active');
  settingsScreen.classList.add('active');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsScreen.classList.remove('active');
  startScreen.classList.add('active');
});

// Customization Listeners
themeSelector.addEventListener('change', (e) => {
  const theme = e.target.value;
  localStorage.setItem('vp_theme', theme);
  game.setTheme(theme);
});

playerModelSelect.addEventListener('change', (e) => {
  const model = e.target.value;
  localStorage.setItem('vp_player_model', model);
  game.player.setModel(model);
});

dogModelSelect.addEventListener('change', (e) => {
  const model = e.target.value;
  localStorage.setItem('vp_dog_model', model);
  game.enemies.setDogModel(model);
});

faceUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const dataUrl = event.target.result;
      localStorage.setItem('vp_face', dataUrl);
      game.player.setFace(dataUrl);
      clearFaceBtn.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

clearFaceBtn.addEventListener('click', () => {
  localStorage.removeItem('vp_face');
  game.player.setFace('./default_human.png');
  faceUpload.value = '';
  clearFaceBtn.style.display = 'none';
});

dogUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const dataUrl = event.target.result;
      localStorage.setItem('vp_dog_face', dataUrl);
      game.enemies.setDogFace(dataUrl);
      clearDogBtn.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

clearDogBtn.addEventListener('click', () => {
  localStorage.removeItem('vp_dog_face');
  game.enemies.setDogFace('./default_dog.png');
  dogUpload.value = '';
  clearDogBtn.style.display = 'none';
});

// Initialize on load
window.addEventListener('DOMContentLoaded', init);
