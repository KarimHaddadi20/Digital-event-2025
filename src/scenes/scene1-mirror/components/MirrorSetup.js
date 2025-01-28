import * as THREE from 'three';
import { WaterEffect } from '../../../shared/components/WaterEffect';

export class MirrorSetup {
    constructor(scene) {
        this.scene = scene;
        this.waterEffect = null;
        this.mirror = null;
    }

    setup() {
        // Créer le miroir
        const geometry = new THREE.PlaneGeometry(5, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.9,
            roughness: 0.1
        });

        this.mirror = new THREE.Mesh(geometry, material);
        this.scene.add(this.mirror);

        // Ajouter l'effet d'eau
        this.waterEffect = new WaterEffect(this.scene, this.mirror);
        this.waterEffect.init();
    }

    update() {
        if (this.waterEffect) {
            this.waterEffect.update();
        }
    }

    cleanup() {
        if (this.waterEffect) {
            this.waterEffect.cleanup();
        }
        if (this.mirror) {
            this.scene.remove(this.mirror);
            this.mirror.geometry.dispose();
            this.mirror.material.dispose();
        }
    }
} 