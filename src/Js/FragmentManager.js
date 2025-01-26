import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

class FragmentManager {
  constructor(app) {
    this.app = app;
    this.fragments = [];
    this.hoveredFragment = null;
    this.isAnimatingFragment = false;
    this.selectedFragment = null;
    this.userHasInteracted = false;
    this.fragmentInstructions = document.querySelector('.fragment-instructions');
    this.initialBackground = null;
    this.activeBackground = null;
    this.backgroundTextures = {
      "Atelier 1": "./src/textures/Atelier1.png",
      "Atelier 2": "src/textures/Atelier2.png",
      "Atelier 3": "src/textures/Atelier3.png",
      "Atelier 4": "src/textures/Atelier4.png",
      "Atelier 5": "src/textures/Atelier5.png",
      "Atelier 6": "src/textures/Atelier6.png",
      "Atelier 7": "src/textures/Atelier7.png",
      "Atelier 8": "src/textures/Atelier8.png",
      "Atelier 9": "src/textures/Atelier9.png",
      "Atelier 10": "src/textures/Atelier10.png",
      "Atelier 11": "src/textures/Atelier11.png"
    };
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

    this.autoSelectTimer = null;

    this.setupUI();
    this.initRaycaster();
  }

  setupUI() {
    this.textElement = document.createElement("div");
    this.textElement.style.position = "fixed";
    this.textElement.style.color = "white";
    this.textElement.style.padding = "12px 20px";
    this.textElement.style.background = "rgba(0, 0, 0, 0.7)";
    this.textElement.style.borderRadius = "20px";
    this.textElement.style.display = "none";
    this.textElement.style.fontSize = "24px";
    this.textElement.style.fontFamily = "Arial, sans-serif";
    this.textElement.style.transition = "opacity 0.3s ease";
    this.textElement.style.pointerEvents = "none";
    this.textElement.style.zIndex = "1000";
    document.body.appendChild(this.textElement);

    // Création du bouton Voyager
    this.voyagerButton = document.createElement("button");
    this.voyagerButton.textContent = "Voyager";
    this.voyagerButton.style.position = "fixed";
    this.voyagerButton.style.left = "50%";
    this.voyagerButton.style.bottom = "4vh";
    this.voyagerButton.style.transform = "translateX(-50%)";
    this.voyagerButton.style.display = "none";
    this.voyagerButton.style.opacity = "0";
    this.voyagerButton.style.padding = "18px 52px";
    this.voyagerButton.style.justifyContent = "center";
    this.voyagerButton.style.alignItems = "center";
    this.voyagerButton.style.gap = "4px";
    this.voyagerButton.style.borderRadius = "4px";
    this.voyagerButton.style.border = "1px solid #FFF";
    this.voyagerButton.style.background = "linear-gradient(344deg, rgba(21, 21, 27, 0.20) -1.4%, rgba(79, 79, 86, 0.20) 104.72%)";
    this.voyagerButton.style.backdropFilter = "blur(2px)";
    this.voyagerButton.style.color = "white";
    this.voyagerButton.style.fontSize = "20px";
    this.voyagerButton.style.fontFamily = "Arial, sans-serif";
    this.voyagerButton.style.cursor = "pointer";
    this.voyagerButton.style.transition = "all 0.3s ease";
    this.voyagerButton.style.zIndex = "1000";

    // Effets de hover
    this.voyagerButton.addEventListener("mouseenter", () => {
      this.voyagerButton.style.background = "linear-gradient(344deg, rgba(21, 21, 27, 0.40) -1.4%, rgba(79, 79, 86, 0.40) 104.72%)";
      this.voyagerButton.style.transform = "translateX(-50%) scale(1.05)";
    });

    this.voyagerButton.addEventListener("mouseleave", () => {
      this.voyagerButton.style.background = "linear-gradient(344deg, rgba(21, 21, 27, 0.20) -1.4%, rgba(79, 79, 86, 0.20) 104.72%)";
      this.voyagerButton.style.transform = "translateX(-50%) scale(1)";
    });

    // Gestion du clic
    this.voyagerButton.addEventListener("click", () => {
      if (this.selectedFragment) {
        this.hideVoyagerButton();
        this.animateFragmentFall(this.selectedFragment);
      }
    });

    document.body.appendChild(this.voyagerButton);
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
                metalness: 1,
                roughness: 0,
                transmission: 0.1,
                thickness: 10,
                envMap: this.app.scene.environment,
                envMapIntensity: 1.5,
                clearcoat: 10,
                clearcoatRoughness: 0.06,
                transparent: false,
                opacity: 0.7,
                side: THREE.DoubleSide,
                depthWrite: false,
              });
            }
          });

          this.app.mirror.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshPhysicalMaterial({
                // Propriétés métalliques
                metalness: 1, // 1 = totalement métallique, 0 = non métallique
                roughness: 0.06, // 0 = surface parfaitement lisse (miroir), 1 = surface rugueuse
                // Propriétés de transparence
                transmission: 1, // 0 = opaque, 1 = totalement transparent
                thickness: 1, // Épaisseur du matériau pour les effets de réfraction
                reflectivity: 0, // Intensité des reflets
                iridescence: 0, // Intensité de l'iridescence
                // Propriétés de réflexion
                envMap: this.app.scene.environment, // Texture d'environnement pour les reflets
                envMapIntensity: 0.25, // Intensité des reflets de l'environnement
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
                envMapIntensity: 0.25, // Intensité des reflets de l'environnement
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
          fragment.position.x = config.position - (rowCount - 1) / 2;
          fragment.position.y = -config.row - 55;
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

    this.app.camera.position.z = 5;

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
        this.updateBackground(firstFragment.userData.atelierName);
        
        if (this.fragmentInstructions) {
          const titleElement = this.fragmentInstructions.querySelector('.instruction-title');
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

  moveFragmentForward(fragment) {
    if (fragment.userData.originalY === undefined) {
      fragment.userData.originalY = fragment.position.y;
      fragment.userData.originalZ = fragment.position.z;
    }

    const duration = 1500;
    const startZ = fragment.position.z;
    const targetZ = fragment.userData.originalZ + 10;
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
    const fragmentInstructions = document.querySelector('.fragment-instructions');
    if (fragmentInstructions) {
        fragmentInstructions.style.display = 'none';
    }

    // Désactiver les interactions avec les autres fragments
    this.fragments.forEach(f => {
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
      { x: -30, y: -140, z: 0 },
      { x: 0, y: -145, z: 0 },
      { x: 35, y: -145, z: 0 },
      { x: -30, y: -90, z: 0 },
      { x: 0, y: -90, z: 0 },
      { x: 35, y: -100, z: 0 },
      { x: -30, y: -40, z: 0 },
      { x: 0, y: -40, z: 0 },
      { x: 35, y: -45, z: 0 },
      { x: -20, y: -10, z: 0 },
      { x: 35, y: -10, z: 0 },
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

  // Sauvegarder le background initial
  saveInitialBackground() {
    const background = this.app.scene.children.find(child => 
      child.material && child.material.map && child.position.z === -300
    );
    if (background) {
      this.initialBackground = background;
      this.initialBackground.material.transparent = true;
    }
  }

  // Changer le background
  updateBackground(atelierName) {
    console.log("Updating background with:", atelierName);
    if (!this.initialBackground) {
      console.log("Saving initial background");
      this.saveInitialBackground();
    }
    
    if (!atelierName) {
      console.log("No atelier name, reverting to initial background");
      if (this.activeBackground) {
        window.gsap.to(this.activeBackground.material, {
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            this.activeBackground.visible = false;
            if (this.initialBackground && this.initialBackground.parent) {
              this.initialBackground.visible = true;
              window.gsap.to(this.initialBackground.material, {
                opacity: 1,
                duration: 0.5
              });
            } else {
              this.setupInitialBackground();
            }
          }
        });
      }
      return;
    }
    
    const texturePath = this.backgroundTextures[atelierName];
    console.log("Loading texture from:", texturePath);
    if (!texturePath) {
      console.log("No texture path found for:", atelierName);
      return;
    }
    
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(texturePath, 
      (texture) => {
        console.log("Texture loaded successfully");
        if (this.activeBackground) {
          const previousBackground = this.activeBackground;
          window.gsap.to(this.activeBackground.material, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
              const aspectRatio = texture.image.width / texture.image.height;
              const bgGeometry = new THREE.PlaneGeometry(600 * aspectRatio, 550);
              const bgMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.FrontSide,
                transparent: true,
                opacity: 0
              });
              this.activeBackground = new THREE.Mesh(bgGeometry, bgMaterial);
              this.activeBackground.position.z = -300;
              this.activeBackground.position.y = 0;
              this.app.scene.add(this.activeBackground);
              
              this.app.scene.remove(previousBackground);
              previousBackground.geometry.dispose();
              previousBackground.material.dispose();
              
              window.gsap.to(this.activeBackground.material, {
                opacity: 1,
                duration: 0.3
              });
            }
          });
        } else {
          const aspectRatio = texture.image.width / texture.image.height;
          const bgGeometry = new THREE.PlaneGeometry(600 * aspectRatio, 550);
          const bgMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.FrontSide,
            transparent: true,
            opacity: 0
          });
          this.activeBackground = new THREE.Mesh(bgGeometry, bgMaterial);
          this.activeBackground.position.z = -300;
          this.activeBackground.position.y = 0;
          this.app.scene.add(this.activeBackground);
          window.gsap.to(this.activeBackground.material, {
            opacity: 1,
            duration: 0.5
          });
        }
        
        if (this.initialBackground) {
          window.gsap.to(this.initialBackground.material, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
              this.initialBackground.visible = false;
            }
          });
        }
      },
      undefined,
      (error) => {
        console.error("Error loading texture:", error);
      }
    );
  }

  setupInitialBackground() {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("src/textures/escape.png", (texture) => {
      const aspectRatio = texture.image.width / texture.image.height;
      const bgGeometry = new THREE.PlaneGeometry(600 * aspectRatio, 550);
      const bgMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.FrontSide,
        transparent: true,
      });
      this.initialBackground = new THREE.Mesh(bgGeometry, bgMaterial);
      this.initialBackground.position.z = -300;
      this.initialBackground.position.y = 0;
      this.app.scene.add(this.initialBackground);
    });
  }

  onMouseMove(event) {
    if (!this.app.isBreaking || this.isAnimatingFragment) return;

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
        if (fragmentObject === this.selectedFragment) return;

        if (this.hoveredFragment !== fragmentObject) {
          if (this.hoveredFragment && this.hoveredFragment !== this.selectedFragment) {
            this.resetFragmentPosition(this.hoveredFragment);
          }

          this.hoveredFragment = fragmentObject;
          this.moveFragmentForward(this.hoveredFragment);

          this.textElement.textContent = fragmentObject.userData.atelierName;
          this.textElement.style.display = "block";
          this.textElement.style.opacity = "1";
          
          if (!this.selectedFragment) {
            this.updateBackground(fragmentObject.userData.atelierName);
          }
        }
      }
    } else {
      if (this.hoveredFragment && this.hoveredFragment !== this.selectedFragment) {
        this.resetFragmentPosition(this.hoveredFragment);
        this.hoveredFragment = null;
        this.textElement.style.opacity = "0";
        setTimeout(() => {
          this.textElement.style.display = "none";
        }, 300);
        if (!this.selectedFragment) {
          this.updateBackground(null);
        }
      }
    }
  }

  handleFragmentClick(event) {
    if (this.isAnimatingFragment) return;

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
          const titleElement = this.fragmentInstructions.querySelector('.instruction-title');
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

        if (this.selectedFragment && this.selectedFragment !== clickedFragment) {
          this.resetFragmentPosition(this.selectedFragment);
        }

        this.selectedFragment = clickedFragment;
        this.moveFragmentForward(clickedFragment);
        this.showVoyagerButton();
        this.updateBackground(clickedFragment.userData.atelierName);
        
        if (this.fragmentInstructions) {
          const titleElement = this.fragmentInstructions.querySelector('.instruction-title');
          if (titleElement) {
            titleElement.innerHTML = `
              <span class="font-aktiv">${clickedFragment.userData.atelierName}</span>
              <span class="font-fraunces">fragment</span>
            `;
          }
        }
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
    const availableFragments = this.fragments.filter(f => f !== this.selectedFragment);
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
    this.updateBackground(randomFragment.userData.atelierName);
    
    if (this.fragmentInstructions) {
      const titleElement = this.fragmentInstructions.querySelector('.instruction-title');
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
    
    if (!this.selectedFragment) {
      this.autoSelectTimer = setTimeout(() => {
        this.selectRandomFragment();
      }, 10000);
    }
  }
}

export { FragmentManager };
