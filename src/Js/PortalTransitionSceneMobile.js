import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { PortalTransitionSceneBase } from './PortalTransitionSceneBase.js';

export class PortalTransitionSceneMobile extends PortalTransitionSceneBase {
    constructor(app, selectedFragmentIndex) {
        super(app, selectedFragmentIndex);
        this._touchHandlerInitialized = false;
        
        // Récupérer la barre de progression existante
        this.progressContainer = document.querySelector('.scroll-progress-container');
        this.progressFill = document.querySelector('.scroll-progress-fill');
        
        if (this.progressContainer) {
            this.progressContainer.style.opacity = '1';
        }
        
        this.setupScrollHandler();
    }

    async setupFragments() {
        try {
            const response = await fetch("./src/data/portalData.json");
            const data = await response.json();
            const atelierData = data[`atelier${this.selectedFragmentIndex + 1}`];

            const sections = [
                {
                    type: "standard",
                    position: "left",
                    mainImage: atelierData.sets[0].image1,
                    secondaryImages: [
                        atelierData.sets[0].image2,
                        atelierData.sets[0].image3,
                    ],
                    title: atelierData.sets[0].title,
                    subtitle: atelierData.sets[0].subtitle,
                    zPosition: -10,
                },
                {
                    type: "standard",
                    position: "right",
                    mainImage: atelierData.sets[1].image1,
                    secondaryImages: [
                        atelierData.sets[1].image2,
                        atelierData.sets[1].image3,
                    ],
                    title: atelierData.sets[1].title,
                    subtitle: atelierData.sets[1].subtitle,
                    zPosition: -60,
                },
                {
                    type: "standard",
                    position: "left",
                    mainImage: atelierData.sets[2].image1,
                    secondaryImages: [
                        atelierData.sets[2].image2,
                        atelierData.sets[2].image3,
                    ],
                    title: atelierData.sets[2].title,
                    subtitle: atelierData.sets[2].subtitle,
                    zPosition: -110,
                },
                {
                    type: "quote",
                    position: "right",
                    mainImage: atelierData.sets[3].image1,
                    secondaryImages: [
                        atelierData.sets[3].image2,
                        atelierData.sets[3].image3,
                    ],
                    quotes: [
                        atelierData.sets[3].quote1,
                        atelierData.sets[3].quote2,
                        atelierData.sets[3].quote3,
                    ],
                    title: atelierData.sets[3].title,
                    subtitle: atelierData.sets[3].subtitle,
                    zPosition: -160,
                },
                {
                    type: "team",
                    position: "center",
                    image: atelierData.sets[4].image1,
                    team: atelierData.sets[4].team,
                    students: atelierData.sets[4].students,
                    zPosition: -230,
                },
            ];

            for (const section of sections) {
                await this.createSection(section);
            }
        } catch (error) {
            console.error("Erreur:", error);
        }
    }

    async createSection(section) {
        const textureLoader = new THREE.TextureLoader();
        const group = new THREE.Group();
        let mainMesh;
        
        group.position.set(0, 0, section.zPosition);

        if (section.type === 'team') {
            // Section team avec image centrale et bouton
            const mainTexture = await this.loadTexture(textureLoader, section.image);
            mainMesh = this.createMainMesh(mainTexture);
            mainMesh.position.set(0, 1, 0);
            mainMesh.scale.set(0.6, 1.2, 1);
            group.add(mainMesh);

            // Ajout du label team dans la même div que la dernière section
            const labelDiv = document.createElement('div');
            labelDiv.className = 'mobile-section-label team-label';
            labelDiv.innerHTML = `
                <div class="label-content">
                    <p class="team-link">${section.team}</p>
                </div>
            `;

            document.body.appendChild(labelDiv);

            // Styles pour le label team mobile
            labelDiv.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 0;
                right: 0;
                width: 100vw;
                color: white;
                text-align: center;
                pointer-events: auto;
                transition: opacity 0.3s ease;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                cursor: pointer;
            `;

            const labelContent = labelDiv.querySelector('.label-content');
            labelContent.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
                padding: 0 16px;
            `;

            // On utilise le même teamLink pour le style et l'événement
            const teamLink = labelDiv.querySelector('.team-link');
            teamLink.style.cssText = `
                color: #FFF;
                font-family: "Aktiv Grotesk", sans-serif;
                font-size: 14px;
                font-style: normal;
                font-weight: 400;
                line-height: 140%;
                text-decoration-line: underline;
                text-decoration-style: solid;
                text-decoration-skip-ink: auto;
                text-decoration-thickness: auto;
                text-underline-offset: auto;
                text-underline-position: from-font;
                margin: 0;
            `;
            
            // Ajout de l'événement click sur le même teamLink
            teamLink.addEventListener('click', () => {
                this.showTeamPopup(section.students);
            });

            group.userData = { 
                label: labelDiv,
                isTeamLabel: true  
            };
        } else if (section.type === 'quote') {
            const mainTexture = await this.loadTexture(textureLoader, section.mainImage);
            mainMesh = this.createMainMesh(mainTexture);
            
            mainMesh.scale.set(0.4, 0.4, 1);
            group.add(mainMesh);

            let detail1, detail2;
            if (section.secondaryImages) {
                const [texture2, texture3] = await Promise.all([
                    this.loadTexture(textureLoader, section.secondaryImages[0]),
                    this.loadTexture(textureLoader, section.secondaryImages[1])
                ]);

                // Créer les images avec la même taille que les images secondaires
                [detail1] = this.createSecondaryMeshes(texture2, texture3);
                [detail2] = this.createSecondaryMeshes(texture3, texture2);

                const quotesMeshes = this.createQuoteMeshes(section.quotes);

                // Premier ensemble
                quotesMeshes[0].position.set(0, 1, 0);
                quotesMeshes[0].scale.set(0.8, 0.8, 1);
                mainMesh.position.set(0, -1, 0);
                mainMesh.userData = { direction: "down", initialY: -1, initialZ: 0 };
                group.add(quotesMeshes[0]);

                // Deuxième ensemble
                detail1.position.set(0, -1, -10);  // Réduit de -15 à -10
                detail1.scale.set(0.6, 0.6, 1);  
                detail1.userData = { direction: "down", initialY: -1, initialZ: -10 };
                quotesMeshes[1].position.set(0, 1, -10);  // Réduit de -15 à -10
                quotesMeshes[1].scale.set(0.8, 0.8, 1);
                group.add(detail1);
                group.add(quotesMeshes[1]);

                // Troisième ensemble
                detail2.position.set(0, -1, -20);  // Réduit de -30 à -20
                detail2.scale.set(0.6, 0.6, 1);  
                detail2.userData = { direction: "down", initialY: -1, initialZ: -20 };
                quotesMeshes[2].position.set(0, 1, -20);  // Réduit de -30 à -20
                quotesMeshes[2].scale.set(0.8, 0.8, 1);
                group.add(detail2);
                group.add(quotesMeshes[2]);

                // Animation de parallaxe pour la section quote
                const updateQuotePositions = () => {
                    const fragments = [
                        { mesh: mainMesh, quote: quotesMeshes[0], z: 0 },
                        { mesh: detail1, quote: quotesMeshes[1], z: -10 },
                        { mesh: detail2, quote: quotesMeshes[2], z: -20 }
                    ];

                    fragments.forEach(fragment => {
                        const startZ = group.position.z + fragment.z + 15;
                        const endZ = group.position.z + fragment.z - 15;
                        
                        const progress = Math.max(0, Math.min(1, 
                            (startZ - this.camera.position.z) / (startZ - endZ)
                        ));

                        // Quote monte en diagonale vers haut/droite
                        fragment.quote.position.y = 1 + (progress * 6);
                        fragment.quote.position.x = (progress * 4);

                        // Image descend en diagonale vers bas/gauche
                        fragment.mesh.position.y = -1 - (progress * 6);
                        fragment.mesh.position.x = -(progress * 4);
                    });
                };

                this.updateCallbacks = this.updateCallbacks || [];
                this.updateCallbacks.push(updateQuotePositions);
            }
        } else {
            // Pour toutes les autres sections (standard et quote)
            const mainTexture = await this.loadTexture(textureLoader, section.mainImage);
            mainMesh = this.createMainMesh(mainTexture);
            mainMesh.position.set(0, 0.8, 0);    
            group.add(mainMesh);

            let detail1, detail2;

            if (section.secondaryImages) {
                const [texture2, texture3] = await Promise.all([
                    this.loadTexture(textureLoader, section.secondaryImages[0]),
                    this.loadTexture(textureLoader, section.secondaryImages[1])
                ]);

                [detail1, detail2] = this.createSecondaryMeshes(texture2, texture3);
                
                // Positions initiales identiques pour toutes les sections standard
                if (section.type === 'standard') {
                    // Image principale en haut
                    mainMesh.position.set(0, 1, 0);
                    mainMesh.scale.set(1, 1, 1);
                    
                    // Images secondaires en bas et écartées
                    if (section.position === 'left') {
                        detail1.position.set(-1.2, -1, 0);
                        detail2.position.set(1.2, -1, 0);
                    } else {
                        // Pour les sections de droite, même position Y mais X inversé
                        detail1.position.set(-1.2, -1, 0);
                        detail2.position.set(1.2, -1, 0);
                    }
                }
                
                detail1.scale.set(0.6, 0.6, 1);
                detail2.scale.set(0.6, 0.6, 1);
                
                group.add(detail1, detail2);

                const updatePositions = () => {
                    const startZ = group.position.z + 30;
                    const endZ = group.position.z - 30;
                    
                    const progress = Math.max(0, Math.min(1, 
                        (startZ - this.camera.position.z) / (startZ - endZ)
                    ));
                    
                    // Même mouvement pour toutes les sections standard
                    mainMesh.position.y = 1 + (progress * 6);
                    mainMesh.position.x = section.position === 'left' ? 
                        (progress * 4) : -(progress * 4);
                    
                    if (detail1 && detail2) {
                        const secondaryY = -1 - (progress * 6);
                        if (section.position === 'left') {
                            detail1.position.y = secondaryY;
                            detail1.position.x = -1.2 - (progress * 3);
                            detail2.position.y = secondaryY;
                            detail2.position.x = 1.2 - (progress * 3);
                        } else {
                            detail1.position.y = secondaryY;
                            detail1.position.x = -1.2 + (progress * 3);
                            detail2.position.y = secondaryY;
                            detail2.position.x = 1.2 + (progress * 3);
                        }
                    }
                };

                this.updateCallbacks = this.updateCallbacks || [];
                this.updateCallbacks.push(updatePositions);
            }
        }

        // Ajout du label seulement si ce n'est pas une section team
        if (section.type !== 'team') {
            // Ajout du label
            const labelDiv = document.createElement('div');
            labelDiv.className = 'mobile-section-label';
            labelDiv.innerHTML = `
                <div class="label-content">
                    <h2>${section.title || ''}</h2>
                    <p class="subtitle">${section.subtitle || ''}</p>
                </div>
            `;

            document.body.appendChild(labelDiv);

            // Styles pour le label mobile
            labelDiv.style.cssText = `
                position: fixed;
                bottom: 60px;
                left: 0;
                right: 0;
                width: 100vw;
                color: white;
                text-align: center;
                pointer-events: none;
                transition: opacity 0.3s ease;
                z-index: 1000;
                opacity: 0;
            `;

            const labelContent = labelDiv.querySelector('.label-content');
            labelContent.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
                padding: 0 24px;
                margin: 0 auto;
                max-width: 100vw;
            `;

            const title = labelDiv.querySelector('h2');
            const subtitle = labelDiv.querySelector('.subtitle');
            title.style.cssText = `
                margin: 0;
                font-family: 'Fraunces', serif;
                font-size: 24px;
                font-style: italic;
                font-weight: 600;
                line-height: 1.2;
                color: white;
            `;
            subtitle.style.cssText = `
                margin: 0;
                font-family: 'Aktiv Grotesk', sans-serif;
                font-size: 14px;
                line-height: 1.4;
                opacity: 0.8;
                max-width: 90%;
                color: white;
            `;

            group.userData = { label: labelDiv };
        }

        this.scene.add(group);
        this.fragments.push({
            group: group,
            mesh: mainMesh
        });
    }

    createMainMesh(texture) {
        return new THREE.Mesh(
            new THREE.PlaneGeometry(8, 6, 50, 50),
            new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            })
        );
    }

    createSecondaryMeshes(texture2, texture3) {
        const geometry = new THREE.PlaneGeometry(3, 2, 1, 1);
        
        const detail1 = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({
                map: texture2,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            })
        );

        const detail2 = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({
                map: texture3,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            })
        );

        return [detail1, detail2];
    }

    createQuoteMeshes(quotes) {
        return quotes.map(quote => {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = 'white';
            ctx.font = 'italic 32px Georgia'; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Wrap le texte pour une meilleure présentation sur mobile
            const words = quote.split(' ');
            let line = '';
            let lines = [];
            let y = canvas.height/2;
            
            words.forEach(word => {
                const testLine = line + word + ' ';
                if (ctx.measureText(testLine).width > 800) { 
                    lines.push(line);
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            });
            lines.push(line);
            
            // Dessiner chaque ligne
            lines.forEach((line, i) => {
                ctx.fillText(line, canvas.width/2, y + (i - lines.length/2) * 35);
            });
            
            const texture = new THREE.CanvasTexture(canvas);
            
            return new THREE.Mesh(
                new THREE.PlaneGeometry(5, 1.5), 
                new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0.9,
                    side: THREE.DoubleSide
                })
            );
        });
    }

    setupScrollHandler() {
        if (this._touchHandlerInitialized) return;
        this._touchHandlerInitialized = true;

        let touchStartY = 0;
        let lastTouchY = 0;
        let currentProgress = 0;

        const handleTouchStart = (event) => {
            touchStartY = event.touches[0].clientY;
            lastTouchY = touchStartY;
        };

        const handleTouchMove = (event) => {
            event.preventDefault();
            const currentTouchY = event.touches[0].clientY;
            const delta = (lastTouchY - currentTouchY) * 0.3;
            lastTouchY = currentTouchY;

            const maxZ = 7;
            const lastFragmentPosition = -221;  // Position du dernier fragment
            const minZ = lastFragmentPosition;

            let newZ = this.camera.position.z - delta;
            newZ = Math.max(minZ, Math.min(maxZ, newZ));
            this.camera.position.z = newZ;

            // Calcul de la progression basé sur la position actuelle
            currentProgress = (maxZ - newZ) / (maxZ - minZ);
            currentProgress = Math.max(0, Math.min(1, currentProgress / 2));

            // Mise à jour de la barre de progression
            if (this.progressFill) {
                this.progressFill.style.setProperty('--progress', currentProgress);
            }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.body.style.overflow = 'hidden';
    }

    updateFragments() {
        this.fragments.forEach((fragment, index) => {
            if (!fragment.group) return;

            const distance = fragment.group.position.z - this.camera.position.z;
            
            let opacity = 0.9;
            const fadeDistance = 20;
            const startFadeDistance = 15;

            if (distance > startFadeDistance) {
                opacity = Math.max(0, 0.9 * (1 - (distance - startFadeDistance) / fadeDistance));
            } else if (distance < -startFadeDistance) {
                opacity = Math.max(0, 0.9 * (1 - (Math.abs(distance) - startFadeDistance) / fadeDistance));
            }

            // Appliquer l'opacité aux matériaux
            fragment.group.traverse((child) => {
                if (child.material) {
                    child.material.opacity = opacity;
                }
            });

            // Appliquer l'opacité au label
            if (fragment.group.userData && fragment.group.userData.label) {
                const label = fragment.group.userData.label;
                
                if (fragment.group.userData.isTeamLabel) {
                    // Pour le label team, ne l'afficher que près de la fin
                    const isNearEnd = this.camera.position.z <= -180;
                    if (isNearEnd) {
                        label.style.visibility = 'visible';
                        label.style.opacity = opacity;
                    } else {
                        label.style.visibility = 'hidden';
                        label.style.opacity = 0;
                    }
                } else {
                    // Pour les autres labels
                    label.style.opacity = opacity;
                }
            }
        });

        // Appeler les callbacks d'update pour l'effet de parallaxe
        if (this.updateCallbacks) {
            this.updateCallbacks.forEach(callback => callback());
        }
    }

    showTeamPopup(students) {
        let popup = document.querySelector('.subtitle-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.className = 'subtitle-popup mobile-popup';
            document.body.appendChild(popup);
        }

        document.body.classList.add('popup-active');

        popup.innerHTML = `
            <button class="popup-close" aria-label="Fermer" type="button">
                <svg viewBox="0 0 24 24">
                    <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            <div class="popup-content">
                <div class="students-list">
                    <div class="students-header">
                        <div class="header-nom">Nom</div>
                        <div class="header-prenom">Prénom</div>
                        <div class="header-classe">Classe</div>
                    </div>
                    <div class="students-rows">
                        ${students.map(student => `
                            <div class="student-row">
                                <div class="student-nom">${student.nom}</div>
                                <div class="student-prenom">${student.prenom}</div>
                                <div class="student-classe">
                                    ${student.classe.endsWith('.svg') 
                                        ? `<img src="${student.classe}" alt="Classe" class="classe-icon"/>` 
                                        : student.classe}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        const closeButton = popup.querySelector('.popup-close');
        closeButton.addEventListener('click', () => {
            document.body.classList.remove('popup-active');
            popup.remove();
        });

        // Ajout d'une animation d'entrée
        requestAnimationFrame(() => {
            popup.classList.add('active');
        });
    }

    cleanup() {
        // Nettoyer les éléments lors de la destruction de la scène
        const elements = document.querySelectorAll(
            ".mobile-section-label, .team-label, .quote-container, .subtitle-popup, .popup-content, .mobile-popup"
        );
        elements.forEach((element) => element.remove());

        if (this._touchHandlerInitialized) {
            window.removeEventListener('touchstart', this._handleTouchStart);
            window.removeEventListener('touchmove', this._handleTouchMove);
        }

        // Nettoyer les callbacks
        this.updateCallbacks = [];

        super.cleanup();
    }
} 