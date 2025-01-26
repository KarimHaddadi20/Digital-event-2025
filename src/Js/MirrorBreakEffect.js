import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { SceneSetup } from "./SceneSetup.js";
import { FragmentManager } from "./FragmentManager.js";
// import { AtelierGalleryScene } from "./AtelierGalleryScene.js";
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

    // Initialisation du gestionnaire de fragments
    this.fragmentManager = new FragmentManager(this);

    // Initialiser l'environnement
    this.onReady = () => {
      // Ajouter les instructions
      const container = document.createElement('div');
      container.className = 'mirror-instructions';
      container.textContent = 'Cassez le miroir';
      document.body.appendChild(container);

      const fragmentInstructions = document.createElement('div');
      fragmentInstructions.className = 'fragment-instructions';
      fragmentInstructions.textContent = 'Cliquez sur un fragment pour découvrir son atelier';
      fragmentInstructions.style.display = 'none';
      document.body.appendChild(fragmentInstructions);

      if (this.startBroken) {
        console.log("Cassure automatique du miroir...");
        // Cacher les instructions du miroir et afficher les instructions des fragments
        container.style.display = 'none';
        fragmentInstructions.style.display = 'block';
        
        // Casser le miroir
        this.mirror.visible = false;
        this.isBreaking = true;
        this.fragmentManager.breakMirror();
      }
    };
    
    this.setupScene();
  }

  setupScene() {
    let hdriLoaded = false;
    let modelLoaded = false;

    // Charger l'environnement et les lumières
    this.setupLights();
    this.setupBackground();
    // this.loadHDRI().then(() => {
    //     hdriLoaded = true;
    //     if (modelLoaded && this.onReady) {
    //         this.onReady();
    //     }
    // });

    // Charger le modèle du miroir
    this.fragmentManager.loadMirrorModel().then(() => {
      modelLoaded = true;
      
      if (this.onReady) {
        this.onReady();
      }
    });

    // Event listeners
    this.setupEventListeners();

    // Démarrer l'animation
    this.animate();
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
    if (this.isBroken) return;
    
    if (!this.isBreaking && this.mirror) {
      // Créer un raycaster pour détecter le clic sur le miroir
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);

      // Vérifier si le clic touche le miroir
      const intersects = raycaster.intersectObject(this.mirror, true);

      if (intersects.length > 0) {
        // Cacher les instructions du miroir et afficher les instructions des fragments
        const instructions = document.querySelector(".mirror-instructions");
        const fragmentInstructions = document.querySelector(
          ".fragment-instructions"
        );

        if (instructions) {
          instructions.style.display = "none";
        }
        if (fragmentInstructions) {
          fragmentInstructions.style.display = "block";
        }

        this.fragmentManager.breakMirror();
        this.isBroken = true;
        
        // Déclencher l'événement mirrorBroken
        const mirrorBrokenEvent = new Event('mirrorBroken');
        document.dispatchEvent(mirrorBrokenEvent);
        
        return;
      }
    }

    // Gérer les clics sur les fragments si le miroir est déjà cassé
    this.fragmentManager.handleFragmentClick(event);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  switchToGalleryScene(fragmentIndex) {
    console.log("MirrorBreakEffect: Début de la transition");

    // Créer un plan noir pour le fade
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

    // Animation de fade out
    let fadeOutComplete = false;
    const fadeOut = () => {
      if (fadeMaterial.opacity >= 1) {
        fadeOutComplete = true;
        console.log("MirrorBreakEffect: Fade out terminé");

        // Arrêter l'animation de cette scène
        this.isAnimating = false;

        // Désactiver les contrôles avant de les nettoyer
        if (this.controls && this.controls.enabled) {
          this.controls.enabled = false;
        }

        // Nettoyer la scène actuelle
        this.clearScene();

        // Supprimer les event listeners
        document.removeEventListener("click", this.handleClick);
        window.removeEventListener(
          "mousemove",
          this.fragmentManager.onMouseMove
        );

        // Créer la scène de transition
        console.log("MirrorBreakEffect: Création de la scène de transition");
        const transitionScene = new PortalTransitionScene(this, fragmentIndex);

        return;
      }
      fadeMaterial.opacity += 0.02;
      requestAnimationFrame(fadeOut);
    };
    fadeOut();
  }

  // loadHDRI() {
  //     return new Promise((resolve) => {
  //         const rgbeLoader = new RGBELoader();
  //         rgbeLoader.load("src/assets/night.hdr", (texture) => {
  //             texture.mapping = THREE.EquirectangularReflectionMapping;
  //             this.scene.background = texture;
  //             this.scene.environment = texture;
  //             resolve();
  //         });
  //     });
  // }
}

export { MirrorBreakEffect };
