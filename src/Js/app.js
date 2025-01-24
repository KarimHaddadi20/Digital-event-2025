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
      { x: 0.3, y: -2.0 },
    ];

    positions.forEach((pos) => {
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

    // Charger l'image comme texture
    // const textureLoader = new THREE.TextureLoader();
    // textureLoader.load('src/textures/Atelier1.png', (texture) => {
    //     texture.mapping = THREE.EquirectangularReflectionMapping;
    //     this.scene.environment = texture;
    //     this.scene.background = texture;
    // });

    // Ajouter le raycaster et la souris
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredFragment = null;

    // Ajouter les noms des ateliers
    this.atelierNames = [
      "Atelier 1",
      "Atelier 2",
      "Atelier 3",
      "Atelier 4",
      "Atelier 5",
      "Atelier 6",
      "Atelier 7",
      "Atelier 8",
      "Atelier 9",
      "Atelier 10",
      "Atelier 11",
    ];

    // Ajouter l'écouteur de mouvement de souris
    window.addEventListener("mousemove", (event) => this.onMouseMove(event));

    // Ajouter une référence à la boîte d'info
    this.infoBox = document.querySelector('.fragment-info-box');

    // Ajouter un chargeur de textures
    this.textureLoader = new THREE.TextureLoader();
    
    // Charger les données JSON
    this.loadAteliersData();
  }

  async loadAteliersData() {
    try {
        const response = await fetch('/src/json/data.json');
        const data = await response.json();
        this.ateliersData = data.ateliers;
        
        // Mettre à jour les noms des ateliers avec les données du JSON
        this.atelierNames = this.ateliersData.map(atelier => atelier.name);
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document
      .getElementById("scene-container")
      .appendChild(this.renderer.domElement);

    // Reculer la caméra pour voir la scène
    this.camera.position.set(0, 0, 1);
    this.camera.lookAt(0, 0, 0);

    // Configuration des contrôles orbitaux
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true; // Activer le zoom
    this.controls.enablePan = true; // Activer le panning
    this.controls.enableRotate = true;

    // Limites de rotation
    this.controls.minAzimuthAngle = -Infinity; // Pas de limite
    this.controls.maxAzimuthAngle = Infinity; // Pas de limite
    this.controls.minPolarAngle = 0; // Pas de limite
    this.controls.maxPolarAngle = Math.PI; // Pas de limite

    // Limites de zoom
    this.controls.minDistance = 50;
    this.controls.maxDistance = 200;

    // Vitesse de rotation
    this.controls.rotateSpeed = 0.5;

    console.log("Position initiale de la caméra:", {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
    });
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
    
    // Définir la configuration des ateliers
    const atelierConfig = [
        // Première ligne (Ateliers 1, 2, 3)
        { index: 1, row: 0, position: 0 },  // Atelier 1 utilise monde1.glb
        { index: 2, row: 0, position: 1 },  // Atelier 2 utilise monde2.glb
        { index: 3, row: 0, position: 2 },  // Atelier 3 utilise monde3.glb
        
        // Deuxième ligne (Ateliers 4, 5, 6)
        { index: 4, row: 1, position: 0 },  // Atelier 4 utilise monde4.glb
        { index: 5, row: 1, position: 1 },  // Atelier 5 utilise monde5.glb
        { index: 6, row: 1, position: 2 },  // Atelier 6 utilise monde6.glb
        
        // Troisième ligne (Ateliers 7, 8, 9)
        { index: 7, row: 2, position: 0 },  // Atelier 7 utilise monde7.glb
        { index: 8, row: 2, position: 1 },  // Atelier 8 utilise monde8.glb
        { index: 9, row: 2, position: 2 },  // Atelier 9 utilise monde9.glb
        
        // Dernière ligne (Ateliers 10, 11)
        { index: 10, row: 3, position: 0 }, // Atelier 10 utilise monde10.glb
        { index: 11, row: 3, position: 1 }  // Atelier 11 utilise monde11.glb
    ];

    // Charger chaque fragment selon sa configuration
    atelierConfig.forEach(config => {
        const fileName = `src/models/fragments3/monde${config.index}.glb`;
        loader.load(
            fileName,
            (gltf) => {
                const fragment = gltf.scene;
                
                // Ajouter les données de l'atelier au fragment
                const atelierData = this.ateliersData?.[config.index - 1];
                if (atelierData) {
                    fragment.userData.atelierName = atelierData.name;
                    fragment.userData.description = atelierData.description;
                    
                    // Charger l'image de l'atelier comme texture
                    if (atelierData.team) {
                        this.textureLoader.load(
                            `src/assets/${atelierData.team}`,
                            (texture) => {
                                // Créer un matériau avec la texture
                                const material = new THREE.MeshBasicMaterial({
                                    map: texture,
                                    transparent: true,
                                    opacity: 0.8
                                });

                                // Créer un plan pour afficher l'image
                                const imageGeometry = new THREE.PlaneGeometry(5, 5 * (texture.image.height / texture.image.width));
                                const imageMesh = new THREE.Mesh(imageGeometry, material);
                                
                                // Positionner l'image près du fragment
                                imageMesh.position.set(0, 2, 0);
                                imageMesh.visible = false; // Cacher initialement
                                
                                fragment.userData.imageMesh = imageMesh;
                                fragment.add(imageMesh);
                            }
                        );
                    }
                }

                // Debug pour le fragment 1
                if (config.index === 1) {
                    console.log("Fragment 1 chargé:", {
                        index: config.index,
                        userData: fragment.userData,
                        position: fragment.position,
                        visible: fragment.visible
                    });
                }

                const rowCount = config.row === 3 ? 2 : 3;

                fragment.scale.set(1, 1, 1);
                fragment.rotation.set(0, 0, 0);
                fragment.position.x = config.position - (rowCount - 1) / 2;
                fragment.position.y = -config.row - 75;
                fragment.position.z = -90;

                fragment.visible = false;
                fragment.userData.index = config.index - 1;
                fragment.userData.isClickable = true;
                fragment.userData.atelierName = this.atelierNames[config.index - 1];

                // Vérifier que le fragment est bien configuré
                if (config.index === 1) {
                    console.log("Fragment 1 après configuration:", {
                        index: fragment.userData.index,
                        atelierName: fragment.userData.atelierName,
                        isClickable: fragment.userData.isClickable
                    });
                }

                this.fragments.push(fragment);
                this.scene.add(fragment);
            },
            undefined,
            (error) => {
                console.error(`Erreur lors du chargement du fichier ${fileName}:`, error);
            }
        );
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
            
            // Remonter jusqu'au parent qui a les propriétés userData
            while (clickedFragment.parent && !clickedFragment.userData.atelierName) {
                clickedFragment = clickedFragment.parent;
            }

            // Vérifier si c'est un fragment valide avec un atelierName et qu'il est cliquable
            if (clickedFragment.userData && 
                clickedFragment.userData.atelierName && 
                clickedFragment.userData.isClickable !== false) {
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

    this.mirror.visible = false;
    document.body.classList.add('mirror-broken');

    // Rendre tous les fragments et leurs box helpers visibles
    this.fragments.forEach((fragment) => {
      fragment.visible = true;
    });

    // Ajuster la position de la caméra
    this.camera.position.z = 5;

    const audio = new Audio("brokenglass.mp3");
    audio.play();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    if (!this.isBreaking || this.isAnimatingFragment) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.fragments, true);

    if (intersects.length > 0) {
        let fragmentObject = intersects[0].object;
        
        while (fragmentObject.parent && !fragmentObject.userData.atelierName) {
            fragmentObject = fragmentObject.parent;
        }

        if (fragmentObject.userData && fragmentObject.userData.atelierName) {
            if (this.hoveredFragment !== fragmentObject) {
                if (this.hoveredFragment) {
                    this.resetFragmentPosition(this.hoveredFragment);
                    // Cacher l'image du fragment précédent
                    if (this.hoveredFragment.userData.imageMesh) {
                        this.hoveredFragment.userData.imageMesh.visible = false;
                    }
                }

                this.hoveredFragment = fragmentObject;
                this.moveFragmentForward(this.hoveredFragment);

                // Afficher l'image du fragment survolé
                if (this.hoveredFragment.userData.imageMesh) {
                    this.hoveredFragment.userData.imageMesh.visible = true;
                }

                // Mettre à jour la boîte d'info
                if (this.infoBox) {
                    this.infoBox.querySelector('h3').textContent = fragmentObject.userData.atelierName;
                    this.infoBox.querySelector('p').textContent = fragmentObject.userData.description;
                    this.infoBox.classList.add('visible');
                }
            }
        }
    } else {
        if (this.hoveredFragment) {
            // Cacher l'image quand on ne survole plus le fragment
            if (this.hoveredFragment.userData.imageMesh) {
                this.hoveredFragment.userData.imageMesh.visible = false;
            }
            this.resetFragmentPosition(this.hoveredFragment);
            this.hoveredFragment = null;
            if (this.infoBox) {
                this.infoBox.classList.remove('visible');
            }
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
      fragment.position.y =
        fragment.userData.originalY +
        Math.sin(progress * Math.PI * 2) * amplitude;

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
        fragment.position.y +=
          Math.sin(time * levitationSpeed + offset) * levitationAmplitude;
      });
    }

    this.controls.update(); // Mettre à jour les contrôles
    this.renderer.render(this.scene, this.camera);
  }

  // Nouvelle méthode pour l'animation de chute et d'immersion
  animateFragmentFall(fragment) {
    if (this.isAnimatingFragment) return;
    this.isAnimatingFragment = true;

    // Désactiver les contrôles pendant l'animation
    this.controls.enabled = false;

    // Rendre les autres fragments non-cliquables
    this.fragments.forEach((f) => {
      if (f !== fragment) {
        f.userData.isClickable = false;
        // Optionnel : réduire légèrement l'opacité des autres fragments
        f.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = 0.5;
          }
        });
      }
    });

    // Variables pour l'animation de chute
    const fallDuration = 1500; // Un peu plus rapide
    const startPosition = fragment.position.clone();
    const fallTarget = new THREE.Vector3(
      startPosition.x,
      startPosition.y - 15, // Chute plus importante
      startPosition.z + 5 // Légèrement vers l'avant
    );
    const startRotation = fragment.rotation.clone();
    const targetRotation = new THREE.Euler(
      startRotation.x + Math.PI * 2,
      startRotation.y + Math.PI,
      startRotation.z + Math.PI / 2
    );
    const startTime = Date.now();

    const animateFall = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / fallDuration, 1);

      // Animation non-linéaire avec easing
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Mettre à jour position et rotation
      fragment.position.lerpVectors(startPosition, fallTarget, easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animateFall);
      } else {
        // Commencer l'animation d'immersion
        this.startImmersionAnimation(fragment);
      }
    };

    animateFall();
  }

  // Nouvelle méthode pour l'animation d'immersion
  startImmersionAnimation(fragment) {
    const immersionDuration = 1500;
    const startTime = Date.now();
    const startFragmentPos = fragment.position.clone();
    const index = fragment.userData.index;

    // Positions finales pour chaque fragment (atelier)
    const finalPositions = [
        // Atelier 1
        { x: -30, y: -140, z: 5 },
        // Atelier 2
        { x: 0, y: -145, z: 5 },
        // Atelier 3
        { x: 35, y: -145, z: 10 },
        // Atelier 4
        { x: -30, y: -90, z: 8 },
        // Atelier 5
        { x: 0, y: -90, z: 8 },
        // Atelier 6 (position actuelle)
        { x: 35, y: -100, z: 5 },
        // Atelier 7
        { x: -30, y: -40, z: 7 },
        // Atelier 8
        { x: 0, y: -40, z: 7 },
        // Atelier 9
        { x: 35, y: -45, z: 6 },
        // Atelier 10
        { x: -20, y: 0, z: 4 },
        // Atelier 11
        { x: 35, y: 0, z: 4 }
    ];

    const finalPosition = this.camera.position.clone();
    // Appliquer les positions spécifiques selon l'index du fragment
    finalPosition.x += finalPositions[index].x;
    finalPosition.y += finalPositions[index].y;
    finalPosition.z += finalPositions[index].z;

    const animateImmersion = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / immersionDuration, 1);

      const ease = 1 - Math.pow(1 - progress, 3);
      fragment.position.lerpVectors(startFragmentPos, finalPosition, ease);

      // Debug pendant l'animation
      if (progress === 0 || progress === 0.5 || progress === 1) {
        console.log("Animation progress:", progress);
        console.log("Current fragment position:", fragment.position.clone());
      }

      if (progress < 1) {
        requestAnimationFrame(animateImmersion);
      } else {
        this.controls.enabled = true;
      }
    };

    animateImmersion();
  }

  createFragment(geometry, material, position) {
    const fragment = new THREE.Mesh(geometry, material);
    fragment.position.copy(position);

    // Créer la hitbox
    fragment.geometry.computeBoundingBox();
    fragment.boundingBox = fragment.geometry.boundingBox.clone();

    // Helper visuel pour debug
    const box = new THREE.Box3Helper(fragment.boundingBox, 0xff0000);
    this.scene.add(box);

    // Mettre à jour la boundingBox avec la position du fragment
    fragment.updateBoundingBox = () => {
      fragment.boundingBox
        .copy(fragment.geometry.boundingBox)
        .applyMatrix4(fragment.matrixWorld);
    };

    // Appeler updateBoundingBox à chaque frame
    fragment.onBeforeRender = () => {
      fragment.updateBoundingBox();
    };

    return fragment;
  }

  // Méthode pour vérifier les collisions
  checkCollision(fragment1, fragment2) {
    return fragment1.boundingBox.intersectsBox(fragment2.boundingBox);
  }
}

// Initialisation
window.mirrorEffect = new MirrorBreakEffect();