import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

class FragmentManager {
  constructor(app) {
    this.app = app;
    this.fragments = [];
    this.hoveredFragment = null;
    this.isAnimatingFragment = false;
    this.selectedFragment = null;
    this.userHasInteracted = false;
    this.lastActivityTime = Date.now();
    this.inactivityTimeout = 10000; // 10 secondes
    this.fragmentInstructions = document.querySelector(
      ".fragment-instructions"
    );

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.outputEncoding = THREE.sRGBEncoding; // Pour un meilleur rendu des couleurs
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // Tonemapping pour des couleurs réalistes
    this.renderer.setPixelRatio(window.devicePixelRatio); // Adapter au ratio de l'écran
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Charger la texture initiale
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("src/textures/homepage.webp", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

      // Créer la sphère d'environnement
      const geometry = new THREE.SphereGeometry(500, 256, 256);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
        transparent: true,
        opacity: 1
      });

      this.envMesh = new THREE.Mesh(geometry, material);
      this.envMesh.rotation.y = Math.PI / 2;
      this.app.scene.add(this.envMesh);

      // Configurer l'environnement pour les réflexions
      this.app.scene.environment = texture;
      this.initialEnvironment = texture;
      this.activeEnvironment = texture;
    });

    this.environmentTextures = {
      "Site web": "src/textures/site.web.webp",
      "Video Mapping": "src/textures/video.mapping.webp",
      "Creative Coding": "src/textures/creative.coding.webp",
      "Gaming & Pop-corn": "src/textures/gaming.popcorn.webp",
      "Video": "src/textures/video.studio.webp",
      "Escape game": "src/textures/espace.game.webp",
      "Podcast": "src/textures/podcast.webp",
      "Photo reportage": "src/textures/photography.webp",
      "AI Driven visual stories": "src/textures/ai.driven.visual.stories.webp",
      "Game design": "src/textures/game.design.webp",
      "Organisation": "src/textures/organisation.webp",
    };
    this.atelierNames = [
      "Site web",
      "Video Mapping",
      "Creative Coding",
      "Gaming & Pop-corn",
      "Video",
      "Escape game",
      "Podcast",
      "Photo reportage",
      "AI Driven visual stories",
      "Game design",
      "Organisation",
    ];

    this.autoSelectTimer = null;

    this.setupUI();
    this.initRaycaster();

    // Ajout des propriétés pour le responsive
    this.isMobile = window.innerWidth <= 768;
    this.footerElements = document.querySelectorAll('.footer-right p');
    this.soundIcon = document.querySelector('.footer-left');
    this.fragmentSelectSound = document.getElementById('fragment-select-sound');
  }

  setupUI() {
    // Créer le bouton Voyager
    this.voyagerButton = document.createElement("button");
    this.voyagerButton.textContent = "Voyager";
    this.voyagerButton.className = "voyager-button";
    this.voyagerButton.style.cssText = `
      display: none;
      opacity: 0;
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      padding: 18px 52px;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      gap: 4px;
      border-radius: 4px;
      border: 1px solid #FFF;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0.03) 100%);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      cursor: pointer;
      z-index: 1000;
      font-family: 'Aktiv Grotesk', sans-serif;
      color: white;
      font-size: 16px;
    `;
    document.body.appendChild(this.voyagerButton);

    // Créer l'élément de texte pour le nom de l'atelier
    this.textElement = document.createElement("div");
    this.textElement.style.cssText = `
      display: none;
      opacity: 0;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-family: 'Aktiv Grotesk', sans-serif;
      font-size: 24px;
      text-align: center;
      pointer-events: none;
      z-index: 1000;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(this.textElement);

    // Ajouter l'événement click sur le bouton Voyager
    // Gestion du clic
    this.voyagerButton.addEventListener("click", () => {
      if (this.selectedFragment) {
        this.hideVoyagerButton();
        this.animateFragmentFall(this.selectedFragment);
        
        // Désactiver les contrôles de la caméra
        this.app.controls.enabled = false;
        
        // Bloquer le suivi du curseur
        this.app.isNavigating = true;
        
        // // Réinitialiser la position de la caméra
        // window.gsap.to(this.app.camera.position, {
        //   x: 0,
        //   y: 0,
        //   z: 5,
        //   duration: 1.5,
        //   ease: "power2.inOut",
        // });

        // Réinitialiser la rotation de la caméra
        window.gsap.to(this.app.camera.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.5,
          ease: "power2.inOut"
        });
      }
    });

    document.body.appendChild(this.voyagerButton);

    // Ajout de la gestion responsive
    const handleResponsive = () => {
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        // Ajuster le style du bouton pour mobile
        this.voyagerButton.style.cssText = `
          position: fixed;
          left: 50%;
          bottom: 8vh; 
          transform: translateX(-50%);
          display: none;
          padding: 8px 16px;
          font-size: 12px;
          width: auto;
          min-width: 80px;
          max-width: 120px;
          border: 1px solid #FFF;
          background: linear-gradient(344deg, rgba(21, 21, 27, 0.20) -1.4%, rgba(79, 79, 86, 0.20) 104.72%);
          color: white;
          border-radius: 4px;
          z-index: 1000;
          cursor: pointer;
        `;
      }
    };

    // Appliquer le responsive
    handleResponsive();
    window.addEventListener('resize', handleResponsive);
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
      if (this.selectedFragment) {
        this.hideLegalNotices();
      }
    });
  }

  initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  loadMirrorModel() {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        "src/models/mirrorsolo.glb",
        (gltf) => {
          this.app.mirror = gltf.scene;

          const box = new THREE.Box3().setFromObject(this.app.mirror);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 230 / maxDim;
          this.app.mirror.scale.multiplyScalar(scale);

          this.app.mirror.position.set(
            -center.x * scale,
            -center.y * scale + 35,
            -240
          );

          // this.app.mirror.traverse((child) => {
          //   if (child.isMesh) {
          //     child.material = new THREE.MeshPhysicalMaterial({
          //       metalness: 0,
          //       roughness: 0,
          //       transmission: 0,
          //       thickness: 0,
          //       envMap: this.app.scene.environment,
          //       envMapIntensity: 0,
          //       clearcoat: 0,
          //       clearcoatRoughness: 0,
          //       transparent: true,
          //       opacity: 0,
          //       side: THREE.DoubleSide,
          //       depthWrite: true,
          //     });
          //   }
          // });

          this.app.mirror.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshPhysicalMaterial({
                // Propriétés métalliques
                metalness: 1, // 1 = totalement métallique, 0 = non métallique
                roughness: 0.06, // 0 = surface parfaitement lisse (miroir), 1 = surface rugueuse
                // Propriétés de transparence
                transmission: 0, // 0 = opaque, 1 = totalement transparent
                thickness: 10, // Épaisseur du matériau pour les effets de réfraction
                reflectivity: 0, // Intensité des reflets
                iridescence: 1, // Intensité de l'iridescence
                // Propriétés de réflexion
                envMap: this.app.scene.environment, // Texture d'environnement pour les reflets
                envMapIntensity: 1.5, // Intensité des reflets de l'environnement
                // Propriétés de revêtement
                clearcoat: 0, // Couche de vernis (0 = aucune, 1 = maximum)
                clearcoatRoughness: 0, // Rugosité de la couche de vernis
                // Propriétés de rendu
                transparent: true, // Active/désactive la transparence
                opacity: 0.6, // 1 = totalement opaque, 0 = invisible
                side: THREE.DoubleSide, // Rendre les deux côtés du matériau
                depthWrite: true, // Écriture dans le buffer de profondeur
              });
            }
          });

          this.app.scene.add(this.app.mirror);
          this.createFragments();

          resolve();
        },
        undefined,
        (error) => {
          console.error("Erreur de chargement du modèle:", error);
          reject(error);
        }
      );
    });
  }

  createFragments() {
    const loader = new GLTFLoader();

    const atelierConfig = [
      { index: 1, row: 0, position: 0 },
      { index: 2, row: 0, position: 1 },
      { index: 3, row: 0, position: 2 },
      { index: 4, row: 1, position: 0 },
      { index: 5, row: 1, position: 1 },
      { index: 6, row: 1, position: 2 },
      { index: 7, row: 2, position: 0 },
      { index: 8, row: 2, position: 1 },
      { index: 9, row: 2, position: 2 },
      { index: 10, row: 3, position: 0 },
      { index: 11, row: 3, position: 1 },
    ];

    const HORIZONTAL_SPACING = -3; // Augmente l'espacement horizontal (défaut: 1)
    const VERTICAL_SPACING = 3; // Augmente l'espacement vertical (défaut: 1)

    atelierConfig.forEach((config) => {
      const fileName = `src/models/fragments3/monde${config.index}.glb`;
      loader.load(
        fileName,
        (gltf) => {
          const fragment = gltf.scene;
          const rowCount = config.row === 3 ? 2 : 3;

          fragment.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshPhysicalMaterial({
                metalness: 1, // 1 = totalement métallique, 0 = non métallique
                roughness: 0.06, // 0 = surface parfaitement lisse (miroir), 1 = surface rugueuse
                // Propriétés de transparence
                transmission: 1, // 0 = opaque, 1 = totalement transparent
                thickness: 1, // Épaisseur du matériau pour les effets de réfraction
                reflectivity: 0, // Intensité des reflets
                iridescence: 0, // Intensité de l'iridescence
                // Propriétés de réflexion
                envMap: this.app.scene.environment, // Texture d'environnement pour les reflets
                envMapIntensity: 1, // Intensité des reflets de l'environnement
                // Propriétés de revêtement
                clearcoat: 0, // Couche de vernis (0 = aucune, 1 = maximum)
                clearcoatRoughness: 0, // Rugosité de la couche de vernis
                // Propriétés de rendu
                transparent: true, // Active/désactive la transparence
                opacity: 0.5, // 1 = totalement opaque, 0 = invisible
                side: THREE.DoubleSide, // Rendre les deux côtés du matériau
                depthWrite: true, // Écriture dans le buffer de profondeur
              });
            }
          });

          fragment.scale.set(1, 1, 1);
          fragment.rotation.set(0, 0, 0);
          fragment.position.x =
            (config.position - (rowCount - 1) / 2) * HORIZONTAL_SPACING;
          fragment.position.y = -config.row * VERTICAL_SPACING - 55;
          fragment.position.z = -150;

          fragment.visible = false;
          fragment.userData.index = config.index - 1;
          fragment.userData.isClickable = true;
          fragment.userData.isHoverable = true;
          fragment.userData.atelierName = this.atelierNames[config.index - 1];

          this.fragments.push(fragment);
          this.app.scene.add(fragment);
        },
        undefined,
        (error) => {
          console.error(
            `Erreur lors du chargement du fichier ${fileName}:`,
            error
          );
        }
      );
    });
  }

  breakMirror() {
    if (this.app.isBreaking) return;
    this.app.isBreaking = true;

    this.app.mirror.visible = false;
    this.fragments.forEach((fragment) => {
      fragment.visible = true;
      fragment.userData.isClickable = false;
    });

    // Ajouter les event listeners pour l'interaction
    this.onMouseMove = this.onMouseMove.bind(this);
    this.handleFragmentClick = this.handleFragmentClick.bind(this);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("click", this.handleFragmentClick);

    // Activer les clics sur les fragments après un court délai
    setTimeout(() => {
      this.fragments.forEach((fragment) => {
        fragment.userData.isClickable = true;
        fragment.userData.isHoverable = true;
      });
    }, 100);

    // Sélection automatique du premier fragment après 10 secondes
    setTimeout(() => {
      if (this.fragments.length > 0) {
        const firstFragment = this.fragments[0];
        this.selectedFragment = firstFragment;
        this.moveFragmentForward(firstFragment);
        this.showVoyagerButton();
        this.updateEnvironment(firstFragment.userData.atelierName);

        if (this.fragmentInstructions) {
          const titleElement =
            this.fragmentInstructions.querySelector(".instruction-title");
          if (titleElement) {
            titleElement.innerHTML = `
              <span class="font-aktiv">${firstFragment.userData.atelierName}</span>
              <span class="font-fraunces">fragment</span>
            `;
          }
        }

        // Démarrer le timer pour la sélection aléatoire
        this.startAutoSelectTimer();
      }
    }, 10000);
  }

  selectFragment(fragment) {
    if (!fragment || !fragment.mesh) return;

    // Simuler la sélection du fragment
    const distance = fragment.mesh.position.z - this.app.camera.position.z;
    if (Math.abs(distance) <= 15) {
      this.selectedFragment = fragment;
      this.animateFragmentFall(fragment);
    }
  }

  moveFragmentForward(fragment, distance = 5) {
    if (fragment.userData.originalY === undefined) {
      fragment.userData.originalY = fragment.position.y;
      fragment.userData.originalZ = fragment.position.z;
    }

    const duration = 1500;
    const startZ = fragment.position.z;
    const targetZ = fragment.userData.originalZ + distance;
    const startTime = Date.now();

    const moveForward = () => {
      const currentTime = Date.now();
      const progress = Math.min((currentTime - startTime) / duration, 1);
      fragment.position.z = THREE.MathUtils.lerp(startZ, targetZ, progress);
      if (progress < 1) {
        requestAnimationFrame(moveForward);
      }
    };

    moveForward();

    const levitationDuration = 3000;
    const levitationStartTime = Date.now();
    const amplitude = 0.7;

    const animate = () => {
      if (this.hoveredFragment !== fragment) return;

      const currentTime = Date.now();
      const elapsed = currentTime - levitationStartTime;
      const progress = (elapsed % levitationDuration) / levitationDuration;

      fragment.position.y =
        fragment.userData.originalY +
        Math.sin(progress * Math.PI * 2) * amplitude;

      requestAnimationFrame(animate);
    };

    animate();
  }

  resetFragmentPosition(fragment) {
    const duration = 1500;
    const startY = fragment.position.y;
    const targetY = fragment.userData.originalY;
    const startZ = fragment.position.z;
    const targetZ = fragment.userData.originalZ;
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const progress = Math.min((currentTime - startTime) / duration, 1);

      fragment.position.y = THREE.MathUtils.lerp(startY, targetY, progress);
      fragment.position.z = THREE.MathUtils.lerp(startZ, targetZ, progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  animateFragmentFall(fragment) {
    this.isAnimatingFragment = true;
    const startTime = Date.now();
    const immersionDuration = 1000;
    const startFragmentPos = fragment.position.clone();

    // Cacher les instructions des fragments
    const fragmentInstructions = document.querySelector(
      ".fragment-instructions"
    );
    if (fragmentInstructions) {
      fragmentInstructions.style.display = "none";
    }

    // Désactiver les interactions avec les autres fragments
    this.fragments.forEach((f) => {
      if (f !== fragment) {
        f.userData.isClickable = false;
      }
    });

    const fallDuration = 1500;
    const startPosition = fragment.position.clone();
    const fallTarget = new THREE.Vector3(
      startPosition.x,
      startPosition.y - 15,
      startPosition.z + 5
    );
    const startRotation = fragment.rotation.clone();
    const targetRotation = new THREE.Euler(
      startRotation.x + Math.PI * 2,
      startRotation.y + Math.PI,
      startRotation.z + Math.PI / 2
    );

    const animateFall = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / fallDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      fragment.position.lerpVectors(startPosition, fallTarget, easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animateFall);
      } else {
        this.startImmersionAnimation(fragment);
      }
    };

    animateFall();
  }

  startImmersionAnimation(fragment) {
    const immersionDuration = 1500;
    const startTime = Date.now();
    const startFragmentPos = fragment.position.clone();
    const index = fragment.userData.index;

    const finalPositions = [
      { x: -30, y: -140, z: -5 },
      { x: 0, y: -145, z: -5 },
      { x: 35, y: -145, z: -5 },
      { x: -30, y: -90, z: -5 },
      { x: 0, y: -90, z: -5 },
      { x: 35, y: -100, z: -5 },
      { x: -30, y: -40, z: -5 },
      { x: 0, y: -40, z: -5 },
      { x: 35, y: -45, z: -5 },
      { x: -20, y: -10, z: -5 },
      { x: 35, y: -10, z: -5 },
    ];

    const finalPosition = this.app.camera.position.clone();
    finalPosition.x += finalPositions[index].x;
    finalPosition.y += finalPositions[index].y;
    finalPosition.z += finalPositions[index].z;

    const animateImmersion = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / immersionDuration, 1);

      const ease = 1 - Math.pow(1 - progress, 3);
      fragment.position.lerpVectors(startFragmentPos, finalPosition, ease);

      if (progress < 1) {
        requestAnimationFrame(animateImmersion);
      } else {
        this.app.controls.enabled = false;

        this.fragments.forEach((fragment) => {
          fragment.traverse((child) => {
            if (child.isMesh) {
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach((mat) => mat.dispose());
                } else {
                  child.material.dispose();
                }
              }
              if (child.geometry) {
                child.geometry.dispose();
              }
            }
          });
        });

        this.fragments = [];
        this.isAnimatingFragment = false;
        this.app.isBreaking = false;
        this.hoveredFragment = null;

        if (this.textElement && this.textElement.parentNode) {
          this.textElement.parentNode.removeChild(this.textElement);
        }

        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("click", this.handleFragmentClick);

        if (typeof this.app.switchToGalleryScene === "function") {
          const fragmentIndex = fragment.userData.index;
          this.app.switchToGalleryScene(fragmentIndex);
        }
      }
    };

    animateImmersion();
  }

  updateEnvironment(atelierName) {
    // Get texture path for selected atelier
    const texturePath = this.environmentTextures[atelierName];
    if (!texturePath) {
      // Fallback to initial environment
      if (this.initialEnvironment) {
        this.createEnvironmentSphere(this.initialEnvironment);
      }
      return;
    }

    // Load new environment texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(texturePath, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

      // Create new environment sphere
      const geometry = new THREE.SphereGeometry(500, 256, 256);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0
      });

      const newEnvMesh = new THREE.Mesh(geometry, material);
      newEnvMesh.rotation.y = Math.PI / 2;
      this.app.scene.add(newEnvMesh);

      // Fade out old environment and fade in new one
      const duration = 1000; // 1 seconde pour la transition
      const startTime = Date.now();

      const animate = () => {
        const currentTime = Date.now();
        const progress = Math.min((currentTime - startTime) / duration, 1);

        // Fade out old environment
        if (this.envMesh) {
          this.envMesh.material.opacity = 1 - progress;
        }

        // Fade in new environment
        newEnvMesh.material.opacity = progress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Remove old environment when transition is complete
          if (this.envMesh) {
            this.app.scene.remove(this.envMesh);
            this.envMesh.material.dispose();
            this.envMesh.geometry.dispose();
          }
          this.envMesh = newEnvMesh;
        }
      };

      animate();

      // Update fragment materials to reflect new environment
      this.fragments.forEach((fragment) => {
        fragment.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.envMap = texture;
            child.material.needsUpdate = true;
          }
        });
      });

      // Set scene environment for reflections
      this.app.scene.environment = texture;
      this.activeEnvironment = texture;
    });
  }

  createEnvironmentSphere(texture) {
    const geometry = new THREE.SphereGeometry(500, 128, 128); // Au lieu de 60, 40
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
    });

    this.envMesh = new THREE.Mesh(geometry, material);
    this.envMesh.rotation.y = Math.PI / 2;
    this.app.scene.add(this.envMesh);

    this.activeEnvironment = texture;
  }

  onMouseMove(event) {
    if (!this.app.isBreaking || this.isAnimatingFragment) return;

    this.lastActivityTime = Date.now();
    this.userHasInteracted = true;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.app.camera);
    const intersects = this.raycaster.intersectObjects(this.fragments, true);

    if (intersects.length > 0) {
      let fragmentObject = intersects[0].object;

      while (fragmentObject.parent && !fragmentObject.userData.atelierName) {
        fragmentObject = fragmentObject.parent;
      }

      if (fragmentObject.userData && fragmentObject.userData.atelierName) {
        document.body.style.cursor = 'pointer';
        if (fragmentObject === this.selectedFragment) return;

        if (this.hoveredFragment !== fragmentObject) {
          if (
            this.hoveredFragment &&
            this.hoveredFragment !== this.selectedFragment
          ) {
            this.resetFragmentPosition(this.hoveredFragment);
          }

          this.hoveredFragment = fragmentObject;
          this.moveFragmentForward(this.hoveredFragment, 3);

          this.textElement.textContent = fragmentObject.userData.atelierName;
          this.textElement.style.display = "block";
          this.textElement.style.opacity = "1";
        }
      }
    } else {
      document.body.style.cursor = 'default';
      if (
        this.hoveredFragment &&
        this.hoveredFragment !== this.selectedFragment
      ) {
        this.resetFragmentPosition(this.hoveredFragment);
        this.hoveredFragment = null;
        this.textElement.style.opacity = "0";
        setTimeout(() => {
          this.textElement.style.display = "none";
        }, 300);
      }
    }
  }

  handleFragmentClick(event) {
    if (this.isAnimatingFragment) return;

    this.lastActivityTime = Date.now();
    this.userHasInteracted = true;

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(mouse, this.app.camera);
    const intersects = this.raycaster.intersectObjects(this.fragments, true);

    if (intersects.length === 0) {
      if (this.selectedFragment) {
        this.resetFragmentPosition(this.selectedFragment);
        this.selectedFragment = null;
        this.hideVoyagerButton();
        this.userHasInteracted = false;
        if (this.fragmentInstructions) {
          const titleElement =
            this.fragmentInstructions.querySelector(".instruction-title");
          if (titleElement) {
            titleElement.innerHTML = `
              <span class="font-aktiv">Sélectionnez un</span>
              <span class="font-fraunces">fragment</span>
            `;
          }
        }
        setTimeout(() => {
          if (!this.selectedFragment) {
            this.selectRandomFragment();
          }
        }, 10000);
      }
      return;
    }

    if (intersects.length > 0) {
      let clickedFragment = intersects[0].object;

      while (clickedFragment.parent && !clickedFragment.userData.atelierName) {
        clickedFragment = clickedFragment.parent;
      }

      if (
        clickedFragment.userData &&
        clickedFragment.userData.atelierName &&
        clickedFragment.userData.isClickable !== false
      ) {
        this.userHasInteracted = true;

        if (this.selectedFragment === clickedFragment) {
          return;
        }

        if (
          this.selectedFragment &&
          this.selectedFragment !== clickedFragment
        ) {
          this.resetFragmentPosition(this.selectedFragment);
        }

        this.fragmentSelectSound.currentTime = 0;
        this.fragmentSelectSound.volume = 0.3;
        this.fragmentSelectSound.play();
        this.selectedFragment = clickedFragment;
        this.moveFragmentForward(clickedFragment, 10);
        this.showVoyagerButton();
        this.updateEnvironment(clickedFragment.userData.atelierName);

        // Garder la position actuelle de la caméra
        const currentCameraPosition = this.app.camera.position.clone();
        const currentCameraRotation = this.app.camera.rotation.clone();

        if (this.fragmentInstructions) {
          const titleElement =
            this.fragmentInstructions.querySelector(".instruction-title");
          const subtitleElement = this.fragmentInstructions.querySelector(".instruction-subtitle");
          
          if (titleElement) {
            titleElement.innerHTML = `
              <span class="font-aktiv">${clickedFragment.userData.atelierName}</span>
              <span class="font-fraunces">fragment</span>
            `;
          }

          // Mettre à jour le sous-titre avec la description de l'atelier
          if (subtitleElement) {
            fetch('/src/data/description.json')
              .then(response => response.json())
              .then(data => {
                const atelierName = clickedFragment.userData.atelierName;
                const description = data[atelierName]?.description || "Découvrez les ateliers en détail";
                subtitleElement.textContent = description;
              });
          }
        }

        // Ajouter ces lignes
        this.hideLegalNotices();
        this.centerSoundIcon();
      }
    }
  }

  animateFragments() {
    const time = Date.now() * 0.001;

    this.fragments.forEach((fragment, index) => {
      const offset = index * (Math.PI / 6);
      const levitationAmplitude = 0.002;
      const levitationSpeed = 0.5;

      fragment.position.y +=
        Math.sin(time * levitationSpeed + offset) * levitationAmplitude;
    });
  }

  showVoyagerButton() {
    this.voyagerButton.style.display = "block";
    setTimeout(() => {
      this.voyagerButton.style.opacity = "1";
    }, 0);
  }

  hideVoyagerButton() {
    this.voyagerButton.style.opacity = "0";
    setTimeout(() => {
      this.voyagerButton.style.display = "none";
    }, 300);
  }

  selectRandomFragment() {
    // Si l'utilisateur a interagi, on arrête la sélection automatique
    if (this.userHasInteracted) return;

    // Exclure le fragment actuellement sélectionné
    const availableFragments = this.fragments.filter(
      (f) => f !== this.selectedFragment
    );
    if (availableFragments.length === 0) return;

    // Sélectionner un fragment aléatoire
    const randomIndex = Math.floor(Math.random() * availableFragments.length);
    const randomFragment = availableFragments[randomIndex];

    // Réinitialiser le fragment actuellement sélectionné
    if (this.selectedFragment) {
      this.resetFragmentPosition(this.selectedFragment);
    }

    // Sélectionner le nouveau fragment
    this.selectedFragment = randomFragment;
    this.moveFragmentForward(randomFragment);
    this.showVoyagerButton();
    this.updateEnvironment(randomFragment.userData.atelierName);

    if (this.fragmentInstructions) {
      const titleElement =
        this.fragmentInstructions.querySelector(".instruction-title");
      if (titleElement) {
        titleElement.innerHTML = `
          <span class="font-aktiv">${randomFragment.userData.atelierName}</span>
          <span class="font-fraunces">fragment</span>
        `;
      }
    }

    // Programmer la prochaine sélection automatique si l'utilisateur n'a pas interagi
    if (!this.userHasInteracted) {
      setTimeout(() => {
        this.selectRandomFragment();
      }, 10000);
    }
  }

  startAutoSelectTimer() {
    if (this.autoSelectTimer) {
      clearTimeout(this.autoSelectTimer);
    }

    const checkInactivity = () => {
      const currentTime = Date.now();
      const inactiveTime = currentTime - this.lastActivityTime;

      if (inactiveTime >= this.inactivityTimeout) {
        this.userHasInteracted = false;
        if (!this.selectedFragment) {
          this.selectRandomFragment();
        }
      }

      this.autoSelectTimer = setTimeout(checkInactivity, 1000); // Vérifier toutes les secondes
    };

    this.autoSelectTimer = setTimeout(checkInactivity, 1000);
  }

  // Nouvelle méthode pour cacher les mentions légales
  hideLegalNotices() {
    if (this.isMobile) {
      this.footerElements.forEach(element => {
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0';
        setTimeout(() => {
          element.style.display = 'none';
        }, 300);
      });
    }
  }

  // Nouvelle méthode pour centrer l'icône son
  centerSoundIcon() {
    if (window.innerWidth <= 768) {
      this.soundIcon.style.position = 'fixed';
      this.soundIcon.style.left = '50%';
      this.soundIcon.style.bottom = '10px';
      this.soundIcon.style.transform = 'translateX(-50%)';
      this.soundIcon.style.transition = 'all 0.3s ease';
    }
  }
}

export { FragmentManager };