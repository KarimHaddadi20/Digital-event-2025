import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js"; 
class MirrorBreakEffect {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.fragments = [];
    this.isBreaking = false;
    this.isFragmentSelected = false;
    // Créer les conteneurs pour chaque position
    this.fragmentContainers = [];
    const positions = [
      // Première ligne : 3, 2, 1
      { x: -0, y: -0.8 },
      { x: -0, y: -0.8 },
      { x: 0.6, y: -0.8 },
      // Deuxième ligne : 6, 5, 4
      { x: -0.6, y: -1.2 },
      { x: 0, y: -1.2 },
      { x: 0.6, y: -1.2 },
      // Troisième ligne : 9, 8, 7
      { x: -0.6, y: -1.6 },
      { x: 0, y: -1.6 },
      { x: 0.6, y: -1.6 },
      // Dernière ligne : 11, 10
      { x: -0.3, y: -2.0 },
      { x: 0.3, y: -2.0 }
    ];

    positions.forEach(pos => {
      const container = new THREE.Group();
      container.position.set(pos.x, pos.y, 0);
      container.userData.baseY = pos.y;
      this.scene.add(container);
      this.fragmentContainers.push(container);
    });

    this.init();
    this.setupLights();
    this.loadHDRI(); // Charger l'image HDR
    this.loadMirrorModel();
    this.animate();

    // Gestionnaire de clic
    this.handleClick = this.handleClick.bind(this);
    document.addEventListener("click", this.handleClick);

    // Ajouter le raycaster et la souris
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredFragment = null;
    
    // Ajouter les noms des ateliers
    this.atelierNames = [
        "Atelier 1", "Atelier 2", "Atelier 3",
        "Atelier 4", "Atelier 5", "Atelier 6",
        "Atelier 7", "Atelier 8", "Atelier 9",
        "Atelier 10", "Atelier 11"
    ];

    // Créer un élément pour le texte fixe à droite
    this.textElement = document.createElement('div');
    this.textElement.style.position = 'fixed';
    this.textElement.style.right = '50px';
    this.textElement.style.top = '50%';
    this.textElement.style.transform = 'translateY(-50%)';
    this.textElement.style.color = 'white';
    this.textElement.style.padding = '20px';
    this.textElement.style.background = 'rgba(0, 0, 0, 0.7)';
    this.textElement.style.borderRadius = '10px';
    this.textElement.style.display = 'none';
    this.textElement.style.fontSize = '24px';
    this.textElement.style.fontFamily = 'Arial, sans-serif';
    this.textElement.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(this.textElement);

    // Ajouter l'écouteur de mouvement de souris
    window.addEventListener('mousemove', (event) => this.onMouseMove(event));
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document
      .getElementById("scene-container")
      .appendChild(this.renderer.domElement);

    // Positionner la caméra plus avancée
    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(0, 0, 0);

    console.log('Position initiale de la caméra:', {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
    });

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.enableZoom = true; // Réactiver le zoom
    this.controls.enablePan = true; // Si vous souhaitez également permettre le panoramique
    this.controls.enableRotate = true; // Si vous souhaitez également permettre la rotation

    // Gestionnaire de scroll pour le zoom
    window.addEventListener('wheel', (event) => {
      event.preventDefault();
      const scrollSpeed = 0.1;
      this.camera.position.z = Math.max(4, Math.min(12, this.camera.position.z + event.deltaY * scrollSpeed));
    }, { passive: false });

    // Redimensionnement
    window.addEventListener("resize", () => this.onWindowResize(), false);
  }

  setupLights() {
    // Lumière ambiante pour un éclairage de base
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Lumière principale plus douce
    const mainLight = new THREE.DirectionalLight(0xffd7b3, 0.5); // réduit de 1.5 à 0.8
    mainLight.position.set(5, 5, 5);
    this.scene.add(mainLight);

    // Ajuster la lumière d'accentuation
    const accentLight = new THREE.SpotLight(0x8080ff, 60); // réduit de 100 à 50
    accentLight.position.set(-5, 3, 2);
    accentLight.angle = Math.PI / 4;
    accentLight.penumbra = 0.5; // augmenté de 0.3 à 0.5
    this.scene.add(accentLight);

    // Réduire la lumière de contre-jour
    const backLight = new THREE.DirectionalLight(0x4040ff, 0.3); // réduit de 0.5 à 0.3
    backLight.position.set(-3, -2, -3);
    this.scene.add(backLight);

    // Ajuster la lumière frontale
    const frontLight = new THREE.SpotLight(0xccccff, 0); // réduit de 100 à 50
    frontLight.position.set(0, 0, 5);
    frontLight.angle = Math.PI / 3;
    frontLight.penumbra = 0.7; // augmenté de 0.5 à 0.7
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

  loadMirrorModel() {
    const loader = new GLTFLoader();

    loader.load(
      "src/models/mirrorsolo.glb",
      (gltf) => {
        this.mirror = gltf.scene;

        // Centrer et redimensionner le modèle
        const box = new THREE.Box3().setFromObject(this.mirror);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 400 / maxDim;
        this.mirror.scale.multiplyScalar(scale);

        this.mirror.position.set(
          -center.x * scale,
          -center.y * scale,
          -300 // Placer le miroir devant la caméra
        );

        // Appliquer la transparence et les reflets
        this.mirror.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshPhysicalMaterial({
              // color: 0xffffff,
              metalness: 1, // Effet miroir
              roughness: 0, // Surface lisse
              transmission: 0.1, // Transparence
              thickness: 10, // Épaisseur du verre
              envMap: this.scene.environment,
              envMapIntensity: 1.5, // Intensité des reflets
              clearcoat: 10, // Effet brillant
              clearcoatRoughness: 0.06, // Netteté du clearcoat
              transparent: false,
              opacity: 0.7, // Transparence globale
              side: THREE.DoubleSide,
              depthWrite: false, // Important pour la transparence
              // blending: THREE.CustomBlending,
              // blendSrc: THREE.OneFactor,
              // blendDst: THREE.OneMinusSrcAlphaFactor,
            });
            this.mirrorMesh = child;
          }
        });

        this.scene.add(this.mirror);
        this.createFragments();

        document.querySelector(".loading-screen").style.display = "none";
      },
      undefined,
      (error) => {
        console.error("Erreur de chargement du modèle:", error);
      }
    );
  }

  createFragments() {
    const loader = new GLTFLoader();
    const rows = [3, 3, 3, 2];
    let index = 0;

    rows.forEach((count, rowIndex) => {
        for (let i = 0; i < count; i++) {
            const fileName = `src/models/fragments3/monde${index + 1}.glb`;
            loader.load(
                fileName,
                (gltf) => {
                    const fragment = gltf.scene;
                    
                    // Ajuster l'échelle
                    fragment.scale.set(1, 1, 1);
                    
                    // Réinitialiser la rotation
                    fragment.rotation.set(0, 0, 0);
                    
                    // Positionnement des fragments
                    fragment.position.x = i - (count - 1) / 2;
                    fragment.position.y = -rowIndex - 75;
                    fragment.position.z = -120;
                    
                    fragment.visible = false;
                    fragment.userData.index = index;
                    fragment.userData.isClickable = true;

                    this.fragments.push(fragment);
                    this.scene.add(fragment);
                },
                undefined,
                (error) => {
                    console.error(`Erreur lors du chargement du fichier ${fileName}:`, error);
                }
            );
            index++;
        }
    });
  }

  handleClick(event) {
    // Si le miroir n'est pas encore brisé
    if (!this.isBreaking && this.mirror) {
        this.breakMirror();
        return;
    }

    // Si une animation est déjà en cours, ignorer les clics
    if (this.isAnimatingFragment) return;

    // Si le miroir est déjà brisé, on gère le clic sur les fragments
    if (this.isBreaking) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        const intersects = raycaster.intersectObjects(this.fragments, true);
        
        if (intersects.length > 0) {
            let clickedFragment = intersects[0].object;
            while(clickedFragment.parent && !clickedFragment.userData.index) {
                clickedFragment = clickedFragment.parent;
            }
            // Vérifier si le fragment est cliquable
            if (clickedFragment.userData.isClickable !== false) {
                this.animateFragmentFall(clickedFragment);
            }
        }
    }
  }

  // Nouvelle méthode pour démarrer la transition vers la galerie
  startGalleryTransition(fragment) {
    this.galleryScene = new GalleryScene(fragment, this.camera);
  }

  breakMirror() {
    if (this.isBreaking) return;
    this.isBreaking = true;

    // Faire disparaître le miroir immédiatement
    this.mirror.visible = false;

    // Animation de transition
    const duration = 2000;
    const startTime = Date.now();
    
    // Position initiale de la caméra
    const startCameraPos = this.camera.position.clone();
    const targetCameraPos = new THREE.Vector3(0, 0, 5);

    const animate = () => {
        const currentTime = Date.now();
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // Rendre les fragments visibles immédiatement
        this.fragments.forEach((fragment) => {
            fragment.visible = true;
        });

        // Déplacer la caméra en douceur
        this.camera.position.lerpVectors(startCameraPos, targetCameraPos, easeProgress);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    animate();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    // Si une animation est en cours, désactiver le hover
    if (!this.isBreaking || this.isAnimatingFragment) return;

    // Calculer la position de la souris normalisée
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Mettre à jour le raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Vérifier l'intersection avec les fragments
    const intersects = this.raycaster.intersectObjects(this.fragments, true);

    if (intersects.length > 0) {
        // Trouver le fragment parent
        let fragmentObject = intersects[0].object;
        while(fragmentObject.parent && !fragmentObject.userData.index) {
            fragmentObject = fragmentObject.parent;
        }

        if (this.hoveredFragment !== fragmentObject) {
            // Réinitialiser le fragment précédemment hover
            if (this.hoveredFragment) {
                this.resetFragmentPosition(this.hoveredFragment);
            }
            
            // Définir le nouveau fragment hover
            this.hoveredFragment = fragmentObject;
            this.moveFragmentForward(this.hoveredFragment);
            
            // Afficher le texte
            const index = fragmentObject.userData.index;
            this.textElement.textContent = this.atelierNames[index];
            this.textElement.style.display = 'block';
            this.textElement.style.opacity = '1';
        }
    } else {
        // Réinitialiser si aucun fragment n'est hover
        if (this.hoveredFragment) {
            this.resetFragmentPosition(this.hoveredFragment);
            this.hoveredFragment = null;
            this.textElement.style.opacity = '0';
            setTimeout(() => {
                this.textElement.style.display = 'none';
            }, 300);
        }
    }
  }

  moveFragmentForward(fragment) {
    // Sauvegarder les positions originales si ce n'est pas déjà fait
    if (fragment.userData.originalY === undefined) {
        fragment.userData.originalY = fragment.position.y;
        fragment.userData.originalZ = fragment.position.z;
    }

    // Animation de déplacement vers l'avant
    const duration = 1500; // Durée de 1.5 secondes pour le mouvement vers l'avant
    const startZ = fragment.position.z;
    const targetZ = fragment.userData.originalZ + 10;
    const startTime = Date.now();

    const moveForward = () => {
        const currentTime = Date.now();
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        // Interpolation linéaire pour le mouvement vers l'avant
        fragment.position.z = THREE.MathUtils.lerp(startZ, targetZ, progress);

        if (progress < 1) {
            requestAnimationFrame(moveForward);
        }
    };

    moveForward();

    // Animation de lévitation
    const levitationDuration = 3000; // Durée de 3 secondes
    const levitationStartTime = Date.now();
    const amplitude = 0.7; // Très petite amplitude pour un mouvement subtil

    const animate = () => {
        if (this.hoveredFragment !== fragment) return; // Arrêter si ce n'est plus le fragment survolé

        const currentTime = Date.now();
        const elapsed = currentTime - levitationStartTime;
        const progress = (elapsed % levitationDuration) / levitationDuration; // Progression cyclique

        // Mouvement sinusoïdal très léger
        fragment.position.y = fragment.userData.originalY + Math.sin(progress * Math.PI * 2) * amplitude;

        requestAnimationFrame(animate);
    };

    animate();
  }

  resetFragmentPosition(fragment) {
    // Animation de retour à la position initiale
    const duration = 1500; // Durée de 1.5 secondes pour le retour
    const startY = fragment.position.y;
    const targetY = fragment.userData.originalY;
    const startZ = fragment.position.z;
    const targetZ = fragment.userData.originalZ;
    const startTime = Date.now();

    const animate = () => {
        const currentTime = Date.now();
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        // Interpolation linéaire pour le retour
        fragment.position.y = THREE.MathUtils.lerp(startY, targetY, progress);
        fragment.position.z = THREE.MathUtils.lerp(startZ, targetZ, progress);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.isBreaking) {
        const time = Date.now() * 0.001;

        this.fragments.forEach((fragment, index) => {
            const offset = index * (Math.PI / 6);
            const levitationAmplitude = 0.002;
            const levitationSpeed = 0.5;

            // Simple mouvement vertical
            fragment.position.y += Math.sin(time * levitationSpeed + offset) * levitationAmplitude;
        });
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // Nouvelle méthode pour l'animation de chute et d'immersion
  animateFragmentFall(fragment) {
    if (this.isAnimatingFragment) return;
    this.isAnimatingFragment = true;

    // Désactiver les contrôles pendant l'animation
    this.controls.enabled = false;

    // Rendre les autres fragments non-cliquables
    this.fragments.forEach(f => {
        if (f !== fragment) {
            f.userData.isClickable = false;
            f.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material = child.material.clone();
                    child.material.transparent = true;
                    child.material.opacity = 0.5;
                }
            });
        }
    });

    // Variables pour l'animation de chute
    const fallDuration = 1500;
    const startPosition = fragment.position.clone();
    const fallTarget = new THREE.Vector3(
        startPosition.x,
        startPosition.y - 15,
        startPosition.z + 5
    );
    const startTime = Date.now();

    const animateFall = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / fallDuration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // Mettre à jour position
        fragment.position.lerpVectors(startPosition, fallTarget, easeProgress);

        if (progress < 1) {
            requestAnimationFrame(animateFall);
        } else {
            // Commencer directement l'animation de scale
            this.startScaleAnimation(fragment);
        }
    };

    animateFall();
  }

  // Nouvelle méthode pour l'animation de scale
  startScaleAnimation(fragment) {
    const scaleDuration = 2000;
    const startTime = Date.now();
    const startScale = fragment.scale.clone();
    const targetScale = startScale.clone().multiplyScalar(3); // Scale final x3

    const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / scaleDuration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // Interpolation entre l'échelle initiale et finale
        const currentScale = startScale.clone().lerp(targetScale, easeProgress);
        fragment.scale.copy(currentScale);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            this.controls.enabled = true;
            setTimeout(() => this.startPortalTransition(fragment), 500);
        }
    };

    animate();
  }

  // Nouvelle méthode pour l'animation d'immersion
  startImmersionAnimation(fragment) {
    const immersionDuration = 2000;
    const startTime = Date.now();
    const startFragmentPos = fragment.position.clone();
    const startScale = fragment.scale.clone();
    
    // Position centrale ajustée
    const centerPosition = new THREE.Vector3(0, 0, -10);
    centerPosition.add(this.camera.position);
    
    // Position finale
    const finalPosition = centerPosition.clone();
    finalPosition.z += 5;

    const animateImmersion = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / immersionDuration, 1);

        if (progress < 0.5) {
            // Centrage du fragment
            const centerProgress = progress * 2;
            const easeCenter = 1 - Math.pow(1 - centerProgress, 2);
            
            fragment.position.lerpVectors(startFragmentPos, centerPosition, easeCenter);
            fragment.quaternion.slerp(this.camera.quaternion, easeCenter);
        } else {
            // Approche vers la caméra avec scale
            const approachProgress = (progress - 0.5) * 2;
            const easeApproach = 1 - Math.pow(1 - approachProgress, 2);
            
            fragment.position.lerpVectors(centerPosition, finalPosition, easeApproach);
            
            // Mise à l'échelle progressive
            const scale = 1 + easeApproach * 2;
            fragment.scale.set(scale, scale, scale);
        }

        if (progress < 1) {
            requestAnimationFrame(animateImmersion);
        } else {
            this.controls.enabled = true;
            setTimeout(() => this.startPortalTransition(fragment), 500);
        }
    };

    animateImmersion();
  }
}

// Initialisation
window.mirrorEffect = new MirrorBreakEffect();