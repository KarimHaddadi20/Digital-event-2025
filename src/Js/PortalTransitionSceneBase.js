import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SceneSetup } from './SceneSetup.js';

export class PortalTransitionSceneBase extends SceneSetup {
    constructor(app, selectedFragmentIndex) {
        super(false);
        
        this.app = app;
        this.selectedFragmentIndex = selectedFragmentIndex;
        this.fragments = [];
        this.time = 0;
        
        this.camera.position.set(0, 0, 7);
        this.camera.lookAt(0, 0, 0);
        
        this.progressContainer = document.querySelector('.scroll-progress-container');
        this.progressFill = document.querySelector('.scroll-progress-fill');
        
        if (this.progressContainer) {
            this.progressContainer.style.opacity = '1';
        }
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Désactiver les contrôles
        if (this.controls) {
            this.controls.enabled = false;
            this.controls.enableRotate = false;
            this.controls.enablePan = false;
            this.controls.enableZoom = false;
        }

        // Initialisation du bouton back
        this.backButton = document.querySelector('#back-button');
        if (this.backButton) {
            this.backButton.style.display = 'block';
            this.backButton.addEventListener('click', () => this.refreshPage());
        }

        this.initScene();
    }

    initScene() {
        console.log('InitScene Base - Début');
        this.setupRenderers();
        this.setupCustomLights();
        this.setupBackground();
        this.setupFragments();
        console.log('InitScene Base - Avant animate');
        this.animate();
        console.log('InitScene Base - Fin');
    }

    setupRenderers() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        
        const container = document.getElementById("scene-container");
        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);
        container.appendChild(this.labelRenderer.domElement);
    }

    setupCustomLights() {
        this.scene.children = this.scene.children.filter(child => !child.isLight);
        
        const ambient = new THREE.AmbientLight(0xffffff, 2);
        this.scene.add(ambient);

        const mainLight = new THREE.DirectionalLight(0x7c4dff, 5);
        mainLight.position.set(5, 5, 5);
        this.scene.add(mainLight);

        const accentLight = new THREE.SpotLight(0x00bcd4, 10);
        accentLight.position.set(-5, 3, 2);
        accentLight.angle = Math.PI / 3;
        accentLight.penumbra = 0.7;
        this.scene.add(accentLight);

        const backLight = new THREE.DirectionalLight(0xe91e63, 3);
        backLight.position.set(0, -5, -5);
        this.scene.add(backLight);
    }

    async setupBackground() {
        try {
            const response = await fetch('/src/data/portalData.json');
            const data = await response.json();
            
            const atelierIndex = this.selectedFragmentIndex + 1;
            const atelierKey = `atelier${atelierIndex}`;
            const atelierData = data[atelierKey];
            
            if (!atelierData?.backgroundImage) {
                this.setupDefaultBackground();
                return;
            }

            this.loadBackgroundTexture(atelierData.backgroundImage);
        } catch (error) {
            console.error("Erreur lors du chargement des données:", error);
            this.setupDefaultBackground();
        }
    }

    setupDefaultBackground() {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('src/textures/homepage7.webp', (texture) => {
            const aspectRatio = texture.image.width / texture.image.height;
            const bgGeometry = new THREE.PlaneGeometry(600 * aspectRatio, 550);
            const bgMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.FrontSide,
                transparent: true,
            });

            this.background = new THREE.Mesh(bgGeometry, bgMaterial);
            this.background.position.z = -300;
            this.background.position.y = 0;
            texture.encoding = THREE.sRGBEncoding;

            this.scene.add(this.background);
            this.scene.background = new THREE.Color(0x000000);
        });
    }

    loadBackgroundTexture(path) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(path, (texture) => {
            const aspectRatio = texture.image.width / texture.image.height;
            const bgGeometry = new THREE.PlaneGeometry(600 * aspectRatio, 550);
            const bgMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.FrontSide,
                transparent: true,
            });

            if (this.background) {
                this.scene.remove(this.background);
                this.background.geometry.dispose();
                this.background.material.dispose();
            }

            this.background = new THREE.Mesh(bgGeometry, bgMaterial);
            this.background.position.z = -300;
            this.background.position.y = 0;
            texture.encoding = THREE.sRGBEncoding;

            this.scene.add(this.background);
            this.scene.background = new THREE.Color(0x000000);
        });
    }

    updateParallax() {
        if (this.background) {
            // Calculer la position relative de la caméra par rapport à sa position initiale
            const cameraZOffset = this.camera.position.z - 7; // 7 est la position initiale en Z
            
            // Appliquer un très léger zoom au background basé sur la position de la caméra
            const zoomFactor = 1 + (Math.abs(cameraZOffset) * 0.0005); // Facteur très faible pour un effet subtil
            this.background.scale.set(zoomFactor, zoomFactor, 1);
            
            // Ajuster légèrement la position Z du background pour donner une sensation de profondeur
            this.background.position.z = -300 + (cameraZOffset * 0.1);
        }
    }

    loadTexture(loader, path) {
        return new Promise((resolve, reject) => {
            if (!path) {
                console.warn('Chemin de texture manquant');
                // Créer un canvas vide pour la texture par défaut
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Pixel transparent
                ctx.fillRect(0, 0, 1, 1);
                
                const defaultTexture = new THREE.CanvasTexture(canvas);
                defaultTexture.needsUpdate = true;
                defaultTexture.colorSpace = THREE.SRGBColorSpace;
                resolve(defaultTexture);
                return;
            }

            loader.load(
                path,
                (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.warn(`Erreur lors du chargement de la texture ${path}:`, error);
                    // Créer un canvas vide pour la texture par défaut
                    const canvas = document.createElement('canvas');
                    canvas.width = 1;
                    canvas.height = 1;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Pixel transparent
                    ctx.fillRect(0, 0, 1, 1);
                    
                    const defaultTexture = new THREE.CanvasTexture(canvas);
                    defaultTexture.needsUpdate = true;
                    defaultTexture.colorSpace = THREE.SRGBColorSpace;
                    resolve(defaultTexture);
                }
            );
        });
    }

    addFragmentLabel(fragment, data) {
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
        fragment.add(label);
    }

    updateWaveEffect(mesh) {
        const positions = mesh.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = 0.2 * Math.sin(x * 0.8 + this.time) * Math.cos(y * 0.8 + this.time);
            positions.setZ(i, z);
        }
        positions.needsUpdate = true;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.time += 0.01;
        this.updateFragments();
        this.updateParallax();
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            this.labelRenderer.render(this.scene, this.camera);
        }
    }

    cleanup() {
        if (this.progressContainer) {
            this.progressContainer.style.opacity = '0';
        }
    }

    // Méthodes à implémenter dans les classes enfants
    setupFragments() {
        throw new Error('setupFragments doit être implémenté dans la classe enfant');
    }

    updateFragments() {
        throw new Error('updateFragments doit être implémenté dans la classe enfant');
    }

    refreshPage() {
        // Nettoyer la scène et les ressources
        if (this.app) {
            this.app.clearScene();
        }

        // Supprimer les event listeners
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('click', this.handleFragmentClick);
        window.removeEventListener('resize', this.onWindowResize);

        // Nettoyer les contrôles
        if (this.controls) {
            this.controls.dispose();
        }

        // Recharger la page
        window.location.reload();
    }
} 
