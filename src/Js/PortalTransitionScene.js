import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { SceneSetup } from './SceneSetup.js';

export class PortalTransitionScene extends SceneSetup {
    constructor(app) {
        // Appeler le constructeur parent sans HDRI
        super(false);
        
        this.app = app;
        this.fragments = [];
        this.time = 0;
        this.lastLogTime = 0;
        
        
        // Configuration de la caméra
        this.camera.position.set(0, 0, 20);
        this.camera.lookAt(0, 0, 0);
        
        // Forcer la réinitialisation complète de la scène
        this.scene = new THREE.Scene();
        
        // Configuration spécifique pour cette scène
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);
        
        // Configuration du renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Supprimer l'ancien renderer s'il existe
        const container = document.getElementById("scene-container");
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        container.appendChild(this.renderer.domElement);
        
        // Désactiver les contrôles pour cette scène
        if (this.controls) {
            this.controls.enabled = false;
        }
        
        // Configurer les lumières
        this.setupCustomLights();
        
        // Créer les fragments qui défilent
        this.createScrollingFragments();
        
        // Démarrer l'animation
        this.animate();
    }

    setupCustomLights() {
        // Vider les lumières existantes
        this.scene.children = this.scene.children.filter(child => !child.isLight);
        
        // Lumière ambiante plus forte
        const ambient = new THREE.AmbientLight(0xffffff, 2);
        this.scene.add(ambient);

        // Lumière principale plus intense
        const mainLight = new THREE.DirectionalLight(0x7c4dff, 5);
        mainLight.position.set(5, 5, 5);
        this.scene.add(mainLight);

        // Lumière d'accent cyan plus forte
        const accentLight = new THREE.SpotLight(0x00bcd4, 10);
        accentLight.position.set(-5, 3, 2);
        accentLight.angle = Math.PI / 3;
        accentLight.penumbra = 0.7;
        this.scene.add(accentLight);

        // Lumière de contre-jour rose plus intense
        const backLight = new THREE.DirectionalLight(0xe91e63, 3);
        backLight.position.set(0, -5, -5);
        this.scene.add(backLight);

    }

    createScrollingFragments() {
        // Créer le fragment principal avec la texture A1-01
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('src/textures/A1-01.png', (texture) => {
            const fragmentGeometry = new THREE.PlaneGeometry(4, 4);
            const fragmentMaterial = new THREE.MeshPhongMaterial({
                map: texture,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide
            });

            const mainFragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);
            mainFragment.position.set(0, 0, -10);
            this.scene.add(mainFragment);
            this.fragments.push(mainFragment);
        });

        // Créer les fragments décoratifs
        const fragmentGeometry = new THREE.IcosahedronGeometry(1, 0);
        const fragmentMaterial = new THREE.MeshPhongMaterial({
            color: 0x7c4dff,
            emissive: 0x2a0096,
            shininess: 100,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });


        // Créer plusieurs fragments avec des positions aléatoires
        for (let i = 0; i < 50; i++) {
            const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial.clone());
            
            // Position aléatoire dans un volume cylindrique
            const radius = Math.random() * 10 + 5;
            const angle = Math.random() * Math.PI * 2;
            const zPos = Math.random() * 100 - 50;
            
            fragment.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                zPos
            );
            
            fragment.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            fragment.scale.set(
                Math.random() * 0.5 + 0.5,
                Math.random() * 0.5 + 0.5,
                Math.random() * 0.5 + 0.5
            );
            
            this.fragments.push(fragment);
            this.scene.add(fragment);
        }


    }

    // Surcharger la méthode clearScene pour nettoyer le texte
    clearScene() {
        if (this.textElement) {
            this.textElement.remove();
        }
        
        // Sauvegarder les fragments avant de nettoyer
        const savedFragments = [...this.fragments];
        
        // Nettoyer la scène en appelant la méthode parent
        super.clearScene();
        
        // Réajouter les fragments à la scène
        savedFragments.forEach(fragment => {
            if (fragment.material && fragment.geometry) {
                this.scene.add(fragment);
            }
        });
        
        // Mettre à jour la liste des fragments
        this.fragments = savedFragments;
        
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.01;
        
        // Animer les fragments
        this.fragments.forEach((fragment, index) => {
            if (!fragment.material) {
                console.error('Fragment sans matériau détecté:', fragment);
                return;
            }
            
            // Mouvement en spirale
            const speed = 0.02;
            const radius = 5 + Math.sin(this.time + index) * 2;
            const angle = this.time * speed + index * (Math.PI * 2 / this.fragments.length);
            
            fragment.position.x = Math.cos(angle) * radius;
            fragment.position.y = Math.sin(angle) * radius;
            fragment.position.z += 0.1;
            
            // Rotation continue
            fragment.rotation.x += 0.01;
            fragment.rotation.y += 0.01;
            
            // Réinitialiser la position Z quand le fragment est trop loin
            if (fragment.position.z > 50) {
                fragment.position.z = -50;
            }
        });

        // Animer le texte
        if (this.textAnimation) {
            this.textAnimation();
        }
        
        // Rendu de la scène
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        } else {
            console.error('Renderer, scene ou camera manquant:', {
                renderer: !!this.renderer,
                scene: !!this.scene,
                camera: !!this.camera
            });
        }
    }
} 