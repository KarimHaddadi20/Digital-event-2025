import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SceneSetup } from './SceneSetup.js';
import { Loader } from './Loader.js';

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

        // Initialiser les contrôles après la création de la scène
        this.setupControls();

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
            this.backButton.addEventListener('click', () => this.handleBackButton());
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
        this.loadBackgroundTexture('src/textures/homepage.webp');
    }

    loadBackgroundTexture(texturePath) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            texturePath,
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                
                const imageRatio = texture.image.width / texture.image.height;
                const screenRatio = window.innerWidth / window.innerHeight;
                
                let planeWidth, planeHeight;
                if (screenRatio > imageRatio) {
                    planeWidth = 20 * screenRatio;
                    planeHeight = planeWidth / imageRatio;
                } else {
                    planeHeight = 20;
                    planeWidth = planeHeight * imageRatio;
                }
                
                const bgGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                const bgMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    depthTest: false
                });
                const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
                
                bgMesh.position.z = -13;
                bgMesh.renderOrder = -1;
                
                this.camera.add(bgMesh);
                
                if (!this.scene.children.includes(this.camera)) {
                    this.scene.add(this.camera);
                }
            },
            undefined,
            (error) => {
                console.error("Erreur lors du chargement de l'image de fond:", error);
                this.setupDefaultBackground();
            }
        );
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

    handleBackButton() {
        // Nettoyer la scène actuelle
        if (this.app) {
            this.app.clearScene();
        }

        // Recréer la structure HTML nécessaire
        document.body.innerHTML = `
            <div id="loading-container">
                <div class="loading-title">
                    <span class="font-aktiv">Digital Event</span>
                    <span class="font-fraunces">Edition 2025</span>
                </div>
                <div id="percentage">0%</div>
                <div id="mirror-percentage">0%</div>
                <div class="loader-footer">
                    <img src="src/assets/icons/esd_logo_NoTexte_Jade 1.svg" alt="esd icon" width="40" height="40" />
                    <p>Ecole Supérieure du Digital</p>
                </div>
            </div>
            <div id="main-content" style="display: none">
                <div class="scene-wrapper">
                    <div id="scene-container"></div>
                    <div class="scroll-progress-container">
                        <div class="scroll-progress-bar">
                            <div class="scroll-progress-fill"></div>
                        </div>
                    </div>
                    <div class="mirror-instructions">
                        <p class="instruction-title">Cassez le miroir</p>
                        <p class="instruction-subtitle">Cliquez pour découvrir les ateliers</p>
                    </div>
                </div>
            </div>`;

        // Recréer la scène initiale
        this.recreateInitialScene();

        // Créer une nouvelle instance du loader
        const loader = new Loader();
        loader.init();
    }
} 