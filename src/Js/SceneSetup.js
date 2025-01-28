import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { Loader } from "./Loader.js";

class SceneSetup {
  constructor(useHDRI = true, setupControls = true) {
    // Initialisation de base
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    // Configuration de base
    this.setupRenderer();
    this.setupCamera();
    this.setupControls();

    // Charger l'HDRI seulement si demandé
    // if (useHDRI) {
    //   this.loadHDRI();
    // }

    // Event listeners de base
    window.addEventListener("resize", () => this.onResize());
  }

  setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    const container = document.getElementById("scene-container");
    if (container) {
      container.appendChild(this.renderer.domElement);
    }
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
    this.controls.enablePan = false;
    this.controls.enableRotate = true;
    this.controls.autoRotate = false;
    
    // Activer la rotation sans clic
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    this.controls.screenSpacePanning = true;
    this.controls.listenToKeyEvents = false;

    // Limites de rotation
    this.controls.minPolarAngle = Math.PI / 2.5; // Environ 72 degrés
    this.controls.maxPolarAngle = Math.PI / 1.7; // Environ 108 degrés
    this.controls.minAzimuthAngle = -Math.PI / 8; // -22.5 degrés
    this.controls.maxAzimuthAngle = Math.PI / 8; // 22.5 degrés

    this.controls.minDistance = 50;
    this.controls.maxDistance = 200;
    this.controls.rotateSpeed = 0.5;

    // Suivre le curseur
    window.addEventListener('mousemove', (e) => {
      if (!this.controls.enabled) return;

      // Convertir la position de la souris en coordonnées normalisées (-1 à 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      // Calculer l'angle de rotation en fonction de la position de la souris
      const targetX = x * Math.PI / 4; // 45 degrés max de rotation
      const targetY = y * Math.PI / 4;

      // Mettre à jour la position cible de la caméra
      this.controls.target.x = Math.sin(targetX) * 10;
      this.controls.target.y = Math.sin(targetY) * 10;

      // Forcer la mise à jour des contrôles
      this.controls.update();
    });

    // Empêcher la désactivation du contrôle au relâchement du clic
    this.controls.domElement.addEventListener('mouseup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
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

  setupBackground() {
    const textureLoader = new THREE.TextureLoader();
    console.log("Loading initial background texture");
    textureLoader.load(
      "src/textures/escape.png",
      (texture) => {
        console.log("Initial background texture loaded");
        const aspectRatio = texture.image.width / texture.image.height;

        const bgGeometry = new THREE.PlaneGeometry(600 * aspectRatio, 550);
        const bgMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.FrontSide,
          transparent: true,
        });

        const background = new THREE.Mesh(bgGeometry, bgMaterial);
        background.position.z = -300;
        background.position.y = 0;
        texture.encoding = THREE.sRGBEncoding;

        this.scene.add(background);
        this.scene.background = new THREE.Color(0x000000);
      },
      undefined,
      (error) => {
        console.error("Error loading initial background:", error);
      }
    );
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Méthode pour nettoyer la scène en préservant les éléments importants
  clearScene() {
    console.log("Début du nettoyage de la scène");

    // Arrêter les animations en cours
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Nettoyer la scène
    if (this.scene) {
      while (this.scene.children.length > 0) {
        const object = this.scene.children[0];
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
        this.scene.remove(object);
      }
    }

    // Nettoyer le renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    // Nettoyer les contrôles
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    // Nettoyer la caméra
    if (this.camera) {
      this.camera = null;
    }

    // Nettoyer les textures
    if (this.scene && this.scene.background) {
      if (this.scene.background.dispose) {
        this.scene.background.dispose();
      }
      this.scene.background = null;
    }

    // Nettoyer la scène elle-même
    if (this.scene) {
      this.scene = null;
    }

    console.log("Fin du nettoyage de la scène");
    console.log(
      "Objets restants:",
      this.scene ? this.scene.children.length : 0
    );
  }

  // Méthode pour gérer la transition entre les scènes
  switchToGalleryScene(createNextScene, createTransitionScene = null) {
    console.log("Début de la transition vers une nouvelle scène");

    // Créer le plan de transition
    const fadeGeometry = new THREE.PlaneGeometry(100, 100);
    const fadeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthTest: false,
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
          console.log("Fade out terminé");

          // Nettoyer la scène seulement après que le fade out soit terminé
          this.clearScene([fadePlane]);

          if (createTransitionScene) {
            console.log("Création de la scène de transition");
            transitionScene = createTransitionScene();
            fadeIn();
          } else {
            console.log("Passage direct à la scène suivante");
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
        console.log("Fade in terminé");

        // Attendre avant de passer à la scène suivante
        setTimeout(() => {
          console.log("Passage à la scène suivante");
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

  onWindowResize() {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    if (this.labelRenderer) {
      this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    }
  }
}

export { SceneSetup };
