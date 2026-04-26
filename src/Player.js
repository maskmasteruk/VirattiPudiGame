import * as THREE from 'three';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    
    // Articulated Humanoid Rig
    this.torsoMat = new THREE.MeshStandardMaterial({ color: 0xff4757, roughness: 0.6 });
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.6 }); // Indian skin tone default
    this.legMat = new THREE.MeshStandardMaterial({ color: 0x2f3542, roughness: 0.8 });
    
    // Body Parts
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), this.torsoMat);
    this.torso.position.y = 1.6;
    this.torso.castShadow = true;
    
    // Head Group to hold the face texture easily
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.8, 0);
    this.torso.add(this.headGroup);
    
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), this.skinMat);
    this.head.castShadow = true;
    this.headGroup.add(this.head);
    this.defaultHeadMat = this.skinMat;
    
    // Limbs
    const limbGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    
    this.armL = new THREE.Mesh(limbGeo, this.skinMat);
    this.armL.position.set(-0.5, 0.2, 0);
    this.torso.add(this.armL);
    
    this.armR = new THREE.Mesh(limbGeo, this.skinMat);
    this.armR.position.set(0.5, 0.2, 0);
    this.torso.add(this.armR);
    
    this.legL = new THREE.Mesh(limbGeo, this.legMat);
    this.legL.position.set(-0.25, -0.6, 0);
    this.torso.add(this.legL);
    
    this.legR = new THREE.Mesh(limbGeo, this.legMat);
    this.legR.position.set(0.25, -0.6, 0);
    this.torso.add(this.legR);
    
    this.mesh.add(this.torso);
    this.scene.add(this.mesh);

    // Physics / Movement
    this.targetX = 0;
    this.speed = 15; // lateral speed
    this.roadWidth = 10;
    this.keys = { left: false, right: false };
    
    this.runTime = 0;
    
    this.setupInput();
  }

  setModel(modelType) {
    if (modelType === 'woman') {
      this.torsoMat.color.setHex(0xff6b81); // Pinkish top
      this.legMat.color.setHex(0x576574);
    } else if (modelType === 'delivery') {
      this.torsoMat.color.setHex(0xeccc68); // Yellow Zomato/Swiggy like shirt
      this.legMat.color.setHex(0x2f3542);
    } else {
      // Man
      this.torsoMat.color.setHex(0xff4757); // Red shirt
      this.legMat.color.setHex(0x1e90ff); // Blue jeans
    }
  }

  setFace(dataUrl) {
    if (!dataUrl) {
      this.head.material = this.defaultHeadMat;
      return;
    }
    
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(dataUrl, (texture) => {
      const customMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.5
      });
      texture.center.set(0.5, 0.5);
      this.head.material = customMat;
    });
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
    });

    window.addEventListener('touchstart', (e) => {
      const touchX = e.touches[0].clientX;
      if (touchX < window.innerWidth / 2) this.keys.left = true;
      else this.keys.right = true;
    });

    window.addEventListener('touchend', () => {
      this.keys.left = false;
      this.keys.right = false;
    });
  }

  update(dt, speedMultiplier) {
    // Lateral movement
    let moveDir = 0;
    if (this.keys.left) moveDir -= 1;
    if (this.keys.right) moveDir += 1;

    this.targetX += moveDir * this.speed * dt;
    
    const maxBound = this.roadWidth / 2 - 0.5;
    this.targetX = Math.max(-maxBound, Math.min(maxBound, this.targetX));

    this.mesh.position.x += (this.targetX - this.mesh.position.x) * 15 * dt;

    // Lean effect
    this.mesh.rotation.z = (this.mesh.position.x - this.targetX) * 0.2;
    this.mesh.rotation.y = (this.mesh.position.x - this.targetX) * 0.3;

    // Run Animation
    this.runTime += dt * 15 * speedMultiplier;
    
    // Swinging arms and legs
    this.armL.rotation.x = Math.sin(this.runTime) * 0.8;
    this.armR.rotation.x = -Math.sin(this.runTime) * 0.8;
    
    this.legL.rotation.x = -Math.sin(this.runTime) * 0.8;
    this.legR.rotation.x = Math.sin(this.runTime) * 0.8;
    
    // Bobbing
    this.torso.position.y = 1.4 + Math.abs(Math.sin(this.runTime * 2)) * 0.1;
  }

  reset() {
    this.targetX = 0;
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
  }
}
