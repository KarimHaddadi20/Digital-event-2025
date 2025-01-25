import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { Loader } from "./Loader.js";

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

        // Nettoyer l'environment et le background
        this.scene.environment = null;
        this.scene.background = null;
        this.scene.fog = null;

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
        let fadeOutComplete = false;

        // Fonction pour le fade out
        const fadeOut = () => {
            if (!fadeOutComplete) {
                fadeMaterial.opacity += 0.02;
                
                if (fadeMaterial.opacity >= 1) {
                    fadeOutComplete = true;
                    console.log('Fade out terminé');
                    
                    // Nettoyer la scène seulement après que le fade out soit terminé
                    this.clearScene([fadePlane]);
                    
                    if (createTransitionScene) {
                        console.log('Création de la scène de transition');
                        transitionScene = createTransitionScene();
                        fadeIn();
                    } else {
                        console.log('Passage direct à la scène suivante');
                        createNextScene();
                        this.cleanupTransition(fadePlane);
                    }
                } else {
                    requestAnimationFrame(fadeOut);
                }
            }
        };

        // Fonction pour le fade in
        const fadeIn = () => {
            if (fadeMaterial.opacity <= 0) {
                console.log('Fade in terminé');
                
                // Attendre avant de passer à la scène suivante
                setTimeout(() => {
                    console.log('Passage à la scène suivante');
                    createNextScene();
                    this.cleanupTransition(fadePlane);
                }, 500);
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

    recreateInitialScene() {
        console.log('Recréation de la scène initiale...');
        
        // Nettoyer la scène actuelle
        this.clearScene();
        
        // Masquer le contenu principal
        const mainContent = document.getElementById('main-content');
        mainContent.style.display = 'none';
        
        // Masquer la navbar et le footer pendant le chargement
        document.querySelector('.navbar').style.display = 'none';
        document.querySelector('.footer').style.display = 'none';
        
        // Recréer la structure HTML nécessaire pour le loader
        const loadingContainer = document.createElement('div');
        loadingContainer.id = 'loading-container';
        
        // Ajouter le titre
        const loadingTitle = document.createElement('div');
        loadingTitle.className = 'loading-title';
        const titleSpan1 = document.createElement('span');
        titleSpan1.className = 'font-aktiv';
        titleSpan1.textContent = 'Digital Event';
        const titleSpan2 = document.createElement('span');
        titleSpan2.className = 'font-fraunces';
        titleSpan2.textContent = 'Edition 2025';
        loadingTitle.appendChild(titleSpan1);
        loadingTitle.appendChild(document.createTextNode(' '));
        loadingTitle.appendChild(titleSpan2);
        loadingContainer.appendChild(loadingTitle);
        
        // Ajouter les éléments de pourcentage
        const percentage = document.createElement('div');
        percentage.id = 'percentage';
        loadingContainer.appendChild(percentage);
        
        const mirrorPercentage = document.createElement('div');
        mirrorPercentage.id = 'mirror-percentage';
        loadingContainer.appendChild(mirrorPercentage);
        
        // Ajouter le footer du loader
        const loaderFooter = document.createElement('div');
        loaderFooter.className = 'loader-footer';
        
        const footerImg = document.createElement('img');
        footerImg.src = 'src/assets/icons/esd_logo_NoTexte_Jade 1.svg';
        footerImg.alt = 'esd icon';
        footerImg.width = 40;
        footerImg.height = 40;
        
        const footerText = document.createElement('p');
        footerText.textContent = 'Ecole Supérieure du Digital';
        
        loaderFooter.appendChild(footerImg);
        loaderFooter.appendChild(footerText);
        loadingContainer.appendChild(loaderFooter);
        
        document.body.appendChild(loadingContainer);
        
        // Lancer le loader qui gère tout le processus de chargement
        new Loader();
    }
}

export { SceneSetup }; 