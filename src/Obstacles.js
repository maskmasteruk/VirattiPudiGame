import * as THREE from 'three';

export class ObstacleManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.obstacles = [];
    this.spawnZ = -150; 
    this.currentTheme = 'city_day';
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
        // Auto Rickshaw (simple box)
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 2, 3),
          new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.4 }) // Yellow
        );
        mesh.position.y = 1;
      } else {
        // Barricade
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(3, 1.5, 0.5),
          new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.6 })
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
    playerBox.expandByScalar(-0.3); // forgiveness

    for (let obs of this.obstacles) {
      if (!obs.active) continue;
      const obsBox = new THREE.Box3().setFromObject(obs.mesh);
      obsBox.expandByScalar(-0.2);
      
      if (playerBox.intersectsBox(obsBox)) {
        // Once collided, don't continuously collide with same obstacle
        obs.active = false;
        // Make obstacle fly away or disappear slightly
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
