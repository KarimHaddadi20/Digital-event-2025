import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SceneSetup } from './SceneSetup.js';
import { PortalTransitionSceneDesktop } from './PortalTransitionSceneDesktop.js';
import { PortalTransitionSceneMobile } from './PortalTransitionSceneMobile.js';

export class PortalTransitionScene {
    constructor(app, selectedFragmentIndex) {
        this.scene = this.createScene(app, selectedFragmentIndex);
        
        // Écouter les changements de taille d'écran
        window.addEventListener('resize', () => {
            const newScene = this.createScene(app, selectedFragmentIndex);
            
            // Nettoyer l'ancienne scène
            if (this.scene && this.scene.cleanup) {
                this.scene.cleanup();
            }
            
            this.scene = newScene;
        });
    }

    createScene(app, selectedFragmentIndex) {
        const width = window.innerWidth;
        if (width <= 768) {
            return new PortalTransitionSceneMobile(app, selectedFragmentIndex);
        } else {
            return new PortalTransitionSceneDesktop(app, selectedFragmentIndex);
        }
    }

    cleanup() {
        if (this.scene && this.scene.cleanup) {
            this.scene.cleanup();
        }
    }
}