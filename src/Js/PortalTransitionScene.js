import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SceneSetup } from './SceneSetup.js';

export class PortalTransitionScene extends SceneSetup {
    constructor(app) {
        super(false);
        
        this.app = app;
        this.fragments = [];
        this.time = 0; // Initialisation du temps
        this.camera.position.set(0, 0, 7); // Position initiale de la caméra
        this.camera.lookAt(0, 0, 0);
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Configuration du renderer
        this.setupRenderers();
        
        // Configuration des lumières
        this.setupCustomLights();
        
        // Ajouter le background
        this.setupBackground();
        
        // Ajouter les fragments de manière asynchrone
        this.setupFragments();
        
        // Configurer le scroll
        this.setupScrollHandler();
        
        // Démarrer l'animation
        this.animate();
    }

    setupRenderers() {
        // WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // CSS2D Renderer
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        
        // Nettoyer et ajouter les renderers
        const container = document.getElementById("scene-container");
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        container.appendChild(this.renderer.domElement);
        container.appendChild(this.labelRenderer.domElement);
    }

    setupScrollHandler() {
        let timeoutId = null;
        window.addEventListener('wheel', (event) => {
            if (timeoutId) return;
            timeoutId = setTimeout(() => {
                this.onScroll(event);
                timeoutId = null;
            }, 18);
        }, { passive: false });
    }

    onScroll(event) {
        event.preventDefault();
        
        const scrollSpeed = 0.1;
        const minZ = 6;
        const maxZ = -(this.fragments.length * 20) + minZ;
        const currentZ = this.camera.position.z;
        
        let delta = event.deltaY * scrollSpeed;
        
        if (currentZ - delta > minZ) delta = currentZ - minZ;
        if (currentZ - delta < maxZ) delta = currentZ - maxZ;
        
        if (currentZ - delta >= maxZ && currentZ - delta <= minZ) {
            gsap.to(this.camera.position, {
                z: currentZ - delta,
                duration: 1.2,
                ease: "power3.out",
                onUpdate: () => {
                    this.updateFragments();
                }
            });
        }
    }

    updateFragments() {
        this.fragments.forEach(fragment => {
            const mesh = fragment.mesh;
            if (!mesh) return;

            const distance = mesh.position.z - this.camera.position.z;
            
            let opacity = 1;
            if (distance < -5 && distance > -15) {
                opacity = (distance + 15) / 10;
            } else if (distance > 5 && distance < 15) {
                opacity = 1 - ((distance - 5) / 10);
            } else if (distance <= -15 || distance >= 15) {
                opacity = 0;
            }
            
            if (mesh.material) {
                mesh.material.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
            }

            const positions = mesh.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                
                const z = 0.2 *
                    Math.sin(x * 0.8 + this.time) *
                    Math.cos(y * 0.8 + this.time);
                
                positions.setZ(i, z);
            }
            positions.needsUpdate = true;

            const xOffset = fragment.exitDirection === 'left' ? -20 : 20;
            const xPosition = (distance / 30) * xOffset;
            mesh.position.x = fragment.exitDirection === 'left' ? 
                Math.min(xPosition, -4) :
                Math.max(xPosition, 4);

            const label = mesh.children.find(child => child instanceof CSS2DObject);
            if (label) {
                label.element.style.opacity = mesh.material.opacity;
            }
        });
    }

    async setupFragments() {
        try {
            const response = await fetch('/src/data/portalData.json');
            const data = await response.json();
            
            // Récupérer les données de l'atelier correspondant
            const atelierData = data.atelier1; // À adapter selon l'atelier
            
            const fragmentsData = atelierData.sets.map((set, index) => ({
                texture: set.image,
                title: set.title,
                subtitle: set.subtitle,
                position: { 
                    x: index % 2 === 0 ? -4 : 4, 
                    y: 1, 
                    z: -5 - (index * 10) 
                },
                exitDirection: index % 2 === 0 ? 'left' : 'right'
            }));

            fragmentsData.forEach(data => this.createFragment(data));
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    }

    createFragment(data) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(data.texture, (texture) => {
            const geometry = new THREE.PlaneGeometry(6, 6, 50, 50);
            const material = new THREE.MeshStandardMaterial({
                map: texture,
                metalness: 0.1,
                roughness: 0.8,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 1
            });
            const imageMesh = new THREE.Mesh(geometry, material);
            imageMesh.position.set(data.position.x, data.position.y, data.position.z);
            this.scene.add(imageMesh);
            
            const textContainer = document.createElement('div');
            textContainer.className = 'portal-text';
            
            const title = document.createElement('h2');
            title.textContent = data.title;
            title.style.cssText = `
                font-family: 'Fraunces, serif';
                font-size: 1.2em;
                color: white;
                margin: 0 0 0.5em 0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            `;
            
            const subtitle = document.createElement('p');
            subtitle.textContent = data.subtitle;
            subtitle.style.cssText = `
                font-family: 'Aktiv Grotesk, sans-serif';
                font-size: 0.9em;
                color: rgba(255, 255, 255, 0.8);
                margin: 0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            `;
            
            textContainer.appendChild(title);
            textContainer.appendChild(subtitle);
            
            const label = new CSS2DObject(textContainer);
            label.position.set(0, -3.5, 0);
            imageMesh.add(label);
            
            this.fragments.push({
                mesh: imageMesh,
                exitDirection: data.exitDirection
            });
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.01; // Mise à jour du temps
        this.updateFragments(); // Mise à jour des fragments à chaque frame
        
        // Rendu de la scène
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            this.labelRenderer.render(this.scene, this.camera);
        }
    }

    setupBackground() {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('src/textures/escape.png', (texture) => {
            const aspectRatio = window.innerWidth / window.innerHeight;
            const bgGeometry = new THREE.PlaneGeometry(40 * aspectRatio, 40);
            const bgMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide
            });
            const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
            bgMesh.position.z = -30;
            bgMesh.renderOrder = -1;
            this.scene.add(bgMesh);
        });
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
} 