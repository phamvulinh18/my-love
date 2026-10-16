import * as THREE from 'three';

/**
 * Procedural Cosmic Nebulae and Volumetric Space Dust
 * Generates soft ethereal gas clouds in pink, violet, and deep cosmic magenta.
 */
export class SpaceNebula {
  constructor(scene) {
    this.scene = scene;
    this.nebulaGroup = new THREE.Group();
    this.scene.add(this.nebulaGroup);

    this.cloudSprites = [];
    this.dustParticles = null;

    this.createProceduralCloudTexture();
    this.createNebulaClouds();
    this.createFloatingDust();
  }

  createProceduralCloudTexture() {
    // Generate soft radial puff texture dynamically using HTML5 Canvas (no external assets needed)
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.2, 'rgba(255, 182, 217, 0.6)');
    grad.addColorStop(0.5, 'rgba(182, 156, 255, 0.25)');
    grad.addColorStop(0.8, 'rgba(23, 16, 47, 0.08)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    this.cloudTexture = new THREE.CanvasTexture(canvas);
  }

  createNebulaClouds() {
    const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const cloudCount = isMobile ? 3 : 5;

    const colors = [
      new THREE.Color('#FF4FA3'),
      new THREE.Color('#B69CFF'),
      new THREE.Color('#FFB6D9'),
    ];

    for (let i = 0; i < cloudCount; i++) {
      const material = new THREE.SpriteMaterial({
        map: this.cloudTexture,
        color: colors[i % colors.length],
        transparent: true,
        opacity: isMobile ? 0.10 : 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const sprite = new THREE.Sprite(material);

      // Distribute in a spherical halo around the galaxy
      const radius = 6.0 + Math.random() * 10.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.6;

      sprite.position.set(
        Math.cos(theta) * Math.cos(phi) * radius,
        Math.sin(phi) * radius * 0.45,
        Math.sin(theta) * Math.cos(phi) * radius
      );

      const scale = 5.0 + Math.random() * 9.0;
      sprite.scale.set(scale, scale, 1);

      sprite.userData = {
        baseOpacity: material.opacity,
        driftSpeed: 0.0003 + Math.random() * 0.0005,
        rotSpeed: (Math.random() - 0.5) * 0.001,
        initialY: sprite.position.y
      };

      this.cloudSprites.push(sprite);
      this.nebulaGroup.add(sprite);
    }
  }

  createFloatingDust() {
    const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const count = isMobile ? 120 : 250;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const c1 = new THREE.Color('#FFF5FB');
    const c2 = new THREE.Color('#FFB6D9');

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 26;
      positions[i3 + 1] = (Math.random() - 0.5) * 12;
      positions[i3 + 2] = (Math.random() - 0.5) * 26;

      const col = Math.random() > 0.4 ? c1 : c2;
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.nebulaGroup.add(this.dustParticles);
  }

  update(elapsedTime) {
    // Rotate and pulse clouds
    for (let i = 0; i < this.cloudSprites.length; i++) {
      const sprite = this.cloudSprites[i];
      sprite.material.opacity = sprite.userData.baseOpacity + Math.sin(elapsedTime * 0.6 + i) * 0.03;
      sprite.position.y = sprite.userData.initialY + Math.sin(elapsedTime * 0.4 + i * 0.5) * 0.25;
    }

    // Slowly swirl nebula group
    this.nebulaGroup.rotation.y = elapsedTime * 0.012;

    // Dust float
    if (this.dustParticles) {
      this.dustParticles.rotation.y = -elapsedTime * 0.008;
    }
  }

  dispose() {
    this.scene.remove(this.nebulaGroup);
    if (this.cloudTexture) this.cloudTexture.dispose();
  }
}
