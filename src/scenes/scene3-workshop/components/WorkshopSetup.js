import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class WorkshopSetup {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.model = null;
        this.animations = [];
        this.mixer = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.interactiveObjects = [];
    }

    async init() {
        // Charger le modèle 3D de l'atelier
        const loader = new GLTFLoader();
        try {
            const gltf = await loader.loadAsync('/src/assets/models/workshop.glb');
            this.model = gltf.scene;
            this.scene.add(this.model);

            // Configuration des animations
            if (gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.model);
                this.animations = gltf.animations;
                this.animations.forEach(clip => {
                    this.mixer.clipAction(clip).play();
                });
            }

            // Configuration des objets interactifs
            this.setupInteractiveObjects();

        } catch (error) {
            console.error('Erreur lors du chargement du modèle:', error);
        }

        // Ajouter les événements
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onClick(e));
    }

    setupInteractiveObjects() {
        // Identifier les objets interactifs dans le modèle
        this.model.traverse(child => {
            if (child.isMesh && child.userData.interactive) {
                this.interactiveObjects.push(child);
            }
        });
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactiveObjects);

        // Effet de survol
        this.interactiveObjects.forEach(obj => {
            if (intersects.length > 0 && intersects[0].object === obj) {
                obj.material.emissive.setHex(0x333333);
            } else {
                obj.material.emissive.setHex(0x000000);
            }
        });
    }

    onClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactiveObjects);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData.action) {
                object.userData.action();
            }
        }
    }

    update() {
        if (this.mixer) {
            this.mixer.update(0.016); // Approximativement 60 FPS
        }
    }

    cleanup() {
        // Supprimer les événements
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('click', this.onClick);

        // Nettoyer le modèle
        if (this.model) {
            this.scene.remove(this.model);
            this.model.traverse(child => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });
        }

        // Nettoyer les animations
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer = null;
        }

        this.interactiveObjects = [];
    }
} 