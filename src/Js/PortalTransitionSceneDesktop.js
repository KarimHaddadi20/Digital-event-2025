import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { PortalTransitionSceneBase } from './PortalTransitionSceneBase.js';

export class PortalTransitionSceneDesktop extends PortalTransitionSceneBase {
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
            const fragmentsData = atelierData.sets.map((set, index) => {
                const isLeft = index % 2 === 0;
                return {
                    texture: set.image1,
                    image2: set.image2,
                    image3: set.image3,
                    title: set.title,
                    subtitle: set.subtitle,
                    position: { 
                        x: isLeft ? -4 : 4,
                        y: 0,
                        z: -5 - (index * 20)
                    },
                    scale: 1,
                    exitDirection: isLeft ? 'left' : 'right'
                };
            });

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
            const [texture1, texture2, texture3] = await Promise.all([
                this.loadTexture(textureLoader, data.texture),
                this.loadTexture(textureLoader, data.image2),
                this.loadTexture(textureLoader, data.image3)
            ]);

            // Fragment principal
            const mainFragment = this.createMainFragment(data, texture1);
            
            // Fragments détaillés
            const [detail1, detail2] = this.createDetailFragments(data, texture2, texture3);
            
            // Position des fragments détaillés
            const detailOffset = data.exitDirection === 'left' ? -4 : 4;
            detail1.position.set(detailOffset, 2, 0);
            detail2.position.set(detailOffset * 1.2, -2, 0);
            
            // Rotation des fragments détaillés
            detail1.rotation.z = data.exitDirection === 'left' ? -0.2 : 0.2;
            detail2.rotation.z = data.exitDirection === 'left' ? 0.3 : -0.3;
            
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
            opacity: 0.9
        });
        
        const mainFragment = new THREE.Mesh(geometry, material);
        mainFragment.position.copy(data.position);
        
        return mainFragment;
    }

    createDetailFragments(data, texture2, texture3) {
        const detailGeometry = new THREE.PlaneGeometry(
            4 * data.scale * 0.6,
            4 * data.scale * 0.6,
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

            // Opacité commune
            let opacity = 0.9;
            if (distance < -15 && distance > -30) {
                opacity = 0.9 * ((distance + 30) / 15);
            } else if (distance > 15 && distance < 30) {
                opacity = 0.9 * (1 - ((distance - 15) / 15));
            } else if (distance <= -30 || distance >= 30) {
                opacity = 0;
            }

            mesh.material.opacity = THREE.MathUtils.clamp(opacity, 0, 1);

            // Position X : maintenir la position gauche/droite
            const xOffset = fragment.exitDirection === 'left' ? -20 : 20;
            const xPosition = (distance / 30) * xOffset;
            mesh.position.x = fragment.exitDirection === 'left' ? 
                Math.min(xPosition, -4) :
                Math.max(xPosition, 4);

            // Fragments détaillés
            mesh.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    const baseOpacity = child.material._baseOpacity || child.material.opacity;
                    child.material.opacity = THREE.MathUtils.clamp(opacity * baseOpacity, 0, baseOpacity);
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
        window.addEventListener('wheel', (event) => {
            event.preventDefault();
            const delta = event.deltaY * 0.05;
            
            const maxZ = 7;
            const fragmentSpacing = 20;
            const lastFragmentPosition = -5 - ((this.fragments.length - 1) * fragmentSpacing);
            const minZ = lastFragmentPosition - 15;
            
            let newZ = this.camera.position.z - delta;
            newZ = Math.max(minZ, Math.min(maxZ, newZ));
            
            window.gsap.to(this.camera.position, {
                z: newZ,
                duration: 0.5,
                ease: "power2.out",
                onUpdate: () => {
                    const progress = Math.min(Math.abs(maxZ - this.camera.position.z) / Math.abs(maxZ - minZ), 1);
                    if (this.progressFill) {
                        this.progressFill.style.setProperty('--progress', progress);
                    }
                }
            });
        }, { passive: false });

        document.body.style.overflow = 'hidden';
    }
} 