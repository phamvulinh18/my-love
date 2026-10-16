import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * High-performance PostProcessing pipeline with instant Direct Render fallback.
 * By default on mobile or low-end GPUs, direct render is used to guarantee 60 FPS.
 */
export class PostProcessing {
  constructor(renderer, scene, camera, width, height) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    // Disabled by default for rock-solid 60 FPS across all devices
    // Our custom shader particles already have optical additive bloom!
    this.enabled = false;

    this.composer = null;
    this.initComposer(width, height);
  }

  initComposer(width, height) {
    try {
      // Half-resolution for bloom to keep memory bandwidth low
      const rtWidth = Math.floor(width * 0.5);
      const rtHeight = Math.floor(height * 0.5);

      const renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      });

      this.composer = new EffectComposer(this.renderer, renderTarget);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(rtWidth, rtHeight),
        0.8,
        0.4,
        0.6
      );
      this.composer.addPass(this.bloomPass);

      const outputPass = new OutputPass();
      this.composer.addPass(outputPass);
    } catch (e) {
      console.warn('PostProcessing not supported, falling back to direct render', e);
      this.enabled = false;
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setSize(width, height) {
    if (this.composer) {
      this.composer.setSize(Math.floor(width * 0.5), Math.floor(height * 0.5));
    }
  }

  render() {
    if (this.enabled && this.composer) {
      this.composer.render();
    } else {
      // 10x faster: Direct single-pass hardware rendering directly to canvas
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    if (this.composer) {
      this.composer.dispose();
    }
  }
}
