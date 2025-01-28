import * as THREE from 'three';
import { PortalTransitionSceneBase } from './PortalTransitionSceneBase.js';

export class PortalTransitionSceneDesktop extends PortalTransitionSceneBase {
    constructor(app, selectedFragmentIndex) {
        super(app, selectedFragmentIndex);
        console.log('Constructor PortalTransitionSceneDesktop - Initialisation');
        this._scrollHandlerInitialized = false;
        this.setupScrollHandler();
    }

    setupScrollHandler() {
        console.log('Setup Scroll Handler appelé - État initialized:', this._scrollHandlerInitialized);
        if (this._scrollHandlerInitialized) {
            console.log('Handler déjà initialisé - sortie');
            return;
        }
        this._scrollHandlerInitialized = true;
        console.log('Initialisation du nouveau handler de scroll');

        const handleScroll = (event) => {
            event.preventDefault();
            console.log('Scroll event - Camera Z:', this.camera.position.z);
            const delta = Math.sign(event.deltaY) * 0.3;
            
            const maxZ = 7;
            const fragmentSpacing = 30;
            const lastFragmentPosition = -10 - ((this.fragments.length - 1) * fragmentSpacing);
            const minZ = lastFragmentPosition - 15;
            
            let newZ = this.camera.position.z - delta;
            newZ = Math.max(minZ, Math.min(maxZ, newZ));
            
            this.camera.position.z = newZ;
            console.log('Nouvelle position Z:', newZ);
            
            const progress = Math.min(Math.abs(maxZ - this.camera.position.z) / Math.abs(maxZ - minZ), 1);
            if (this.progressFill) {
                this.progressFill.style.setProperty('--progress', progress);
            }
        };

        if (this._currentScrollHandler) {
            console.log('Nettoyage de l\'ancien handler');
            window.removeEventListener('wheel', this._currentScrollHandler);
        }

        this._currentScrollHandler = handleScroll;
        window.addEventListener('wheel', this._currentScrollHandler, { passive: false });
        console.log('Nouveau handler installé');
        document.body.style.overflow = 'hidden';
    }

    async setupFragments() {
        try {
            const response = await fetch('./src/data/portalData.json');
            const data = await response.json();
            const atelierData = data[`atelier${this.selectedFragmentIndex + 1}`];

            const sections = [
                {
                    type: 'standard',
                    position: 'left',
                    mainImage: atelierData.sets[0].image1,
                    secondaryImages: [atelierData.sets[0].image2, atelierData.sets[0].image3],
                    title: atelierData.sets[0].title,
                    subtitle: atelierData.sets[0].subtitle,
                    zPosition: -10
                },
                {
                    type: 'standard',
                    position: 'right',
                    mainImage: atelierData.sets[1].image1,
                    secondaryImages: [atelierData.sets[1].image2, atelierData.sets[1].image3],
                    title: atelierData.sets[1].title,
                    subtitle: atelierData.sets[1].subtitle,
                    zPosition: -40
                },
                {
                    type: 'standard',
                    position: 'left',
                    mainImage: atelierData.sets[2].image1,
                    secondaryImages: [atelierData.sets[2].image2, atelierData.sets[2].image3],
                    title: atelierData.sets[2].title,
                    subtitle: atelierData.sets[2].subtitle,
                    zPosition: -70
                },
                {
                    type: 'quote',
                    position: 'right',
                    mainImage: atelierData.sets[3].image1,
                    secondaryImages: [atelierData.sets[3].image2, atelierData.sets[3].image3],
                    quotes: [
                        atelierData.sets[3].quote1,
                        atelierData.sets[3].quote2,
                        atelierData.sets[3].quote3
                    ],
                    title: atelierData.sets[3].title,
                    subtitle: atelierData.sets[3].subtitle,
                    zPosition: -100
                },
                {
                    type: 'team',
                    position: 'left',
                    image: atelierData.sets[4].image1,
                    team: atelierData.sets[4].team,
                    students: atelierData.sets[4].students,
                    zPosition: -130
                }
            ];

            for (const section of sections) {
                await this.createSection(section);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    async createSection(section) {
        const textureLoader = new THREE.TextureLoader();
        const group = new THREE.Group();
        
        // Augmentation du décalage latéral
        const baseOffset = section.position === 'left' ? -8 : 8;
        group.position.set(baseOffset, 0, section.zPosition);

        // Création de l'image principale
        let mainTexture;
        if (section.type === 'team') {
            mainTexture = await this.loadTexture(textureLoader, section.image1 || section.image);
        } else {
            mainTexture = await this.loadTexture(textureLoader, section.mainImage);
        }

        const mainMesh = this.createMainMesh(mainTexture);
        group.add(mainMesh);

        // Gestion des images secondaires avec plus de décalage
        if (section.type !== 'team' && section.secondaryImages) {
            const [texture2, texture3] = await Promise.all([
                this.loadTexture(textureLoader, section.secondaryImages[0]),
                this.loadTexture(textureLoader, section.secondaryImages[1])
            ]);

            const [detail1, detail2] = this.createSecondaryMeshes(texture2, texture3);
            
            // Ajustement des positions pour un défilement horizontal
            const secondaryOffset = section.position === 'left' ? 12 : -12;
            
            detail1.position.set(secondaryOffset, 2, 0); // Modification de la position Y à 2 au lieu de -2
            detail2.position.set(secondaryOffset * 1.2, -2, 0); // Modification de la position Y à -2
            
            // Ajustement des rotations pour l'effet de perspective
            detail1.rotation.z = section.position === 'left' ? -0.1 : 0.1;
            detail2.rotation.z = section.position === 'left' ? 0.1 : -0.1;
            
            group.add(detail1, detail2);
        }

        // Ajout des quotes pour la section quote
        if (section.type === 'quote' && section.quotes) {
            const quotesMeshes = this.createQuoteMeshes(section.quotes);
            quotesMeshes.forEach((mesh, index) => {
                mesh.position.set(0, -6 - (index * 2), -5 - (index * 10));
                group.add(mesh);
            });
        }

        this.scene.add(group);
        this.fragments.push({
            mesh: mainMesh,
            group: group,
            exitDirection: section.position
        });

        // Ajout du label approprié
        if (section.type === 'team') {
            this.addTeamLabel(group, section);
        } else {
            this.addFragmentLabel(group, section);
        }
    }

    createMainMesh(texture) {
        return new THREE.Mesh(
            new THREE.PlaneGeometry(6, 6, 50, 50),
            new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            })
        );
    }

    createSecondaryMeshes(texture2, texture3) {
        const geometry = new THREE.PlaneGeometry(4, 4, 1, 1);
        const material2 = new THREE.MeshBasicMaterial({
            map: texture2,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const material3 = new THREE.MeshBasicMaterial({
            map: texture3,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });

        return [
            new THREE.Mesh(geometry, material2),
            new THREE.Mesh(geometry, material3)
        ];
    }

    createQuoteMeshes(quotes) {
        return quotes.map(quote => {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(quote, canvas.width/2, canvas.height/2);
            
            const texture = new THREE.CanvasTexture(canvas);
            
            return new THREE.Mesh(
                new THREE.PlaneGeometry(8, 2),
                new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0.9,
                    side: THREE.DoubleSide
                })
            );
        });
    }

    addFragmentLabel(fragment, section) {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'fragment-label';
        labelDiv.style.pointerEvents = 'auto';
        labelDiv.innerHTML = `
            <div class="label-content">
                <h2>${section.title}</h2>
                <p class="subtitle">${section.subtitle}</p>
            </div>
        `;

        document.body.appendChild(labelDiv);

        fragment.userData = { label: labelDiv };
        
        labelDiv.style.cssText = `
            position: fixed;
            left: ${section.position === 'left' ? '40px' : 'auto'};
            right: ${section.position === 'right' ? '40px' : 'auto'};
            bottom: 40px;
            color: white;
            text-align: ${section.position};
            pointer-events: auto;
            transition: opacity 0.1s linear;
            z-index: 1000;
            opacity: ${fragment.position.z === -10 ? 1 : 0};
        `;
    }

    addTeamLabel(fragment, section) {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'fragment-label';
        labelDiv.style.pointerEvents = 'auto';
        labelDiv.innerHTML = `
            <div class="label-content">
                <p class="team-link">${section.team}</p>
            </div>
        `;

        document.body.appendChild(labelDiv);

        const teamLink = labelDiv.querySelector('.team-link');
        teamLink.addEventListener('click', () => {
            this.showTeamPopup(section.students);
        });

        fragment.userData = { label: labelDiv };
        
        labelDiv.style.cssText = `
            position: fixed;
            left: ${section.position === 'left' ? '40px' : 'auto'};
            right: ${section.position === 'right' ? '40px' : 'auto'};
            bottom: 40px;
            color: white;
            text-align: ${section.position};
            pointer-events: auto;
            transition: opacity 0.1s linear;
            z-index: 1000;
        `;
    }

    showTeamPopup(students) {
        let popup = document.querySelector('.subtitle-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.className = 'subtitle-popup';
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

        requestAnimationFrame(() => {
            popup.classList.add('active');
        });
    }

    updateFragments() {
        this.fragments.forEach((fragment) => {
            if (!fragment.mesh || !fragment.group) return;

            const distance = fragment.group.position.z - this.camera.position.z;
            
            if (fragment.mesh.geometry.isBufferGeometry) {
                this.updateWaveEffect(fragment.mesh);
            }

            let opacity = 0.9;
            if (distance < -15 && distance > -30) {
                opacity = 0.9 * ((distance + 30) / 15);
            } else if (distance > 15 && distance < 30) {
                opacity = 0.9 * (1 - ((distance - 15) / 15));
            } else if (distance <= -30 || distance >= 30) {
                opacity = 0;
            }

            fragment.group.traverse((child) => {
                if (child.material) {
                    child.material.opacity = opacity;
                }
            });

            if (fragment.group.userData && fragment.group.userData.label) {
                const label = fragment.group.userData.label;
                
                if (this.camera.position.z === 0 && fragment.group.position.z === -10) {
                    return;
                }
                
                if (Math.abs(distance) > 8) {
                    label.style.opacity = 0;
                } else {
                    label.style.opacity = opacity;
                }
            }
        });
    }

    cleanup() {
        console.log('Cleanup appelé - Suppression du handler');
        if (this._currentScrollHandler) {
            window.removeEventListener('wheel', this._currentScrollHandler);
        }
        super.cleanup();
    }
}