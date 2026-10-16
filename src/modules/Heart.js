import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Saturn-Ring Celestial Glow Heart & 4-Point Diamond Sparkles
 * Faithfully matches the user's reference image:
 * 1. Soft ethereal luminous heart with feathered celestial glow.
 * 2. Crisp, elegant tilted planetary ring encircling the heart's equator.
 * 3. Iconic 4-point diamond sparkle stars twinkling at fixed celestial coordinates.
 * 4. Silky-smooth 60 FPS performance with zero lag.
 */
export class Heart {
  constructor(scene, camera, galaxy = null) {
    this.scene = scene;
    this.camera = camera;
    this.galaxy = galaxy;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.pulseTime = 0;
    this.baseScale = 1.0;

    this.createGlowHeart();
    this.createSaturnRing();
    this.createDiamondSparkles();
    this.createTwinklingPinkMotes();
    this.createTextConstellation();
    this.createBurstSystem();
    this.createInteractionHitTarget();
  }

  createGlowHeart() {
    // Elegant organic 2D heart shape extruded and beveled with soft curvature
    const shape = new THREE.Shape();
    const x = 0, y = 0;

    shape.moveTo(x, y + 0.65);
    shape.bezierCurveTo(x - 0.1, y + 1.1, x - 1.25, y + 1.45, x - 1.4, y + 0.55);
    shape.bezierCurveTo(x - 1.45, y - 0.25, x - 0.7, y - 0.85, x, y - 1.45);
    shape.bezierCurveTo(x + 0.7, y - 0.85, x + 1.45, y - 0.25, x + 1.4, y + 0.55);
    shape.bezierCurveTo(x + 1.25, y + 1.45, x + 0.1, y + 1.1, x, y + 0.65);

    const extrudeSettings = {
      depth: 0.45,
      bevelEnabled: true,
      bevelSegments: 16,
      steps: 2,
      bevelSize: 0.35,
      bevelThickness: 0.35,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // Custom shader for dreamy, feathered celestial glow in gorgeous romantic pinks
    this.heartMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uCoreColor: { value: new THREE.Color('#FFFFFF') },    // Diamond white shine
        uGlowColor: { value: new THREE.Color('#FF4FA3') },    // Vibrant romantic pink
        uRimColor: { value: new THREE.Color('#FFB6D9') },     // Soft pastel pink / lavender rim
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uCoreColor;
        uniform vec3 uGlowColor;
        uniform vec3 uRimColor;
        uniform float uTime;

        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          float NdotV = dot(normal, viewDir);
          float facing = max(0.0, NdotV);

          // Feathered soft glowing light
          float coreIntensity = pow(facing, 1.4);
          float rimIntensity = pow(1.0 - abs(NdotV), 1.8);

          vec3 color = mix(uRimColor, uGlowColor, coreIntensity);
          color = mix(color, uCoreColor, pow(facing, 4.0) * 0.65);

          float alpha = clamp(coreIntensity * 0.95 + rimIntensity * 0.8, 0.0, 1.0);
          gl_FragColor = vec4(color, alpha * 0.90);
        }
      `
    });

    this.heartMesh = new THREE.Mesh(geometry, this.heartMaterial);
    this.heartMesh.scale.set(0.68, 0.68, 0.68);
    this.group.add(this.heartMesh);

    // Soft outer romantic pink haze aura
    const auraGeo = new THREE.PlaneGeometry(3.0, 3.0);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0.0, 'rgba(255, 182, 217, 0.55)');
    grad.addColorStop(0.35, 'rgba(255, 79, 163, 0.28)');
    grad.addColorStop(0.7, 'rgba(255, 182, 217, 0.08)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const auraTexture = new THREE.CanvasTexture(canvas);
    const auraMat = new THREE.MeshBasicMaterial({
      map: auraTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85,
    });
    this.auraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.auraMesh.position.z = -0.05;
    this.group.add(this.auraMesh);

    // Inner vibrant pink light
    this.heartLight = new THREE.PointLight(0xff4fa3, 4.0, 9, 2.0);
    this.heartLight.position.set(0, 0, 0.4);
    this.group.add(this.heartLight);
  }

  createSaturnRing() {
    // Flowing cosmic galaxy stardust ring encircling the heart
    const ringGroup = new THREE.Group();

    const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const particleCount = isMobile ? 1200 : 2200;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const angles = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const offsets = new Float32Array(particleCount * 2); // radial spread & z spread

    const radiusX = 1.95;
    const radiusY = 0.60;

    const cWhite = new THREE.Color('#FFFFFF');
    const cPastelPink = new THREE.Color('#FFB6D9');
    const cNeonPink = new THREE.Color('#FF4FA3');
    const cLavender = new THREE.Color('#D8B4FE');

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;

      // Tight Gaussian-like radial dispersion around the elliptical track
      const dr = (Math.random() - 0.5) * 0.12 * (Math.random() < 0.7 ? 0.6 : 1.2);
      const dz = (Math.random() - 0.5) * 0.08;

      positions[i3] = Math.cos(angle) * (radiusX + dr);
      positions[i3 + 1] = Math.sin(angle) * (radiusY + dr * 0.35);
      positions[i3 + 2] = dz;

      angles[i] = angle;
      speeds[i] = 0.25 + Math.random() * 0.35; // Stardust orbital speed
      offsets[i * 2] = dr;
      offsets[i * 2 + 1] = dz;

      // Color distribution: 60% diamond white, 25% pastel pink, 15% lavender/neon
      const pick = Math.random();
      const col = new THREE.Color();
      if (pick < 0.60) {
        col.copy(cWhite);
      } else if (pick < 0.82) {
        col.copy(cPastelPink);
      } else if (pick < 0.94) {
        col.copy(cLavender);
      } else {
        col.copy(cNeonPink);
      }

      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      scales[i] = Math.random() * 0.85 + 0.45;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 2));

    this.ringParticleGeo = geometry;

    // Custom shader for luminous galaxy stardust particles
    this.ringMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 },
        uRadiusX: { value: radiusX },
        uRadiusY: { value: radiusY },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uRadiusX;
        uniform float uRadiusY;

        attribute float aScale;
        attribute float aAngle;
        attribute float aSpeed;
        attribute vec2 aOffset;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Continuous smooth orbital rotation around the ring ellipse
          float currentAngle = aAngle + uTime * aSpeed;
          float rx = uRadiusX + aOffset.x;
          float ry = uRadiusY + aOffset.x * 0.35;

          vec3 pos = vec3(
            cos(currentAngle) * rx,
            sin(currentAngle) * ry,
            aOffset.y
          );

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Twinkle effect
          float twinkle = sin(uTime * 3.5 + aAngle * 10.0) * 0.28 + 0.72;
          gl_PointSize = (58.0 * aScale * twinkle) / -mvPosition.z;

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

          // Brilliant star glow profile
          float softHalo = pow(1.0 - dist * 2.0, 1.8);
          float hotCore = pow(max(0.0, 1.0 - dist * 3.0), 2.8);
          vec3 finalColor = vColor * (softHalo * 1.5) + vec3(hotCore * 2.2);

          gl_FragColor = vec4(finalColor * 1.35, min(1.0, softHalo * vAlpha * 1.15));
        }
      `
    });

    this.ringParticles = new THREE.Points(geometry, this.ringMaterial);
    ringGroup.add(this.ringParticles);

    // Exact tilt angle matching the reference photo
    ringGroup.rotation.x = Math.PI * 0.36;
    ringGroup.rotation.y = -Math.PI * 0.06;
    ringGroup.rotation.z = -Math.PI * 0.16;

    this.ringGroup = ringGroup;
    this.group.add(this.ringGroup);
  }

  createDiamondSparkles() {
    // 3 iconic 4-point diamond sparkle stars positioned exactly like in the user's reference:
    // 1. Upper right (large diamond star)
    // 2. Middle left (medium diamond star)
    // 3. Lower right (subtle diamond star)
    this.sparklesGroup = new THREE.Group();

    // Procedural 4-point diamond star shape
    const starShape = new THREE.Shape();
    const rOuter = 0.28;
    const rInner = 0.045;

    starShape.moveTo(0, rOuter);
    starShape.quadraticCurveTo(0, 0, rInner, 0);
    starShape.quadraticCurveTo(0, 0, 0, -rOuter);
    starShape.quadraticCurveTo(0, 0, -rInner, 0);
    starShape.quadraticCurveTo(0, 0, 0, rOuter);

    const starGeo = new THREE.ShapeGeometry(starShape);

    const starMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sparkleStars = [];

    const sparkleConfigs = [
      // Upper Right (large)
      { x: 1.15, y: 0.75, z: 0.2, scale: 1.1, phase: 0 },
      // Middle Left (medium)
      { x: -1.25, y: 0.35, z: 0.2, scale: 0.75, phase: 2.1 },
      // Lower Right (small)
      { x: 1.18, y: -0.85, z: 0.2, scale: 0.65, phase: 4.2 },
    ];

    sparkleConfigs.forEach((cfg) => {
      const mesh = new THREE.Mesh(starGeo, starMat);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.scale.set(cfg.scale, cfg.scale, cfg.scale);
      mesh.userData = {
        baseScale: cfg.scale,
        phase: cfg.phase
      };
      this.sparklesGroup.add(mesh);
      this.sparkleStars.push(mesh);
    });

    this.group.add(this.sparklesGroup);
  }

  createTwinklingPinkMotes() {
    // Exact match to user's reference photo:
    // A delicate, elegant cosmic field of soft glowing round pink bokeh stardust motes
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.innerWidth < window.innerHeight);
    const count = isMobile ? 750 : 1450;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    // Exact color spectrum sampled directly from the user's reference photo
    const pinkPalette = [
      new THREE.Color('#D81B60'), // Deep vibrant magenta
      new THREE.Color('#E91E63'), // Hot pink
      new THREE.Color('#EC407A'), // Romantic rose pink
      new THREE.Color('#F06292'), // Warm blossom pink
      new THREE.Color('#F48FB1'), // Soft pastel pink
      new THREE.Color('#F8BBD0'), // Delicate sakura blush
      new THREE.Color('#CE93D8'), // Orchid lilac pink
      new THREE.Color('#BA68C8'), // Cosmic lavender pink
      new THREE.Color('#FFF0F5'), // Pearl white-pink highlight
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Volumetric 3D distribution surrounding the heart and expanding across the field of view
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      // Radius distribution from inner halo to outer celestial sea
      const r = 0.55 + Math.pow(Math.random(), 0.72) * 5.2;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.95 + 0.1;
      positions[i3 + 2] = r * Math.cos(phi) * 0.88;

      const col = pinkPalette[Math.floor(Math.random() * pinkPalette.length)];
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      // Varied bokeh sizes: majority fine stardust, balanced with medium motes & soft bokeh orbs
      const randSize = Math.random();
      if (randSize < 0.68) {
        scales[i] = 0.45 + Math.random() * 0.55; // Delicate stardust dots
      } else if (randSize < 0.92) {
        scales[i] = 1.0 + Math.random() * 0.7;   // Medium glowing motes
      } else {
        scales[i] = 1.8 + Math.random() * 1.1;   // Soft luminous bokeh discs
      }

      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.35 + Math.random() * 0.75;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    this.pinkMotesMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 },
        uHeartBeat: { value: 1.0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uHeartBeat;

        attribute float aScale;
        attribute float aPhase;
        attribute float aSpeed;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec3 pos = position;

          // Gentle floating zero-gravity drift matching the reference image
          float t = uTime * 0.28 * aSpeed;
          pos.x += sin(t + aPhase) * 0.16 + cos(t * 0.5 + aPhase * 2.1) * 0.06;
          pos.y += cos(t * 0.75 + aPhase * 1.3) * 0.20 + sin(t * 0.4 + aPhase) * 0.05;
          pos.z += sin(t * 0.6 + aPhase * 1.8) * 0.15;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Delicate natural twinkling
          float twinkle = sin(uTime * (1.8 + aSpeed * 2.5) + aPhase) * 0.28 + 0.72;

          // Point size: crisp, soft-blurred round bokeh dots exactly as in the photo
          float pointSize = (78.0 * aScale * twinkle) / -mvPosition.z;
          gl_PointSize = clamp(pointSize, 2.5, 42.0);

          vColor = color;
          vAlpha = twinkle;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          if (dist > 0.5) discard;

          // Exact soft circular bokeh falloff matching the user reference photo
          float softEdge = smoothstep(0.5, 0.05, dist);
          float core = pow(max(0.0, 1.0 - dist * 2.2), 2.0);

          // Soft glowing pink bokeh dot with gentle luminous center
          vec3 finalColor = vColor * (softEdge * 1.4) + vec3(core * 0.95);
          float alpha = min(1.0, (softEdge * 0.85 + core * 0.4) * vAlpha);

          gl_FragColor = vec4(finalColor * 1.3, alpha);
        }
      `
    });

    this.pinkMotes = new THREE.Points(geometry, this.pinkMotesMat);
    this.group.add(this.pinkMotes);
  }

  createBurstSystem() {
    // 350 shimmering burst particles when clicked
    const count = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const alphas = new Float32Array(count);

    const cWhite = new THREE.Color('#FFFFFF');
    const cBlue = new THREE.Color('#D6E2FF');
    const cPink = new THREE.Color('#FFB6D9');

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;

      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const speed = 0.8 + Math.random() * 1.4; // Soft gentle drift

      velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i3 + 2] = Math.cos(phi) * speed;

      const pick = Math.random();
      const col = pick < 0.6 ? cWhite : pick < 0.85 ? cBlue : cPink;
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      alphas[i] = 0.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    this.burstMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float alpha;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 36.0 * (1.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float strength = pow(1.0 - d * 2.0, 2.0);
          gl_FragColor = vec4(vColor, strength * vAlpha);
        }
      `
    });

    this.burstPoints = new THREE.Points(geometry, this.burstMat);
    this.group.add(this.burstPoints);

    this.burstVelocities = velocities;
    this.burstActive = false;
    this.burstProgress = 0;
  }

  createTextConstellation() {
    // Curated deeply meaningful, romantic love wishes for lover
    this.wishes = [
      'YÊU EM HƠN CẢ VŨ TRỤ',
      'EM LÀ CẢ THẾ GIỚI CỦA ANH',
      'CẢM ƠN VÌ EM ĐÃ ĐẾN',
      'HẠNH PHÚC LÀ KHI CÓ EM',
      'MÃI MÃI LÀ DUY NHẤT',
      'Ở ĐÂU CÓ EM, Ở ĐÓ LÀ NHÀ',
      'NẮM TAY ANH ĐI HẾT THANH XUÂN',
      'VŨ TRỤ NÀY, ANH CHỈ YÊU EM',
      'I LOVE YOU\nTO THE MOON AND BACK',
      'MỖI NGÀY BÊN EM ĐỀU LÀ MÓN QUÀ'
    ];
    this.currentWishIndex = -1; // -1 means clean initial state: NO static text by default
    this.particleCount = 4200;

    const particleCount = this.particleCount;
    const startPositions = new Float32Array(particleCount * 3);
    const targetPositions = new Float32Array(particleCount * 3);
    const scatterPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    const cWhite = new THREE.Color('#FFFFFF');
    const cPastelPink = new THREE.Color('#FFB6D9');
    const cNeonPink = new THREE.Color('#FF3B96');
    const cLavender = new THREE.Color('#E0C3FC');
    const cChampagne = new THREE.Color('#FFF1D6');

    // Initial state: Faint ambient cosmic ring around the celestial heart, waiting silently
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const rad = 1.4 + Math.random() * 2.2;
      const y = (Math.random() - 0.5) * 1.6;
      const z = (Math.random() - 0.5) * 1.6;

      const px = Math.cos(angle) * rad;
      const py = y;
      const pz = Math.sin(angle) * rad + z;

      startPositions[i3] = px;
      startPositions[i3 + 1] = py;
      startPositions[i3 + 2] = pz;

      targetPositions[i3] = px;
      targetPositions[i3 + 1] = py;
      targetPositions[i3 + 2] = pz;

      // Swirling scatter trajectory vectors
      const phi = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * 2.2;
      const scatterDist = 1.0 + Math.random() * 2.2;
      scatterPositions[i3] = Math.cos(phi) * scatterDist;
      scatterPositions[i3 + 1] = elevation * scatterDist;
      scatterPositions[i3 + 2] = Math.sin(phi) * scatterDist;

      // 65% diamond white, 18% pastel pink, 10% lavender, 7% champagne & neon pink
      const pick = Math.random();
      const col = new THREE.Color();
      if (pick < 0.65) {
        col.copy(cWhite);
      } else if (pick < 0.83) {
        col.copy(cPastelPink);
      } else if (pick < 0.93) {
        col.copy(cLavender);
      } else if (pick < 0.97) {
        col.copy(cChampagne);
      } else {
        col.copy(cNeonPink);
      }

      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      scales[i] = Math.random() * 0.75 + 0.65;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(startPositions), 3));
    geometry.setAttribute('aStartPos', new THREE.BufferAttribute(startPositions, 3));
    geometry.setAttribute('aTargetPos', new THREE.BufferAttribute(targetPositions, 3));
    geometry.setAttribute('aScatter', new THREE.BufferAttribute(scatterPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this.textGeometry = geometry;

    // Custom shader: Cosmic morphing stardust into meaningful love wishes
    this.textMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: 1.0 },
        uAlphaMultiplier: { value: 0.0 }, // Starts 0.0: clean space until heart is touched!
        uHover: { value: 0.0 },
        uMouseLocal: { value: new THREE.Vector3(0, 0, 0) },
        uWaveProgress: { value: 0.0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uMorphProgress;
        uniform float uAlphaMultiplier;
        uniform float uHover;
        uniform vec3 uMouseLocal;
        uniform float uWaveProgress;

        attribute vec3 aStartPos;
        attribute vec3 aTargetPos;
        attribute vec3 aScatter;
        attribute float aScale;
        attribute float aPhase;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // 1. Smooth cubic S-curve transition
          float p = clamp(uMorphProgress, 0.0, 1.0);
          float smoothP = smoothstep(0.0, 1.0, p);

          // 2. Swirling cosmic vortex arc during morphing
          float arc = sin(smoothP * 3.14159265);
          vec3 swirlOffset = aScatter * (arc * 1.5);

          // Subtle spiral twist around Y axis while morphing
          float rotAngle = arc * 1.2;
          vec3 rawMix = mix(aStartPos, aTargetPos, smoothP) + swirlOffset;
          float c = cos(rotAngle);
          float s = sin(rotAngle);
          vec3 pos;
          pos.x = rawMix.x * c - rawMix.z * s;
          pos.y = rawMix.y + arc * 0.15;
          pos.z = rawMix.x * s + rawMix.z * c;

          // 3. Gentle harmonic breath when assembled into words
          pos.y += sin(uTime * 1.5 + pos.x * 1.8) * 0.035 * smoothP;

          // 4. Soft magnetic wave on hover
          if (uHover > 0.001) {
            float dist = length(pos.xy - uMouseLocal.xy);
            float radius = 1.4;
            if (dist < radius) {
              float wave = sin((1.0 - dist / radius) * 3.14159) * uHover;
              pos.z += wave * 0.18;
              pos.y += wave * 0.04;
            }
          }

          // 5. Interactive click ripple wave
          if (uWaveProgress > 0.001 && uWaveProgress < 1.0) {
            float dist = length(pos.xy - uMouseLocal.xy);
            float waveR = uWaveProgress * 4.0;
            float diff = abs(dist - waveR);
            if (diff < 0.5) {
              float waveAmp = (1.0 - diff / 0.5) * (1.0 - uWaveProgress);
              pos.z += waveAmp * 0.35;
              pos.y += sin(diff * 6.28) * waveAmp * 0.10;
            }
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Rapid sparkling twinkle
          float twinkleSpeed = 3.2 + uHover * 4.5 + arc * 5.0;
          float twinkle = sin(uTime * twinkleSpeed + aPhase) * 0.25 + 0.75;
          float hoverSize = 1.0 + uHover * 0.35 + arc * 0.45;

          // Crisp diamond star points
          gl_PointSize = (48.0 * aScale * twinkle * hoverSize) / -mvPosition.z;

          // Colors ignite with pure diamond radiance on morph/hover
          vec3 brightCol = mix(color, vec3(1.0, 0.96, 1.0), uHover * 0.5 + arc * 0.6);
          vColor = brightCol;
          vAlpha = twinkle * uAlphaMultiplier;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          if (vAlpha < 0.005) discard;
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;

          // Crisp optical star glow: tight hot center + delicate feathered halo
          float halo = pow(1.0 - dist * 2.0, 2.0);
          float core = pow(max(0.0, 1.0 - dist * 2.6), 3.2);
          vec3 finalColor = vColor * (halo * 1.5) + vec3(core * 2.8);

          gl_FragColor = vec4(finalColor, min(1.0, halo * vAlpha * 1.25));
        }
      `
    });

    this.textPoints = new THREE.Points(geometry, this.textMaterial);
    this.group.add(this.textPoints);

    // Interactive clickable & hoverable hit target mesh for the wish constellation
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.innerWidth < window.innerHeight);
    const spanX = isMobile ? 3.15 : 4.6;
    const baseY = isMobile ? 1.68 : 1.92;
    const hitBoxGeo = new THREE.BoxGeometry(spanX + 0.8, 1.4, 1.2);
    const hitBoxMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.0001,
      depthWrite: false,
    });
    this.textHitMesh = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    this.textHitMesh.position.set(0, baseY, 0.15);
    this.textHitMesh.visible = true;
    this.group.add(this.textHitMesh);

    // Re-sample if fonts load dynamically
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (this.currentWishIndex >= 0) {
          const sample = this.sampleWishPositions(this.wishes[this.currentWishIndex]);
          if (sample && this.textGeometry) {
            this.textGeometry.attributes.aTargetPos.copyArray(sample.targets);
            this.textGeometry.attributes.aTargetPos.needsUpdate = true;
          }
        }
      });
    }
  }

  sampleWishPositions(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 3200;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Auto-balance into 2 lines if any single line exceeds 22 characters
    let lines = text.split('\n');
    if (lines.length === 1 && text.length > 22) {
      const mid = Math.floor(text.length / 2);
      const spaceBefore = text.lastIndexOf(' ', mid);
      const spaceAfter = text.indexOf(' ', mid);
      let splitIdx = -1;
      if (spaceBefore !== -1 && spaceAfter !== -1) {
        splitIdx = (mid - spaceBefore < spaceAfter - mid) ? spaceBefore : spaceAfter;
      } else {
        splitIdx = spaceBefore !== -1 ? spaceBefore : spaceAfter;
      }
      if (splitIdx !== -1) {
        lines = [text.substring(0, splitIdx).trim(), text.substring(splitIdx + 1).trim()];
      }
    }

    // Dynamic adaptive font size calculation
    let fontSize = lines.length > 1 ? 125 : 140;
    const fontStack = '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.font = `900 ${fontSize}px ${fontStack}`;

    // Measure maximum line width
    let maxW = 0;
    lines.forEach(line => {
      const w = ctx.measureText(line.trim()).width;
      if (w > maxW) maxW = w;
    });

    // Keep text strictly within safe bounds (canvas.width - 240px padding)
    const maxSafeW = canvas.width - 240;
    if (maxW > maxSafeW) {
      fontSize = Math.floor(fontSize * (maxSafeW / maxW));
      ctx.font = `900 ${fontSize}px ${fontStack}`;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lineHeight = fontSize * 1.38;
    const totalH = lines.length * lineHeight;
    const startY = (canvas.height - totalH) / 2 + lineHeight / 2;

    lines.forEach((line, idx) => {
      const y = startY + idx * lineHeight;
      ctx.strokeText(line.trim(), canvas.width / 2, y);
      ctx.fillText(line.trim(), canvas.width / 2, y);
    });

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const rawPixels = [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    const step = 2;
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const idx = (y * canvas.width + x) * 4;
        if (data[idx] > 60) {
          rawPixels.push({ rawX: x, rawY: y });
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (rawPixels.length === 0) return null;

    const textW = Math.max(1, maxX - minX);
    const textH = Math.max(1, maxY - minY);
    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;

    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.innerWidth < window.innerHeight);
    const maxSpanX = isMobile ? 3.35 : 4.8;
    const letterAspect = textW / textH;
    let curSpanX = maxSpanX;
    let curSpanY = curSpanX / letterAspect;

    const maxSpanY = isMobile ? 1.40 : 1.60;
    if (curSpanY > maxSpanY) {
      curSpanY = maxSpanY;
      curSpanX = curSpanY * letterAspect;
    }

    const baseY = isMobile ? 1.72 : 1.95;

    const targetArray = new Float32Array(this.particleCount * 3);
    const scatterArray = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const sampleIdx = Math.floor((i / this.particleCount) * rawPixels.length);
      const p = rawPixels[sampleIdx];

      const normX = (p.rawX - centerX) / (textW * 0.5);
      const normY = -(p.rawY - centerY) / (textH * 0.5);

      const jx = (Math.random() - 0.5) * 0.018;
      const jy = (Math.random() - 0.5) * 0.018;
      const jz = (Math.random() - 0.5) * 0.05;

      targetArray[i3] = normX * (curSpanX * 0.5) + jx;
      targetArray[i3 + 1] = baseY + normY * (curSpanY * 0.5) + jy;
      targetArray[i3 + 2] = 0.15 + jz;

      // Swirl trajectory vectors
      const phi = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * 2.2;
      const scatterDist = 1.0 + Math.random() * 2.0;
      scatterArray[i3] = Math.cos(phi) * scatterDist;
      scatterArray[i3 + 1] = elevation * scatterDist;
      scatterArray[i3 + 2] = Math.sin(phi) * scatterDist;
    }

    return {
      targets: targetArray,
      scatter: scatterArray,
      spanX: curSpanX,
      spanY: curSpanY,
      baseY: baseY
    };
  }

  morphToNextWish() {
    if (!this.textGeometry || !this.textMaterial) return;

    const nextIndex = (this.currentWishIndex + 1) % this.wishes.length;
    const wishText = this.wishes[nextIndex];
    const sample = this.sampleWishPositions(wishText);
    if (!sample) return;

    const isFirstReveal = (this.currentWishIndex === -1);
    this.currentWishIndex = nextIndex;

    const startAttr = this.textGeometry.attributes.aStartPos;
    const targetAttr = this.textGeometry.attributes.aTargetPos;
    const scatterAttr = this.textGeometry.attributes.aScatter;

    if (isFirstReveal) {
      // Particles swirl inwards from ambient galaxy orbit into Wish 1
      targetAttr.copyArray(sample.targets);
      targetAttr.needsUpdate = true;
      scatterAttr.copyArray(sample.scatter);
      scatterAttr.needsUpdate = true;

      gsap.killTweensOf(this.textMaterial.uniforms.uAlphaMultiplier);
      gsap.to(this.textMaterial.uniforms.uAlphaMultiplier, {
        value: 1.0,
        duration: 1.2,
        ease: 'power2.out'
      });

      gsap.killTweensOf(this.textMaterial.uniforms.uMorphProgress);
      this.textMaterial.uniforms.uMorphProgress.value = 0.0;
      gsap.to(this.textMaterial.uniforms.uMorphProgress, {
        value: 1.0,
        duration: 1.8,
        ease: 'power2.inOut'
      });
    } else {
      // Current target becomes new starting position
      startAttr.copyArray(targetAttr.array);
      startAttr.needsUpdate = true;

      // Next wish becomes target
      targetAttr.copyArray(sample.targets);
      targetAttr.needsUpdate = true;
      scatterAttr.copyArray(sample.scatter);
      scatterAttr.needsUpdate = true;

      gsap.killTweensOf(this.textMaterial.uniforms.uMorphProgress);
      this.textMaterial.uniforms.uMorphProgress.value = 0.0;
      gsap.to(this.textMaterial.uniforms.uMorphProgress, {
        value: 1.0,
        duration: 1.6,
        ease: 'power2.inOut'
      });
    }

    // Update clickable hit box to fit new wish dimensions
    if (this.textHitMesh) {
      this.textHitMesh.geometry.dispose();
      this.textHitMesh.geometry = new THREE.BoxGeometry(sample.spanX + 0.8, sample.spanY + 0.6, 1.2);
      this.textHitMesh.position.set(0, sample.baseY, 0.15);
    }
  }

  setTextHover(isHovered, localPoint = null) {
    if (!this.textMaterial || this.currentWishIndex === -1) return;

    if (localPoint) {
      this.textMaterial.uniforms.uMouseLocal.value.copy(localPoint);
    }

    gsap.killTweensOf(this.textMaterial.uniforms.uHover);
    gsap.to(this.textMaterial.uniforms.uHover, {
      value: isHovered ? 1.0 : 0.0,
      duration: isHovered ? 0.35 : 0.65,
      ease: 'power2.out',
    });
  }

  triggerTextClick(localPoint = null) {
    if (!this.textMaterial) return;

    // Morph to next wish when clicking the constellation too!
    this.morphToNextWish();

    if (localPoint) {
      this.textMaterial.uniforms.uMouseLocal.value.copy(localPoint);
    }

    // Ripple wave across letters
    gsap.killTweensOf(this.textMaterial.uniforms.uWaveProgress);
    this.textMaterial.uniforms.uWaveProgress.value = 0.0;
    gsap.to(this.textMaterial.uniforms.uWaveProgress, {
      value: 1.0,
      duration: 1.6,
      ease: 'power2.out',
      onComplete: () => {
        this.textMaterial.uniforms.uWaveProgress.value = 0.0;
      }
    });

    // Gentle jump/breath animation on the text
    gsap.killTweensOf(this.textPoints.position);
    gsap.to(this.textPoints.position, {
      y: 0.12,
      duration: 0.28,
      yoyo: true,
      repeat: 1,
      ease: 'sine.out',
      onComplete: () => {
        this.textPoints.position.set(0, 0, 0);
      }
    });
  }

  createInteractionHitTarget() {
    // Generous clickable hit sphere (invisible but visible=true so Three.js Raycaster detects it 100%)
    const hitGeo = new THREE.SphereGeometry(2.4, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.0001,
      depthWrite: false,
    });
    this.hitMesh = new THREE.Mesh(hitGeo, hitMat);
    this.hitMesh.visible = true;
    this.group.add(this.hitMesh);
  }

  triggerClickEffect() {
    // Dynamic galaxy stardust morphing into love wishes!
    this.morphToNextWish();

    // 1. Gentle, tender heartbeat pulse
    gsap.killTweensOf(this.heartMesh.scale);
    gsap.to(this.heartMesh.scale, {
      x: 0.72,
      y: 0.72,
      z: 0.72,
      duration: 0.32,
      ease: 'sine.out',
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.heartMesh.scale.set(0.68, 0.68, 0.68);
      }
    });

    // 2. Soft warm glow breathing
    gsap.killTweensOf(this.heartLight);
    gsap.to(this.heartLight, {
      intensity: 5.2,
      duration: 0.35,
      yoyo: true,
      repeat: 1,
      ease: 'sine.out',
      onComplete: () => {
        this.heartLight.intensity = 4.0;
      }
    });

    // 3. Subtle ring shimmer
    gsap.killTweensOf(this.ringGroup.scale);
    gsap.to(this.ringGroup.scale, {
      x: 1.08,
      y: 1.08,
      z: 1.08,
      duration: 0.45,
      ease: 'sine.out',
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.ringGroup.scale.set(1, 1, 1);
      }
    });

    // 4. Soft, gentle magnetic wave ripples (Sóng từ êm ái, bồng bềnh)
    this.createShockwaveRings();

    // 5. Gentle galaxy star breath
    if (this.galaxy && typeof this.galaxy.triggerShockwave === 'function') {
      this.galaxy.triggerShockwave();
    }

    // 6. Delicate stardust drift
    this.burstActive = true;
    this.burstProgress = 0;
    const positions = this.burstPoints.geometry.attributes.position.array;
    const alphas = this.burstPoints.geometry.attributes.alpha.array;
    for (let i = 0; i < alphas.length; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      alphas[i] = 0.65;
    }
    this.burstPoints.geometry.attributes.position.needsUpdate = true;
    this.burstPoints.geometry.attributes.alpha.needsUpdate = true;
  }

  createShockwaveRings() {
    // Whisper-soft, dreamy, ethereal magnetic ripples (Sóng từ cực kỳ êm dịu, mượt mà và nhẹ nhàng)
    const ringConfigs = [
      { delay: 0.0, maxScale: 5.5, duration: 2.8, color: 0xffffff, opacity: 0.28 },
      { delay: 0.28, maxScale: 7.0, duration: 3.2, color: 0xffb6d9, opacity: 0.20 },
      { delay: 0.55, maxScale: 8.5, duration: 3.6, color: 0xd8b4fe, opacity: 0.12 },
    ];

    ringConfigs.forEach((cfg) => {
      setTimeout(() => {
        // Ultra thin, delicate whisper ring
        const ringGeo = new THREE.RingGeometry(0.30, 0.33, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: cfg.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: cfg.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI * 0.36;
        ringMesh.rotation.y = -Math.PI * 0.06;
        ringMesh.rotation.z = -Math.PI * 0.16;
        this.group.add(ringMesh);

        gsap.to(ringMesh.scale, {
          x: cfg.maxScale,
          y: cfg.maxScale,
          z: cfg.maxScale,
          duration: cfg.duration,
          ease: 'sine.out',
        });

        gsap.to(ringMat, {
          opacity: 0,
          duration: cfg.duration,
          ease: 'sine.out',
          onComplete: () => {
            this.group.remove(ringMesh);
            ringGeo.dispose();
            ringMat.dispose();
          }
        });
      }, cfg.delay * 1000);
    });

    // Subtle volumetric spherical ripple
    const bubbleGeo = new THREE.SphereGeometry(0.8, 24, 24);
    const bubbleMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      uniforms: {
        uProgress: { value: 0.0 },
        uColor: { value: new THREE.Color('#FFFFFF') },
        uGlow: { value: new THREE.Color('#FFB6D9') },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform vec3 uColor;
        uniform vec3 uGlow;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.8);
          float alpha = sin(uProgress * 3.14159) * (1.0 - uProgress * 0.5);
          vec3 col = mix(uColor, uGlow, uProgress * 0.7);

          gl_FragColor = vec4(col, fresnel * alpha * 0.18);
        }
      `
    });

    const bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    this.group.add(bubbleMesh);

    const bubbleAnim = { scale: 0.8, progress: 0.0 };
    gsap.to(bubbleAnim, {
      scale: 6.2,
      progress: 1.0,
      duration: 3.0,
      ease: 'sine.out',
      onUpdate: () => {
        bubbleMesh.scale.set(bubbleAnim.scale, bubbleAnim.scale, bubbleAnim.scale);
        bubbleMat.uniforms.uProgress.value = bubbleAnim.progress;
      },
      onComplete: () => {
        this.group.remove(bubbleMesh);
        bubbleGeo.dispose();
        bubbleMat.dispose();
      }
    });
  }

  update(elapsedTime, delta) {
    this.pulseTime += delta;

    // Gentle heartbeat pulsation
    const beatCycle = (this.pulseTime * 1.1) % 1.0;
    let beatScale = 1.0;
    if (beatCycle < 0.12) {
      beatScale = 1.0 + Math.sin((beatCycle / 0.12) * Math.PI) * 0.08;
    } else if (beatCycle > 0.20 && beatCycle < 0.32) {
      beatScale = 1.0 + Math.sin(((beatCycle - 0.20) / 0.12) * Math.PI) * 0.04;
    }

    if (this.heartMesh && !gsap.isTweening(this.heartMesh.scale)) {
      const s = 0.68 * beatScale;
      this.heartMesh.scale.set(s, s, s);
    }

    // Floating motion
    this.group.position.y = 0.45 + Math.sin(elapsedTime * 1.2) * 0.12;
    this.heartMesh.rotation.y = Math.sin(elapsedTime * 0.4) * 0.12;

    // Twinkle the 3 diamond sparkle stars
    for (let i = 0; i < this.sparkleStars.length; i++) {
      const star = this.sparkleStars[i];
      const twinkle = Math.sin(elapsedTime * 3.5 + star.userData.phase) * 0.35 + 0.85;
      const s = star.userData.baseScale * twinkle;
      star.scale.set(s, s, s);
      star.rotation.z = Math.sin(elapsedTime * 1.5 + star.userData.phase) * 0.15;
    }

    // Animate galaxy stardust particles in Saturn ring
    if (this.ringMaterial && this.ringMaterial.uniforms) {
      this.ringMaterial.uniforms.uTime.value = elapsedTime;
    }

    // Animate dancing twinkling pink motes
    if (this.pinkMotesMat && this.pinkMotesMat.uniforms) {
      this.pinkMotesMat.uniforms.uTime.value = elapsedTime;
      this.pinkMotesMat.uniforms.uHeartBeat.value = beatScale;
    }

    // Animate celestial "I love You" stardust constellation above the heart
    if (this.textMaterial && this.textMaterial.uniforms) {
      this.textMaterial.uniforms.uTime.value = elapsedTime;
    }

    // Billboard: always face the camera directly so "I LOVE YOU" is NEVER mirrored or reversed from any angle
    if (this.textPoints && this.camera) {
      const groupWorldQuat = new THREE.Quaternion();
      this.group.getWorldQuaternion(groupWorldQuat);
      this.textPoints.quaternion.copy(groupWorldQuat.invert().multiply(this.camera.quaternion));
      if (this.textHitMesh) {
        this.textHitMesh.quaternion.copy(this.textPoints.quaternion);
      }
    }

    // Subtle breathing on Saturn ring
    if (this.ringGroup) {
      this.ringGroup.rotation.z = -Math.PI * 0.16 + Math.sin(elapsedTime * 0.5) * 0.02;
    }

    // Update burst particles physics
    if (this.burstActive) {
      this.burstProgress += delta;
      const positions = this.burstPoints.geometry.attributes.position.array;
      const alphas = this.burstPoints.geometry.attributes.alpha.array;
      const vels = this.burstVelocities;

      let stillAlive = false;
      for (let i = 0; i < alphas.length; i++) {
        const i3 = i * 3;
        positions[i3] += vels[i3] * delta;
        positions[i3 + 1] += vels[i3 + 1] * delta;
        positions[i3 + 2] += vels[i3 + 2] * delta;

        vels[i3] *= 0.985;
        vels[i3 + 1] *= 0.985;
        vels[i3 + 2] *= 0.985;

        alphas[i] = Math.max(0.0, 1.0 - this.burstProgress / 1.4);
        if (alphas[i] > 0.01) stillAlive = true;
      }

      this.burstPoints.geometry.attributes.position.needsUpdate = true;
      this.burstPoints.geometry.attributes.alpha.needsUpdate = true;

      if (!stillAlive || this.burstProgress >= 1.4) {
        this.burstActive = false;
      }
    }
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
