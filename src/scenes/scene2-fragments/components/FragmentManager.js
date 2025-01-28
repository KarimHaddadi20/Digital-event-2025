import * as THREE from 'three';
import { Router } from '../../../routes/router';

export class FragmentManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.fragments = [];
        this.router = new Router();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    init() {
        // Créer les fragments du miroir
        this.createFragments();
        
        // Ajouter les événements
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onClick(e));
    }

    createFragments() {
        const fragmentsData = [
            { position: new THREE.Vector3(-2, 2, 0), rotation: new THREE.Euler(0.2, 0.1, 0.3), link: '/workshop' },
            { position: new THREE.Vector3(2, -1, 0), rotation: new THREE.Euler(-0.1, 0.2, -0.1), link: '/workshop' },
            { position: new THREE.Vector3(0, 0, 1), rotation: new THREE.Euler(0.1, -0.1, 0.2), link: '/workshop' }
        ];

        fragmentsData.forEach(data => {
            const geometry = new THREE.PlaneGeometry(1, 1.5);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.9,
                roughness: 0.1
            });

            const fragment = new THREE.Mesh(geometry, material);
            fragment.position.copy(data.position);
            fragment.rotation.copy(data.rotation);
            fragment.userData.link = data.link;

            this.fragments.push(fragment);
            this.scene.add(fragment);
        });
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.fragments);

        // Effet de survol
        this.fragments.forEach(fragment => {
            if (intersects.length > 0 && intersects[0].object === fragment) {
                fragment.material.emissive.setHex(0x333333);
            } else {
                fragment.material.emissive.setHex(0x000000);
            }
        });
    }

    onClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.fragments);

        if (intersects.length > 0) {
            const fragment = intersects[0].object;
            if (fragment.userData.link) {
                this.router.navigateTo(fragment.userData.link);
            }
        }
    }

    update() {
        // Animation des fragments
        this.fragments.forEach(fragment => {
            fragment.rotation.x += 0.001;
            fragment.rotation.y += 0.001;
        });
    }

    cleanup() {
        // Supprimer les événements
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('click', this.onClick);

        // Nettoyer les fragments
        this.fragments.forEach(fragment => {
            this.scene.remove(fragment);
            fragment.geometry.dispose();
            fragment.material.dispose();
        });
        this.fragments = [];
    }
} 