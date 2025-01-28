import * as THREE from 'three';
import { MirrorSetup } from './components/MirrorSetup';
import { LightingSetup } from '../../shared/components/LightingSetup';
import { SceneManager } from '../../shared/utils/SceneManager';

export default class MirrorScene {
    constructor() {
        this.sceneManager = new SceneManager();
        this.mirror = null;
        this.lights = null;
    }

    init() {
        // Initialiser la scène
        this.sceneManager.init();

        // Configurer les lumières
        this.lights = new LightingSetup(this.sceneManager.scene);
        this.lights.setup();

        // Configurer le miroir
        this.mirror = new MirrorSetup(this.sceneManager.scene);
        this.mirror.setup();

        // Démarrer l'animation
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.mirror) {
            this.mirror.update();
        }

        this.sceneManager.render();
    }

    cleanup() {
        // Nettoyer les ressources
        this.sceneManager.cleanup();
        this.mirror = null;
        this.lights = null;
    }
} 