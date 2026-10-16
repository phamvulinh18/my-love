import * as THREE from 'three';
import gsap from 'gsap';

/**
 * PhotoParticles - Celestial floating memory charms featuring ngiu.jpg
 * - Initially: Delicate circular glowing galaxy charms.
 * - On Click/Touch: Dynamically morphs into an exquisite HEART SHAPE with romantic zoom bloom!
 */
export class PhotoParticles {
  constructor(parentGroup, camera) {
    this.parentGroup = parentGroup;
    this.camera = camera;

    this.group = new THREE.Group();
    this.parentGroup.add(this.group);

    this.count = 24; // Tasteful, delicate count matching user request
    this.particles = [];
    this.sharedPlaneGeo = new THREE.PlaneGeometry(1, 1);

    this.circleTexture = null;
    this.heartTexture = null;

    this.loadTextures();
  }

  loadTextures() {
    const img = new Image();
    img.src = '/ngiu.jpg';
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      this.circleTexture = this.createCircleTexture(img);
      this.heartTexture = this.createHeartTexture(img);

      // Now that textures are ready, update all particle materials
      this.particles.forEach((p) => {
        if (p.material && p.material.uniforms) {
          p.material.uniforms.uCircleTex.value = this.circleTexture;
          p.material.uniforms.uHeartTex.value = this.heartTexture;
          p.material.needsUpdate = true;
        }
      });
    };

    this.initParticles();
  }

  createCircleTexture(img) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const cx = 256;
    const cy = 256;
    const radius = 210;

    ctx.clearRect(0, 0, 512, 512);

    // 1. Circular clipping mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // 2. Draw cropped photo centered on her lovely face and pose
    const cropSize = 640;
    const sx = Math.max(0, (img.width - cropSize) / 2);
    const sy = 60;
    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 512, 512);
    ctx.restore();

    // 3. Gentle vignette feathering along inside edge
    ctx.save();
    const innerGrad = ctx.createRadialGradient(cx, cy, radius * 0.78, cx, cy, radius);
    innerGrad.addColorStop(0, 'rgba(255, 182, 217, 0)');
    innerGrad.addColorStop(1, 'rgba(255, 105, 180, 0.40)');
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = innerGrad;
    ctx.fill();
    ctx.restore();

    // 4. Glowing pure white & pastel pink borders
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 11;
    ctx.shadowColor = '#FF80BF';
    ctx.shadowBlur = 25;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFB6D9';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#E0C3FC';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.restore();

    // 5. Tiny 4-point diamond star emblem on corner
    this.drawStar(ctx, cx + radius * 0.70, cy - radius * 0.70, 22);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }

  createHeartTexture(img) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const cx = 256;
    const cy = 256;

    ctx.clearRect(0, 0, 512, 512);

    // Parametric true celestial heart curve
    const drawHeartPath = (scaleOffset = 0) => {
      const scale = 13.5 + scaleOffset;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const t = (i / 100) * Math.PI * 2;
        const sinT = Math.sin(t);
        const px = cx + 16 * sinT * sinT * sinT * scale;
        const py = cy + (-(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) - 2.55) * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    // 1. Heart clipping mask
    ctx.save();
    drawHeartPath(0);
    ctx.clip();

    // 2. Draw cropped photo centered on her face and pose
    const cropSize = 640;
    const sx = Math.max(0, (img.width - cropSize) / 2);
    const sy = 60;
    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 512, 512);
    ctx.restore();

    // 3. Romantic soft inner feathering
    ctx.save();
    drawHeartPath(0);
    ctx.clip();
    const innerGrad = ctx.createRadialGradient(cx, cy, 110, cx, cy, 215);
    innerGrad.addColorStop(0, 'rgba(255, 182, 217, 0)');
    innerGrad.addColorStop(1, 'rgba(255, 60, 150, 0.45)');
    ctx.fillStyle = innerGrad;
    ctx.fill();
    ctx.restore();

    // 4. Glowing pure white & rose pink heart borders
    ctx.save();
    drawHeartPath(0);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 11;
    ctx.shadowColor = '#FF80BF';
    ctx.shadowBlur = 26;
    ctx.stroke();

    drawHeartPath(0.35);
    ctx.strokeStyle = '#FFB6D9';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#E0C3FC';
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.restore();

    // 5. Diamond star sparkle on the right heart lobe
    this.drawStar(ctx, cx + 115, cy - 130, 22);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }

  drawStar(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFF5FB';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.quadraticCurveTo(x, y, x + size, y);
    ctx.quadraticCurveTo(x, y, x, y + size);
    ctx.quadraticCurveTo(x, y, x - size, y);
    ctx.quadraticCurveTo(x, y, x, y - size);
    ctx.fill();
    ctx.restore();
  }

  createParticleMaterial() {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uCircleTex: { value: this.circleTexture },
        uHeartTex: { value: this.heartTexture },
        uMorph: { value: 0.0 }, // 0.0 = Circle, 1.0 = Heart
        uTime: { value: 0.0 },
        uOpacity: { value: 0.95 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uCircleTex;
        uniform sampler2D uHeartTex;
        uniform float uMorph;
        uniform float uTime;
        uniform float uOpacity;

        varying vec2 vUv;

        void main() {
          vec4 colCircle = texture2D(uCircleTex, vUv);
          vec4 colHeart = texture2D(uHeartTex, vUv);

          // Smooth interpolation between circular and heart shape
          vec4 col = mix(colCircle, colHeart, uMorph);

          // Ethereal diamond stardust flash during the morphing transition
          float morphBurst = sin(uMorph * 3.14159265);
          col.rgb += vec3(1.0, 0.78, 0.95) * (morphBurst * 0.45);

          if (col.a < 0.01) discard;

          gl_FragColor = vec4(col.rgb, col.a * uOpacity);
        }
      `
    });
  }

  initParticles() {
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.innerWidth < window.innerHeight);

    for (let i = 0; i < this.count; i++) {
      // Distribute along the 4 galaxy spiral arms
      const branchIndex = i % 4;
      const radius = 2.6 + (i / this.count) * 6.8 + (Math.random() - 0.5) * 0.8;
      const spinAngle = radius * 1.2;
      const branchAngle = (branchIndex / 4) * Math.PI * 2;
      const angle = branchAngle + spinAngle + (Math.random() - 0.5) * 0.35;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 1.5;

      const baseScale = (isMobile ? 0.40 : 0.48) + Math.random() * 0.12;

      const mat = this.createParticleMaterial();
      const mesh = new THREE.Mesh(this.sharedPlaneGeo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(baseScale, baseScale, baseScale);

      mesh.userData = {
        baseScale: baseScale,
        baseY: y,
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 1.8 + Math.random() * 1.5,
        isHeart: false,
        revertTimer: null,
      };

      this.group.add(mesh);
      this.particles.push(mesh);
    }
  }

  checkHover(raycaster) {
    const intersects = raycaster.intersectObjects(this.particles, false);
    let hoveredOne = null;

    if (intersects.length > 0) {
      hoveredOne = intersects[0].object;
      document.body.style.cursor = 'pointer';
    }

    this.particles.forEach((p) => {
      if (p.userData.isHeart) return;

      if (p === hoveredOne) {
        gsap.to(p.scale, {
          x: p.userData.baseScale * 1.35,
          y: p.userData.baseScale * 1.35,
          z: p.userData.baseScale * 1.35,
          duration: 0.3,
          ease: 'power2.out'
        });
      } else {
        gsap.to(p.scale, {
          x: p.userData.baseScale,
          y: p.userData.baseScale,
          z: p.userData.baseScale,
          duration: 0.4,
          ease: 'power2.out'
        });
      }
    });

    return hoveredOne !== null;
  }

  checkClick(raycaster) {
    const intersects = raycaster.intersectObjects(this.particles, false);
    if (intersects.length > 0) {
      const p = intersects[0].object;
      this.triggerMorphToHeart(p);
      return true;
    }
    return false;
  }

  triggerMorphToHeart(mesh) {
    if (!mesh || !mesh.material || !mesh.material.uniforms) return;

    if (mesh.userData.revertTimer) {
      clearTimeout(mesh.userData.revertTimer);
      mesh.userData.revertTimer = null;
    }

    const isCurrentlyHeart = mesh.userData.isHeart;

    if (!isCurrentlyHeart) {
      // 1. Transform from Circle to HEART SHAPE!
      mesh.userData.isHeart = true;

      // Morph shader transition 0.0 -> 1.0 (Circle -> Heart)
      gsap.killTweensOf(mesh.material.uniforms.uMorph);
      gsap.to(mesh.material.uniforms.uMorph, {
        value: 1.0,
        duration: 0.65,
        ease: 'power2.out',
      });

      // Smooth romantic zoom bloom (scale: ~2.8x)
      const targetScale = mesh.userData.baseScale * 2.8;
      gsap.killTweensOf(mesh.scale);
      gsap.to(mesh.scale, {
        x: targetScale,
        y: targetScale,
        z: targetScale,
        duration: 0.65,
        ease: 'back.out(1.8)',
      });

      // Stay as heart shape for 3.6 seconds, then smoothly return to circular galaxy charm
      mesh.userData.revertTimer = setTimeout(() => {
        gsap.to(mesh.material.uniforms.uMorph, {
          value: 0.0,
          duration: 0.8,
          ease: 'power2.inOut',
        });
        gsap.to(mesh.scale, {
          x: mesh.userData.baseScale,
          y: mesh.userData.baseScale,
          z: mesh.userData.baseScale,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => {
            mesh.userData.isHeart = false;
          }
        });
      }, 3600);
    } else {
      // Clicked while in heart shape: toggle immediately back to circle
      mesh.userData.isHeart = false;
      gsap.killTweensOf(mesh.material.uniforms.uMorph);
      gsap.to(mesh.material.uniforms.uMorph, {
        value: 0.0,
        duration: 0.5,
        ease: 'power2.inOut',
      });
      gsap.killTweensOf(mesh.scale);
      gsap.to(mesh.scale, {
        x: mesh.userData.baseScale,
        y: mesh.userData.baseScale,
        z: mesh.userData.baseScale,
        duration: 0.5,
        ease: 'power2.inOut',
      });
    }
  }

  update(elapsedTime, delta) {
    // Rotate in perfect harmony with the galaxy spiral
    this.group.rotation.y = elapsedTime * 0.02;

    // Billboard towards camera so her face is always upright and perfectly oriented
    if (this.camera) {
      const q = new THREE.Quaternion();
      this.group.getWorldQuaternion(q);
      const camLocalQ = q.invert().multiply(this.camera.quaternion);
      for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].quaternion.copy(camLocalQ);
      }
    }

    // Harmonic floating wave & subtle heartbeat pulse for active heart particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Pass time to material
      if (p.material && p.material.uniforms) {
        p.material.uniforms.uTime.value = elapsedTime;
      }

      // Gentle floating bob
      p.position.y = p.userData.baseY + Math.sin(elapsedTime * 1.2 + p.userData.phase) * 0.10;

      // When in heart mode, gentle tender heartbeat breathing
      if (p.userData.isHeart && !gsap.isTweening(p.scale)) {
        const beat = 1.0 + Math.sin(elapsedTime * 4.0) * 0.04;
        const currentS = p.userData.baseScale * 2.8 * beat;
        p.scale.set(currentS, currentS, currentS);
      }
      // When in circle mode, subtle twinkle breathing
      else if (!p.userData.isHeart && !gsap.isTweening(p.scale)) {
        const twinkle = Math.sin(elapsedTime * p.userData.twinkleSpeed + p.userData.phase) * 0.05 + 1.0;
        const currentS = p.userData.baseScale * twinkle;
        p.scale.set(currentS, currentS, currentS);
      }
    }
  }

  dispose() {
    this.parentGroup.remove(this.group);
    if (this.circleTexture) this.circleTexture.dispose();
    if (this.heartTexture) this.heartTexture.dispose();
    if (this.sharedPlaneGeo) this.sharedPlaneGeo.dispose();
  }
}
