import * as THREE from 'three';

export class Enemy {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    
    // Articulated Dog
    this.dogMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 }); // Brown
    this.customDogMat = null;
    
    this.dogGroup = new THREE.Group();
    
    // Body Parts
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.2), this.dogMat);
    this.body.position.y = 0.5;
    this.body.castShadow = true;
    this.dogGroup.add(this.body);
    
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), this.dogMat);
    this.head.position.set(0, 0.4, 0.7);
    this.head.castShadow = true;
    this.body.add(this.head);
    
    // Legs
    const legGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
    
    this.legFL = new THREE.Mesh(legGeo, this.dogMat);
    this.legFL.position.set(-0.2, -0.25, 0.4);
    this.body.add(this.legFL);
    
    this.legFR = new THREE.Mesh(legGeo, this.dogMat);
    this.legFR.position.set(0.2, -0.25, 0.4);
    this.body.add(this.legFR);
    
    this.legBL = new THREE.Mesh(legGeo, this.dogMat);
    this.legBL.position.set(-0.2, -0.25, -0.4);
    this.body.add(this.legBL);
    
    this.legBR = new THREE.Mesh(legGeo, this.dogMat);
    this.legBR.position.set(0.2, -0.25, -0.4);
    this.body.add(this.legBR);
    
    this.scene.add(this.dogGroup);
    
    this.targetZ = 15;
    this.currentZ = 15;
    this.dogGroup.position.set(0, 0, this.currentZ);
    
    this.runTime = 0;
  }

  setDogModel(modelType) {
    if (modelType === 'black') {
      this.dogMat.color.setHex(0x111111);
    } else if (modelType === 'spotted') {
      this.dogMat.color.setHex(0xeccc68); // Light brownish
    } else {
      this.dogMat.color.setHex(0x8B4513); // Brown
    }
  }

  setDogFace(dataUrl) {
    if (!dataUrl) {
      this.customDogMat = null;
      this.head.material = this.dogMat;
      return;
    }

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(dataUrl, (texture) => {
      texture.center.set(0.5, 0.5);
      this.customDogMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5 });
      this.head.material = this.customDogMat;
    });
  }

  update(dt, playerSpeed, isStumbled) {
    if (isStumbled) {
      this.targetZ -= 10 * dt; 
      if (this.targetZ < 0) this.targetZ = 0; 
    } else {
      this.targetZ += 2 * dt;
      if (this.targetZ > 15) this.targetZ = 15;
    }
    
    this.currentZ += (this.targetZ - this.currentZ) * 5 * dt;
    this.dogGroup.position.z = this.currentZ;
    
    this.dogGroup.position.x += (this.player.mesh.position.x - this.dogGroup.position.x) * 5 * dt;
    
    // Quadruped Run Animation
    // Dog runs fast when catching up
    const catchupSpeed = isStumbled ? 2.5 : 1.0;
    this.runTime += dt * 20 * catchupSpeed;
    
    if (this.currentZ < 15) {
      this.legFL.rotation.x = Math.sin(this.runTime) * 0.6;
      this.legBR.rotation.x = Math.sin(this.runTime) * 0.6;
      
      this.legFR.rotation.x = -Math.sin(this.runTime) * 0.6;
      this.legBL.rotation.x = -Math.sin(this.runTime) * 0.6;
      
      this.body.position.y = 0.5 + Math.abs(Math.sin(this.runTime * 2)) * 0.1;
      this.body.rotation.z = Math.sin(this.runTime) * 0.05;
    } else {
      this.body.position.y = 0.5;
    }
  }

  isBiting() {
    return this.currentZ < 1.0;
  }

  reset() {
    this.targetZ = 15;
    this.currentZ = 15;
    this.dogGroup.position.set(0, 0, this.currentZ);
  }
}
