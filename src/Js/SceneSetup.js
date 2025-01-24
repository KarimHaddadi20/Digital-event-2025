import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

class SceneSetup {
    constructor(app) {
        this.app = app;
    }

    init() {
        this.app.renderer.setSize(window.innerWidth, window.innerHeight);
        this.app.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById("scene-container").appendChild(this.app.renderer.domElement);

        // Reculer la caméra pour voir la scène
        this.app.camera.position.set(0, 0, 1);
        this.app.camera.lookAt(0, 0, 0);

        // Configuration des contrôles orbitaux
        this.app.controls = new OrbitControls(this.app.camera, this.app.renderer.domElement);
        this.app.controls.enableDamping = true;
        this.app.controls.dampingFactor = 0.05;
        this.app.controls.enableZoom = true;
        this.app.controls.enablePan = true;
        this.app.controls.enableRotate = true;

        // Limites de rotation et zoom
        this.app.controls.minDistance = 50;
        this.app.controls.maxDistance = 200;
        this.app.controls.rotateSpeed = 0.5;
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.app.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffd7b3, 0.5);
        mainLight.position.set(5, 5, 5);
        this.app.scene.add(mainLight);

        const accentLight = new THREE.SpotLight(0x8080ff, 60);
        accentLight.position.set(-5, 3, 2);
        accentLight.angle = Math.PI / 4;
        accentLight.penumbra = 0.5;
        this.app.scene.add(accentLight);

        const backLight = new THREE.DirectionalLight(0x4040ff, 0.3);
        backLight.position.set(-3, -2, -3);
        this.app.scene.add(backLight);

        const frontLight = new THREE.SpotLight(0xccccff, 0);
        frontLight.position.set(0, 0, 5);
        frontLight.angle = Math.PI / 3;
        frontLight.penumbra = 0.7;
        this.app.scene.add(frontLight);
    }

    loadHDRI() {
        const rgbeLoader = new RGBELoader();
        rgbeLoader.load("src/assets/night.hdr", (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.app.scene.background = texture;
            this.app.scene.environment = texture;
        });
    }
}

export { SceneSetup }; 