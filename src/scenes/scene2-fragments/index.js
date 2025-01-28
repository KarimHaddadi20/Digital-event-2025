import * as THREE from 'three';
import { FragmentManager } from './components/FragmentManager';
import { LightingSetup } from '../../shared/components/LightingSetup';
import { SceneManager } from '../../shared/utils/SceneManager';

export default class FragmentsScene {
    constructor() {
        this.sceneManager = new SceneManager();
        this.fragmentManager = null;
        this.lights = null;
    }

    init() {
        // Initialiser la scène
        this.sceneManager.init();

        // Configurer les lumières
        this.lights = new LightingSetup(this.sceneManager.scene);
        this.lights.setup();

        // Configurer les fragments
        this.fragmentManager = new FragmentManager(this.sceneManager.scene, this.sceneManager.camera);
        this.fragmentManager.init();

        // Démarrer l'animation
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.fragmentManager) {
            this.fragmentManager.update();
        }

        this.sceneManager.render();
    }

    cleanup() {
        if (this.fragmentManager) {
            this.fragmentManager.cleanup();
        }
        this.sceneManager.cleanup();
        this.fragmentManager = null;
        this.lights = null;
    }
} 