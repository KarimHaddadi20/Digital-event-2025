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
        
        // Initial camera setup to see first fragment
        this.camera.position.set(0, 0, 8); // Moved closer
        this.camera.lookAt(0, 0, 0);
        
        // Fragment data with first one visible
        this.fragmentsData = [
            {
                position: { x: -4, y: 0, z: 2 }, // Closer position
                title: "Portal Gateway",
                description: "Enter the digital realm",
                initialOpacity: 1 // Force first fragment visible
            },
            {
                position: { x: 4, y: 0, z: -15 }, // Closer spacing
                title: "Digital Nexus",
                description: "Connection point of realities",
                initialOpacity: 0
            },
            {
                position: { x: -4, y: 0, z: -30 }, // Closer spacing
                title: "Data Stream",
                description: "Flow of information",
                initialOpacity: 0
            },
            {
                position: { x: 4, y: 0, z: -45 }, // Closer spacing
                title: "Virtual Echo",
                description: "Resonance of code",
                initialOpacity: 0
            }
        ];
        
        this.setupScene();
        this.createScrollingFragments();
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
                labelDiv.innerHTML = `
                    <h3 style="margin: 0; font-size: 1.2em;">${data.title}</h3>
                    <p style="margin: 5px 0 0 0; font-size: 0.9em;">${data.description}</p>
                `;
                labelDiv.style.color = 'white';
                labelDiv.style.textAlign = 'center';
                labelDiv.style.opacity = data.initialOpacity; // Use initial opacity from data
                labelDiv.style.transition = 'opacity 0.5s ease';

                const label = new CSS2DObject(labelDiv);
                label.position.set(0, -3, 0);
                fragment.add(label);

                this.fragments.push(fragment);
                this.scene.add(fragment);
            });
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
            // Update main fragment opacity
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
            
            // Update child fragments opacity
            fragment.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    child.material.opacity = fragment.material.opacity;
                }
            });

            // Update label opacity
            const label = fragment.children.find(child => child instanceof CSS2DObject);
            if (label) {
                label.element.style.opacity = fragment.material.opacity;
            }
        });

        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
    }

    // Ajouter le contrôle de défilement pour la caméra
    setupScrollControl() {
        window.addEventListener('wheel', (event) => {
            event.preventDefault();
            
            // Slower scroll speed for better control
            const scrollSpeed = 0.03;
            const minZ = 8;
            
            // Adjust fragment spacing
            const fragmentSpacing = 20; // Reduced from default
            const lastFragment = this.fragments[this.fragments.length - 1];
            const maxZ = lastFragment ? lastFragment.position.z + 5 : -45;
            
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
                duration: 1, // Longer duration for smoother movement
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

    createFragments() {
        const fragmentCount = 5; // Number of main fragments
        const spacing = 10; // Space between main fragments
    
        for (let i = 0; i < fragmentCount; i++) {
            // Create main fragment
            const mainFragment = this.createFragment();
            mainFragment.position.z = i * spacing;
            
            // Position main fragments alternating left and right
            mainFragment.position.x = (i % 2 === 0) ? -5 : 5;
            
            this.fragments.push(mainFragment);
            this.scene.add(mainFragment);
    
            // Create two child fragments for each main fragment
            const childSpacing = 3; // Space between children
            const childOffset = 2; // How far children are from parent
    
            for (let j = 0; j < 2; j++) {
                const childFragment = this.createFragment(0.7); // Smaller scale
                
                // Position children on opposite side of parent
                childFragment.position.z = mainFragment.position.z + (j - 0.5) * childSpacing;
                childFragment.position.x = mainFragment.position.x > 0 ? 
                                         -childOffset : // If parent is right, children go left
                                         childOffset;  // If parent is left, children go right
                
                mainFragment.add(childFragment);
            }
        }
    }
}