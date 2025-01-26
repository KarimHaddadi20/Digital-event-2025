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

        // Configuration du bouton retour
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                console.log('Bouton retour cliqué');
                this.recreateInitialScene();
            });
        }
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
        this.controls.enableZoom = false;
        this.controls.enablePan = true;
        this.controls.enableRotate = false;

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
        rgbeLoader.load("src/assets/grey2.hdr", (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
    
          // Create PMREMGenerator for better reflections
          const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
          const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    
          // Apply environment but keep black background
          this.scene.environment = envMap;
          this.scene.background = new THREE.Color(0x000000);
    
          // Dispose resources
          texture.dispose();
          pmremGenerator.dispose();
        });
      }

    setupBackground() {
        // Créer un plan pour l'arrière-plan au lieu d'utiliser environment map
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load("src/textures/escape.png", (texture) => {
          const aspectRatio = texture.image.width / texture.image.height;

        // texture.encoding = THREE.sRGBEncoding;
    
          // Créer un grand plan pour l'arrière-plan
          const bgGeometry = new THREE.PlaneGeometry(600 * aspectRatio, 550);
          const bgMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.FrontSide,
          });
    
          const background = new THREE.Mesh(bgGeometry, bgMaterial);
    
          // Positionner le plan derrière le miroir
          background.position.z = -300; // Ajustez cette valeur selon vos besoins
          background.position.y = 0; // Ajustez si nécessaire
    
          this.scene.add(background);
    
          // Définir une couleur de fond neutre au lieu de l'environment map
          this.scene.background = new THREE.Color(0x000000);
        });
    }
    
    setupEnvironment() {
        // Clear any existing environment
        if (this.scene.environment) {
          this.scene.environment.dispose();
        }
    
        const textureLoader = new THREE.TextureLoader();
        console.log("Loading texture from: src/textures/espace.game.png");
    
        textureLoader.load(
          "src/textures/espace.game.png",
          (texture) => {
            console.log("Texture loaded successfully");
    
            // Configure texture
            texture.encoding = THREE.sRGBEncoding;
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.needsUpdate = true;
    
            // Generate environment map
            const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
            pmremGenerator.compileEquirectangularShader();
    
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    
            // Apply to scene - both as environment and background
            this.scene.environment = envMap;
            this.scene.background = envMap;
    
            console.log("Environment set up complete");
    
            // Cleanup
            pmremGenerator.dispose();
          },
          undefined, // onProgress callback
          (error) => {
            console.error("Error loading texture:", error);
          }
        );
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
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        
        // Masquer la navbar et le footer pendant le chargement
        const navbar = document.querySelector('.navbar');
        const footer = document.querySelector('.footer');
        if (navbar) navbar.style.display = 'none';
        if (footer) footer.style.display = 'none';
        
        // Supprimer l'ancien container de chargement s'il existe
        const oldContainer = document.getElementById('loading-container');
        if (oldContainer) {
            oldContainer.remove();
        }
        
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
        percentage.textContent = '0%';
        loadingContainer.appendChild(percentage);
        
        const mirrorPercentage = document.createElement('div');
        mirrorPercentage.id = 'mirror-percentage';
        mirrorPercentage.textContent = '0%';
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
        
        // Ajouter le container au body
        document.body.appendChild(loadingContainer);
        
        // Créer et démarrer une nouvelle instance du Loader
        const loader = new Loader();
        
        return true;
    }
}

export { SceneSetup }; 