import * as THREE from 'three';

export class LightingSetup {
    constructor(scene) {
        this.scene = scene;
        this.lights = [];
    }

    setup() {
        // Lumière ambiante
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.lights.push(ambientLight);
        this.scene.add(ambientLight);

        // Lumière directionnelle principale
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(5, 5, 5);
        mainLight.castShadow = true;
        this.lights.push(mainLight);
        this.scene.add(mainLight);

        // Configuration des ombres pour la lumière directionnelle
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 500;

        // Lumières d'accentuation
        const accentLight1 = new THREE.PointLight(0x00ffff, 1, 10);
        accentLight1.position.set(-5, 2, -5);
        this.lights.push(accentLight1);
        this.scene.add(accentLight1);

        const accentLight2 = new THREE.PointLight(0xff00ff, 1, 10);
        accentLight2.position.set(5, 2, -5);
        this.lights.push(accentLight2);
        this.scene.add(accentLight2);
    }

    update() {
        // Animation des lumières d'accentuation si nécessaire
        const time = Date.now() * 0.001;
        this.lights[2].intensity = 0.5 + Math.sin(time) * 0.5;
        this.lights[3].intensity = 0.5 + Math.sin(time + Math.PI) * 0.5;
    }

    cleanup() {
        // Supprimer toutes les lumières de la scène
        this.lights.forEach(light => {
            this.scene.remove(light);
        });
        this.lights = [];
    }
} 