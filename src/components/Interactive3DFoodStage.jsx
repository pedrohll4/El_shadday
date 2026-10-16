import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, RefreshCw, Hand, Flame, Sparkles } from 'lucide-react';

const COLOR_TEXTURE_URL = 'https://yzeemqzxlgudynydvpof.supabase.co/storage/v1/object/public/gallery/hero_pizza_esfiha_round.webp';
const DEPTH_MAP_URL = 'https://yzeemqzxlgudynydvpof.supabase.co/storage/v1/object/public/gallery/hero_depth_map.webp';

export function Interactive3DFoodStage() {
  const mountRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const controlsRef = useRef({
    resetPosition: null,
    spin360: null,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer, scene, camera, animId;
    let foodMesh, particles;
    let dynamicLight, rimLight;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 340;

    try {
      // 1. Scene & Camera Setup
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 0, 4.8);
      camera.lookAt(0, 0, 0);

      // 2. High-Performance WebGL Renderer with Alpha Transparency (No background box!)
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0); // 100% transparent
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;

      container.appendChild(renderer.domElement);

      // 3. Cinematic Gourmet Lighting
      const ambientLight = new THREE.AmbientLight(0xfffaed, 1.8);
      scene.add(ambientLight);

      // Directional light highlighting the 3D relief of the cheese and crust
      const keyLight = new THREE.DirectionalLight(0xfff3d6, 2.6);
      keyLight.position.set(2.5, 4.0, 3.5);
      scene.add(keyLight);

      // Dynamic Interactive Pointer Light (follows mouse cursor in 3D)
      dynamicLight = new THREE.PointLight(0xffd56d, 3.8, 12);
      dynamicLight.position.set(0, 0.5, 2.5);
      scene.add(dynamicLight);

      // Golden Rim Backlight for warm crust edge halo
      rimLight = new THREE.PointLight(0xffa126, 2.2, 10);
      rimLight.position.set(-2.0, -1.0, 1.5);
      scene.add(rimLight);

      // 4. Load Photorealistic Textures & Real 3D Displacement
      const textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = 'anonymous';

      textureLoader.load(COLOR_TEXTURE_URL, (colorTex) => {
        colorTex.colorSpace = THREE.SRGBColorSpace;
        colorTex.generateMipmaps = true;

        textureLoader.load(DEPTH_MAP_URL, (depthTex) => {
          depthTex.generateMipmaps = true;

          // 3D Displaced Mesh: 120x120 vertices creating real 3D volume, crust relief, and cheese height
          const geometry = new THREE.PlaneGeometry(3.3, 3.3, 120, 120);

          const material = new THREE.MeshStandardMaterial({
            map: colorTex,
            displacementMap: depthTex,
            displacementScale: 0.38, // Real physical 3D pop
            displacementBias: -0.04,
            roughness: 0.35, // Glossy melted cheese
            metalness: 0.04,
            transparent: true,
            alphaTest: 0.05,
            side: THREE.DoubleSide
          });

          foodMesh = new THREE.Mesh(geometry, material);
          foodMesh.position.set(0, 0, 0);
          scene.add(foodMesh);
        });
      });

      // 5. 3D Floating Golden Embers & Savory Steam
      const particleCount = 50;
      const particleGeom = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const speeds = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 3.8;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 3.2 - 0.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
        speeds[i] = 0.006 + Math.random() * 0.012;
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

      // 6. Soft Radial Ground Shadow Plane
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 128;
      shadowCanvas.height = 128;
      const sCtx = shadowCanvas.getContext('2d');
      if (sCtx) {
        const radGrad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        radGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
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
      const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.8), shadowMat);
      shadowMesh.position.set(0, -1.6, 0);
      scene.add(shadowMesh);

      // 7. Interactive Physics & Pointer Drag State
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
        velY = 0.12;
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

        // Dynamic light tracks cursor for specular shimmer
        const rect = container.getBoundingClientRect();
        const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);
        
        dynamicLight.position.x = normX * 2.8;
        dynamicLight.position.y = normY * 2.2 + 0.5;

        if (!isDragging) return;

        const deltaX = clientX - prevX;
        const deltaY = clientY - prevY;

        prevX = clientX;
        prevY = clientY;

        // Rotate Y (horizontal) and X (vertical tilt)
        targetRotY += deltaX * 0.01;
        targetRotX += deltaY * 0.01;

        // Clamp rotation so the food remains gorgeous and in perspective
        targetRotX = Math.max(-0.55, Math.min(0.55, targetRotX));
        targetRotY = Math.max(-0.95, Math.min(0.95, targetRotY));

        velX = deltaY * 0.004;
        velY = deltaX * 0.004;
      };

      const onPointerUp = () => {
        isDragging = false;
        setIsInteracting(false);
      };

      container.addEventListener('pointerdown', onPointerDown, { passive: true });
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { passive: true });

      // 8. Animation Loop
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // 3D Embers movement
        if (particles) {
          const pPositions = particles.geometry.attributes.position.array;
          for (let i = 0; i < particleCount; i++) {
            pPositions[i * 3 + 1] += speeds[i];
            pPositions[i * 3] += Math.sin(elapsedTime * 2 + i) * 0.002;
            if (pPositions[i * 3 + 1] > 2.0) {
              pPositions[i * 3 + 1] = -1.6;
              pPositions[i * 3] = (Math.random() - 0.5) * 3.6;
            }
          }
          particles.geometry.attributes.position.needsUpdate = true;
        }

        // Inertia damping and idle floating
        if (foodMesh) {
          if (!isDragging) {
            targetRotX += velX;
            targetRotY += velY;
            velX *= 0.94;
            velY *= 0.94;

            // Idle levitation
            const levitation = Math.sin(elapsedTime * 1.8) * 0.1;
            foodMesh.position.y = levitation;

            // Ground shadow breathes
            shadowMesh.scale.set(1.0 - levitation * 0.35, 1.0 - levitation * 0.35, 1.0);
            shadowMat.opacity = 0.65 - levitation * 0.2;

            // Subtle continuous floating oscillation
            if (Math.abs(velY) < 0.001) {
              targetRotY += Math.sin(elapsedTime * 0.8) * 0.0015;
            }
          } else {
            foodMesh.position.y = 0.06;
          }

          // Smooth spring damping towards target rotation
          foodMesh.rotation.x += (targetRotX - foodMesh.rotation.x) * 0.12;
          foodMesh.rotation.y += (targetRotY - foodMesh.rotation.y) * 0.12;
        }

        renderer.render(scene, camera);
      };

      animate();

      // 9. Resize Handler
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
        className="relative w-full max-w-[340px] sm:max-w-[420px] h-[300px] sm:h-[350px] cursor-grab active:cursor-grabbing touch-none flex items-center justify-center overflow-visible"
        title="Clique e arraste para girar e interagir em 3D!"
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
            Interativo 3D • Na Hora
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
          <span>{isInteracting ? 'Girando em 3D!' : 'Arraste para girar em 3D'}</span>
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
