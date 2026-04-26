import * as THREE from 'three';
import { Player } from './Player.js';
import { Environment } from './Environment.js';
import { Enemy } from './Enemy.js';
import { ObstacleManager } from './Obstacles.js';
import { AudioManager } from './AudioManager.js';

export class Game {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.onGameOver = callbacks.onGameOver;
    this.onScoreUpdate = callbacks.onScoreUpdate;

    // Three.js setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); 
    
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.position.set(0, 5, 8); 
    this.camera.lookAt(0, 0, -10);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    // Game Objects
    this.player = new Player(this.scene);
    this.environment = new Environment(this.scene);
    this.enemies = new Enemy(this.scene, this.player);
    this.obstacles = new ObstacleManager(this.scene, this.player);
    this.audio = new AudioManager();

    // State
    this.isActive = false;
    this.score = 0;
    
    // Dynamic Speed system
    this.targetSpeed = 30; // Desired cruising speed
    this.currentSpeed = 30; // Actual speed
    this.speedMultiplier = 1;
    
    // Stumble state
    this.isStumbled = false;
    this.stumbleRecoverTimer = 0;

    // Spawning logic
    this.lastObstacleSpawn = 0;
    
    this.currentTheme = 'city_day';
    this.clock = new THREE.Clock();

    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Intro Setup
    this.enemies.currentZ = 2; // Dog right behind player initially
    this.enemies.targetZ = 2;
    this.camera.position.set(2, 2, 4); // Side cinematic view
    this.camera.lookAt(0, 1, 0); // Looking at player
    
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    this.isActive = true;
    this.score = 0;
    this.speedMultiplier = 1;
    this.currentSpeed = 30;
    this.targetSpeed = 30;
    this.isStumbled = false;
    this.stumbleRecoverTimer = 0;
    
    this.player.reset();
    this.environment.reset();
    this.enemies.reset();
    this.enemies.targetZ = 15; // Dog falls back as run begins
    this.obstacles.reset();
    
    this.lastObstacleSpawn = 0;

    // Reset Camera to running view
    this.camera.position.set(0, 5, 8); 
    this.camera.lookAt(0, 0, -10);

    this.clock.start();
    this.audio.startEngine();
    this.loop();
  }

  gameOver() {
    this.isActive = false;
    this.audio.stopEngine();
    this.audio.playCrash();
    
    // Zoom in on the tragic end
    this.camera.position.set(this.player.mesh.position.x + 3, 3, this.player.mesh.position.z + 5);
    this.camera.lookAt(this.player.mesh.position.x, 1, this.player.mesh.position.z);
    this.renderer.render(this.scene, this.camera);
    
    this.onGameOver();
  }

  setTheme(theme) {
    this.currentTheme = theme;
    
    const themes = {
      city_day: { bg: 0x87CEEB, fogNear: 50, fogFar: 150 },
      city_night: { bg: 0x050510, fogNear: 20, fogFar: 80 },
      village: { bg: 0xe6a15c, fogNear: 30, fogFar: 120 },
      highway: { bg: 0x87CEEB, fogNear: 40, fogFar: 150 }
    };
    
    const t = themes[theme] || themes['city_day'];
    
    this.scene.background.setHex(t.bg);
    if (this.scene.fog) {
      this.scene.fog.color.setHex(t.bg);
      this.scene.fog.near = t.fogNear;
      this.scene.fog.far = t.fogFar;
    }
    
    this.environment.applyTheme(theme);
    this.obstacles.setTheme(theme);
    
    if (!this.isActive) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  handleStumble() {
    this.audio.playCrash(); // Use crash sound as bump
    
    // Check if dog is already near
    if (this.isStumbled && this.enemies.currentZ < 5) {
      // Bitten!
      this.gameOver();
      return;
    }
    
    // First stumble or far dog
    this.isStumbled = true;
    this.stumbleRecoverTimer = 3.0; // Seconds until fully recovered
    this.currentSpeed *= 0.3; // Speed drops drastically
    this.targetSpeed = 30 * this.speedMultiplier; 
    
    // Camera shake effect
    document.getElementById('game-container').classList.add('shake');
    setTimeout(() => {
      document.getElementById('game-container').classList.remove('shake');
    }, 300);
  }

  loop() {
    if (!this.isActive) return;
    
    requestAnimationFrame(this.loop.bind(this));
    
    const dt = this.clock.getDelta();
    const safeDt = Math.min(dt, 0.1);

    // Difficulty scaling and manual speed control
    if (this.player.keys.up) {
      this.speedMultiplier += safeDt * 0.2; // Accelerate manually
    } else if (this.player.keys.down) {
      this.speedMultiplier -= safeDt * 0.2; // Decelerate manually
    } else {
      this.speedMultiplier += safeDt * 0.005; // Auto accelerate slowly
    }
    
    // Clamp speed multiplier between 0.5 (slow) and 3.0 (very fast)
    this.speedMultiplier = Math.max(0.5, Math.min(3.0, this.speedMultiplier));
    
    // Recovery Logic
    if (this.isStumbled) {
      this.stumbleRecoverTimer -= safeDt;
      if (this.stumbleRecoverTimer <= 0) {
        this.isStumbled = false;
      }
    }
    
    // Speed interpolation
    this.targetSpeed = 30 * this.speedMultiplier;
    
    if (this.isStumbled) {
      // Slowly accelerate while recovering
      this.currentSpeed += (this.targetSpeed - this.currentSpeed) * 0.5 * safeDt;
    } else {
      // Normal acceleration
      this.currentSpeed += (this.targetSpeed - this.currentSpeed) * 2 * safeDt;
    }

    // Score based on distance (speed * time)
    this.score += this.currentSpeed * safeDt * 0.1;
    this.onScoreUpdate(this.score, this.currentSpeed);
    this.audio.updateEngine(this.currentSpeed / 30);

    // Update entities
    this.player.update(safeDt, this.currentSpeed / 30);
    this.environment.update(safeDt, this.currentSpeed);
    this.enemies.update(safeDt, this.currentSpeed, this.isStumbled);
    this.obstacles.update(safeDt, this.currentSpeed);

    // Camera follow player slightly and sway to simulate curved road
    const sway = Math.sin(this.score * 0.02) * 3;
    this.camera.position.x += (this.player.mesh.position.x * 0.4 + sway - this.camera.position.x) * safeDt * 5;
    this.camera.lookAt(sway * 1.5, 0, -20);

    // Spawning logic (spawn faster as speed increases)
    const spawnThreshold = Math.max(10, 30 - this.speedMultiplier * 5);
    if (this.score > this.lastObstacleSpawn + spawnThreshold) {
      this.obstacles.spawnObstacle();
      this.lastObstacleSpawn = this.score;
    }

    // Check Collisions
    if (this.obstacles.checkCollisions()) {
      this.handleStumble();
    }
    
    if (this.enemies.isBiting()) {
      this.audio.playBark();
      this.gameOver();
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (!this.isActive) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
