import * as THREE from 'three';

export class ObstacleManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.obstacles = [];
    this.spawnZ = -150; 
    this.currentTheme = 'city_day';
    
    const textureLoader = new THREE.TextureLoader();
    this.autoTex = textureLoader.load('./auto_rickshaw_tex.png');
    this.barricadeTex = textureLoader.load('./barricade_tex.png');
  }

  setTheme(theme) {
    this.currentTheme = theme;
  }

  spawnObstacle() {
    let mesh;
    const isBarrier = Math.random() > 0.5;
    const isPothole = Math.random() > 0.8; // 20% chance to be a pothole
    
    if (isPothole) {
      // Pothole (dark spot on ground)
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.1, 16),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 })
      );
      mesh.position.y = 0.05;
    } else if (this.currentTheme === 'village') {
      if (isBarrier) {
        // Hay bale
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.5, 2, 16),
          new THREE.MeshStandardMaterial({ color: 0xDAA520, roughness: 1 })
        );
        mesh.rotation.z = Math.PI / 2;
        mesh.position.y = 1;
      } else {
        // Wooden cart / box
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(2, 1.5, 2),
          new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 })
        );
        mesh.position.y = 0.75;
      }
    } else if (this.currentTheme === 'highway') {
      if (isBarrier) {
        // Traffic Cone
        mesh = new THREE.Mesh(
          new THREE.ConeGeometry(0.8, 2, 16),
          new THREE.MeshStandardMaterial({ color: 0xFF4500, roughness: 0.5 })
        );
        mesh.position.y = 1;
      } else {
        // Tire stack
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(1, 1, 1.5, 16),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
        );
        mesh.position.y = 0.75;
      }
    } else { // City Day / Night
      if (isBarrier) {
        // Auto Rickshaw (using realistic texture)
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 2, 3),
          new THREE.MeshStandardMaterial({ 
            map: this.autoTex,
            color: 0xFFFFFF,
            roughness: 0.5 
          }) 
        );
        mesh.position.y = 1;
      } else {
        // Barricade (using realistic texture)
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(3, 1.5, 0.5),
          new THREE.MeshStandardMaterial({ 
            map: this.barricadeTex,
            color: 0xFFFFFF, 
            roughness: 0.6,
            transparent: true
          })
        );
        mesh.position.y = 0.75;
      }
    }
    
    mesh.castShadow = !isPothole;
    mesh.receiveShadow = true;
    
    mesh.position.x = (Math.random() - 0.5) * 8; // Random lane
    mesh.position.z = this.spawnZ;
    
    this.scene.add(mesh);
    this.obstacles.push({ mesh, active: true, passed: false });
  }

  update(dt, moveSpeed) {
    const moveAmount = moveSpeed * dt;
    
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (!obs.active) continue;
      
      obs.mesh.position.z += moveAmount;
      
      // Remove if past player completely
      if (obs.mesh.position.z > 20) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    const playerBox = new THREE.Box3().setFromObject(this.player.mesh);
    // Only shrink slightly to avoid edge grazing
    playerBox.expandByScalar(-0.1); 

    for (let obs of this.obstacles) {
      if (!obs.active) continue;
      
      const obsBox = new THREE.Box3().setFromObject(obs.mesh);
      
      // For potholes, we need to artificially inflate their Y so the player's hovering legs can hit them
      if (obs.mesh.geometry.type === 'CylinderGeometry' && obs.mesh.position.y === 0.05) {
        obsBox.max.y += 1.0; 
      }
      
      obsBox.expandByScalar(-0.1);
      
      if (playerBox.intersectsBox(obsBox)) {
        obs.active = false;
        obs.mesh.material.opacity = 0.5;
        obs.mesh.material.transparent = true;
        
        return true; // Stumble triggered
      }
    }
    return false;
  }

  reset() {
    this.obstacles.forEach(obs => this.scene.remove(obs.mesh));
    this.obstacles = [];
  }
}
