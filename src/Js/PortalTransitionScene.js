import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SceneSetup } from './SceneSetup.js';

export class PortalTransitionScene extends SceneSetup {
    constructor(app) {
        super(false);
        
        this.app = app;
        this.fragments = [];
        this.time = 0; // Initialisation du temps
        this.camera.position.set(0, 0, 7); // Position initiale de la caméra
        this.camera.lookAt(0, 0, 0);
        
        // Référence à la barre de progression
        this.progressContainer = document.querySelector('.scroll-progress-container');
        this.progressFill = document.querySelector('.scroll-progress-fill');
        
        // Afficher la barre de progression
        if (this.progressContainer) {
            this.progressContainer.style.opacity = '1';
        }
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Configuration du renderer
        this.setupRenderers();
        
        // Configuration des lumières
        this.setupCustomLights();
        
        // Ajouter le background
        this.setupBackground();
        
        // Ajouter les fragments de manière asynchrone
        this.setupFragments();
        
        // Configurer le scroll
        this.setupScrollHandler();
        
        // Démarrer l'animation
        this.animate();
    }

    setupRenderers() {
        // WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // CSS2D Renderer
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        
        // Nettoyer et ajouter les renderers
        const container = document.getElementById("scene-container");
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        container.appendChild(this.renderer.domElement);
        container.appendChild(this.labelRenderer.domElement);
    }

    setupScrollHandler() {
        let timeoutId = null;
        let touchStartY = 0;
        
        // Gestion du scroll desktop
        window.addEventListener('wheel', (event) => {
            if (timeoutId) return;
            timeoutId = setTimeout(() => {
                this.onScroll(event.deltaY);
                timeoutId = null;
            }, 18);
        }, { passive: false });

        // Gestion du scroll mobile (touch events)
        window.addEventListener('touchstart', (event) => {
            touchStartY = event.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchmove', (event) => {
            if (timeoutId) return;
            const touchEndY = event.touches[0].clientY;
            const deltaY = touchEndY - touchStartY;
            touchStartY = touchEndY;

            timeoutId = setTimeout(() => {
                this.onScroll(-deltaY * 1);
                timeoutId = null;
            }, 18);
        }, { passive: true });
    }

    onScroll(deltaY) {
        const scrollSpeed = 0.1;
        const minZ = 6;
        const maxZ = -(this.fragments.length * 20) + minZ;
        const currentZ = this.camera.position.z;
        
        let delta = deltaY * scrollSpeed;
        
        if (currentZ - delta > minZ) delta = currentZ - minZ;
        if (currentZ - delta < maxZ) delta = currentZ - maxZ;
        
        if (currentZ - delta >= maxZ && currentZ - delta <= minZ) {
            gsap.to(this.camera.position, {
                z: currentZ - delta,
                duration: 1.2,
                ease: "power3.out",
                onUpdate: () => {
                    this.updateFragments();
                    this.updateProgressBar(minZ, maxZ);
                }
            });
        }
    }

    updateProgressBar(minZ, maxZ) {
        if (!this.progressFill) return;
        
        // Calculer le pourcentage de progression
        const totalDistance = Math.abs(maxZ - minZ);
        const currentProgress = Math.abs(this.camera.position.z - minZ);
        const progressPercent = (currentProgress / totalDistance) * 100;
        
        // Mettre à jour la barre de progression
        this.progressFill.style.setProperty('--progress', progressPercent / 100);
    }

    updateFragments() {
        this.fragments.forEach(fragment => {
            const mesh = fragment.mesh;
            if (!mesh) return;

            const distance = mesh.position.z - this.camera.position.z;
            
            // Calcul de l'opacité pour le fragment principal
            let opacity = 1;
            if (distance < -5 && distance > -15) {
                opacity = (distance + 15) / 10;
            } else if (distance > 5 && distance < 15) {
                opacity = 1 - ((distance - 5) / 10);
            } else if (distance <= -15 || distance >= 15) {
                opacity = 0;
            }
            
            // Appliquer l'opacité au fragment principal
            if (mesh.material) {
                mesh.material.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
            }

            // Appliquer l'opacité aux fragments détaillés en préservant leur opacité relative
            mesh.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    const baseOpacity = child.material._baseOpacity || child.material.opacity;
                    if (!child.material._baseOpacity) {
                        child.material._baseOpacity = child.material.opacity;
                    }
                    child.material.opacity = THREE.MathUtils.clamp(opacity * baseOpacity, 0, baseOpacity);
                }
            });

            // Mise à jour des positions pour l'effet ondulant
            const positions = mesh.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                
                const z = 0.2 *
                    Math.sin(x * 0.8 + this.time) *
                    Math.cos(y * 0.8 + this.time);
                
                positions.setZ(i, z);
            }
            positions.needsUpdate = true;

            const responsive = this.getResponsivePositions();
            const xOffset = fragment.exitDirection === 'left' ? -20 : 20;
            const xPosition = (distance / 30) * xOffset;
            
            if (responsive.verticalLayout) {
                // En mobile, permettre un décalage plus important
                mesh.position.x = fragment.exitDirection === 'left' ? 
                    Math.min(xPosition, 0) : // Réduit la limite à gauche
                    Math.max(xPosition, 0);   // Réduit la limite à droite
            } else {
                // En desktop, garder les limites originales
                mesh.position.x = fragment.exitDirection === 'left' ? 
                    Math.min(xPosition, -4) :
                    Math.max(xPosition, 4);
            }

            const label = mesh.children.find(child => child instanceof CSS2DObject);
            if (label) {
                label.element.style.opacity = mesh.material.opacity;
            }
        });
    }

    // Nouvelle méthode pour obtenir les positions responsives
    getResponsivePositions() {
        const width = window.innerWidth;
        if (width <= 768) { // Mobile
            return {
                xOffset: 1.5, // Réduit l'espacement horizontal
                yOffset: -2, // Déplace les fragments vers le bas
                zSpacing: 8, // Réduit l'espacement en profondeur
                scale: 0.8, // Ajuste la taille des fragments
                verticalLayout: true, // Nouveau paramètre pour la disposition verticale
                detailsScale: 0.5, // Échelle pour les fragments de détail
                mainFragmentY: 0.7 // Position Y du fragment principal
            };
        } else if (width <= 1024) { // Tablet
            return {
                xOffset: 3,
                yOffset: 0.8,
                zSpacing: 17,
                scale: 0.85,
                verticalLayout: false,
                detailsScale: 0.6,
                mainFragmentY: 0
            };
        } else { // Desktop
            return {
                xOffset: 4,
                yOffset: 0,
                zSpacing: 20,
                scale: 1,
                verticalLayout: false,
                detailsScale: 0.6,
                mainFragmentY: 0
            };
        }
    }

    async setupFragments() {
        try {
            const response = await fetch('/src/data/portalData.json');
            const data = await response.json();
            
            // Récupérer les données de l'atelier correspondant
            const atelierData = data.atelier1; // À adapter selon l'atelier
            
            const responsive = this.getResponsivePositions();
            
            const fragmentsData = atelierData.sets.map((set, index) => ({
                texture: set.image,
                title: set.title,
                subtitle: set.subtitle,
                position: { 
                    x: index % 2 === 0 ? -responsive.xOffset : responsive.xOffset, 
                    y: responsive.yOffset, 
                    z: -5 - (index * responsive.zSpacing) 
                },
                scale: responsive.scale,
                exitDirection: index % 2 === 0 ? 'left' : 'right'
            }));

            fragmentsData.forEach(data => this.createFragment(data));
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    }

    createFragment(data) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(data.texture, (texture) => {
            const responsive = this.getResponsivePositions();
            
            // Fragment principal avec échelle responsive
            const geometry = new THREE.PlaneGeometry(6 * data.scale, 6 * data.scale, 50, 50);
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 1
            });
            const imageMesh = new THREE.Mesh(geometry, material);

            // Ajuster la position en fonction du layout
            if (responsive.verticalLayout) {
                // En mobile, le fragment principal va en bas
                imageMesh.position.set(
                    0, // Centré horizontalement
                    responsive.mainFragmentY, // Plus bas
                    data.position.z
                );
            } else {
                // En desktop, garder la disposition horizontale originale
                imageMesh.position.set(
                    data.position.x,
                    data.position.y,
                    data.position.z
                );
            }

            this.scene.add(imageMesh);

            // Fragments de détail avec échelle responsive
            const detailGeometry = new THREE.PlaneGeometry(
                4 * data.scale * responsive.detailsScale,
                4 * data.scale * responsive.detailsScale,
                50,
                50
            );
            
            // Premier détail
            const detail1 = new THREE.Mesh(
                detailGeometry,
                new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                })
            );
            
            // Deuxième détail
            const detail2 = new THREE.Mesh(
                detailGeometry,
                new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide
                })
            );

            // Positionner les détails en fonction du layout
            if (responsive.verticalLayout) {
                // En mobile, les détails vont en haut, plus centrés
                detail1.position.set(-2, 4, -3); // Premier fragment à gauche
                detail2.position.set(2, 4, -5);  // Second fragment à droite et légèrement plus loin
            } else {
                // En desktop, garder la disposition originale
                const detailOffset = data.exitDirection === 'left' ? 8 * data.scale : -8 * data.scale;
                detail1.position.set(detailOffset, 2 * data.scale, -5);
                detail2.position.set(detailOffset * 1.2, -2 * data.scale, -8);
            }

            // Ajouter une légère rotation aux détails
            detail1.rotation.z = responsive.verticalLayout ? 0.1 : (data.exitDirection === 'left' ? 0.2 : -0.2);
            detail2.rotation.z = responsive.verticalLayout ? -0.1 : (data.exitDirection === 'left' ? -0.3 : 0.3);

            imageMesh.add(detail1);
            imageMesh.add(detail2);
            
            // Création du conteneur de texte
            const textContainer = document.createElement('div');
            textContainer.className = 'portal-text';
            
            const title = document.createElement('h2');
            title.textContent = data.title;
            title.style.cssText = `
                font-family: 'Fraunces, serif';
                font-size: 1.2em;
                color: white;
                margin: 0 0 0.5em 0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            `;
            
            const subtitle = document.createElement('p');
            subtitle.textContent = data.subtitle;
            subtitle.style.cssText = `
                font-family: 'Aktiv Grotesk, sans-serif';
                font-size: 0.9em;
                color: rgba(255, 255, 255, 0.8);
                margin: 0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            `;
            
            textContainer.appendChild(title);
            textContainer.appendChild(subtitle);
            
            const label = new CSS2DObject(textContainer);
            label.position.set(0, -3.5, 0);
            imageMesh.add(label);
            
            this.fragments.push({
                mesh: imageMesh,
                exitDirection: data.exitDirection
            });
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.01;
        this.updateFragments();
        
        // Rendu de la scène
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            this.labelRenderer.render(this.scene, this.camera);
        }
    }

    setupBackground() {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('src/textures/gaming_popcorn.png', (texture) => {
            // Calculer le ratio d'aspect de la texture
            const imageRatio = texture.image.width / texture.image.height;
            const screenRatio = window.innerWidth / window.innerHeight;
            texture.encoding = THREE.sRGBEncoding;
            
            // Déterminer la taille du plan en fonction des ratios
            let planeWidth, planeHeight;
            if (screenRatio > imageRatio) {
                planeWidth = 20 * screenRatio;
                planeHeight = planeWidth / imageRatio;
            } else {
                planeHeight = 20;
                planeWidth = planeHeight * imageRatio;
            }
            
            const bgGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
            const bgMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                depthWrite: false,
                depthTest: false
            });
            const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
            
            // Positionner le plan derrière la caméra
            bgMesh.position.z = -13;
            bgMesh.renderOrder = -1;
            
            // Attacher le background à la caméra pour qu'il reste fixe
            this.camera.add(bgMesh);
            
            // S'assurer que la scène contient la caméra
            if (!this.scene.children.includes(this.camera)) {
                this.scene.add(this.camera);
            }
        });
    }

    setupCustomLights() {
        // Vider les lumières existantes
        this.scene.children = this.scene.children.filter(child => !child.isLight);
        
        // Lumière ambiante plus forte
        const ambient = new THREE.AmbientLight(0xffffff, 2);
        this.scene.add(ambient);

        // Lumière principale plus intense
        const mainLight = new THREE.DirectionalLight(0x7c4dff, 5);
        mainLight.position.set(5, 5, 5);
        this.scene.add(mainLight);

        // Lumière d'accent cyan plus forte
        const accentLight = new THREE.SpotLight(0x00bcd4, 10);
        accentLight.position.set(-5, 3, 2);
        accentLight.angle = Math.PI / 3;
        accentLight.penumbra = 0.7;
        this.scene.add(accentLight);

        // Lumière de contre-jour rose plus intense
        const backLight = new THREE.DirectionalLight(0xe91e63, 3);
        backLight.position.set(0, -5, -5);
        this.scene.add(backLight);
    }

    cleanup() {
        // Cacher la barre de progression lors du nettoyage de la scène
        if (this.progressContainer) {
            this.progressContainer.style.opacity = '0';
        }
    }
}