import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

class SceneSetup {
    constructor(useHDRI = true) {
        // Initialisation de base
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        // Configuration de base
        this.setupRenderer();
        this.setupCamera();
        this.setupControls();
        
        // Charger l'HDRI seulement si demandé
        if (useHDRI) {
            this.loadHDRI();
        }
        
        // Event listeners de base
        window.addEventListener('resize', () => this.onResize());
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        document.getElementById("scene-container").appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera.position.set(0, 0, 1);
        this.camera.lookAt(0, 0, 0);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;

        this.controls.minDistance = 50;
        this.controls.maxDistance = 200;
        this.controls.rotateSpeed = 0.5;
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffd7b3, 0.5);
        mainLight.position.set(5, 5, 5);
        this.scene.add(mainLight);

        const accentLight = new THREE.SpotLight(0x8080ff, 60);
        accentLight.position.set(-5, 3, 2);
        accentLight.angle = Math.PI / 4;
        accentLight.penumbra = 0.5;
        this.scene.add(accentLight);

        const backLight = new THREE.DirectionalLight(0x4040ff, 0.3);
        backLight.position.set(-3, -2, -3);
        this.scene.add(backLight);

        const frontLight = new THREE.SpotLight(0xccccff, 0);
        frontLight.position.set(0, 0, 5);
        frontLight.angle = Math.PI / 3;
        frontLight.penumbra = 0.7;
        this.scene.add(frontLight);
    }

    loadHDRI() {
        const rgbeLoader = new RGBELoader();
        rgbeLoader.load("src/assets/night.hdr", (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.background = texture;
            this.scene.environment = texture;
        });
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Méthode pour nettoyer la scène
    clearScene() {
        // Nettoyer l'environnement et l'arrière-plan
        this.scene.environment = null;
        this.scene.background = null;
        this.scene.fog = null;

        // Nettoyer tous les objets de la scène
        while(this.scene.children.length > 0) { 
            const child = this.scene.children[0];
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
            if (child.geometry) {
                child.geometry.dispose();
            }
            this.scene.remove(child);
        }
    }
}

export { SceneSetup }; 