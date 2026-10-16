import * as THREE from 'three';
import gsap from 'gsap';

/**
 * StairwayPortal - Cinematic Opening Scene
 * Faithfully matches the user's reference image:
 * 1. Deep black void with a majestic rising perspective staircase.
 * 2. Pure luminous glowing doorway (ánh sáng) at the summit.
 * 3. Soft feathered volumetric aura and downward light spill.
 * 4. Interactive click trigger that flies the camera into the light to unveil the 3D Love Universe.
 */
export class StairwayPortal {
  constructor(scene, camera, onEnterCallback) {
    this.scene = scene;
    this.camera = camera;
    this.onEnterCallback = onEnterCallback;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.isEntering = false;
    this.stepCount = 34;
    this.stepDepth = 0.52;
    this.stepHeight = 0.18;
    this.stepWidth = 4.2;

    this.progress = 0.0;
    this.targetProgress = 0.0;

    this.createStaircase();
    this.createGlowingDoor();
    this.createAmbientLightBeams();
    this.createPortalHint();

    // Straight line path coordinates
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.innerWidth < window.innerHeight);
    this.startPos = isMobile ? new THREE.Vector3(0, 1.35, 7.2) : new THREE.Vector3(0, 1.15, 5.2);
    this.endPos = new THREE.Vector3(0, this.summitY + 1.45, this.summitZ - 1.2);
    this.lookTarget = new THREE.Vector3(0, this.summitY + 1.45, this.summitZ - 8.0);
    this.initialLook = new THREE.Vector3(0, 3.8, -8.0);
  }

  addProgress(delta) {
    if (this.isEntering) return;
    this.targetProgress = Math.min(1.0, Math.max(0.0, this.targetProgress + delta));
  }

  stepForward(steps = 5) {
    if (this.isEntering) return;
    const progressPerStep = 1.0 / this.stepCount;
    const increment = steps * progressPerStep; // 5 steps per tap ≈ 0.15
    const target = Math.min(1.0, this.targetProgress + increment);

    gsap.killTweensOf(this);
    gsap.to(this, {
      targetProgress: target,
      duration: 1.0,
      ease: 'power2.out',
    });
  }

  createStaircase() {
    this.stairsGroup = new THREE.Group();

    // Material with high contrast lighting matching the reference photo
    // Top surface catches light, front face is shaded
    const stepGeo = new THREE.BoxGeometry(this.stepWidth, this.stepHeight, this.stepDepth);

    const stepMat = new THREE.MeshStandardMaterial({
      color: 0xdedede,
      roughness: 0.6,
      metalness: 0.1,
      flatShading: true,
    });

    for (let i = 0; i < this.stepCount; i++) {
      const stepMesh = new THREE.Mesh(stepGeo, stepMat);
      
      // Step positions rising and receding back into the distance
      const y = i * this.stepHeight;
      const z = -i * this.stepDepth;

      stepMesh.position.set(0, y, z);
      this.stairsGroup.add(stepMesh);
    }

    this.group.add(this.stairsGroup);

    // Light casting down from the doorway onto the stairs
    const summitY = (this.stepCount - 1) * this.stepHeight;
    const summitZ = -(this.stepCount - 1) * this.stepDepth;

    const doorLight = new THREE.PointLight(0xffffff, 4.5, 25, 1.2);
    doorLight.position.set(0, summitY + 1.6, summitZ + 0.8);
    this.group.add(doorLight);
    this.doorLight = doorLight;

    const downSpot = new THREE.SpotLight(0xffffff, 6.0, 35, Math.PI * 0.28, 0.45);
    downSpot.position.set(0, summitY + 3.0, summitZ);
    downSpot.target.position.set(0, 0, 0);
    this.group.add(downSpot);
    this.group.add(downSpot.target);

    this.summitY = summitY;
    this.summitZ = summitZ;
  }

  createGlowingDoor() {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, this.summitY + 1.45, this.summitZ - 0.2);

    // 1. Solid pure white glowing door panel (rectangle aspect ~ 1 : 2.1)
    const doorWidth = 1.35;
    const doorHeight = 2.7;
    const doorGeo = new THREE.PlaneGeometry(doorWidth, doorHeight);
    
    this.doorMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });

    this.doorMesh = new THREE.Mesh(doorGeo, this.doorMat);
    doorGroup.add(this.doorMesh);

    // 2. Feathered soft ethereal halo around the doorway
    const haloGeo = new THREE.PlaneGeometry(doorWidth * 6.0, doorHeight * 3.8);

    // Procedural soft halo radial gradient texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.65)');
    grad.addColorStop(0.60, 'rgba(255, 220, 240, 0.22)');
    grad.addColorStop(0.85, 'rgba(255, 182, 217, 0.08)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const haloTexture = new THREE.CanvasTexture(canvas);
    this.haloMat = new THREE.MeshBasicMaterial({
      map: haloTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.haloMesh = new THREE.Mesh(haloGeo, this.haloMat);
    this.haloMesh.position.z = 0.02;
    doorGroup.add(this.haloMesh);

    // 3. Interactive click target for the glowing doorway
    const hitGeo = new THREE.PlaneGeometry(doorWidth * 3.5, doorHeight * 2.0);
    const hitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    this.hitMesh = new THREE.Mesh(hitGeo, hitMat);
    this.hitMesh.position.z = 0.1;
    doorGroup.add(this.hitMesh);

    this.group.add(doorGroup);
    this.doorGroup = doorGroup;
  }

  createAmbientLightBeams() {
    // Soft floating dust motes dancing in the shaft of light
    const dustCount = 80;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(dustCount * 3);
    const phases = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      const progress = Math.random();
      positions[i3] = (Math.random() - 0.5) * (1.2 + progress * 3.0);
      positions[i3 + 1] = progress * this.summitY + (Math.random() - 0.5) * 1.5;
      positions[i3 + 2] = -progress * Math.abs(this.summitZ) + (Math.random() - 0.5) * 2.0;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this.dustMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
        attribute float aPhase;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.8 + aPhase) * 0.15;
          pos.x += cos(uTime * 0.6 + aPhase) * 0.12;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = 18.0 / -mvPosition.z;

          float twinkle = sin(uTime * 2.5 + aPhase) * 0.35 + 0.65;
          vAlpha = twinkle * 0.75;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          float s = pow(1.0 - dist * 2.0, 1.6);
          gl_FragColor = vec4(1.0, 0.96, 0.98, s * vAlpha);
        }
      `
    });

    this.dustPoints = new THREE.Points(geometry, this.dustMat);
    this.group.add(this.dustPoints);
  }

  createPortalHint() {
    // Subtle pulsating hint text in DOM
    const hint = document.createElement('div');
    hint.id = 'portal-hint';
    hint.innerHTML = `
      <div class="portal-text">✦ Chạm vào bậc thang để tiến tới nào baby ✦</div>
      <div class="portal-sub">Từng bước chân sẽ đưa chúng mình tiến vào vũ trụ tình yêu</div>
    `;
    hint.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.stepForward(5);
    });
    hint.addEventListener('click', (e) => {
      e.stopPropagation();
      this.stepForward(5);
    });
    document.body.appendChild(hint);
    this.hintElement = hint;
  }

  getInitialCameraPosition() {
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.innerWidth < window.innerHeight);
    return {
      pos: isMobile ? new THREE.Vector3(0, 1.35, 7.2) : new THREE.Vector3(0, 1.15, 5.2),
      target: new THREE.Vector3(0, 3.8, -8.0)
    };
  }

  triggerEnter() {
    if (this.isEntering) return;
    this.isEntering = true;

    // Fade out hint text
    if (this.hintElement) {
      this.hintElement.style.opacity = '0';
      this.hintElement.style.pointerEvents = 'none';
      setTimeout(() => {
        if (this.hintElement && this.hintElement.parentNode) {
          this.hintElement.parentNode.removeChild(this.hintElement);
        }
      }, 1000);
    }

    // Create natural optical lens bloom overlay with rotating god rays
    const flash = document.createElement('div');
    flash.id = 'portal-flash-overlay';
    flash.innerHTML = `<div class="light-ray-burst"></div>`;
    document.body.appendChild(flash);

    // Final smooth burst into the glowing doorway
    const targetZ = this.summitZ - 1.2;
    const targetY = this.summitY + 1.45;

    // 1. Camera glides straight through the door
    gsap.to(this.camera.position, {
      x: 0,
      y: targetY,
      z: targetZ,
      duration: 1.8,
      ease: 'power2.in',
      onUpdate: () => {
        this.camera.lookAt(0, targetY, this.summitZ - 8.0);
      }
    });

    // 2. Swell the physical 3D light intensity inside the scene
    if (this.doorLight) {
      gsap.to(this.doorLight, {
        intensity: 22.0,
        duration: 1.8,
        ease: 'sine.in'
      });
    }

    // 3. Door halo blooms to fill the screen
    if (this.haloMesh) {
      gsap.to(this.haloMesh.scale, {
        x: 18.0,
        y: 18.0,
        duration: 1.8,
        ease: 'sine.in'
      });
    }

    // 4. Natural optical bloom swells smoothly (sine curve, no harsh flash)
    gsap.to(flash, {
      opacity: 1.0,
      duration: 1.1,
      delay: 0.7,
      ease: 'sine.in',
      onComplete: () => {
        // Hide staircase portal
        this.group.visible = false;

        // Callback to main to reveal 3D Love Universe & play music
        if (this.onEnterCallback) {
          this.onEnterCallback();
        }

        // Dissolve the natural light bloom gently like morning sunlight breaking through
        gsap.to(flash, {
          opacity: 0,
          duration: 2.2,
          ease: 'power2.out',
          onComplete: () => {
            if (flash.parentNode) flash.parentNode.removeChild(flash);
            this.dispose();
          }
        });
      }
    });
  }

  update(elapsedTime) {
    if (this.dustMat && this.dustMat.uniforms) {
      this.dustMat.uniforms.uTime.value = elapsedTime;
    }

    if (!this.isEntering) {
      // Smooth physical interpolation along the single straight line
      this.progress += (this.targetProgress - this.progress) * 0.12;

      // Single straight forward direction towards the glowing doorway
      this.camera.position.lerpVectors(this.startPos, this.endPos, this.progress);

      // Keep camera oriented strictly straight ahead towards the doorway center
      const currentLook = new THREE.Vector3();
      currentLook.lerpVectors(this.initialLook, this.lookTarget, this.progress);
      this.camera.lookAt(currentLook);

      // Door halo naturally grows as you walk closer
      if (this.haloMesh) {
        const doorScale = 1.0 + this.progress * 4.0;
        this.haloMesh.scale.set(doorScale, doorScale, doorScale);
      }

      // When walked straight through the door, enter the universe!
      if (this.progress >= 0.94) {
        this.triggerEnter();
      }
    }
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
