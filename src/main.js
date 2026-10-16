import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

import { Galaxy } from './modules/Galaxy.js';
import { Heart } from './modules/Heart.js';
import { SpaceNebula } from './modules/SpaceNebula.js';
import { Starfield } from './modules/Starfield.js';
import { PostProcessing } from './modules/PostProcessing.js';
import { SoundController } from './modules/Sound.js';
import { StairwayPortal } from './modules/StairwayPortal.js';
import { PhotoParticles } from './modules/PhotoParticles.js';

class LoveUniverseApp {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.floatingContainer = document.getElementById('floating-hearts-container');
    this.heroContent = document.getElementById('hero-content');
    this.soundBtn = document.getElementById('sound-btn');
    this.bloomBtn = document.getElementById('bloom-btn');
    this.bloomLabel = document.getElementById('bloom-label');
    this.resetBtn = document.getElementById('camera-reset-btn');
    this.enterBtn = document.getElementById('enter-universe-btn');
    this.morphBtn = document.getElementById('morph-btn');
    this.morphLabel = document.getElementById('morph-label');

    this.sound = new SoundController();

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Mouse coordinates for parallax
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.raycaster = new THREE.Raycaster();
    this.mouseVector = new THREE.Vector2();

    this.initThree();
    this.initModules();
    this.initEvents();

    this.animate();
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0c0818, 0.015);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 300);
    // Start far out for cinematic fly-in
    this.camera.position.set(0, 12, 22);

    // 3. WebGL Renderer
    const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const maxDpr = isMobile ? 1.25 : 1.75;

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isMobile, // Disable hardware AA on mobile when bloom is active for huge FPS gain
      alpha: false,
      stencil: false,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls with restricted angles for preserved cinematic composition
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.045;
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 28.0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.15; // Don't flip under
    this.controls.minPolarAngle = 0.2;
    this.controls.enablePan = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.35;

    // 5. Ambient & Directional Lighting for Ruby Glass Material
    const ambientLight = new THREE.AmbientLight(0xffb6d9, 1.2);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(5, 10, 7);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xb69cff, 1.8);
    dirLight2.position.set(-6, -4, -6);
    this.scene.add(dirLight2);

    // 6. Post Processing Pipeline
    this.postProcessing = new PostProcessing(
      this.renderer,
      this.scene,
      this.camera,
      this.width,
      this.height
    );

    // Clock for delta timing
    this.clock = new THREE.Clock();
  }

  initModules() {
    // 1. Group for 3D Love Universe content (hidden during opening staircase)
    this.universeGroup = new THREE.Group();
    this.scene.add(this.universeGroup);

    this.galaxy = new Galaxy(this.universeGroup);
    this.heart = new Heart(this.universeGroup, this.camera, this.galaxy);
    this.photoParticles = new PhotoParticles(this.universeGroup, this.camera);
    this.nebula = new SpaceNebula(this.universeGroup);
    this.starfield = new Starfield(this.universeGroup);

    this.universeGroup.visible = false;
    this.isPortalOpen = false;

    // 2. Stairway Portal (3D staircase leading to glowing doorway)
    this.portal = new StairwayPortal(this.scene, this.camera, () => {
      this.onUniverseEntered();
    });

    // Initial stance at foot of stairs
    const start = this.portal.getInitialCameraPosition();
    this.camera.position.copy(start.pos);
    this.controls.target.copy(start.target);
    this.camera.lookAt(start.target);
    this.controls.enabled = false; // Strictly locked on 1 straight forward direction up the stairs!
  }

  onUniverseEntered() {
    this.isPortalOpen = true;
    this.universeGroup.visible = true;
    this.controls.enabled = true;
    this.scene.fog = new THREE.FogExp2(0x0c0818, 0.015);

    // 1. Immediately position camera far away in deep space to gaze at the entire vast galaxy panorama first
    const isMobile = window.innerWidth < 768 || window.innerWidth < window.innerHeight;
    const farZ = isMobile ? 24.0 : 22.0;
    const farY = isMobile ? 12.0 : 10.0;

    this.camera.position.set(0, farY, farZ);
    this.controls.target.set(0, 0.35, 0);
    this.camera.lookAt(0, 0.35, 0);
    this.controls.update();

    // 2. Auto-play music on user interaction
    if (!this.sound.isPlaying) {
      const active = this.sound.toggle();
      if (this.soundBtn) this.soundBtn.classList.toggle('active', active);
    }

    // 4. Majestic, slow cinematic flight from far cosmic distance inward toward the celestial heart
    this.playCinematicIntro();
  }

  playCinematicIntro() {
    const isMobile = window.innerWidth < 768 || window.innerWidth < window.innerHeight;
    const targetZ = isMobile ? 9.8 : 6.8;
    const targetY = isMobile ? 1.25 : 1.8;

    // Smooth, majestic cosmic fly-in from far away in deep space gradually into intimate view
    gsap.killTweensOf(this.camera.position);
    gsap.to(this.camera.position, {
      x: 0,
      y: targetY,
      z: targetZ,
      duration: 5.5,
      delay: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        this.controls.target.set(0, 0.35, 0);
      }
    });
  }

  initEvents() {
    // Window Resize
    window.addEventListener('resize', () => this.onWindowResize(), false);

    // Mouse Movement for Smooth Parallax & Text Hover Reaction
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / this.width - 0.5) * 2;
      this.mouse.targetY = (e.clientY / this.height - 0.5) * 2;
      this.checkTextHover(e.clientX, e.clientY);
    });

    // Wheel scroll for manual forward locomotion along the stairs in one straight direction
    window.addEventListener('wheel', (e) => {
      if (!this.isPortalOpen && this.portal) {
        const delta = Math.abs(e.deltaY) * 0.0014;
        this.portal.addProgress(delta);
      }
    }, { passive: true });

    // Touch Support & Swipe up for manual forward locomotion on mobile
    let touchStartY = null;
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        if (!this.isPortalOpen && this.portal && touchStartY !== null) {
          const dy = touchStartY - e.touches[0].clientY;
          if (Math.abs(dy) > 2) {
            this.portal.addProgress(Math.abs(dy) * 0.004);
            touchStartY = e.touches[0].clientY;
          }
        }
        this.mouse.targetX = (e.touches[0].clientX / this.width - 0.5) * 2;
        this.mouse.targetY = (e.touches[0].clientY / this.height - 0.5) * 2;
        this.checkTextHover(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    // Keyboard keys (W, ArrowUp, Space) for manual walking forward
    window.addEventListener('keydown', (e) => {
      if (!this.isPortalOpen && this.portal) {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
          this.portal.addProgress(0.08);
        }
      }
    });

    // Click / Tap interactions
    window.addEventListener('pointerdown', (e) => this.onPointerDown(e), false);

    // Button: Enter Universe
    if (this.enterBtn) {
      this.enterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.enterUniverse();
      });
    }

    // Button: Reset Camera
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetCamera();
      });
    }

    // Button: Sound
    if (this.soundBtn) {
      this.soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const active = this.sound.toggle();
        this.soundBtn.classList.toggle('active', active);
      });
    }

    // Button: Bloom Toggle
    if (this.bloomBtn) {
      this.bloomBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isBloomOn = this.postProcessing.toggle();
        this.bloomBtn.classList.toggle('active', isBloomOn);
        if (this.bloomLabel) {
          this.bloomLabel.textContent = isBloomOn ? 'Bloom: Bật' : 'Glow: 60 FPS';
        }
      });
    }
  }

  enterUniverse() {
    // Minimize center UI to let the 3D spectacle breathe
    if (this.heroContent) {
      this.heroContent.classList.toggle('minimized');
    }

    // Smooth camera swoop into close-up orbit
    gsap.to(this.camera.position, {
      x: 2.5,
      y: 1.5,
      z: 5.2,
      duration: 2.2,
      ease: 'power2.inOut',
      onUpdate: () => this.controls.target.set(0, 0, 0)
    });

    // Start sound if not yet playing
    if (!this.sound.isPlaying) {
      const active = this.sound.toggle();
      if (this.soundBtn) this.soundBtn.classList.toggle('active', active);
    }

    this.heart.triggerClickEffect();
  }

  resetCamera() {
    gsap.to(this.camera.position, {
      x: 0,
      y: 2.8,
      z: 7.8,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => this.controls.target.set(0, 0, 0)
    });
  }

  checkTextHover(clientX, clientY) {
    this.mouseVector.x = (clientX / this.width) * 2 - 1;
    this.mouseVector.y = -(clientY / this.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouseVector, this.camera);

    let isPointer = false;

    // Check hover on photo particles
    if (this.photoParticles && this.photoParticles.checkHover(this.raycaster)) {
      isPointer = true;
    }

    if (this.heart && this.heart.textHitMesh) {
      const intersects = this.raycaster.intersectObject(this.heart.textHitMesh, false);
      if (intersects.length > 0) {
        const localPoint = this.heart.group.worldToLocal(intersects[0].point.clone());
        this.heart.setTextHover(true, localPoint);
        isPointer = true;
      } else {
        this.heart.setTextHover(false);
      }
    }

    document.body.style.cursor = isPointer ? 'pointer' : 'default';
  }

  onPointerDown(event) {
    // If opening portal scene is active, clicking or tapping climbs up 5 steps smoothly!
    if (!this.isPortalOpen) {
      if (this.portal) {
        this.portal.stepForward(5);
      }
      return;
    }

    // Ignore UI button clicks
    if (event.target.closest('#ui-layer button')) return;

    this.mouseVector.x = (event.clientX / this.width) * 2 - 1;
    this.mouseVector.y = -(event.clientY / this.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVector, this.camera);

    // 0. Check if clicking floating photo particles
    if (this.photoParticles && this.photoParticles.checkClick(this.raycaster)) {
      this.sound.playSparkleChime();
      return;
    }

    // 1. Check if clicking the stardust text directly
    if (this.heart.textHitMesh) {
      const textIntersects = this.raycaster.intersectObject(this.heart.textHitMesh, false);
      if (textIntersects.length > 0) {
        const localPoint = this.heart.group.worldToLocal(textIntersects[0].point.clone());
        this.heart.triggerTextClick(localPoint);
        this.sound.playSparkleChime();
        return;
      }
    }

    // 2. Check if clicking the celestial heart
    const targets = [];
    if (this.heart.hitMesh) targets.push(this.heart.hitMesh);
    if (this.heart.heartMesh) targets.push(this.heart.heartMesh);
    if (this.heart.heartPoints) targets.push(this.heart.heartPoints);

    const intersects = this.raycaster.intersectObjects(targets, true);
    const distToCenter = Math.hypot(this.mouseVector.x, this.mouseVector.y);

    if (intersects.length > 0 || distToCenter < 0.45) {
      // Direct heart click: triggers gentle 3D waves, stardust love wishes morphing & audio chimes
      this.heart.triggerClickEffect();
      this.sound.playHeartbeat();
      this.sound.playSparkleChime();
    } else {
      // Space sparkle chime
      this.sound.playSparkleChime();
    }
  }

  onWindowResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    const isMobile = this.width < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const maxDpr = isMobile ? 1.25 : 1.75;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));

    this.postProcessing.setSize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Smooth Mouse Parallax Damping
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Apply subtle parallax offset to camera group
    if (!this.controls.state || this.controls.state === -1) {
      this.scene.position.x = this.mouse.x * 0.25;
      this.scene.position.y = -this.mouse.y * 0.25;
    }

    // 2. Update OrbitControls if enabled
    if (this.controls.enabled) {
      this.controls.update();
    }

    // 3. Update 3D Modules
    if (!this.isPortalOpen) {
      if (this.portal) {
        this.portal.update(elapsedTime);
      }
    } else {
      this.galaxy.update(elapsedTime, delta);
      this.heart.update(elapsedTime, delta);
      if (this.photoParticles) this.photoParticles.update(elapsedTime, delta);
      this.nebula.update(elapsedTime);
      this.starfield.update(elapsedTime, delta);
    }

    // 4. Render with Post-Processing
    this.postProcessing.render();
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new LoveUniverseApp();
});
