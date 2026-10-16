import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RotateCw, RefreshCw, Hand, Flame, Sparkles } from 'lucide-react';

export function Interactive3DFoodStage() {
  const mountRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const controlsRef = useRef({
    resetPosition: null,
    spin360: null,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer, scene, camera, animId;
    let stageGroup, particles;
    let pizzaMeshGroup, esfirraMeshGroup;
    let dynamicLight, rimLight;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 340;

    try {
      // 1. Scene & Camera Setup
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0.6, 5.2);
      camera.lookAt(0, 0, 0);

      // 2. High-Performance WebGL Renderer with Alpha Transparency (No background box!)
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0); // 100% transparent canvas
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;

      container.appendChild(renderer.domElement);

      // 3. Cinematic Gourmet Lighting
      const ambientLight = new THREE.AmbientLight(0xfffaea, 1.8);
      scene.add(ambientLight);

      // Main directional light highlighting cheese & crust relief
      const keyLight = new THREE.DirectionalLight(0xfff5dc, 2.8);
      keyLight.position.set(3.0, 4.5, 4.0);
      scene.add(keyLight);

      // Dynamic Interactive Pointer Light (follows mouse cursor in 3D)
      dynamicLight = new THREE.PointLight(0xffd56d, 3.8, 14);
      dynamicLight.position.set(0, 1.0, 2.8);
      scene.add(dynamicLight);

      // Golden Rim Backlight for warm crust edge halo
      rimLight = new THREE.PointLight(0xff9e24, 2.4, 12);
      rimLight.position.set(-2.5, -0.8, 1.8);
      scene.add(rimLight);

      // 4. Main 3D Container Group
      stageGroup = new THREE.Group();
      scene.add(stageGroup);

      // 5. Load Real 3D GLB Models (Pizza & Esfirra)
      const gltfLoader = new GLTFLoader();
      let loadedCount = 0;
      const checkAllLoaded = () => {
        loadedCount += 1;
        if (loadedCount >= 2) {
          setIsLoaded(true);
        }
      };

      // Load 3D Pizza Slice Model
      gltfLoader.load(
        '/models/pizza.glb',
        (gltf) => {
          pizzaMeshGroup = gltf.scene;
          pizzaMeshGroup.position.set(-0.9, -0.05, 0.15);
          pizzaMeshGroup.scale.set(0.92, 0.92, 0.92);
          // Angle tilted slightly forward for mouth-watering perspective
          pizzaMeshGroup.rotation.set(0.42, 0.38, -0.12);
          
          pizzaMeshGroup.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.roughness = 0.35;
              child.material.metalness = 0.05;
            }
          });

          stageGroup.add(pizzaMeshGroup);
          checkAllLoaded();
        },
        undefined,
        (err) => console.warn('Error loading pizza.glb:', err)
      );

      // Load 3D Brazilian Round Open Esfirra Model
      gltfLoader.load(
        '/models/esfirra.glb',
        (gltf) => {
          esfirraMeshGroup = gltf.scene;
          esfirraMeshGroup.position.set(0.9, -0.05, -0.1);
          esfirraMeshGroup.scale.set(0.95, 0.95, 0.95);
          // Angle tilted slightly forward displaying the juicy open filling
          esfirraMeshGroup.rotation.set(0.46, -0.32, 0.1);

          esfirraMeshGroup.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.roughness = 0.42;
              child.material.metalness = 0.04;
            }
          });

          stageGroup.add(esfirraMeshGroup);
          checkAllLoaded();
        },
        undefined,
        (err) => console.warn('Error loading esfirra.glb:', err)
      );

      // 6. 3D Floating Golden Embers
      const particleCount = 45;
      const particleGeom = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const speeds = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 4.2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 3.4 - 0.6;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
        speeds[i] = 0.007 + Math.random() * 0.014;
      }
      particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const particleMat = new THREE.PointsMaterial({
        color: 0xffd56d,
        size: 0.065,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      particles = new THREE.Points(particleGeom, particleMat);
      scene.add(particles);

      // 7. Ground Contact Soft Radial Shadows
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 128;
      const sCtx = shadowCanvas.getContext('2d');
      if (sCtx) {
        // Shadow for pizza (left)
        const rad1 = sCtx.createRadialGradient(75, 64, 0, 75, 64, 55);
        rad1.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
        rad1.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
        rad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sCtx.fillStyle = rad1;
        sCtx.fillRect(0, 0, 140, 128);

        // Shadow for esfirra (right)
        const rad2 = sCtx.createRadialGradient(180, 64, 0, 180, 64, 55);
        rad2.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
        rad2.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
        rad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sCtx.fillStyle = rad2;
        sCtx.fillRect(120, 0, 136, 128);
      }
      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.7,
        depthWrite: false
      });
      const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.2), shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(0, -1.25, 0);
      scene.add(shadowMesh);

      // 8. Interactive Drag Physics State
      let isDragging = false;
      let prevX = 0;
      let prevY = 0;
      let velX = 0;
      let velY = 0;
      let targetRotX = 0;
      let targetRotY = 0;
      let clock = new THREE.Clock();

      controlsRef.current.resetPosition = () => {
        targetRotX = 0;
        targetRotY = 0;
        velX = 0;
        velY = 0;
      };

      controlsRef.current.spin360 = () => {
        velY = 0.14;
      };

      // Pointer Event Handlers
      const onPointerDown = (e) => {
        isDragging = true;
        setIsInteracting(true);
        prevX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        prevY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
        velX = 0;
        velY = 0;
      };

      const onPointerMove = (e) => {
        const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

        // Dynamic light tracks cursor for specular shimmer on cheese
        const rect = container.getBoundingClientRect();
        const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);
        
        dynamicLight.position.x = normX * 3.2;
        dynamicLight.position.y = normY * 2.4 + 0.8;

        if (!isDragging) return;

        const deltaX = clientX - prevX;
        const deltaY = clientY - prevY;

        prevX = clientX;
        prevY = clientY;

        // Rotate Y (horizontal 360 spin) and X (vertical tilt)
        targetRotY += deltaX * 0.012;
        targetRotX += deltaY * 0.012;

        // Clamp vertical tilt so it always looks gorgeous
        targetRotX = Math.max(-0.65, Math.min(0.65, targetRotX));

        velX = deltaY * 0.005;
        velY = deltaX * 0.005;
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

        // Inertia damping and idle floating
        if (stageGroup) {
          if (!isDragging) {
            targetRotX += velX;
            targetRotY += velY;
            velX *= 0.93;
            velY *= 0.93;

            // Idle levitation
            const levitation = Math.sin(elapsedTime * 1.6) * 0.08;
            stageGroup.position.y = levitation;

            // Independent subtle secondary breathing
            if (pizzaMeshGroup) {
              pizzaMeshGroup.position.y = -0.05 + Math.sin(elapsedTime * 2.0) * 0.025;
            }
            if (esfirraMeshGroup) {
              esfirraMeshGroup.position.y = -0.05 + Math.cos(elapsedTime * 1.8) * 0.025;
            }

            // Ground shadow breathes
            shadowMesh.scale.set(1.0 - levitation * 0.3, 1.0 - levitation * 0.3, 1.0);
            shadowMat.opacity = 0.7 - levitation * 0.2;

            // Subtle continuous floating oscillation
            if (Math.abs(velY) < 0.001) {
              targetRotY += Math.sin(elapsedTime * 0.7) * 0.0012;
            }
          } else {
            stageGroup.position.y = 0.04;
          }

          // Smooth spring damping towards target rotation
          stageGroup.rotation.x += (targetRotX - stageGroup.rotation.x) * 0.12;
          stageGroup.rotation.y += (targetRotY - stageGroup.rotation.y) * 0.12;
        }

        renderer.render(scene, camera);
      };

      animate();

      // 10. Resize Handler
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
      console.warn('Three.js initialization failed:', e);
    }
  }, []);

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none">
      
      {/* 3D WebGL Canvas Stage */}
      <div 
        ref={mountRef}
        className="relative w-full max-w-[340px] sm:max-w-[440px] h-[300px] sm:h-[350px] cursor-grab active:cursor-grabbing touch-none flex items-center justify-center overflow-visible"
        title="Clique e arraste para girar a pizza e a esfirra em 3D!"
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
