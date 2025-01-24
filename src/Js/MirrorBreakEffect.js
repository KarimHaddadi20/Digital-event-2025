import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { SceneSetup } from "./SceneSetup.js";
import { FragmentManager } from "./FragmentManager.js";

class MirrorBreakEffect {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        // Initialisation des gestionnaires
        this.sceneSetup = new SceneSetup(this);
        this.fragmentManager = new FragmentManager(this);
        
        // État
        this.isBreaking = false;
        this.isFragmentSelected = false;
        
        this.init();
    }

    init() {
        this.sceneSetup.init();
        this.sceneSetup.setupLights();
        this.sceneSetup.loadHDRI();
        this.fragmentManager.loadMirrorModel();
        this.animate();
        
        // Event listeners
        this.handleClick = this.handleClick.bind(this);
        document.addEventListener("click", this.handleClick);
        window.addEventListener("mousemove", (event) => this.fragmentManager.onMouseMove(event));
        window.addEventListener('resize', () => this.onWindowResize());
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.isBreaking) {
            this.fragmentManager.animateFragments();
        }
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    handleClick(event) {
        if (!this.isBreaking && this.mirror) {
            this.fragmentManager.breakMirror();
            return;
        }
        this.fragmentManager.handleFragmentClick(event);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

export { MirrorBreakEffect }; 