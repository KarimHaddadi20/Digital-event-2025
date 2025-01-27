import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { PortalTransitionSceneBase } from './PortalTransitionSceneBase.js';

export class PortalTransitionSceneMobile extends PortalTransitionSceneBase {
    constructor(app, selectedFragmentIndex) {
        super(app, selectedFragmentIndex);
    }

    async setupFragments() {
        try {
            const response = await fetch('/src/data/portalData.json');
            const data = await response.json();
            
            const atelierIndex = this.selectedFragmentIndex + 1;
            const atelierKey = `atelier${atelierIndex}`;
            
            const atelierData = data[atelierKey];
            if (!atelierData) {
                console.error(`Pas de données pour ${atelierKey}`);
                return;
            }
            
            // Créer les fragments pour chaque set de l'atelier
            const fragmentsData = atelierData.sets.map((set, index) => ({
                texture: set.image1,
                image2: set.image2,
                image3: set.image3,
                title: set.title,
                subtitle: set.subtitle,
                position: { 
                    x: 0,                    // Centré horizontalement
                    y: 4,                    // Position Y fixe
                    z: -20 - (index * 25)    // Position Z initiale plus éloignée et espacement plus grand
                },
                scale: 0.8,
                exitDirection: 'left'
            }));

            // Créer les fragments
            for (const data of fragmentsData) {
                await this.createFragment(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    }

    async createFragment(data) {
        const textureLoader = new THREE.TextureLoader();

        try {
            // Charger les textures avec gestion des erreurs
            const textures = await Promise.all([
                this.loadTexture(textureLoader, data.texture).catch(() => this.loadTexture(textureLoader, null)),
                this.loadTexture(textureLoader, data.image2).catch(() => this.loadTexture(textureLoader, null)),
                this.loadTexture(textureLoader, data.image3).catch(() => this.loadTexture(textureLoader, null))
            ]);

            const [texture1, texture2, texture3] = textures;

            // Fragment principal
            const mainFragment = this.createMainFragment(data, texture1);
            
            // Fragments détaillés avec une taille plus grande
            const [detail1, detail2] = this.createDetailFragments(data, texture2, texture3);
            
            // Augmenter la taille des fragments détaillés (par exemple 1.5 fois plus grand)
            detail1.scale.set(2, 2, 1);
            detail2.scale.set(2, 2, 1);
            
            // Position des fragments détaillés
            detail1.position.set(2, -6, -3); // Ajusté la position X pour compenser la nouvelle taille
            detail2.position.set(-2, -6, -5);  // Ajusté la position X pour compenser la nouvelle taille
            
            // Rotation des fragments détaillés
            detail1.rotation.z = 0.1;
            detail2.rotation.z = -0.1;
            
            mainFragment.add(detail1);
            mainFragment.add(detail2);
            
            this.addFragmentLabel(mainFragment, data);
            
            this.scene.add(mainFragment);
            this.fragments.push({
                mesh: mainFragment,
                exitDirection: data.exitDirection
            });

        } catch (error) {
            console.error('Erreur lors de la création du fragment:', error);
        }
    }

    createMainFragment(data, texture) {
        const geometry = new THREE.PlaneGeometry(6 * data.scale, 6 * data.scale, 50, 50);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        
        const mainFragment = new THREE.Mesh(geometry, material);
        mainFragment.position.copy(data.position);
        
        return mainFragment;
    }

    createDetailFragments(data, texture2, texture3) {
        const detailGeometry = new THREE.PlaneGeometry(
            4 * data.scale * 0.5,
            4 * data.scale * 0.5,
            50, 50
        );

        const detail1 = new THREE.Mesh(
            detailGeometry,
            new THREE.MeshBasicMaterial({
                map: texture2,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            })
        );

        const detail2 = new THREE.Mesh(
            detailGeometry,
            new THREE.MeshBasicMaterial({
                map: texture3,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            })
        );

        return [detail1, detail2];
    }

    updateFragments() {
        this.fragments.forEach(fragment => {
            const mesh = fragment.mesh;
            if (!mesh) return;

            const distance = mesh.position.z - this.camera.position.z;
            
            // Effet de vague
            this.updateWaveEffect(mesh);

            // Opacité du fragment principal - transition douce
            let mainOpacity = 0.5;
            const transitionDistance = 20;
            
            if (Math.abs(distance) < transitionDistance) {
                const progress = 1 - (Math.abs(distance) / transitionDistance);
                mainOpacity = 0.66 + (0.5 * progress);
            } else if (distance <= -30 || distance >= 30) {
                mainOpacity = 0;
            }
            mesh.material.opacity = THREE.MathUtils.clamp(mainOpacity, 0, 1);

            // Calcul de la progression pour le mouvement latéral
            const moveProgress = Math.max(0, 1 - (Math.abs(distance) / 30));
            
            // Fragment principal : déplacement vers la droite
            mesh.position.x = moveProgress * 8; // Déplacement vers la droite

            // Scale progressif
            const baseScale = 1.2;
            const maxScale = 1.5;
            const scaleProgress = Math.max(0, 1 - (Math.abs(distance) / 30));
            const newScale = baseScale + (maxScale - baseScale) * scaleProgress;
            mesh.scale.set(newScale, newScale, 1);

            // Fragments détaillés : déplacement vers la gauche
            mesh.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    child.material.opacity = 0.9;
                    // Position de base + déplacement vers la gauche
                    const baseX = child.position.x < 0 ? -2 : 2; // Conserve la position de base
                    child.position.x = baseX - (moveProgress * 6); // Déplacement vers la gauche
                }
            });

            // Labels
            const label = mesh.children.find(child => child instanceof CSS2DObject);
            if (label) {
                label.element.style.opacity = mesh.material.opacity;
            }
        });
    }

    setupScrollHandler() {
        let touchStartY = 0;
        let lastTouchY = 0;
        let isScrolling = false;
        
        const handleTouchStart = (event) => {
            if (event.target.closest('#burger-menu') || event.target.closest('#side-menu')) return;
            touchStartY = event.touches[0].clientY;
            lastTouchY = touchStartY;
            isScrolling = true;
        };

        const handleTouchMove = (event) => {
            if (!isScrolling) return;
            if (event.target.closest('#burger-menu') || event.target.closest('#side-menu')) return;
            
            event.preventDefault();
            const currentTouchY = event.touches[0].clientY;
            const delta = (lastTouchY - currentTouchY) * 0.1;
            lastTouchY = currentTouchY;

            // Calculer les limites de scroll
            const maxZ = 7;
            const fragmentSpacing = 15;
            const lastFragmentPosition = -5 - ((this.fragments.length - 1) * fragmentSpacing);
            const minZ = lastFragmentPosition - 15;

            // Mettre à jour la position de la caméra
            let newZ = this.camera.position.z - delta;
            newZ = Math.max(minZ, Math.min(maxZ, newZ));
            this.camera.position.z = newZ;

            // Mettre à jour la barre de progression
            const progress = Math.min(Math.abs(maxZ - this.camera.position.z) / Math.abs(maxZ - minZ), 1);
            if (this.progressFill) {
                this.progressFill.style.setProperty('--progress', progress);
            }
        };

        const handleTouchEnd = () => {
            isScrolling = false;
        };

        // Ajouter les écouteurs d'événements
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('touchcancel', handleTouchEnd);

        // Désactiver le scroll par défaut
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
    }
} 