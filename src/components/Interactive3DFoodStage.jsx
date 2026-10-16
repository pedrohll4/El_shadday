import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, RefreshCw, Hand, Sparkles, Flame } from 'lucide-react';

/* =========================================================================
   PROCEDURAL TEXTURE GENERATORS (Gourmet Realistic Food Materials)
   ========================================================================= */

// 1. Artisan Wood-Fired Baked Dough Texture (Massa dourada com bolhas tostadas)
function createDoughTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base golden-wheat baked gradient
  const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
  grad.addColorStop(0, '#e8b874');
  grad.addColorStop(0.6, '#cf964d');
  grad.addColorStop(1, '#a66b26');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Micro flour specks & dough porosity
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 1.5;
    ctx.fillStyle = Math.random() > 0.4 ? 'rgba(255, 248, 230, 0.25)' : 'rgba(120, 70, 20, 0.18)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Artisan wood-oven charred blister spots (bolhas tostadas do forno)
  for (let i = 0; i < 35; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 4 + Math.random() * 14;
    const bGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    bGrad.addColorStop(0, 'rgba(45, 20, 5, 0.95)');
    bGrad.addColorStop(0.6, 'rgba(80, 38, 12, 0.8)');
    bGrad.addColorStop(1, 'rgba(166, 107, 38, 0)');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 2. Melted Bubbly Mozzarella Cheese Texture (Queijo puxando com tostado dourado)
function createCheeseTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Creamy molten mozzarella base
  const grad = ctx.createRadialGradient(256, 256, 60, 256, 256, 256);
  grad.addColorStop(0, '#fffbe6');
  grad.addColorStop(0.5, '#faea9d');
  grad.addColorStop(1, '#e8c95e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Melted cheese fat pools & golden toasted blisters
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 5 + Math.random() * 18;
    const cGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    cGrad.addColorStop(0, 'rgba(180, 95, 15, 0.85)');
    cGrad.addColorStop(0.5, 'rgba(215, 135, 30, 0.5)');
    cGrad.addColorStop(1, 'rgba(250, 234, 157, 0)');
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Oregano / green herb flakes
  ctx.fillStyle = 'rgba(40, 90, 25, 0.85)';
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.ellipse(x, y, 1.5, 3, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 3. Seasoned Ground Beef Texture (Carne moída temperada artesanal)
function createMeatTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3a2012';
  ctx.fillRect(0, 0, 512, 512);

  // Meat nodules & mince texture
  for (let i = 0; i < 3500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 1.5 + Math.random() * 3.5;
    const shades = ['#4f2c18', '#2b160a', '#61371f', '#331a0d', '#6e4026'];
    ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Black pepper & seasoning flecks
  ctx.fillStyle = '#151515';
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillRect(x, y, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 4. Pepperoni / Calabresa Slice Texture (Calabresa com textura fatiada e gordura)
function createPepperoniTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Red paprika salami gradient
  const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  grad.addColorStop(0, '#a32014');
  grad.addColorStop(0.7, '#8f190e');
  grad.addColorStop(1, '#661108');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Pork fat marbling specks
  ctx.fillStyle = 'rgba(255, 230, 220, 0.75)';
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 1.5 + Math.random() * 3.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}


/* =========================================================================
   3D GEOMETRY BUILDERS
   ========================================================================= */

// --- 1. MODELO 3D: ESFIRRA ABERTA REDONDA BRASILEIRA ---
function build3DRoundEsfirra(textures) {
  const esfirraGroup = new THREE.Group();

  // A. Massa Base (Disco inferior côncavo)
  const baseGeom = new THREE.CylinderGeometry(1.05, 1.0, 0.14, 48);
  // Deform bottom slightly for artisan hand-shaped bottom
  const pos = baseGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < 0) {
      pos.setY(i, y + (Math.random() - 0.5) * 0.02);
    }
  }
  baseGeom.computeVertexNormals();

  const doughMat = new THREE.MeshStandardMaterial({
    map: textures.dough,
    roughness: 0.85,
    metalness: 0.04
  });
  const baseMesh = new THREE.Mesh(baseGeom, doughMat);
  esfirraGroup.add(baseMesh);

  // B. Borda Fofa Arredondada (Raised hand-kneaded crust rim)
  const rimGeom = new THREE.TorusGeometry(0.96, 0.22, 24, 52);
  rimGeom.rotateX(Math.PI / 2);
  rimGeom.translate(0, 0.08, 0);

  // Deform rim vertices with organic artisanal bumps
  const rPos = rimGeom.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    const x = rPos.getX(i);
    const z = rPos.getZ(i);
    const angle = Math.atan2(z, x);
    // Subtle wave around the perimeter
    const wave = Math.sin(angle * 7) * 0.035 + Math.cos(angle * 13) * 0.02;
    rPos.setY(i, rPos.getY(i) + wave);
  }
  rimGeom.computeVertexNormals();

  const rimMesh = new THREE.Mesh(rimGeom, doughMat);
  esfirraGroup.add(rimMesh);

  // C. Recheio de Carne Moída Temperada (Substrato com relevo irregular)
  const meatGeom = new THREE.CylinderGeometry(0.86, 0.86, 0.12, 36);
  meatGeom.translate(0, 0.05, 0);
  const mPos = meatGeom.attributes.position;
  for (let i = 0; i < mPos.count; i++) {
    if (mPos.getY(i) > 0) {
      // Rough textured surface
      mPos.setY(i, mPos.getY(i) + (Math.sin(mPos.getX(i) * 15) * Math.cos(mPos.getZ(i) * 15)) * 0.03);
    }
  }
  meatGeom.computeVertexNormals();

  const meatMat = new THREE.MeshStandardMaterial({
    map: textures.meat,
    roughness: 0.9,
    metalness: 0.02
  });
  const meatMesh = new THREE.Mesh(meatGeom, meatMat);
  esfirraGroup.add(meatMesh);

  // D. Queijo Mussarela Derretido por cima (Melted cheese blanket with high gloss)
  const cheeseGeom = new THREE.CylinderGeometry(0.78, 0.78, 0.06, 32);
  cheeseGeom.translate(0, 0.095, 0);
  const cPos = cheeseGeom.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    if (cPos.getY(i) > 0.09) {
      const x = cPos.getX(i);
      const z = cPos.getZ(i);
      // Soft melted puddles
      cPos.setY(i, cPos.getY(i) + (Math.sin(x * 8) * Math.sin(z * 8)) * 0.02);
    }
  }
  cheeseGeom.computeVertexNormals();

  const cheeseMat = new THREE.MeshStandardMaterial({
    map: textures.cheese,
    roughness: 0.22, // Glossy melted fat
    metalness: 0.04
  });
  const cheeseMesh = new THREE.Mesh(cheeseGeom, cheeseMat);
  esfirraGroup.add(cheeseMesh);

  // Scale & initial orientation
  esfirraGroup.scale.set(1.1, 1.1, 1.1);
  return esfirraGroup;
}

// --- 2. MODELO 3D: FATIA DE PIZZA ARTESANAL COM QUEIJO PUXANDO ---
function build3DPizzaSlice(textures) {
  const pizzaGroup = new THREE.Group();

  // A. Triangular Wedge Slice (Massa da fatia com espessura)
  const shape = new THREE.Shape();
  const radius = 2.0;
  const halfAngle = Math.PI / 6; // 60 degree slice

  shape.moveTo(0, 0);
  // Arc at the back crust
  const arcSegments = 24;
  for (let i = 0; i <= arcSegments; i++) {
    const theta = -halfAngle + (i / arcSegments) * (2 * halfAngle);
    shape.lineTo(Math.sin(theta) * radius, Math.cos(theta) * radius);
  }
  shape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3
  };
  const sliceGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  sliceGeom.rotateX(-Math.PI / 2);
  sliceGeom.translate(0, -0.06, -0.8);

  const doughMat = new THREE.MeshStandardMaterial({
    map: textures.dough,
    roughness: 0.85,
    metalness: 0.04
  });
  const sliceMesh = new THREE.Mesh(sliceGeom, doughMat);
  pizzaGroup.add(sliceMesh);

  // B. Cornicione de Forno a Lenha (Borda alta, grossa e inflada no fundo da fatia)
  const crustCurve = new THREE.Curve();
  const points = [];
  for (let i = 0; i <= 24; i++) {
    const theta = -halfAngle + (i / 24) * (2 * halfAngle);
    points.push(new THREE.Vector3(Math.sin(theta) * radius, 0.08, Math.cos(theta) * radius - 0.8));
  }
  const crustPath = new THREE.CatmullRomCurve3(points);
  const crustGeom = new THREE.TubeGeometry(crustPath, 32, 0.18, 16, false);

  // Deform crust with wood-oven blisters
  const cPos = crustGeom.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    cPos.setY(i, cPos.getY(i) + (Math.random() - 0.5) * 0.03);
  }
  crustGeom.computeVertexNormals();

  const crustMesh = new THREE.Mesh(crustGeom, doughMat);
  pizzaGroup.add(crustMesh);

  // C. Molho de Tomate Rústico (Camada vermelha saborosa)
  const sauceShape = new THREE.Shape();
  sauceShape.moveTo(0, 0.05);
  for (let i = 0; i <= arcSegments; i++) {
    const theta = -halfAngle + (i / arcSegments) * (2 * halfAngle);
    sauceShape.lineTo(Math.sin(theta) * (radius - 0.15), Math.cos(theta) * (radius - 0.15));
  }
  sauceShape.closePath();

  const sauceGeom = new THREE.ExtrudeGeometry(sauceShape, { depth: 0.02, bevelEnabled: false });
  sauceGeom.rotateX(-Math.PI / 2);
  sauceGeom.translate(0, 0.07, -0.8);

  const sauceMat = new THREE.MeshStandardMaterial({
    color: 0xaa2014,
    roughness: 0.5,
    metalness: 0.05
  });
  const sauceMesh = new THREE.Mesh(sauceGeom, sauceMat);
  pizzaGroup.add(sauceMesh);

  // D. Queijo Mussarela Derretido (Camada ondulada brilhante)
  const cheeseShape = new THREE.Shape();
  cheeseShape.moveTo(0, 0.08);
  for (let i = 0; i <= arcSegments; i++) {
    const theta = -halfAngle + (i / arcSegments) * (2 * halfAngle);
    cheeseShape.lineTo(Math.sin(theta) * (radius - 0.18), Math.cos(theta) * (radius - 0.18));
  }
  cheeseShape.closePath();

  const cheeseGeom = new THREE.ExtrudeGeometry(cheeseShape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 });
  cheeseGeom.rotateX(-Math.PI / 2);
  cheeseGeom.translate(0, 0.085, -0.8);

  const cheeseMat = new THREE.MeshStandardMaterial({
    map: textures.cheese,
    roughness: 0.2, // Ultra glossy melted cheese
    metalness: 0.05
  });
  const cheeseMesh = new THREE.Mesh(cheeseGeom, cheeseMat);
  pizzaGroup.add(cheeseMesh);

  // E. 3D Fios de Queijo Derretido Esticando (Stretching cheese strings dripping down!)
  const stringMat = new THREE.MeshStandardMaterial({
    color: 0xfcebb1,
    roughness: 0.18,
    metalness: 0.02
  });

  const stringPaths = [
    [new THREE.Vector3(0, 0.08, -0.8), new THREE.Vector3(0.02, -0.25, -0.8), new THREE.Vector3(-0.02, -0.65, -0.78)],
    [new THREE.Vector3(0.15, 0.07, -0.6), new THREE.Vector3(0.18, -0.2, -0.6), new THREE.Vector3(0.12, -0.45, -0.58)],
    [new THREE.Vector3(-0.15, 0.07, -0.6), new THREE.Vector3(-0.18, -0.22, -0.6), new THREE.Vector3(-0.14, -0.5, -0.58)]
  ];

  stringPaths.forEach((pathPoints) => {
    const curve = new THREE.CatmullRomCurve3(pathPoints);
    const tubeGeom = new THREE.TubeGeometry(curve, 16, 0.025, 8, false);
    const tubeMesh = new THREE.Mesh(tubeGeom, stringMat);
    pizzaGroup.add(tubeMesh);
  });

  // F. 3D Toppings: Rodelas de Calabresa / Pepperoni
  const pepGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.035, 24);
  const pepMat = new THREE.MeshStandardMaterial({
    map: textures.pepperoni,
    roughness: 0.35,
    metalness: 0.05
  });

  const pep1 = new THREE.Mesh(pepGeom, pepMat);
  pep1.position.set(-0.25, 0.13, -0.2);
  pep1.rotation.y = 0.3;
  pizzaGroup.add(pep1);

  const pep2 = new THREE.Mesh(pepGeom, pepMat);
  pep2.position.set(0.3, 0.13, 0.2);
  pep2.rotation.y = -0.4;
  pizzaGroup.add(pep2);

  const pep3 = new THREE.Mesh(pepGeom, pepMat);
  pep3.position.set(-0.15, 0.13, 0.55);
  pep3.rotation.y = 0.8;
  pizzaGroup.add(pep3);

  // G. Folha de Manjericão Fresco (Fresh Basil Leaf)
  const basilGeom = new THREE.PlaneGeometry(0.25, 0.4, 8, 8);
  basilGeom.rotateX(-Math.PI / 2.2);
  const bPos = basilGeom.attributes.position;
  for (let i = 0; i < bPos.count; i++) {
    // Natural curl along the spine
    const x = bPos.getX(i);
    bPos.setY(i, bPos.getY(i) - Math.sin(Math.abs(x) * 8) * 0.04);
  }
  basilGeom.computeVertexNormals();

  const basilMat = new THREE.MeshStandardMaterial({
    color: 0x2e6b21,
    roughness: 0.3,
    metalness: 0.02,
    side: THREE.DoubleSide
  });
  const basilMesh = new THREE.Mesh(basilGeom, basilMat);
  basilMesh.position.set(0.05, 0.15, 0.0);
  basilMesh.rotation.y = 0.6;
  pizzaGroup.add(basilMesh);

  pizzaGroup.scale.set(0.9, 0.9, 0.9);
  return pizzaGroup;
}


/* =========================================================================
   REACT INTERACTIVE 3D FOOD STAGE COMPONENT
   ========================================================================= */

export function Interactive3DFoodStage() {
  const mountRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // Controls accessible from UI buttons
  const controlsRef = useRef({
    resetPosition: null,
    spin360: null,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer, scene, camera, animId;
    let main3DGroup, pizzaMeshGroup, esfirraMeshGroup;
    let particles, dynamicLight, rimLight;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 340;

    try {
      // 1. Scene & Camera with true 3D perspective
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0.8, 5.5);
      camera.lookAt(0, 0, 0);

      // 2. High-performance WebGL Renderer with full Alpha (transparent background)
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0); // 100% transparent, ZERO background box!
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;

      container.appendChild(renderer.domElement);

      // 3. Cinematic Gourmet Lighting
      const ambientLight = new THREE.AmbientLight(0xfffaed, 1.6);
      scene.add(ambientLight);

      // Key light for melted cheese specular glints
      const keyLight = new THREE.DirectionalLight(0xfff5e0, 2.8);
      keyLight.position.set(3, 5, 4);
      scene.add(keyLight);

      // Warm Golden Dynamic Pointer Light (follows mouse cursor in 3D)
      dynamicLight = new THREE.PointLight(0xffd56d, 3.5, 14);
      dynamicLight.position.set(0, 1.5, 3);
      scene.add(dynamicLight);

      // Backlight rim for crispy crust glow
      rimLight = new THREE.PointLight(0xff9e24, 2.5, 10);
      rimLight.position.set(-2, -1.5, -2);
      scene.add(rimLight);

      // 4. Generate Procedural High-Fidelity Textures
      const textures = {
        dough: createDoughTexture(),
        cheese: createCheeseTexture(),
        meat: createMeatTexture(),
        pepperoni: createPepperoniTexture()
      };

      // 5. Main 3D Composition Group (Both models rotate together)
      main3DGroup = new THREE.Group();
      scene.add(main3DGroup);

      // Build 3D Pizza Slice (Left)
      pizzaMeshGroup = build3DPizzaSlice(textures);
      pizzaMeshGroup.position.set(-1.1, -0.05, 0.15);
      pizzaMeshGroup.rotation.set(0.35, -0.3, -0.15); // Inviting gourmet tilt
      main3DGroup.add(pizzaMeshGroup);

      // Build 3D Round Esfirra (Right)
      esfirraMeshGroup = build3DRoundEsfirra(textures);
      esfirraMeshGroup.position.set(1.15, -0.05, -0.1);
      esfirraMeshGroup.rotation.set(0.45, 0.25, 0.05); // Angled up towards viewer
      main3DGroup.add(esfirraMeshGroup);

      // 6. 3D Floating Embers & Savory Steam Cloud
      const particleCount = 65;
      const particleGeom = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const speeds = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 4.2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 3.4 - 0.8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
        speeds[i] = 0.007 + Math.random() * 0.013;
      }
      particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const particleMat = new THREE.PointsMaterial({
        color: 0xffd56d,
        size: 0.065,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      particles = new THREE.Points(particleGeom, particleMat);
      scene.add(particles);

      // 7. Dynamic Ground Shadow Plane
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 128;
      shadowCanvas.height = 128;
      const sCtx = shadowCanvas.getContext('2d');
      if (sCtx) {
        const radGrad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        radGrad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        radGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sCtx.fillStyle = radGrad;
        sCtx.fillRect(0, 0, 128, 128);
      }
      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.65,
        depthWrite: false
      });
      const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.2), shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(0, -1.55, 0);
      scene.add(shadowMesh);

      // 8. Physics & Pointer Interaction State
      let isDragging = false;
      let prevPointerX = 0;
      let prevPointerY = 0;
      let rotationVelocityX = 0;
      let rotationVelocityY = 0;
      let targetRotX = 0;
      let targetRotY = 0;
      let clock = new THREE.Clock();

      controlsRef.current.resetPosition = () => {
        targetRotX = 0;
        targetRotY = 0;
        rotationVelocityX = 0;
        rotationVelocityY = 0;
      };

      controlsRef.current.spin360 = () => {
        rotationVelocityY = 0.14;
      };

      // Pointer event listeners
      const onPointerDown = (e) => {
        isDragging = true;
        setIsInteracting(true);
        prevPointerX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        prevPointerY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
        rotationVelocityX = 0;
        rotationVelocityY = 0;
      };

      const onPointerMove = (e) => {
        const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

        // Dynamic 3D light follows cursor for interactive cheese glints
        const rect = container.getBoundingClientRect();
        const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);
        
        dynamicLight.position.x = normX * 3.0;
        dynamicLight.position.y = normY * 2.5 + 1.0;

        if (!isDragging) return;

        const deltaX = clientX - prevPointerX;
        const deltaY = clientY - prevPointerY;

        prevPointerX = clientX;
        prevPointerY = clientY;

        // Rotate Y (horizontal 360 spin) and X (vertical tilt)
        targetRotY += deltaX * 0.012;
        targetRotX += deltaY * 0.012;

        // Clamp vertical tilt so it always looks delicious
        targetRotX = Math.max(-0.75, Math.min(0.75, targetRotX));

        rotationVelocityX = deltaY * 0.005;
        rotationVelocityY = deltaX * 0.005;
      };

      const onPointerUp = () => {
        isDragging = false;
        setIsInteracting(false);
      };

      container.addEventListener('pointerdown', onPointerDown, { passive: true });
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { passive: true });

      // 9. Silky 60fps Animation Loop
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // 3D Embers movement
        if (particles) {
          const pPositions = particles.geometry.attributes.position.array;
          for (let i = 0; i < particleCount; i++) {
            pPositions[i * 3 + 1] += speeds[i];
            pPositions[i * 3] += Math.sin(elapsedTime * 2 + i) * 0.002;
            if (pPositions[i * 3 + 1] > 2.2) {
              pPositions[i * 3 + 1] = -1.6;
              pPositions[i * 3] = (Math.random() - 0.5) * 4.0;
            }
          }
          particles.geometry.attributes.position.needsUpdate = true;
        }

        // Smooth physics inertia and floating levitation
        if (!isDragging) {
          targetRotX += rotationVelocityX;
          targetRotY += rotationVelocityY;
          rotationVelocityX *= 0.94;
          rotationVelocityY *= 0.94;

          // Idle Levitation & subtle floating
          const levitation = Math.sin(elapsedTime * 1.6) * 0.1;
          main3DGroup.position.y = levitation;

          // Gentle individual micro-floats
          pizzaMeshGroup.position.y = -0.05 + Math.sin(elapsedTime * 2.0) * 0.03;
          esfirraMeshGroup.position.y = -0.05 + Math.cos(elapsedTime * 1.8) * 0.03;

          // Ground shadow breathes
          shadowMesh.scale.set(1.0 - levitation * 0.35, 1.0 - levitation * 0.35, 1.0);
          shadowMat.opacity = 0.65 - levitation * 0.2;

          // Gentle continuous slow rotation when idle
          if (Math.abs(rotationVelocityY) < 0.001) {
            targetRotY += Math.sin(elapsedTime * 0.7) * 0.0012;
          }
        } else {
          main3DGroup.position.y = 0.08;
        }

        // Spring interpolation towards target rotation
        main3DGroup.rotation.x += (targetRotX - main3DGroup.rotation.x) * 0.12;
        main3DGroup.rotation.y += (targetRotY - main3DGroup.rotation.y) * 0.12;

        renderer.render(scene, camera);
      };

      animate();

      // 10. Responsive Resize
      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        container.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);

        if (renderer && renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        if (renderer) renderer.dispose();
      };
    } catch (e) {
      console.warn('Three.js 3D initialization failed:', e);
    }
  }, []);

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none">
      
      {/* 3D WebGL Canvas Stage */}
      <div 
        ref={mountRef}
        className="relative w-full max-w-[340px] sm:max-w-[420px] h-[300px] sm:h-[350px] cursor-grab active:cursor-grabbing touch-none flex items-center justify-center overflow-visible"
        title="Clique e arraste para girar a pizza e a esfirra em 3D real!"
      >
        {/* Soft Radial Gold Aura behind transparent WebGL canvas */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-gold/25 via-amber-500/15 to-transparent blur-3xl animate-aura-glow pointer-events-none"></div>

        {/* Floating Quality Badge (Glassmorphic) */}
        <div className="absolute top-2 right-2 sm:right-4 z-20 flex items-center gap-1.5 px-3 py-1 bg-dark-900/90 backdrop-blur-md border border-brand-gold/40 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.7)] pointer-events-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold"></span>
          </span>
          <Flame className="w-3.5 h-3.5 text-brand-gold" />
          <span className="text-[11px] font-black text-brand-gold tracking-tight">
            Pizza & Esfirra Modeladas 3D
          </span>
        </div>
      </div>

      {/* Interactive 3D Controls Pill */}
      <div className="relative z-20 -mt-2 flex flex-wrap items-center justify-center gap-2">
        
        {/* Status indicator */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 shadow-md ${
          isInteracting
            ? 'bg-brand-gold text-dark-950 scale-105 shadow-glow-gold'
            : 'bg-dark-900/90 text-brand-gold border border-brand-gold/40 backdrop-blur-md'
        }`}>
          <Hand className={`w-3.5 h-3.5 ${isInteracting ? 'animate-bounce' : ''}`} />
          <span>{isInteracting ? 'Girando Modelos 3D!' : 'Arraste para girar em 3D'}</span>
        </div>

        {/* 360 Spin Action */}
        <button
          type="button"
          onClick={() => controlsRef.current.spin360 && controlsRef.current.spin360()}
          className="p-1.5 rounded-full bg-dark-900/90 hover:bg-dark-850 text-slate-300 hover:text-brand-gold border border-white/10 hover:border-brand-gold/40 transition-colors shadow-sm cursor-pointer"
          title="Girar 360 graus"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Reset Position Action */}
        <button
          type="button"
          onClick={() => controlsRef.current.resetPosition && controlsRef.current.resetPosition()}
          className="p-1.5 rounded-full bg-dark-900/90 hover:bg-dark-850 text-slate-300 hover:text-brand-gold border border-white/10 hover:border-brand-gold/40 transition-colors shadow-sm cursor-pointer"
          title="Centralizar posição"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

      </div>

    </div>
  );
}
