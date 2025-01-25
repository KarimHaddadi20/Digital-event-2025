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
        this.originalFragmentPosition = null;
        this.isReturning = false;
        
        
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
        
        // Créer le plan de fade
        const fadeGeometry = new THREE.PlaneGeometry(100, 100);
        const fadeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            depthTest: false
        });
        this.fadePlane = new THREE.Mesh(fadeGeometry, fadeMaterial);
        this.fadePlane.position.z = this.camera.position.z - 1;
        this.fadePlane.renderOrder = 999;
        this.scene.add(this.fadePlane);
        
        // Créer les fragments qui défilent
        this.createScrollingFragments();
        
        // Ajouter l'écouteur pour le bouton retour
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => this.handleReturn());
        }
        
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

            // Créer les fragments décoratifs
            const decorativeGeometry = new THREE.IcosahedronGeometry(1, 0);
            const decorativeMaterial = new THREE.MeshPhongMaterial({
                color: 0x7c4dff,
                emissive: 0x2a0096,
                shininess: 100,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide
            });

            // Créer plusieurs fragments avec des positions aléatoires
            for (let i = 0; i < 50; i++) {
                const fragment = new THREE.Mesh(decorativeGeometry, decorativeMaterial.clone());
                
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

            // Démarrer le fade in une fois que tout est chargé
            this.startFadeIn();
        });
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
        
        if (!this.isReturning) {
            this.time += 0.01;
            
            // Animation normale des fragments
            this.fragments.forEach((fragment, index) => {
                if (!fragment.material) return;
                
                const speed = 0.02;
                const radius = 5 + Math.sin(this.time + index) * 2;
                const angle = this.time * speed + index * (Math.PI * 2 / this.fragments.length);
                
                fragment.position.x = Math.cos(angle) * radius;
                fragment.position.y = Math.sin(angle) * radius;
                fragment.position.z += 0.1;
                
                fragment.rotation.x += 0.01;
                fragment.rotation.y += 0.01;
                
                if (fragment.position.z > 50) {
                    fragment.position.z = -50;
                }
            });
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

    startFadeIn() {
        const fadeIn = () => {
            if (this.fadePlane.material.opacity <= 0) {
                // Fade in terminé, nettoyer le plan de fade
                this.fadePlane.geometry.dispose();
                this.fadePlane.material.dispose();
                this.scene.remove(this.fadePlane);
                return;
            }
            
            this.fadePlane.material.opacity -= 0.02;
            requestAnimationFrame(fadeIn);
        };
        
        fadeIn();
    }

    handleReturn() {
        if (this.isReturning) return;
        this.isReturning = true;

        // Créer un plan noir pour le fade out
        const fadeGeometry = new THREE.PlaneGeometry(100, 100);
        const fadeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthTest: false
        });
        const fadePlane = new THREE.Mesh(fadeGeometry, fadeMaterial);
        fadePlane.position.z = this.camera.position.z - 1;
        fadePlane.renderOrder = 999;
        this.scene.add(fadePlane);

        // Animation de fade out
        const fadeOut = () => {
            if (fadeMaterial.opacity >= 1) {
                // Nettoyer la scène actuelle
                this.clearScene();
                
                // Supprimer tous les éléments CSS2D
                const css2dElements = document.querySelectorAll('.css2d-label');
                css2dElements.forEach(element => element.remove());
                
                // Supprimer le renderer actuel
                const container = document.getElementById("scene-container");
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
                
                // Recréer la scène initiale via l'app
                if (this.app && typeof this.app.recreateInitialScene === 'function') {
                    this.app.recreateInitialScene();
                } else {
                    console.error('Impossible de recréer la scène initiale');
                }
                return;
            }
            
            fadeMaterial.opacity += 0.02;
            requestAnimationFrame(fadeOut);
        };

        fadeOut();
    }
} 