import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RotateCw, Sparkles, RefreshCw, Hand, Flame } from 'lucide-react';

const HERO_TEXTURE_URL = 'https://yzeemqzxlgudynydvpof.supabase.co/storage/v1/object/public/gallery/hero_pizza_esfiha_round.webp';

export function Interactive3DFoodStage() {
  const mountRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // References to communicate between React controls and Three.js animation loop
  const controlsRef = useRef({
    resetPosition: null,
    spin360: null,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer, scene, camera, animId;
    let foodGroup, particles;
    let dynamicLight, rimLight;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 320;

    try {
      // 1. Scene & Transparent Camera setup
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 0, 5.2);

      // 2. High-performance WebGL Renderer with full Alpha transparency
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0); // 100% transparent canvas
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;

      container.appendChild(renderer.domElement);

      // 3. Gourmet Lighting Setup
      // Ambient warm base
      const ambientLight = new THREE.AmbientLight(0xfffaed, 1.4);
      scene.add(ambientLight);

      // Key light for melted cheese specular glints
      const keyLight = new THREE.DirectionalLight(0xfff3d6, 2.5);
      keyLight.position.set(2, 4, 3);
      scene.add(keyLight);

      // Interactive Dynamic Pointer Light (follows mouse/touch)
      dynamicLight = new THREE.PointLight(0xffd56d, 3.2, 12);
      dynamicLight.position.set(0, 0.5, 2.5);
      scene.add(dynamicLight);

      // Golden Rim Backlight for crispy crust halo
      rimLight = new THREE.PointLight(0xffa126, 2.8, 10);
      rimLight.position.set(-2.5, -1, -1.5);
      scene.add(rimLight);

      // 4. Main 3D Food Group
      foodGroup = new THREE.Group();
      scene.add(foodGroup);

      // 5. Texture Loading with CORS support
      const textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = 'anonymous';

      textureLoader.load(
        HERO_TEXTURE_URL,
        (foodTexture) => {
          foodTexture.colorSpace = THREE.SRGBColorSpace;
          foodTexture.generateMipmaps = true;
          foodTexture.minFilter = THREE.LinearMipmapLinearFilter;

          // Compute custom normal/roughness map dynamically for melted cheese shine
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(foodTexture.image, 0, 0, 512, 512);
            const imgData = ctx.getImageData(0, 0, 512, 512);
            const d = imgData.data;

            // Generate roughness map: bright yellow/white areas (cheese) are shiny (low roughness)
            // dark/dough areas are matte (high roughness)
            for (let i = 0; i < d.length; i += 4) {
              const r = d[i], g = d[i+1], b = d[i+2];
              const lum = (r * 0.299 + g * 0.587 + b * 0.114);
              // Cheese has high green/red and high brightness
              const isCheese = lum > 140 && r > 130 && g > 110;
              const roughness = isCheese ? 40 : 220; // 0-255
              d[i] = roughness;
              d[i+1] = roughness;
              d[i+2] = roughness;
            }
            ctx.putImageData(imgData, 0, 0);
          }

          const roughnessTexture = new THREE.CanvasTexture(canvas);
          roughnessTexture.wrapS = THREE.ClampToEdgeWrapping;
          roughnessTexture.wrapT = THREE.ClampToEdgeWrapping;

          // Material with Physical sheen and realistic reflections
          const foodMaterial = new THREE.MeshStandardMaterial({
            map: foodTexture,
            roughnessMap: roughnessTexture,
            roughness: 0.65,
            metalness: 0.08,
            transparent: true,
            alphaTest: 0.04,
            side: THREE.FrontSide
          });

          // Main Front 3D Plane
          const geom = new THREE.PlaneGeometry(3.0, 3.0, 32, 32);
          
          // Slight 3D curvature for dimensional pop
          const pos = geom.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            // subtle spherical bulge towards camera
            const dist = Math.sqrt(x * x + y * y);
            pos.setZ(i, Math.max(0, (1.8 - dist) * 0.12));
          }
          geom.computeVertexNormals();

          const frontMesh = new THREE.Mesh(geom, foodMaterial);
          foodGroup.add(frontMesh);

          // Back Layer: Baked stone-oven crust texture
          const backMaterial = new THREE.MeshStandardMaterial({
            color: 0x422a12, // Warm baked oven crust
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.95
          });
          const backMesh = new THREE.Mesh(geom.clone(), backMaterial);
          backMesh.position.z = -0.06;
          foodGroup.add(backMesh);
        },
        undefined,
        (err) => {
          console.warn('Could not load 3D texture, falling back gracefully:', err);
          setLoadError(true);
        }
      );

      // 6. 3D Floating Embers & Particle Steam Cloud
      const particleCount = 55;
      const particleGeom = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const speeds = new Float32Array(particleCount);
      const scales = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 3.8;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 3.2 - 0.8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
        speeds[i] = 0.006 + Math.random() * 0.012;
        scales[i] = 0.5 + Math.random() * 1.5;
      }

      particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // Golden glowing embers material
      const particleMaterial = new THREE.PointsMaterial({
        color: 0xffd56d,
        size: 0.07,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      particles = new THREE.Points(particleGeom, particleMaterial);
      scene.add(particles);

      // 7. Dynamic Levitation Ground Shadow
      const shadowGeom = new THREE.PlaneGeometry(2.4, 0.5);
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 128;
      shadowCanvas.height = 128;
      const sCtx = shadowCanvas.getContext('2d');
      if (sCtx) {
        const radGrad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        radGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
        radGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sCtx.fillStyle = radGrad;
        sCtx.fillRect(0, 0, 128, 128);
      }
      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.7,
        depthWrite: false
      });
      const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
      shadowMesh.position.set(0, -1.65, 0);
      scene.add(shadowMesh);

      // 8. Physics & Pointer Drag State
      let isDragging = false;
      let prevPointerX = 0;
      let prevPointerY = 0;
      let rotationVelocityX = 0;
      let rotationVelocityY = 0;
      let targetRotX = 0;
      let targetRotY = 0;
      let clock = new THREE.Clock();

      // Exposed controls for React buttons
      controlsRef.current.resetPosition = () => {
        targetRotX = 0;
        targetRotY = 0;
        rotationVelocityX = 0;
        rotationVelocityY = 0;
      };

      controlsRef.current.spin360 = () => {
        rotationVelocityY = 0.12;
      };

      // Pointer Event Handlers
      const onPointerDown = (e) => {
        isDragging = true;
        setIsInteracting(true);
        setHasInteracted(true);
        prevPointerX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        prevPointerY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
        rotationVelocityX = 0;
        rotationVelocityY = 0;
      };

      const onPointerMove = (e) => {
        const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

        // Dynamic light follows pointer in 3D
        const rect = container.getBoundingClientRect();
        const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);
        
        dynamicLight.position.x = normX * 2.5;
        dynamicLight.position.y = normY * 2.0;

        if (!isDragging) return;

        const deltaX = clientX - prevPointerX;
        const deltaY = clientY - prevPointerY;

        prevPointerX = clientX;
        prevPointerY = clientY;

        // Rotate Y (horizontal 360 spin) and X (vertical tilt)
        targetRotY += deltaX * 0.012;
        targetRotX += deltaY * 0.012;

        // Keep vertical tilt within natural appetizing angle (-45° to +45°)
        targetRotX = Math.max(-0.65, Math.min(0.65, targetRotX));

        rotationVelocityX = deltaY * 0.005;
        rotationVelocityY = deltaX * 0.005;
      };

      const onPointerUp = () => {
        isDragging = false;
        setIsInteracting(false);
      };

      // Attach pointer events to canvas container
      container.addEventListener('pointerdown', onPointerDown, { passive: true });
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { passive: true });

      // 9. Silky 60fps Animation Loop
      const animate = () => {
        animId = requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        // Particle floating steam movement
        if (particles) {
          const pPositions = particles.geometry.attributes.position.array;
          for (let i = 0; i < particleCount; i++) {
            pPositions[i * 3 + 1] += speeds[i];
            // Wobble
            pPositions[i * 3] += Math.sin(elapsedTime * 2 + i) * 0.002;
            // Reset to bottom when rising past top
            if (pPositions[i * 3 + 1] > 2.0) {
              pPositions[i * 3 + 1] = -1.6;
              pPositions[i * 3] = (Math.random() - 0.5) * 3.5;
            }
          }
          particles.geometry.attributes.position.needsUpdate = true;
        }

        // Inertia damping & rotation update
        if (!isDragging) {
          // Decaying velocity
          targetRotX += rotationVelocityX;
          targetRotY += rotationVelocityY;
          rotationVelocityX *= 0.94;
          rotationVelocityY *= 0.94;

          // Idle Levitation & Gentle ambient breath
          const levitationOffset = Math.sin(elapsedTime * 1.8) * 0.12;
          foodGroup.position.y = levitationOffset;
          
          // Shadow breathes in inverse proportion to height
          shadowMesh.scale.set(
            1.0 - levitationOffset * 0.4,
            1.0 - levitationOffset * 0.4,
            1.0
          );
          shadowMat.opacity = 0.65 - levitationOffset * 0.25;

          // Gentle continuous slow rotation when idle
          if (Math.abs(rotationVelocityY) < 0.001) {
            targetRotY += Math.sin(elapsedTime * 0.8) * 0.0012;
          }
        } else {
          // Subtle drag elevation
          foodGroup.position.y = 0.08;
        }

        // Smooth spring interpolation towards target rotation
        foodGroup.rotation.x += (targetRotX - foodGroup.rotation.x) * 0.12;
        foodGroup.rotation.y += (targetRotY - foodGroup.rotation.y) * 0.12;

        renderer.render(scene, camera);
      };

      animate();

      // 10. Responsive Resize Handler
      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };

      window.addEventListener('resize', handleResize);

      // Cleanup on unmount
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
      setLoadError(true);
    }
  }, []);

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none">
      
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={mountRef}
        className="relative w-full max-w-[340px] sm:max-w-[400px] h-[300px] sm:h-[340px] cursor-grab active:cursor-grabbing touch-none flex items-center justify-center overflow-visible"
        title="Clique e arraste para girar a esfirra e a pizza em 3D!"
      >
        {/* Glow ambient background aura in CSS behind the transparent 3D canvas */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-gold/25 via-amber-500/15 to-transparent blur-3xl animate-aura-glow pointer-events-none"></div>

        {/* Graceful Fallback if WebGL isn't supported */}
        {loadError && (
          <img
            src={HERO_TEXTURE_URL}
            alt="Esfirra Aberta e Fatia de Pizza Artesanal El Shadday"
            className="w-full max-h-[280px] object-contain animate-esfiha-float"
            style={{ mixBlendMode: 'screen' }}
          />
        )}
      </div>

      {/* Interactive Controls & 3D Feedback Pill */}
      <div className="relative z-20 -mt-2 flex flex-wrap items-center justify-center gap-2">
        
        {/* Interactive Indicator Pill */}
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
