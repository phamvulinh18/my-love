import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Spiral 3D Galaxy with custom soft particle shaders.
 * Features 14,500 glowing stardust particles rotating in cosmic harmony.
 * Optimized for rock-solid 60 FPS on any device while looking lush and brilliant.
 */
export class Galaxy {
  constructor(scene) {
    this.scene = scene;

    const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Dense visual appeal with zero GPU lag
    this.parameters = {
      count: isMobile ? 7500 : 14500,
      radius: 12,
      branches: 4,
      spin: 1.2,
      randomness: 0.55,
      power: 3.5,
      insideColor: '#FFF5FB',   // Pearl White core
      midColor: '#FF4FA3',      // Neon/Vibrant Pink
      outsideColor: '#B69CFF',  // Lavender space edge
    };

    this.geometry = null;
    this.material = null;
    this.points = null;

    this.createGalaxy();
  }

  createGalaxy() {
    this.geometry = new THREE.BufferGeometry();

    const count = this.parameters.count;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomness = new Float32Array(count * 3);

    const colorInside = new THREE.Color(this.parameters.insideColor);
    const colorMid = new THREE.Color(this.parameters.midColor);
    const colorOutside = new THREE.Color(this.parameters.outsideColor);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = Math.random() * this.parameters.radius;
      const spinAngle = radius * this.parameters.spin;
      const branchAngle = ((i % this.parameters.branches) / this.parameters.branches) * Math.PI * 2;

      const randomX = Math.pow(Math.random(), this.parameters.power) * (Math.random() < 0.5 ? 1 : -1) * this.parameters.randomness * radius;
      const randomY = Math.pow(Math.random(), this.parameters.power) * (Math.random() < 0.5 ? 1 : -1) * this.parameters.randomness * (radius * 0.45);
      const randomZ = Math.pow(Math.random(), this.parameters.power) * (Math.random() < 0.5 ? 1 : -1) * this.parameters.randomness * radius;

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      positions[i3 + 1] = randomY;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      randomness[i3] = Math.random();
      randomness[i3 + 1] = Math.random();
      randomness[i3 + 2] = Math.random();

      const mixedColor = colorInside.clone();
      const ratio = radius / this.parameters.radius;
      if (ratio < 0.35) {
        mixedColor.lerp(colorMid, ratio / 0.35);
      } else {
        mixedColor.copy(colorMid).lerp(colorOutside, (ratio - 0.35) / 0.65);
      }

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      scales[i] = Math.random() * 0.85 + 0.45;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    this.geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));

    // Optical bloom built directly into shader
    this.material = new THREE.ShaderMaterial({
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uWaveRadius: { value: -10.0 },
        uWaveStrength: { value: 0.0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uWaveRadius;
        uniform float uWaveStrength;

        attribute float aScale;
        attribute vec3 aRandomness;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);

          float angle = atan(modelPosition.x, modelPosition.z);
          float distanceToCenter = length(modelPosition.xz);
          float offsetAngle = (1.0 / (distanceToCenter + 0.1)) * uTime * 0.12;
          modelPosition.x = cos(angle + offsetAngle) * distanceToCenter;
          modelPosition.z = sin(angle + offsetAngle) * distanceToCenter;

          modelPosition.y += sin(uTime * 0.7 + aRandomness.x * 6.28) * (0.04 + distanceToCenter * 0.01);

          // Gentle gravitational shockwave ripple
          if (uWaveStrength > 0.001) {
            float distToCore = length(modelPosition.xyz);
            float waveDiff = distToCore - uWaveRadius;
            float waveExp = exp(-waveDiff * waveDiff * 0.85) * uWaveStrength;
            modelPosition.xyz += normalize(modelPosition.xyz + vec3(0.001)) * waveExp * 0.45;
            modelPosition.y += sin(waveDiff * 3.14159) * waveExp * 0.25;
          }

          vec4 viewPosition = viewMatrix * modelPosition;
          gl_Position = projectionMatrix * viewPosition;

          float twinkle = sin(uTime * 2.2 + aRandomness.y * 30.0) * 0.28 + 0.72;
          gl_PointSize = (72.0 * aScale * twinkle) / -viewPosition.z;

          vColor = color;
          vAlpha = twinkle;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;

          // Radiant dual-ring optical glow profile
          float softHalo = pow(1.0 - dist * 2.0, 1.8);
          float hotCore = pow(max(0.0, 1.0 - dist * 3.0), 2.8);
          vec3 finalColor = vColor * (softHalo * 1.5) + vec3(hotCore * 2.2);

          gl_FragColor = vec4(finalColor * 1.3, min(1.0, softHalo * vAlpha * 1.1));
        }
      `
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  triggerShockwave() {
    gsap.killTweensOf(this.material.uniforms.uWaveRadius);
    gsap.killTweensOf(this.material.uniforms.uWaveStrength);

    this.material.uniforms.uWaveRadius.value = 0.0;
    this.material.uniforms.uWaveStrength.value = 0.45; // Gentle wave amplitude

    gsap.to(this.material.uniforms.uWaveRadius, {
      value: 12.0,
      duration: 3.0,
      ease: 'sine.out',
    });

    gsap.to(this.material.uniforms.uWaveStrength, {
      value: 0.0,
      duration: 3.0,
      ease: 'sine.inOut',
    });
  }

  update(elapsedTime) {
    if (this.material) {
      this.material.uniforms.uTime.value = elapsedTime;
    }
    if (this.points) {
      this.points.rotation.y = elapsedTime * 0.02;
    }
  }

  dispose() {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.points) this.scene.remove(this.points);
  }
}
