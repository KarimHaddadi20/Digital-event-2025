import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
    }

    init() {
        // Créer la scène
        this.scene = new THREE.Scene();

        // Configurer la caméra
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;

        // Configurer le renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Configurer les contrôles
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // Gérer le redimensionnement
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    cleanup() {
        // Supprimer les événements
        window.removeEventListener('resize', () => this.onWindowResize());

        // Supprimer le canvas
        if (this.renderer) {
            document.body.removeChild(this.renderer.domElement);
        }

        // Nettoyer la scène
        while(this.scene.children.length > 0) { 
            this.scene.remove(this.scene.children[0]); 
        }

        // Disposer des ressources
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
    }
} 