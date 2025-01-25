import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { SceneSetup } from "./SceneSetup.js";
import { FragmentManager } from "./FragmentManager.js";
import { AtelierGalleryScene } from "./AtelierGalleryScene.js";
import { PortalTransitionScene } from './PortalTransitionScene.js';

class MirrorBreakEffect extends SceneSetup {
    constructor() {
        // Appeler le constructeur parent avec HDRI activé
        super(true);
        
        // État
        this.isBreaking = false;
        this.isFragmentSelected = false;
        this.mirror = null;
        
        // Initialisation du gestionnaire de fragments
        this.fragmentManager = new FragmentManager(this);
        
        // Initialiser l'environnement
        this.setupScene();
    }

    setupScene() {
        // Charger l'environnement et les lumières
        this.setupLights();
        this.loadHDRI();
        
        // Charger le modèle du miroir
        this.fragmentManager.loadMirrorModel();
        
        // Event listeners
        this.setupEventListeners();
        
        // Démarrer l'animation
        this.animate();
    }

    setupEventListeners() {
        this.handleClick = this.handleClick.bind(this);
        document.addEventListener("click", this.handleClick);
        window.addEventListener("mousemove", (event) => this.fragmentManager.onMouseMove(event));
        window.addEventListener('resize', () => this.onWindowResize());
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.isBreaking) {
            this.fragmentManager.animateFragments();
        }
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    handleClick(event) {
        if (!this.isBreaking && this.mirror) {
            this.fragmentManager.breakMirror();
            return;
        }
        
        this.fragmentManager.handleFragmentClick(event);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    switchToGalleryScene(fragmentIndex) {
        console.log('MirrorBreakEffect: Début de la transition');
        
        // Créer un plan noir pour le fade
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

        // Animation de fade out
        let fadeOutComplete = false;
        const fadeOut = () => {
            if (fadeMaterial.opacity >= 1) {
                fadeOutComplete = true;
                console.log('MirrorBreakEffect: Fade out terminé');
                
                // Nettoyer la scène actuelle
                this.clearScene();
                
                // Supprimer les event listeners
                document.removeEventListener("click", this.handleClick);
                window.removeEventListener("mousemove", this.fragmentManager.onMouseMove);
                
                // Créer la scène de transition
                console.log('MirrorBreakEffect: Création de la scène de transition');
                const transitionScene = new PortalTransitionScene(this);
                
                // Attendre 3 secondes puis passer à la galerie
                setTimeout(() => {
                    console.log('MirrorBreakEffect: Passage à la galerie');
                    transitionScene.clearScene();
                    new AtelierGalleryScene(this, fragmentIndex);
                }, 3000);
                
                // Réinitialiser les contrôles
                this.controls.enabled = true;
                this.controls.target.set(0, 0, 0);
                this.controls.update();
                
                return;
            }
            fadeMaterial.opacity += 0.02;
            requestAnimationFrame(fadeOut);
        };
        fadeOut();
    }
}

export { MirrorBreakEffect }; 