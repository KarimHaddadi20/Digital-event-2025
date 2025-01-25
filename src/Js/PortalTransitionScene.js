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
        
        console.log('Initialisation de PortalTransitionScene');
        
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
        
        // Supprimer l'ancien renderer et les éléments CSS2D
        const container = document.getElementById("scene-container");
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        // Supprimer spécifiquement les éléments CSS2D
        const css2dElements = document.querySelectorAll('.css2d-label');
        css2dElements.forEach(element => {
            element.remove();
        });
        
        container.appendChild(this.renderer.domElement);
        
        // Désactiver les contrôles pour cette scène
        if (this.controls) {
            this.controls.enabled = false;
        }
        
        // Configurer les lumières
        this.setupCustomLights();
        
        // Créer les fragments qui défilent
        this.createScrollingFragments();

        // Créer le texte central
        this.createCenterText();
        
        console.log('Configuration initiale terminée');
        console.log('Nombre de fragments:', this.fragments.length);
        console.log('Objets dans la scène:', this.scene.children.length);
        
        // Démarrer l'animation
        this.animate();
    }

    logSceneStatus() {
        const currentTime = Date.now();
        if (currentTime - this.lastLogTime >= 1000) { // Log toutes les secondes
            console.log('Scene active: PortalTransitionScene');
            console.log('Nombre de fragments:', this.fragments.length);
            console.log('Position caméra:', this.camera.position);
            console.log('Objets dans la scène:', this.scene.children.length);
            this.lastLogTime = currentTime;
        }
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

        console.log('Lumières configurées:', this.scene.children.filter(child => child.isLight).length);
    }

    createScrollingFragments() {
        const fragmentGeometry = new THREE.IcosahedronGeometry(1, 0);
        const fragmentMaterial = new THREE.MeshPhongMaterial({
            color: 0x7c4dff,
            emissive: 0x2a0096,
            shininess: 100,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });

        console.log('Création des fragments de transition');

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

            console.log(`Fragment ${i} créé à la position:`, fragment.position);
            console.log(`Fragment ${i} matériau:`, fragment.material);
            
            this.fragments.push(fragment);
            this.scene.add(fragment);
        }

        // Ajouter un helper pour voir les axes
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        console.log('Nombre total de fragments créés:', this.fragments.length);
        console.log('Objets dans la scène après création des fragments:', this.scene.children.length);
    }

    createCenterText() {
        // Créer un texte HTML pour un résultat immédiat
        const textContainer = document.createElement('div');
        textContainer.style.position = 'fixed';
        textContainer.style.top = '50%';
        textContainer.style.left = '50%';
        textContainer.style.transform = 'translate(-50%, -50%)';
        textContainer.style.color = '#ffffff';
        textContainer.style.fontSize = '48px';
        textContainer.style.fontFamily = 'Arial, sans-serif';
        textContainer.style.textAlign = 'center';
        textContainer.style.textShadow = '0 0 10px #00ffff, 0 0 20px #0000ff';
        textContainer.style.zIndex = '1000';
        textContainer.style.pointerEvents = 'none';
        textContainer.style.opacity = '0';
        textContainer.innerHTML = 'Transition vers<br>une nouvelle dimension';
        document.body.appendChild(textContainer);

        // Animation d'apparition
        setTimeout(() => {
            textContainer.style.transition = 'opacity 1s ease-in-out';
            textContainer.style.opacity = '1';
        }, 100);

        // Stocker la référence pour pouvoir le supprimer plus tard
        this.textElement = textContainer;

        // Animation du texte
        const animate = () => {
            const scale = 1 + Math.sin(this.time * 2) * 0.1;
            textContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
        };

        // Ajouter l'animation à la boucle d'animation principale
        this.textAnimation = animate;
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
        
        console.log('Nettoyage de la scène terminé');
        console.log('Fragments conservés:', this.fragments.length);
        console.log('Objets dans la scène après nettoyage:', this.scene.children.length);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.01;
        
        // Log du statut
        this.logSceneStatus();
        
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