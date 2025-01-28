import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SceneSetup } from "./SceneSetup.js";
import { FragmentManager } from "./FragmentManager.js";
import { PortalTransitionScene } from "./PortalTransitionScene.js";

class MirrorBreakEffect extends SceneSetup {
  constructor(startBroken = false) {
    // Appeler le constructeur parent avec HDRI activé
    super(true);

    // État
    this.isBreaking = false;
    this.isFragmentSelected = false;
    this.mirror = null;
    this.startBroken = startBroken;
    this.isAnimating = true;
    this.mirrorInstructions = null;
    this.fragmentInstructions = null;
    this.isInitialized = false;

    // Initialisation du gestionnaire de fragments
    this.fragmentManager = new FragmentManager(this);

    // Ajouter l'écouteur pour le bouton back
    this.handleBackButton = this.handleBackButton.bind(this);
    window.addEventListener('popstate', this.handleBackButton);

    // Initialiser l'environnement
    this.init();
  }

  handleBackButton(event) {
    console.log("Back button pressed - Réinitialisation complète de la scène");
    // Forcer une réinitialisation complète
    this.fullReset();
  }

  async fullReset() {
    // Arrêter toute animation en cours
    this.isAnimating = false;
    
    // Nettoyer complètement la scène actuelle
    this.cleanup();
    
    // Nettoyer le conteneur
    const container = document.getElementById("scene-container");
    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
    
    // Réinitialiser tous les états
    this.isBreaking = false;
    this.isFragmentSelected = false;
    this.mirror = null;
    this.isInitialized = false;
    this.fragmentManager = null;
    
    // Recréer le fragment manager
    this.fragmentManager = new FragmentManager(this);
    
    // Réinitialiser la scène
    await this.init();
  }

  async init() {
    try {
      // Nettoyer la scène précédente si elle existe
      if (this.isInitialized) {
        this.cleanup();
      }

      // Réinitialiser la scène de base
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      
      // Recréer le renderer
      const container = document.getElementById("scene-container");
      if (container) {
        // Nettoyer le container
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        
        // Créer un nouveau renderer
        this.renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 1);
        container.appendChild(this.renderer.domElement);
      }

      // Configurer la caméra
      this.camera.position.set(0, 0, 5);
      this.camera.lookAt(0, 0, 0);

      // Configurer les contrôles
      this.setupControls();

      // Configurer les lumières
      await this.setupLights();
      
      // Réinitialiser le fragment manager
      this.fragmentManager = new FragmentManager(this);
      
      // Charger le modèle du miroir
      await this.fragmentManager.loadMirrorModel();
      
      // Créer les éléments UI
      this.createUIElements();

      // Configurer l'état initial
      if (this.startBroken) {
        this.initBrokenState();
      }

      // Configurer les événements
      this.setupEventListeners();

      // Démarrer l'animation
      this.isAnimating = true;
      this.animate();

      this.isInitialized = true;
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la scène:", error);
    }
  }

  async setupLights() {
    // Lumière ambiante
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Lumière directionnelle principale
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    // Lumières d'accentuation
    const pointLight1 = new THREE.PointLight(0xffffff, 1, 10);
    pointLight1.position.set(-5, 5, 0);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 1, 10);
    pointLight2.position.set(5, -5, 0);
    this.scene.add(pointLight2);
  }

  createUIElements() {
    // Supprimer les anciennes instructions si elles existent
    this.cleanupUIElements();

    // Créer les instructions du miroir
    this.mirrorInstructions = document.createElement("div");
    this.mirrorInstructions.className = "mirror-instructions";
    this.mirrorInstructions.innerHTML = `
      <div class="instruction-title">
        <span class="font-aktiv">Cassez le</span>
        <span class="font-fraunces">miroir</span>
      </div>
      <div class="instruction-subtitle">Cliquez pour découvrir les ateliers</div>
    `;
    document.body.appendChild(this.mirrorInstructions);

    // Créer les instructions des fragments
    this.fragmentInstructions = document.createElement("div");
    this.fragmentInstructions.className = "fragment-instructions";
    this.fragmentInstructions.innerHTML = `
      <div class="instruction-title">
        <span class="font-aktiv">Sélectionnez un</span>
        <span class="font-fraunces">fragment</span>
      </div>
      <div class="instruction-subtitle">Cliquez pour découvrir l'atelier</div>
    `;
    this.fragmentInstructions.style.display = "none";
    document.body.appendChild(this.fragmentInstructions);
  }

  cleanupUIElements() {
    // Supprimer les anciennes instructions si elles existent
    const oldMirrorInstructions = document.querySelector(".mirror-instructions");
    const oldFragmentInstructions = document.querySelector(".fragment-instructions");

    if (oldMirrorInstructions) {
      oldMirrorInstructions.remove();
    }
    if (oldFragmentInstructions) {
      oldFragmentInstructions.remove();
    }
  }

  initBrokenState() {
    console.log("Initialisation de l'état brisé...");
    if (this.mirrorInstructions) {
      this.mirrorInstructions.style.display = "none";
    }
    if (this.fragmentInstructions) {
      this.fragmentInstructions.style.display = "block";
    }
    if (this.mirror) {
      this.mirror.visible = false;
      this.isBreaking = true;
      this.isBroken = true;
      this.fragmentManager.breakMirror();
    }
  }

  setupEventListeners() {
    this.handleClick = this.handleClick.bind(this);
    document.addEventListener("click", this.handleClick);
    window.addEventListener("mousemove", (event) =>
      this.fragmentManager.onMouseMove(event)
    );
    window.addEventListener("resize", () => this.onWindowResize());
  }

  animate() {
    if (!this.isAnimating) return;
    requestAnimationFrame(() => this.animate());
    if (this.isBreaking) {
      this.fragmentManager.animateFragments();
    }
    if (this.controls) {
      this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }

  handleClick(event) {
    // Vérifier si le menu est ouvert
    const sideMenu = document.getElementById("side-menu");
    if (sideMenu && sideMenu.classList.contains("open")) {
      return;
    }

    // Vérifier si on clique sur le menu burger
    if (
      event.target.closest("#burger-menu") ||
      event.target.closest("#side-menu")
    ) {
      return;
    }

    if (this.isBroken) return;

    if (!this.isBreaking && this.mirror) {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);

      const intersects = raycaster.intersectObject(this.mirror, true);

      if (intersects.length > 0) {
        if (this.mirrorInstructions) {
          this.mirrorInstructions.style.display = "none";
        }
        if (this.fragmentInstructions) {
          this.fragmentInstructions.style.display = "block";
        }

        this.fragmentManager.breakMirror();
        this.isBroken = true;

        const mirrorBrokenEvent = new Event("mirrorBroken");
        document.dispatchEvent(mirrorBrokenEvent);
        return;
      }
    }

    this.fragmentManager.handleFragmentClick(event);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  switchToGalleryScene(fragmentIndex) {
    console.log("MirrorBreakEffect: Début de la transition");

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

    let fadeOutComplete = false;
    const fadeOut = () => {
      if (fadeMaterial.opacity >= 1) {
        fadeOutComplete = true;
        console.log("MirrorBreakEffect: Fade out terminé");

        this.isAnimating = false;

        if (this.controls && this.controls.enabled) {
          this.controls.enabled = false;
        }

        this.clearScene();

        document.removeEventListener("click", this.handleClick);
        window.removeEventListener(
          "mousemove",
          this.fragmentManager.onMouseMove
        );

        console.log("MirrorBreakEffect: Création de la scène de transition");
        const transitionScene = new PortalTransitionScene(this, fragmentIndex);

        return;
      }
      fadeMaterial.opacity += 0.02;
      requestAnimationFrame(fadeOut);
    };
    fadeOut();
  }

  cleanup() {
    console.log("Nettoyage de MirrorBreakEffect");
    
    // Nettoyer les éléments UI
    this.cleanupUIElements();

    // Nettoyer les événements
    document.removeEventListener("click", this.handleClick);
    window.removeEventListener("mousemove", this.fragmentManager?.onMouseMove);
    window.removeEventListener("resize", this.onWindowResize);

    // Arrêter l'animation
    this.isAnimating = false;

    // Nettoyer le fragment manager
    if (this.fragmentManager) {
      this.fragmentManager = null;
    }

    // Nettoyer la scène
    if (this.scene) {
      while(this.scene.children.length > 0) {
        const object = this.scene.children[0];
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
        this.scene.remove(object);
      }
      this.scene = null;
    }

    // Nettoyer le renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      const gl = this.renderer.getContext();
      if (gl) {
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) loseContext.loseContext();
      }
      this.renderer.domElement.remove();
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

    // Réinitialiser les états
    this.isBreaking = false;
    this.isFragmentSelected = false;
    this.mirror = null;
    this.isInitialized = false;

    console.log("Nettoyage terminé");
  }
}

export { MirrorBreakEffect };
