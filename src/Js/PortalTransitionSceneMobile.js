import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { PortalTransitionSceneBase } from './PortalTransitionSceneBase.js';

export class PortalTransitionSceneMobile extends PortalTransitionSceneBase {
    constructor(app, selectedFragmentIndex) {
        super(app, selectedFragmentIndex);
        this._touchHandlerInitialized = false;
        
        // Créer la barre de progression
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressBar.appendChild(progressFill);
        document.body.appendChild(progressBar);
        
        this.progressFill = progressFill;
        this.setupScrollHandler();
    }

    async setupFragments() {
        try {
            const response = await fetch('./src/data/portalData.json');
            const data = await response.json();
            const atelierData = data[`atelier${this.selectedFragmentIndex + 1}`];
            
            if (!atelierData) {
                console.error(`Pas de données pour atelier${this.selectedFragmentIndex + 1}`);
                return;
            }

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
                    zPosition: -60
                },
                {
                    type: 'standard',
                    position: 'left',
                    mainImage: atelierData.sets[2].image1,
                    secondaryImages: [atelierData.sets[2].image2, atelierData.sets[2].image3],
                    title: atelierData.sets[2].title,
                    subtitle: atelierData.sets[2].subtitle,
                    zPosition: -110
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
                    zPosition: -160
                },
                {
                    type: 'team',
                    position: 'center',
                    image: atelierData.sets[4].image1,
                    team: atelierData.sets[4].team,
                    students: atelierData.sets[4].students,
                    zPosition: -200
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
        let mainMesh;
        
        group.position.set(0, 0, section.zPosition);

        if (section.type === 'team') {
            // Section team avec image centrale et bouton
            const mainTexture = await this.loadTexture(textureLoader, section.image);
            mainMesh = this.createMainMesh(mainTexture);
            mainMesh.position.set(0, 2, 0);
            mainMesh.scale.set(1.5, 1.5, 1);
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
                margin: 0;
                font-size: 18px;
                font-weight: bold;
                color: white;
            `;
            
            // Ajout de l'événement click sur le même teamLink
            teamLink.addEventListener('click', () => {
                this.showTeamPopup(section.students);
            });

            group.userData = { 
                label: labelDiv,
                isTeamLabel: true  // S'assurer que c'est bien marqué comme label team
            };
        } else if (section.type === 'quote') {
            const mainTexture = await this.loadTexture(textureLoader, section.mainImage);
            mainMesh = this.createMainMesh(mainTexture);
            mainMesh.position.set(0, 4, 0);
            mainMesh.scale.set(1.2, 1.2, 1);
            group.add(mainMesh);

            const quotesMeshes = this.createQuoteMeshes(section.quotes);
            
            quotesMeshes[0].position.set(0, 1, 0);
            quotesMeshes[0].scale.set(0.9, 0.9, 1);
            group.add(quotesMeshes[0]);
            
            // Deuxième ensemble (image et quote)
            const [texture2, texture3] = await Promise.all([
                this.loadTexture(textureLoader, section.secondaryImages[0]),
                this.loadTexture(textureLoader, section.secondaryImages[1])
            ]);

            const [detail1, detail2] = this.createSecondaryMeshes(texture2, texture3);
            
            detail1.position.set(-2.5, -2, 0);
            detail2.position.set(2.5, -2, 0);
            
            detail1.scale.set(0.9, 0.9, 1);
            detail2.scale.set(0.9, 0.9, 1);
            
            quotesMeshes[1].position.set(-2.5, -4, 0);
            quotesMeshes[2].position.set(2.5, -4, 0);
            
            group.add(detail1, detail2, quotesMeshes[1], quotesMeshes[2]);
        } else {
            // Section standard
            const mainTexture = await this.loadTexture(textureLoader, section.mainImage);
            mainMesh = this.createMainMesh(mainTexture);
            mainMesh.position.set(0, 2, 0);
            mainMesh.scale.set(1.2, 1.2, 1);
            group.add(mainMesh);

            if (section.secondaryImages) {
                const [texture2, texture3] = await Promise.all([
                    this.loadTexture(textureLoader, section.secondaryImages[0]),
                    this.loadTexture(textureLoader, section.secondaryImages[1])
                ]);

                const [detail1, detail2] = this.createSecondaryMeshes(texture2, texture3);
                
                detail1.position.set(-2, -2, 0); // Position en bas à gauche
                detail2.position.set(2, -2, 0);  // Position en bas à droite
                
                detail1.scale.set(0.8, 0.8, 1);
                detail2.scale.set(0.8, 0.8, 1);
                
                group.add(detail1, detail2);
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
            new THREE.PlaneGeometry(8, 8),
            new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            })
        );
    }

    createSecondaryMeshes(texture2, texture3) {
        const geometry = new THREE.PlaneGeometry(4, 4);
        
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
            ctx.font = 'italic 32px Georgia'; // Police plus petite pour mobile
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Wrap le texte pour une meilleure présentation sur mobile
            const words = quote.split(' ');
            let line = '';
            let lines = [];
            let y = canvas.height/2;
            
            words.forEach(word => {
                const testLine = line + word + ' ';
                if (ctx.measureText(testLine).width > 800) { // Largeur réduite pour mobile
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
                new THREE.PlaneGeometry(5, 1.5), // Dimensions réduites pour mobile
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
            const lastFragmentPosition = -260 - 15;
            const minZ = lastFragmentPosition;

            let newZ = this.camera.position.z - delta;
            newZ = Math.max(minZ, Math.min(maxZ, newZ));
            this.camera.position.z = newZ;

            const progress = Math.min(Math.abs(maxZ - this.camera.position.z) / Math.abs(maxZ - minZ), 1);
            if (this.progressFill) {
                this.progressFill.style.setProperty('--progress', progress);
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
} 