import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    this.scene.add(dirLight);

    // Fog for depth
    this.scene.fog = new THREE.Fog(0x000000, 50, 150);

    // Ground/Road
    this.roadWidth = 10;
    this.roadLength = 200;
    
    const textureLoader = new THREE.TextureLoader();
    this.roadTexture = textureLoader.load('./indian_road_texture.png');
    this.roadTexture.wrapS = THREE.RepeatWrapping;
    this.roadTexture.wrapT = THREE.RepeatWrapping;
    this.roadTexture.repeat.set(1, 20); // Repeat texture along the road
    
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.roadLength);
    const roadMat = new THREE.MeshStandardMaterial({ 
      map: this.roadTexture,
      color: 0x999999,
      roughness: 0.9 
    });
    this.road = new THREE.Mesh(roadGeo, roadMat);
    this.road.rotation.x = -Math.PI / 2;
    this.road.position.z = -this.roadLength / 2 + 20; // Extend forward
    this.road.receiveShadow = true;
    this.scene.add(this.road);

    // Ground Plane outside road
    const groundGeo = new THREE.PlaneGeometry(200, this.roadLength);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a1a,
      roughness: 1.0
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.z = -this.roadLength / 2 + 20;
    this.ground.position.y = -0.1;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Road markings (moving)
    this.markings = [];
    const markGeo = new THREE.PlaneGeometry(0.5, 3);
    const markMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    for (let i = 0; i < 20; i++) {
      const mark = new THREE.Mesh(markGeo, markMat);
      mark.rotation.x = -Math.PI / 2;
      mark.position.y = 0.01;
      mark.position.z = -i * 10;
      this.scene.add(mark);
      this.markings.push(mark);
    }

    // Surroundings (Buildings/Trees)
    this.buildings = [];
    const bldgGeo = new THREE.BoxGeometry(1, 1, 1);
    
    // Load Building Texture
    this.shopTexture = textureLoader.load('./indian_shop_texture.png');
    this.shopTexture.wrapS = THREE.RepeatWrapping;
    this.shopTexture.wrapT = THREE.RepeatWrapping;
    
    for (let i = 0; i < 40; i++) {
      const bldgMat = new THREE.MeshStandardMaterial({ 
        map: this.shopTexture,
        color: new THREE.Color().setHSL(Math.random(), 0.5, 0.5),
        roughness: 0.7
      });
      const bldg = new THREE.Mesh(bldgGeo, bldgMat);
      
      const width = 2 + Math.random() * 4;
      const height = 5 + Math.random() * 15;
      const depth = 2 + Math.random() * 4;
      
      bldg.scale.set(width, height, depth);
      
      // Update texture repeating based on scale
      bldgMat.map = this.shopTexture.clone();
      bldgMat.map.needsUpdate = true;
      bldgMat.map.repeat.set(width / 2, height / 2);
      
      // Place on left or right
      const side = Math.random() > 0.5 ? 1 : -1;
      bldg.position.x = side * (this.roadWidth / 2 + width / 2 + 1 + Math.random() * 5);
      bldg.position.y = height / 2;
      bldg.position.z = -Math.random() * this.roadLength;
      
      bldg.castShadow = true;
      bldg.receiveShadow = true;
      
      this.scene.add(bldg);
      this.buildings.push({ mesh: bldg, material: bldgMat });
    }
  }

  update(dt, moveSpeed) {
    const moveAmount = moveSpeed * dt;
    
    // Animate texture to create illusion of moving
    if (this.roadTexture) {
      this.roadTexture.offset.y -= moveAmount * 0.05;
    }
    
    // Move markings
    this.markings.forEach(mark => {
      mark.position.z += moveAmount;
      if (mark.position.z > 20) {
        mark.position.z -= 200;
      }
    });

    // Move buildings
    this.buildings.forEach(bldgObj => {
      const bldg = bldgObj.mesh;
      bldg.position.z += moveAmount;
      if (bldg.position.z > 20) {
        bldg.position.z -= this.roadLength;
        const width = bldg.scale.x;
        const side = Math.random() > 0.5 ? 1 : -1;
        bldg.position.x = side * (this.roadWidth / 2 + width / 2 + 1 + Math.random() * 5);
      }
    });
  }

  applyTheme(theme) {
    const themes = {
      city_day: { roadTint: 0xffffff, ground: 0x1a2a1a, bldgHsl: [Math.random(), 0.5, 0.5] },
      city_night: { roadTint: 0x555555, ground: 0x0a0a0a, bldgHsl: [Math.random(), 0.6, 0.2] },
      village: { roadTint: 0xccaa77, ground: 0x556B2F, bldgHsl: [0.1, 0.4, 0.4] }, // Brown tint over road, greenish ground
      highway: { roadTint: 0x999999, ground: 0x2c3e50, bldgHsl: [0.6, 0.1, 0.6] } // Grey highway, dark ground
    };

    const t = themes[theme] || themes['city_day'];

    this.road.material.color.setHex(t.roadTint);
    this.ground.material.color.setHex(t.ground);

    // Update buildings base color
    this.buildings.forEach(bldgObj => {
      // Slightly randomize based on theme base HSL
      const h = (t.bldgHsl[0] + Math.random() * 0.1) % 1;
      bldgObj.material.color.setHSL(h, t.bldgHsl[1], t.bldgHsl[2]);
    });
  }

  reset() {
    this.markings.forEach((mark, i) => {
      mark.position.z = -i * 10;
    });
    this.buildings.forEach(bldgObj => {
      bldgObj.mesh.position.z = -Math.random() * this.roadLength;
    });
  }
}
