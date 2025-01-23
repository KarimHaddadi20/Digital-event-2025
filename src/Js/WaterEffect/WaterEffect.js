import * as THREE from 'three';
import {
    simulationVertexShader,
    simulationFragmentShader,
    renderVertexShader,
    renderFragmentShader,
} from './shaders.js';

export class WaterEffect {
    constructor() {
        this.scene = new THREE.Scene();
        this.simScene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            preserveDrawingBuffer: true,
        });
        
        this.init();
        this.setupEvents();
        this.animate();
    }

    init() {
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.mouse = new THREE.Vector2();
        this.frame = 0;

        const width = window.innerWidth * window.devicePixelRatio;
        const height = window.innerHeight * window.devicePixelRatio;

        // Configuration des render targets
        const options = {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            stencilBuffer: false,
            depthBuffer: false,
        };
        
        this.rtA = new THREE.WebGLRenderTarget(width, height, options);
        this.rtB = new THREE.WebGLRenderTarget(width, height, options);

        // Création des matériaux
        this.setupMaterials(width, height);
        
        // Création du plan
        const plane = new THREE.PlaneGeometry(2, 2);
        this.simQuad = new THREE.Mesh(plane, this.simMaterial);
        this.renderQuad = new THREE.Mesh(plane, this.renderMaterial);

        this.simScene.add(this.simQuad);
        this.scene.add(this.renderQuad);

        this.createTextTexture(width, height);
    }

    setupMaterials(width, height) {
        this.simMaterial = new THREE.ShaderMaterial({
            uniforms: {
                textureA: { value: null },
                mouse: { value: this.mouse },
                resolution: { value: new THREE.Vector2(width, height) },
                time: { value: 0 },
                frame: { value: 0 },
            },
            vertexShader: simulationVertexShader,
            fragmentShader: simulationFragmentShader,
        });

        this.renderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                textureA: { value: null },
                textureB: { value: null },
            },
            vertexShader: renderVertexShader,
            fragmentShader: renderFragmentShader,
            transparent: true,
        });
    }

    createTextTexture(width, height) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { alpha: false });

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);

        this.textTexture = new THREE.CanvasTexture(canvas);
        this.textTexture.minFilter = THREE.LinearFilter;
        this.textTexture.magFilter = THREE.LinearFilter;
    }

    setupEvents() {
        window.addEventListener("mousemove", (e) => {
            this.mouse.x = e.clientX * window.devicePixelRatio;
            this.mouse.y = (window.innerHeight - e.clientY) * window.devicePixelRatio;
        });

        window.addEventListener("mouseleave", () => {
            this.mouse.set(0, 0);
        });

        window.addEventListener("resize", () => this.onResize());
    }

    onResize() {
        const width = window.innerWidth * window.devicePixelRatio;
        const height = window.innerHeight * window.devicePixelRatio;

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.rtA.setSize(width, height);
        this.rtB.setSize(width, height);
        this.simMaterial.uniforms.resolution.value.set(width, height);
        
        this.createTextTexture(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.simMaterial.uniforms.frame.value = this.frame++;
        this.simMaterial.uniforms.time.value = performance.now() / 1000;
        this.simMaterial.uniforms.textureA.value = this.rtA.texture;

        this.renderer.setRenderTarget(this.rtB);
        this.renderer.render(this.simScene, this.camera);

        this.renderMaterial.uniforms.textureA.value = this.rtB.texture;
        this.renderMaterial.uniforms.textureB.value = this.textTexture;
        
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.scene, this.camera);

        const temp = this.rtA;
        this.rtA = this.rtB;
        this.rtB = temp;
    }
} 