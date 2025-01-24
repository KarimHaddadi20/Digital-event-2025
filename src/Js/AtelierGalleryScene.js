// Imports nécessaires
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SceneSetup } from './SceneSetup.js';

export class AtelierGalleryScene extends SceneSetup {
    constructor(app, fragmentIndex = 0) {
        // Appeler le constructeur parent sans HDRI
        super(false);
        
        // Réinitialiser complètement l'environnement et l'arrière-plan
        this.scene.environment = null;
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.Fog(0x000000, 10, 50);

        // Charger le fond d'image
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('/src/textures/Atelier1.png', (texture) => {
            const aspectRatio = texture.image.width / texture.image.height;
            const bgGeometry = new THREE.PlaneGeometry(50 * aspectRatio, 50);
            const bgMaterial = new THREE.MeshBasicMaterial({ 
                map: texture,
                opacity: 0.5,
                transparent: true
            });
            const background = new THREE.Mesh(bgGeometry, bgMaterial);
            background.position.z = -30;
            this.scene.add(background);
        });
        
        this.fragments = [];
        this.svgSprites = [];
        this.currentFragmentIndex = fragmentIndex;
        this.time = 0;
        this.texts = null;

        this.waveConfig = {
            frequency: 0.8,
            amplitude: 0.2,
            speed: 2
        };

        this.fragmentsData = [
            {
                id: 1,
                title: "L'Horizon Perdu",
                description: "Une œuvre abstraite évoquant les limites entre ciel et terre"
            },
            {
                id: 2,
                title: "Mélodie Fractale",
                description: "Fragments géométriques inspirés par les motifs musicaux"
            },
            {
                id: 3,
                title: "Échos du Temps",
                description: "Représentation de la mémoire collective à travers les âges"
            },
            {
                id: 4,
                title: "Fusion Organique",
                description: "Mélange harmonieux entre nature et technologie"
            },
            {
                id: 5,
                title: "Résonance Cristalline",
                description: "Structure complexe reflétant la lumière et l'espace"
            },
            {
                id: 6,
                title: "Vagues Numériques",
                description: "Ondulations dynamiques dans l'espace virtuel"
            },
            {
                id: 7,
                title: "Symétrie Brisée",
                description: "Exploration des patterns chaotiques et ordonnés"
            },
            {
                id: 8,
                title: "Confluence",
                description: "Point de rencontre entre différentes dimensions"
            },
            {
                id: 9,
                title: "Nébulose Urbaine",
                description: "Abstraction de la vie citadine moderne"
            },
            {
                id: 10,
                title: "Métamorphose",
                description: "Transformation continue de la matière digitale"
            },
            {
                id: 11,
                title: "Équilibre Parfait",
                description: "Harmonie entre les forces opposées"
            }
        ];

        // Configuration de la scène
        this.setupGalleryLights();
        this.setupLabelRenderer();
        
        // Créer les éléments de la scène
        this.createFragments();
        this.loadTexts();
        this.createSVGSprites();
        this.setupEventListeners();

        // Animation d'entrée
        gsap.to(this.camera.position, {
            duration: 2,
            z: 7,
            ease: "power2.inOut"
        });

        // Démarrer l'animation
        this.animate();
    }

    setupGalleryLights() {
        // Lumière ambiante douce
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        // Lumière principale pour l'éclairage général
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(0, 1, 2);
        this.scene.add(mainLight);

        // Lumière d'accentuation pour les fragments
        const spotLight = new THREE.SpotLight(0xffffff, 1);
        spotLight.position.set(0, 5, 0);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.1;
        spotLight.decay = 2;
        spotLight.distance = 200;
        this.scene.add(spotLight);
    }

    setupLabelRenderer() {
        const container = document.getElementById('scene-container');
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(container.offsetWidth, container.offsetHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(this.labelRenderer.domElement);
    }

    createFragments() {
        const textureLoader = new THREE.TextureLoader();
        const mainTexture = textureLoader.load('/src/textures/Atelier1.png');
        const texture10 = textureLoader.load('/src/textures/Atelier1.png');
        const texture11 = textureLoader.load('/src/textures/Atelier1.png');

        Array.from({ length: 5 }).forEach((_, i) => {
            const geometry = new THREE.PlaneGeometry(6, 6, 50, 50);
            const material = new THREE.MeshPhysicalMaterial({
                map: mainTexture,
                metalness: 0.5,
                roughness: 0.3,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 1
            });

            const fragment = new THREE.Mesh(geometry, material);
            const isEven = i % 2 === 0;
            
            fragment.position.set(
                isEven ? -4 : 4,
                1,
                i * -22
            );

            const detailGeometry = new THREE.PlaneGeometry(10, 10, 50, 50);
            
            const detail1 = new THREE.Mesh(
                detailGeometry,
                new THREE.MeshPhysicalMaterial({
                    map: texture10,
                    metalness: 0.5,
                    roughness: 0.3,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.5
                })
            );
            
            const detail2 = new THREE.Mesh(
                detailGeometry,
                new THREE.MeshPhysicalMaterial({
                    map: texture11,
                    metalness: 0.5,
                    roughness: 0.3,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.7
                })
            );

            detail1.position.set(0, 2, -30);
            detail2.position.set(0, -2, -30);
            
            detail1.scale.set(0.5, 0.5, 0.5);
            detail2.scale.set(0.5, 0.5, 0.5);
            
            fragment.add(detail1);
            fragment.add(detail2);

            fragment.userData.id = this.fragmentsData[i].id;
            this.fragments.push(fragment);
            this.scene.add(fragment);
        });
    }

    createSVGSprites() {
        const spriteMap = new THREE.TextureLoader().load('/src/textures/Atelier1.png');
        const spriteMaterial = new THREE.SpriteMaterial({
            map: spriteMap,
            transparent: true,
            opacity: 2,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        for (let i = 0; i < 10; i++) {
            const sprite = new THREE.Sprite(spriteMaterial);
            this.positionSprite(sprite, true);
            this.svgSprites.push(sprite);
            this.scene.add(sprite);
        }
    }

    positionSprite(sprite, initial = false) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const z = initial ? Math.random() * -50 : this.camera.position.z - 50;
        
        sprite.position.set(
            side * (8 + Math.random() * 4),
            Math.random() * 10 - 5,
            z
        );
        
        const scale = 0.5 + Math.random() * 0.3;
        sprite.scale.set(scale, scale, 1);
        sprite.rotation.z = Math.random() * Math.PI * 2;
    }

    setupEventListeners() {
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
                    const speed = Math.abs(delta);
                    this.svgSprites.forEach(sprite => {
                        sprite.material.opacity = THREE.MathUtils.clamp(speed * 20, 0.2, 0.6);
                    });
                    this.updateFragments();
                }
            });
        }
    }

    updateFragments() {
        this.fragments.forEach(fragment => {
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
            
            const positions = fragment.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                
                const z = this.waveConfig.amplitude *
                    Math.sin(x * this.waveConfig.frequency + this.time) *
                    Math.cos(y * this.waveConfig.frequency + this.time);
                
                positions.setZ(i, z);
            }
            positions.needsUpdate = true;

            const label = fragment.children.find(child => child instanceof CSS2DObject);
            if (label) {
                label.element.style.opacity = fragment.material.opacity;
            }

            fragment.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    child.material.opacity = fragment.material.opacity;
                }
            });
        });
    }

    async loadTexts() {
        try {
            const response = await fetch('/src/data/texts.json');
            if (!response.ok) {
                this.texts = {
                    fragmentTexts: this.fragmentsData.map((f, index) => ({
                        id: f.id,
                        title: `Fragment ${index + 1}`,
                        description: f.description
                    }))
                };
            } else {
                this.texts = await response.json();
            }
            this.addTextLabels();
        } catch (error) {
            console.error('Error loading texts:', error);
            this.texts = {
                fragmentTexts: this.fragmentsData.map((f, index) => ({
                    id: f.id,
                    title: `Fragment ${index + 1}`,
                    description: f.description
                }))
            };
            this.addTextLabels();
        }
    }

    addTextLabels() {
        const mainFragments = this.fragments.filter((_, index) => index < 9);
        
        mainFragments.forEach((fragment, index) => {
            const textDiv = document.createElement('div');
            textDiv.className = 'label';
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'label-title';
            titleDiv.textContent = this.fragmentsData[index].title;
            
            const descDiv = document.createElement('div');
            descDiv.className = 'label-description';
            descDiv.textContent = this.fragmentsData[index].description;
            
            textDiv.appendChild(titleDiv);
            textDiv.appendChild(descDiv);
            
            textDiv.style.cssText = `
                color: white;
                padding: 8px;
                text-align: center;
                width: 200px;
                transform: translateY(10px);
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            `;
            
            titleDiv.style.cssText = `
                font-weight: bold;
                margin-bottom: 5px;
            `;
            
            descDiv.style.cssText = `
                font-size: 0.9em;
                opacity: 0.8;
            `;
            
            const label = new CSS2DObject(textDiv);
            label.position.set(0, -3.5, 0);
            textDiv.style.opacity = 0;
            textDiv.style.transition = 'opacity 0s ease-in-out';
            fragment.add(label);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateFragments();
        this.svgSprites.forEach(sprite => {
            sprite.position.z += 0.05;
            sprite.rotation.z += 0.05;
            
            if (sprite.position.z > this.camera.position.z + 10) {
                this.positionSprite(sprite);
            }
        });
        
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
    }

    onResize() {
        super.onResize();
        if (this.labelRenderer) {
            const container = document.getElementById('scene-container');
            this.labelRenderer.setSize(container.offsetWidth, container.offsetHeight);
        }
    }
}