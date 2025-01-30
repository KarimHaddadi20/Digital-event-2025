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
    // this.renderer.outputEncoding = THREE.sRGBEncoding; // Pour un meilleur rendu des couleurs
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // Tonemapping pour des couleurs réalistes
    this.renderer.setPixelRatio(window.devicePixelRatio); // Adapter au ratio de l'écran
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Charger la texture initiale
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("src/textures/homepage7.webp", (texture) => {
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
        opacity: 1,
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
      Video: "src/textures/video.studio.webp",
      "Escape game": "src/textures/escape.game.webp",
      Podcast: "src/textures/podcast.webp",
      "Photo reportage": "src/textures/photography.webp",
      "AI Driven visual stories": "src/textures/ai.driven.visual.stories.webp",
      "Game design": "src/textures/game.design.webp",
      Organisation: "src/textures/organisation.webp",
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
    this.footerElements = document.querySelectorAll(".footer-right p");
    this.soundIcon = document.querySelector(".footer-left");
    this.fragmentSelectSound = document.getElementById("fragment-select-sound");
    this.buttonPressSound = document.getElementById("button-press-sound");

    // Ajouter un event listener pour le resize
    window.addEventListener("resize", () => {
        this.isMobile = window.innerWidth <= 768;
        this.hideLegalNotices();
        this.centerSoundIcon();
    });
    
    // Appeler au chargement initial
    if (this.isMobile) {
        this.hideLegalNotices();
        this.centerSoundIcon();
    }
  }

  setupUI() {
    // Créer le bouton Voyager
    this.voyagerButton = document.createElement("button");
    this.voyagerButton.textContent = "Voyager";
    this.voyagerButton.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 5vh;
      transform: translateX(-50%);
      display: none;
      opacity: 0;
      padding: 12px 24px;
      background: linear-gradient(343.92deg, rgba(21, 21, 27, 0.6) -1.4%, rgba(79, 79, 86, 0.6) 104.72%);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      color: white;
      font-family: "Aktiv Grotesk", sans-serif;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      z-index: 9998;
    `;

    // Ajouter l'événement click sur le bouton Voyager
    // Gestion du clic
    this.voyagerButton.addEventListener("click", () => {
      if (this.selectedFragment) {
        // Play button press sound
        this.buttonPressSound.currentTime = 0;
        this.buttonPressSound.volume = 0.1;
        this.buttonPressSound.play();

        this.hideVoyagerButton();
        this.animateFragmentFall(this.selectedFragment);

        // Désactiver les contrôles de la caméra
        this.app.controls.enabled = false;

        // Bloquer le suivi du curseur
        this.app.isNavigating = true;

        // Réinitialiser la rotation de la caméra
        window.gsap.to(this.app.camera.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.5,
          ease: "power2.inOut",
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
          bottom: 9vh; 
          transform: translateX(-50%);
          display: none;
          opacity: 0;
          padding: 12px 24px;
          background: linear-gradient(343.92deg, rgba(21, 21, 27, 0.6) -1.4%, rgba(79, 79, 86, 0.6) 104.72%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: white;
          font-family: "Aktiv Grotesk", sans-serif;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 9998;
        `;
      }
    };

    // Appliquer le responsive
    handleResponsive();
    window.addEventListener("resize", handleResponsive);
    window.addEventListener("resize", () => {
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
                envMapIntensity: 1.5, // Intensité des reflets de l'environnement
                // Propriétés de revêtement
                clearcoat: 0, // Couche de vernis (0 = aucune, 1 = maximum)
                clearcoatRoughness: 0, // Rugosité de la couche de vernis
                // Propriétés de rendu
                transparent: true, // Active/désactive la transparence
                opacity: 1, // 1 = totalement opaque, 0 = invisible
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

    // Sélection automatique du premier fragment après 10 secondes UNIQUEMENT si l'utilisateur n'a pas interagi
    setTimeout(() => {
      if (!this.userHasInteracted && this.fragments.length > 0) {
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

        // Démarrer le timer pour la sélection aléatoire uniquement si l'utilisateur n'a toujours pas interagi
        if (!this.userHasInteracted) {
          this.startAutoSelectTimer();
        }
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
    // Si on demande l'environnement initial
    if (atelierName === "initial") {
      if (this.initialEnvironment) {
        // Créer une nouvelle sphère avec la texture initiale
        const geometry = new THREE.SphereGeometry(500, 256, 256);
        const material = new THREE.MeshBasicMaterial({
          map: this.initialEnvironment,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0,
        });

        const newEnvMesh = new THREE.Mesh(geometry, material);
        newEnvMesh.rotation.y = Math.PI / 2;
        this.app.scene.add(newEnvMesh);

        // Faire la transition
        const duration = 1000;
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
            // Remove old environment
            if (this.envMesh) {
              this.app.scene.remove(this.envMesh);
              this.envMesh.material.dispose();
              this.envMesh.geometry.dispose();
            }
            this.envMesh = newEnvMesh;
          }
        };

        animate();

        // Mettre à jour l'environnement de la scène
        this.app.scene.environment = this.initialEnvironment;
        this.activeEnvironment = this.initialEnvironment;

        // Mettre à jour le matériau du miroir
        if (this.app.mirror) {
          this.app.mirror.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.envMap = this.initialEnvironment;
              child.material.needsUpdate = true;
            }
          });
        }

        // Mettre à jour les matériaux des fragments
        this.fragments.forEach((fragment) => {
          fragment.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.envMap = this.initialEnvironment;
              child.material.needsUpdate = true;
            }
          });
        });

        return;
      }
    }

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
        opacity: 0,
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
    
    // Désactiver définitivement l'auto-sélection si l'utilisateur interagit
    if (this.autoSelectTimer) {
      clearTimeout(this.autoSelectTimer);
      this.autoSelectTimer = null;
    }

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
        document.body.style.cursor = "pointer";
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
        }
      }
    } else {
      document.body.style.cursor = "default";
      if (
        this.hoveredFragment &&
        this.hoveredFragment !== this.selectedFragment
      ) {
        this.resetFragmentPosition(this.hoveredFragment);
        this.hoveredFragment = null;
      }
    }
  }

  handleFragmentClick(event) {
    if (this.isAnimatingFragment) return;

    // Désactiver définitivement l'auto-sélection dès qu'un clic est détecté
    this.userHasInteracted = true;
    if (this.autoSelectTimer) {
      clearTimeout(this.autoSelectTimer);
      this.autoSelectTimer = null;
    }

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(mouse, this.app.camera);
    const intersects = this.raycaster.intersectObjects(this.fragments, true);

    // Clic en dehors des fragments
    if (intersects.length === 0) {
      if (this.selectedFragment) {
        this.resetFragmentPosition(this.selectedFragment);
        this.selectedFragment = null;
        this.hideVoyagerButton();
        this.userHasInteracted = false;

        // Réinitialiser l'environnement au background initial
        if (this.initialEnvironment) {
          this.updateEnvironment("initial");
        }

        // Réinitialiser les textes
        if (this.fragmentInstructions) {
          const titleElement = this.fragmentInstructions.querySelector(".instruction-title");
          const subtitleElement = this.fragmentInstructions.querySelector(".instruction-subtitle");
          
          if (titleElement) {
            titleElement.innerHTML = `
              <span class="font-aktiv">Sélectionnez un</span>
              <span class="font-fraunces">fragment</span>
            `;
          }
          
          if (subtitleElement) {
            subtitleElement.textContent = "Découvrez les ateliers en détail";
          }
        }

        // Relancer l'autoSelect
        if (this.autoSelectTimer) {
          clearTimeout(this.autoSelectTimer);
        }
        this.startAutoSelectTimer();
      }
      return;
    }

    // Clic sur un fragment
    if (intersects.length > 0) {
      let clickedFragment = intersects[0].object;

      while (clickedFragment.parent && !clickedFragment.userData.atelierName) {
        clickedFragment = clickedFragment.parent;
      }

      if (clickedFragment.userData && 
          clickedFragment.userData.atelierName && 
          clickedFragment.userData.isClickable !== false) {
        
        // Désactiver complètement l'autoSelect car l'utilisateur a fait une sélection manuelle
        this.userHasInteracted = true;
        if (this.autoSelectTimer) {
          clearTimeout(this.autoSelectTimer);
          this.autoSelectTimer = null;
        }

        if (this.selectedFragment === clickedFragment) {
          return;
        }

        if (this.selectedFragment && this.selectedFragment !== clickedFragment) {
          this.resetFragmentPosition(this.selectedFragment);
        }

        // Sélection du nouveau fragment
        this.fragmentSelectSound.currentTime = 0;
        this.fragmentSelectSound.volume = 0.3;
        this.fragmentSelectSound.play();
        this.selectedFragment = clickedFragment;
        this.moveFragmentForward(clickedFragment, 10);
        this.showVoyagerButton();
        this.updateEnvironment(clickedFragment.userData.atelierName);

        // Mise à jour des textes
        if (this.fragmentInstructions) {
          const titleElement = this.fragmentInstructions.querySelector(".instruction-title");
          const subtitleElement = this.fragmentInstructions.querySelector(".instruction-subtitle");

          if (titleElement) {
            titleElement.innerHTML = `
              <span class="font-aktiv">${clickedFragment.userData.atelierName}</span>
              <span class="font-fraunces">fragment</span>
            `;
          }

          if (subtitleElement) {
            fetch("/src/data/description.json")
              .then((response) => response.json())
              .then((data) => {
                const atelierName = clickedFragment.userData.atelierName;
                const description = data[atelierName]?.description || "Découvrez les ateliers en détail";
                subtitleElement.textContent = description;
              });
          }
        }

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

  startAutoSelectTimer() {
    if (this.autoSelectTimer) {
      clearTimeout(this.autoSelectTimer);
    }

    // Ne démarrer le timer que si l'utilisateur n'a jamais interagi
    if (!this.userHasInteracted && !this.selectedFragment) {
      this.autoSelectTimer = setTimeout(() => {
        this.selectRandomFragment();
      }, 10000);
    }
  }

  selectRandomFragment() {
    // Ne pas sélectionner si l'utilisateur a déjà interagi
    if (this.userHasInteracted || this.selectedFragment) return;

    const availableFragments = this.fragments.filter(f => f !== this.selectedFragment);
    if (availableFragments.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableFragments.length);
    const randomFragment = availableFragments[randomIndex];

    if (this.selectedFragment) {
      this.resetFragmentPosition(this.selectedFragment);
    }

    this.selectedFragment = randomFragment;
    this.moveFragmentForward(randomFragment);
    this.showVoyagerButton();
    this.updateEnvironment(randomFragment.userData.atelierName);

    if (this.fragmentInstructions) {
      const titleElement = this.fragmentInstructions.querySelector(".instruction-title");
      if (titleElement) {
        titleElement.innerHTML = `
          <span class="font-aktiv">${randomFragment.userData.atelierName}</span>
          <span class="font-fraunces">fragment</span>
        `;
      }
    }

    // Continuer la sélection automatique uniquement si l'utilisateur n'a jamais interagi
    if (!this.userHasInteracted) {
      this.startAutoSelectTimer();
    }
  }

  // Nouvelle méthode pour cacher les mentions légales
  hideLegalNotices() {
    // Masquer les mentions légales en responsive uniquement
    if (this.isMobile) {
        this.footerElements.forEach((element) => {
            element.style.display = "none";  // Masquer directement sans transition
        });
    }
  }

  // Nouvelle méthode pour centrer l'icône son
  centerSoundIcon() {
    if (this.isMobile) {
        if (this.soundIcon) {
            this.soundIcon.style.cssText = `
                position: fixed;
                left: 50%;
                bottom: 16px;
                transform: translateX(-50%);
                z-index: 1000;
            `;
        }
    } else {
        if (this.soundIcon) {
            // Réinitialiser le style pour desktop
            this.soundIcon.style.cssText = '';
        }
    }
  }
}

export { FragmentManager };
