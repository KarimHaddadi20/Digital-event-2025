import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

class SceneSetup {
    constructor(useHDRI = true) {
        // Initialisation de base
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        // Configuration de base
        this.setupRenderer();
        this.setupCamera();
        this.setupControls();
        
        // Charger l'HDRI seulement si demandé
        if (useHDRI) {
            this.loadHDRI();
        }
        
        // Event listeners de base
        window.addEventListener('resize', () => this.onResize());
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        document.getElementById("scene-container").appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera.position.set(0, 0, 1);
        this.camera.lookAt(0, 0, 0);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;

        this.controls.minDistance = 50;
        this.controls.maxDistance = 200;
        this.controls.rotateSpeed = 0.5;
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffd7b3, 0.5);
        mainLight.position.set(5, 5, 5);
        this.scene.add(mainLight);

        const accentLight = new THREE.SpotLight(0x8080ff, 60);
        accentLight.position.set(-5, 3, 2);
        accentLight.angle = Math.PI / 4;
        accentLight.penumbra = 0.5;
        this.scene.add(accentLight);

        const backLight = new THREE.DirectionalLight(0x4040ff, 0.3);
        backLight.position.set(-3, -2, -3);
        this.scene.add(backLight);

        const frontLight = new THREE.SpotLight(0xccccff, 0);
        frontLight.position.set(0, 0, 5);
        frontLight.angle = Math.PI / 3;
        frontLight.penumbra = 0.7;
        this.scene.add(frontLight);
    }

    loadHDRI() {
        const rgbeLoader = new RGBELoader();
        rgbeLoader.load("src/assets/night.hdr", (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.background = texture;
            this.scene.environment = texture;
        });
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Méthode pour nettoyer la scène en préservant les éléments importants
    clearScene(preserveItems = []) {
        console.log('Début du nettoyage de la scène');
        
        // Sauvegarder l'état actuel
        const savedState = {
            environment: this.scene.environment,
            background: this.scene.background,
            fog: this.scene.fog,
            lights: [],
            preservedObjects: []
        };

        // Sauvegarder les lumières et les éléments à préserver
        this.scene.traverse((child) => {
            if (child.isLight) {
                savedState.lights.push(child);
            }
            if (preserveItems.includes(child)) {
                savedState.preservedObjects.push(child);
            }
        });

        // Nettoyer tous les objets de la scène
        while(this.scene.children.length > 0) { 
            const child = this.scene.children[0];
            this.scene.remove(child);
        }

        // Restaurer l'état
        this.scene.environment = savedState.environment;
        this.scene.background = savedState.background;
        this.scene.fog = savedState.fog;

        // Restaurer les lumières
        savedState.lights.forEach(light => {
            this.scene.add(light);
        });

        // Restaurer les objets préservés
        savedState.preservedObjects.forEach(obj => {
            this.scene.add(obj);
        });

        console.log('Fin du nettoyage de la scène');
        console.log('Objets restants:', this.scene.children.length);
    }

    // Méthode pour gérer la transition entre les scènes
    switchToGalleryScene(createNextScene, createTransitionScene = null) {
        console.log('Début de la transition vers une nouvelle scène');
        console.log('État actuel de la scène:', {
            environment: this.scene.environment ? 'Présent' : 'Absent',
            background: this.scene.background ? 'Présent' : 'Absent',
            nombreObjets: this.scene.children.length,
            type: this.constructor.name
        });
        
        // Créer le plan de transition
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

        let transitionScene = null;

        // Fonction pour le fade out
        const fadeOut = () => {
            if (fadeMaterial.opacity >= 1) {
                console.log('Fade out terminé');
                console.log('État avant nettoyage:', {
                    environment: this.scene.environment ? 'Présent' : 'Absent',
                    background: this.scene.background ? 'Présent' : 'Absent',
                    nombreObjets: this.scene.children.length
                });
                
                // Nettoyer la scène actuelle en préservant le plan de transition
                this.clearScene([fadePlane]);
                
                if (createTransitionScene) {
                    console.log('Création de la scène de transition');
                    transitionScene = createTransitionScene();
                    console.log('État après création de la scène de transition:', {
                        environment: this.scene.environment ? 'Présent' : 'Absent',
                        background: this.scene.background ? 'Présent' : 'Absent',
                        nombreObjets: this.scene.children.length,
                        type: transitionScene.constructor.name
                    });
                    
                    // Démarrer le fade in
                    fadeIn();
                } else {
                    console.log('Passage direct à la scène suivante');
                    createNextScene();
                    this.cleanupTransition(fadePlane);
                }
                return;
            }
            
            fadeMaterial.opacity += 0.02;
            requestAnimationFrame(fadeOut);
        };

        // Fonction pour le fade in
        const fadeIn = () => {
            if (fadeMaterial.opacity <= 0) {
                console.log('Fade in terminé');
                console.log('État avant passage à la scène suivante:', {
                    environment: this.scene.environment ? 'Présent' : 'Absent',
                    background: this.scene.background ? 'Présent' : 'Absent',
                    nombreObjets: this.scene.children.length,
                    type: transitionScene?.constructor.name
                });
                
                // Attendre avant de passer à la scène suivante
                setTimeout(() => {
                    console.log('Passage à la scène suivante');
                    createNextScene();
                    this.cleanupTransition(fadePlane);
                    
                    console.log('État final:', {
                        environment: this.scene.environment ? 'Présent' : 'Absent',
                        background: this.scene.background ? 'Présent' : 'Absent',
                        nombreObjets: this.scene.children.length,
                        type: this.constructor.name
                    });
                }, 3000);
                return;
            }
            
            fadeMaterial.opacity -= 0.02;
            requestAnimationFrame(fadeIn);
        };

        // Démarrer la séquence de transition
        fadeOut();
    }

    // Méthode pour nettoyer les éléments de transition
    cleanupTransition(fadePlane) {
        if (fadePlane) {
            fadePlane.geometry.dispose();
            fadePlane.material.dispose();
            this.scene.remove(fadePlane);
        }
    }
}

export { SceneSetup }; 