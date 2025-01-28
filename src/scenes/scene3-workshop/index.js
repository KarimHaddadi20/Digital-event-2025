import * as THREE from 'three';
import { WorkshopSetup } from './components/WorkshopSetup';
import { LightingSetup } from '../../shared/components/LightingSetup';
import { SceneManager } from '../../shared/utils/SceneManager';

export default class WorkshopScene {
    constructor() {
        this.sceneManager = new SceneManager();
        this.workshop = null;
        this.lights = null;
    }

    init() {
        // Initialiser la scène
        this.sceneManager.init();

        // Configurer les lumières
        this.lights = new LightingSetup(this.sceneManager.scene);
        this.lights.setup();

        // Configurer l'atelier
        this.workshop = new WorkshopSetup(this.sceneManager.scene, this.sceneManager.camera);
        this.workshop.init();

        // Démarrer l'animation
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.workshop) {
            this.workshop.update();
        }

        this.sceneManager.render();
    }

    cleanup() {
        if (this.workshop) {
            this.workshop.cleanup();
        }
        this.sceneManager.cleanup();
        this.workshop = null;
        this.lights = null;
    }
} 