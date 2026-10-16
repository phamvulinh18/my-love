import * as THREE from 'three';

/**
 * Multilayer 3D Starfield & Shooting Stars (Meteors)
 * Deep background celestial stars with parallax differentiation,
 * plus periodic romantic shooting stars with light trails.
 */
export class Starfield {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.shootingStars = [];
    this.createDistantStars();
    this.createShootingStars();
  }

  createDistantStars() {
    const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const count = isMobile ? 500 : 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const colorPalette = [
      new THREE.Color('#FFF5FB'), // Pearl white
      new THREE.Color('#FFB6D9'), // Soft pink
      new THREE.Color('#B69CFF'), // Lavender
      new THREE.Color('#9AD0EC'), // Subtle ice cyan for contrast
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spherical distribution
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 40.0 + Math.random() * 80.0;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      scales[i] = Math.random() * 2.5 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    this.starMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
        attribute float aScale;
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          float twinkle = sin(uTime * 2.0 + position.x * 0.1 + position.y * 0.2) * 0.4 + 0.6;
          vTwinkle = twinkle;

          gl_PointSize = aScale * twinkle * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;

          float intensity = pow(1.0 - dist * 2.0, 2.0);
          gl_FragColor = vec4(vColor, intensity * vTwinkle * 0.85);
        }
      `
    });

    this.stars = new THREE.Points(geometry, this.starMaterial);
    this.group.add(this.stars);
  }

  createShootingStars() {
    // Pool of 4 shooting stars that periodically streak across the sky
    const poolSize = 4;
    for (let i = 0; i < poolSize; i++) {
      const lineGeo = new THREE.BufferGeometry();
      const linePos = new Float32Array(6); // 2 vertices: head and tail
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));

      const lineMat = new THREE.LineBasicMaterial({
        color: 0xffb6d9,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        linewidth: 2,
      });

      const line = new THREE.Line(lineGeo, lineMat);
      this.group.add(line);

      this.shootingStars.push({
        mesh: line,
        active: false,
        timer: Math.random() * 4.0 + 2.0, // Initial delay
        start: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        speed: 25.0,
        progress: 0,
        length: 6.0,
      });
    }
  }

  spawnShootingStar(star) {
    star.active = true;
    star.progress = 0;
    star.speed = 35.0 + Math.random() * 25.0;
    star.length = 6.0 + Math.random() * 4.0;

    // Random start position in upper sky
    const theta = Math.random() * Math.PI * 2;
    const r = 25.0 + Math.random() * 15.0;
    const y = 8.0 + Math.random() * 14.0;
    star.start.set(Math.cos(theta) * r, y, Math.sin(theta) * r);

    // Direction angled downwards and across
    star.dir.set(
      (Math.random() - 0.5) * 1.5,
      -0.6 - Math.random() * 0.5,
      (Math.random() - 0.5) * 1.5
    ).normalize();
  }

  update(elapsedTime, delta) {
    if (this.starMaterial) {
      this.starMaterial.uniforms.uTime.value = elapsedTime;
    }
    this.group.rotation.y = elapsedTime * 0.005;

    // Update shooting stars
    for (let i = 0; i < this.shootingStars.length; i++) {
      const star = this.shootingStars[i];
      if (!star.active) {
        star.timer -= delta;
        if (star.timer <= 0) {
          this.spawnShootingStar(star);
        }
      } else {
        star.progress += delta * (star.speed / 15.0);

        const currentHead = star.start.clone().addScaledVector(star.dir, star.progress * 15.0);
        const currentTail = star.start.clone().addScaledVector(star.dir, Math.max(0, star.progress * 15.0 - star.length));

        const positions = star.mesh.geometry.attributes.position.array;
        positions[0] = currentTail.x;
        positions[1] = currentTail.y;
        positions[2] = currentTail.z;
        positions[3] = currentHead.x;
        positions[4] = currentHead.y;
        positions[5] = currentHead.z;
        star.mesh.geometry.attributes.position.needsUpdate = true;

        // Fade in and out
        const fade = Math.sin(Math.min(1.0, star.progress) * Math.PI);
        star.mesh.material.opacity = fade * 0.85;

        if (star.progress >= 1.0) {
          star.active = false;
          star.mesh.material.opacity = 0;
          star.timer = Math.random() * 5.0 + 3.0; // Wait before respawn
        }
      }
    }
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
