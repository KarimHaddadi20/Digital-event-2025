import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { SceneSetup } from './SceneSetup.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export class PortalTransitionScene extends SceneSetup {
    constructor(app) {
        super(false);
        
        this.app = app;
        this.fragments = [];
        this.currentFragmentIndex = 0;
        this.scrollThreshold = window.innerHeight * 0.2;
            this.scrollSpeed = 0.5; // Add scroll speed control


        // Initialize scroll tracking
        this.lastScrollPosition = 0;
        this.currentScrollPosition = 0;

        // Bind scroll handler
        window.addEventListener('scroll', this.handleScroll.bind(this));

        // Clear scene background
        this.scene.background = null;
        
        // Adjust texture loader and sphere creation
const textureLoader = new THREE.TextureLoader();
textureLoader.load(
    '/src/textures/monde/escape.png',
    (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1); // Adjust these values if needed

        const geometry = new THREE.SphereGeometry(2000, 128, 128); // Increased segments for better mapping
        const material = new THREE.MeshBasicMaterial({ 
            map: texture,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.8,
            color: 0x404040,
            depthTest: false,
            depthWrite: false,
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        this.scene.add(sphere);
    }
);

        // Adjust camera
        this.camera.position.set(0, 0, 8); // Rapprocher la caméra de 15 à 10
        this.camera.near = 0.1;
        this.camera.far = 3000;
        this.camera.updateProjectionMatrix();
        
        // Fragment data with first one visible
        this.fragmentsData = [
            {
                position: { x: -4, y: 0, z: 0 },  // Premier fragment plus proche (de 5 à 2)
                title: "Portal Gateway",
                description: "Enter the digital realm",
                initialOpacity: 1
            },
            {
                position: { x: 4, y: 0, z: -8 },  // Ajusté proportionnellement
                title: "Digital Nexus",
                description: "Connection point of realities",
                initialOpacity: 0
            },
            {
                position: { x: -4, y: 0, z: -18 }, // Ajusté proportionnellement
                title: "Data Stream",
                description: "Flow of information",
                initialOpacity: 0
            },
            {
                position: { x: 4, y: 0, z: -28 },  // Ajusté proportionnellement
                title: "Virtual Echo",
                description: "Resonance of code",
                initialOpacity: 0
                
            }
        ];
        
        this.setupScene();
        this.createScrollingFragments();

        this.currentScrollPosition = 0;
        this.scrollThreshold = 300; // Pixels per transition
        
        // Add scroll listener
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });
    }

    setupScene() {
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
        
        // Setup CSS2D renderer
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        document.getElementById('scene-container').appendChild(this.labelRenderer.domElement);
        
        // Désactiver les contrôles pour cette scène
        if (this.controls) {
            this.controls.enabled = false;
        }
        
        // Configurer les lumières
        this.setupCustomLights();
        
        // Ajouter le contrôle de défilement pour la caméra
        this.setupScrollControl();
        
        // Démarrer l'animation
        this.animate();

        // Ajuster la position initiale de la caméra dans setupScene aussi
        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(0, 0, 5); // Faire regarder la caméra vers le premier fragment
        
        // Définir les limites de zoom pour les contrôles
        if (this.controls) {
            this.controls.minDistance = 10;
            this.controls.maxDistance = 50;
            this.controls.target.set(0, 0, 5); // Point de focus sur le premier fragment
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

    }

    createScrollingFragments() {
        const textureLoader = new THREE.TextureLoader();

        textureLoader.load('src/textures/A1-01.png', (texture) => {
            this.fragmentsData.forEach((data, index) => {
                const fragmentGeometry = new THREE.PlaneGeometry(4, 4);
                const fragmentMaterial = new THREE.MeshPhongMaterial({
                    map: texture,
                    transparent: true,
                    opacity: data.initialOpacity, // Use initial opacity from data
                    side: THREE.DoubleSide
                });

                const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);
                fragment.position.set(data.position.x, data.position.y, data.position.z);

                const labelDiv = document.createElement('div');
                labelDiv.className = 'fragment-label';

                // Apply modern glassmorphism styles
                labelDiv.style.cssText = `
                    box-sizing: border-box;
                    padding: 15px;
                    width: 276px;
                    color: white;
                    text-align: center;
                    opacity: ${data.initialOpacity};
                    transition: opacity 0.5s ease;
                    background: linear-gradient(118.48deg, rgba(255, 255, 255, 0.16) -28.48%, rgba(255, 255, 255, 0.04) 100.43%);
                    backdrop-filter: blur(10px);
                    border-radius: 8px;
                `;

                labelDiv.innerHTML = `
                    <h3 style="margin: 0; font-size: 1.2em;">${data.title}</h3>
                    <p style="margin: 5px 0 0 0; font-size: 0.9em;">${data.description}</p>
                `;

                const label = new CSS2DObject(labelDiv);
                label.position.set(0, -3, 0);
                fragment.add(label);

                this.fragments.push(fragment);
                this.scene.add(fragment);

                // Assurer que le premier fragment est bien visible
                if (index === 0) {
                    fragment.position.z = 5; // Position plus proche de la caméra
                    fragmentMaterial.opacity = 1;
                    if (labelDiv) {
                        labelDiv.style.opacity = 1;
                    }
                }
            });

            // Force le rendu initial
            this.renderer.render(this.scene, this.camera);
            this.labelRenderer.render(this.scene, this.camera);
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
        
        // Update fragments opacity based on camera distance
        this.fragments.forEach((fragment, index) => {
            // Skip opacity transition for first fragment
            if (index === 0) return;
            
            const distance = fragment.position.z - this.camera.position.z;
            
            let opacity = 1;
            if (distance < -5 && distance > -15) {
                opacity = (distance + 15) / 10;
            } else if (distance > 5 && distance < 15) {
                opacity = 1 - ((distance - 5) / 10);
            } else if (distance <= -15 || distance >= 15) {
                opacity = 0;
            }
            
            fragment.material.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
            
            // Update label opacity
            const label = fragment.children.find(child => child instanceof CSS2DObject);
            if (label) {
                label.element.style.opacity = fragment.material.opacity;
            }
        });

        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);

        this.handleScroll(); // Ensure fragments update each frame
    }

    // Ajouter le contrôle de défilement pour la caméra
    setupScrollControl() {
        window.addEventListener('wheel', (event) => {
            event.preventDefault();
            
            const scrollSpeed = 0.05;  // Augmenté de 0.03 à 0.05 pour un défilement plus rapide
            const minZ = 15;
            
            // Réduire l'espacement entre les fragments
            const fragmentSpacing = 10; // Réduit de 20 à 10
            const lastFragment = this.fragments[this.fragments.length - 1];
            const maxZ = lastFragment ? lastFragment.position.z + 5 : -30; // Ajusté pour le nouvel espacement
            
            const delta = event.deltaY * scrollSpeed;
            const currentZ = this.camera.position.z;
            const targetZ = currentZ - delta;
            
            // Stop at fragment positions
            if (targetZ <= maxZ) {
                this.camera.position.z = maxZ;
                return;
            }
            
            gsap.to(this.camera.position, {
                z: THREE.MathUtils.clamp(targetZ, maxZ, minZ),
                duration: 1., // Longer duration for smoother movement
                ease: "power2.inOut", // Smoother easing
                onUpdate: () => {
                    this.fragments.forEach((fragment, index) => {
                        if (index === 0) return;
                        
                        const distance = fragment.position.z - this.camera.position.z;
                        // Wider visibility range for fragments
                        const textOpacity = Math.abs(distance) < 4 ? 1 : 0;
                        const fragmentOpacity = Math.abs(distance) < 6 ? 1 - Math.abs(distance) / 6 : 0;
                        
                        fragment.material.opacity = fragmentOpacity;
                        
                        const label = fragment.children.find(child => child instanceof CSS2DObject);
                        if (label && label.element) {
                            label.element.style.opacity = textOpacity;
                            label.element.style.transition = 'opacity 0.3s';
                        }
                    });
                }
            });
        }, { passive: false });
    }

    handleScroll = () => {
        this.currentScrollPosition = window.scrollY;
        
        this.fragmentsData.forEach((fragment, index) => {
            const distance = Math.abs(this.currentScrollPosition - (index * this.scrollThreshold));
            const opacity = index === 0 && this.currentScrollPosition < this.scrollThreshold ? 
                          1 : // Keep first fragment fully visible initially
                          Math.max(0, 1 - (distance / this.scrollThreshold));
            
            if (fragment.mesh) {
                fragment.mesh.material.opacity = opacity;
                fragment.mesh.visible = opacity > 0;
            }
        });

        this.lastScrollPosition = this.currentScrollPosition;
    }

    initializeFragments() {
        // Force first fragment to be visible
        if (this.fragmentsData[0].mesh) {
            this.fragmentsData[0].mesh.material.opacity = 1;
            this.fragmentsData[0].mesh.visible = true;
        }

        // Initialize others as invisible
        for (let i = 1; i < this.fragmentsData.length; i++) {
            if (this.fragmentsData[i].mesh) {
                this.fragmentsData[i].mesh.material.opacity = 0;
                this.fragmentsData[i].mesh.visible = false;
            }
        }
    }
}