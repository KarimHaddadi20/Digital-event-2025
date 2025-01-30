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
    if (setupControls) {
      this.setupControls();
    }

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

    // Désactiver complètement la rotation verticale
    this.controls.minPolarAngle = Math.PI / 2; // 90 degrés
    this.controls.maxPolarAngle = Math.PI / 2; // 90 degrés

    // Limiter la rotation horizontale si nécessaire
    this.controls.minAzimuthAngle = -Math.PI / 12;
    this.controls.maxAzimuthAngle = Math.PI / 12;

    // Autres configurations...

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.enableRotate = true;
    this.controls.autoRotate = false;

    // Détection plus précise des appareils mobiles
    const isMobileDevice = () => {
      const hasTouchScreen =
        navigator.maxTouchPoints > 0 || "ontouchstart" in window;
      const isSmallScreen = window.innerWidth <= 768;
      return hasTouchScreen && isSmallScreen;
    };

    // Configuration mobile uniquement
    if (isMobileDevice()) {
      this.controls.mouseButtons = {};
      this.controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
      };
    }

    this.controls.screenSpacePanning = true;
    this.controls.listenToKeyEvents = false;

    this.controls.minDistance = 50;
    this.controls.maxDistance = 200;
    this.controls.rotateSpeed = 0.5;

    this.isNavigating = false;

    // Suivre le curseur sur desktop
    window.addEventListener("mousemove", (e) => {
      if (!this.controls || !this.controls.enabled || this.isNavigating) return;

      // Ne pas appliquer le suivi du curseur sur mobile
      if (isMobileDevice()) return;

      const x = (e.clientX / window.innerWidth) * 2 - 1;
      // Supprimer le calcul de y puisqu'on ne veut pas de mouvement vertical

      const targetX = (x * Math.PI) / 4;
      // Ne pas modifier targetY

      this.controls.target.x = Math.sin(targetX) * 20;
      // Ne pas modifier target.y pour éviter le mouvement vertical
      this.controls.update();
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
    textureLoader.load(
      "src/textures/escape.png",
      (texture) => {
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
        // texture.encoding = THREE.sRGBEncoding;
        texture.outputColorSpace = THREE.SRGBColorSpace;

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
  }

  // Méthode pour gérer la transition entre les scènes
  switchToGalleryScene(createNextScene, createTransitionScene = null) {

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
        fadeMaterial.opacity += 0.1;

        if (fadeMaterial.opacity >= 1) {
          fadeOutComplete = true;

          // Nettoyer la scène seulement après que le fade out soit terminé
          this.clearScene([fadePlane]);

          if (createTransitionScene) {
            transitionScene = createTransitionScene();
            fadeIn();
          } else {
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
        // Attendre avant de passer à la scène suivante
        setTimeout(() => {
          createNextScene();
          this.cleanupTransition(fadePlane);
        }, 500);
        return;
      }

      fadeMaterial.opacity -= 0.01;
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
