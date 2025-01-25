// Imports nécessaires
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SceneSetup } from './SceneSetup.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// export class AtelierGalleryScene extends SceneSetup {
//     constructor(app, fragmentIndex = 0) {
//         // Appeler le constructeur parent sans HDRI
//         super(false);
        
//         // Configuration de la caméra
//         this.camera.position.set(0, 0, 0);
//         this.camera.lookAt(0, 0, 0);
        
//         // Configuration de base de la scène
//         this.scene.background = new THREE.Color(0x000000);
        
//         // Configurer les lumières en premier
//         this.setupGalleryLights();
        
//         // Charger le HDRI après les lumières
//         this.loadHDRI();
        
//         // Charger le fond d'image
//         const textureLoader = new THREE.TextureLoader();
//         console.log("Début du chargement de la texture de fond");
//         textureLoader.load('./src/textures/Atelier1.png', 
//             (texture) => {
//                 console.log("Texture de fond chargée avec succès");
//                 const aspectRatio = texture.image.width / texture.image.height;
//                 console.log("Aspect ratio:", aspectRatio);
//                 const bgGeometry = new THREE.PlaneGeometry(50 * aspectRatio, 50);
//                 const bgMaterial = new THREE.MeshBasicMaterial({ 
//                     map: texture,
//                     opacity: 0.5,
//                     transparent: true,
//                     side: THREE.DoubleSide
//                 });
//                 const background = new THREE.Mesh(bgGeometry, bgMaterial);
//                 background.position.z = -30;
//                 this.scene.add(background);
//                 console.log("Background ajouté à la scène");
//             },
//             (xhr) => {
//                 console.log("Progression du chargement de la texture de fond:", (xhr.loaded / xhr.total * 100) + '%');
//             },
//             (error) => {
//                 console.error("Erreur lors du chargement de la texture de fond:", error);
//                 console.error("URL tentée:", './src/textures/Atelier1.png');
//             }
//         );
        
//         this.fragments = [];
//         this.svgSprites = [];
//         this.currentFragmentIndex = fragmentIndex;
//         this.time = 0;
//         this.texts = null;

//         this.waveConfig = {
//             frequency: 0.8,
//             amplitude: 0.2,
//             speed: 2
//         };

//         this.fragmentsData = [
//             {
//                 id: 1,
//                 title: "L'Horizon Perdu",
//                 description: "Une œuvre abstraite évoquant les limites entre ciel et terre"
//             },
//             {
//                 id: 2,
//                 title: "Mélodie Fractale",
//                 description: "Fragments géométriques inspirés par les motifs musicaux"
//             },
//             {
//                 id: 3,
//                 title: "Échos du Temps",
//                 description: "Représentation de la mémoire collective à travers les âges"
//             },
//             {
//                 id: 4,
//                 title: "Fusion Organique",
//                 description: "Mélange harmonieux entre nature et technologie"
//             },
//             {
//                 id: 5,
//                 title: "Résonance Cristalline",
//                 description: "Structure complexe reflétant la lumière et l'espace"
//             },
//             {
//                 id: 6,
//                 title: "Vagues Numériques",
//                 description: "Ondulations dynamiques dans l'espace virtuel"
//             },
//             {
//                 id: 7,
//                 title: "Symétrie Brisée",
//                 description: "Exploration des patterns chaotiques et ordonnés"
//             },
//             {
//                 id: 8,
//                 title: "Confluence",
//                 description: "Point de rencontre entre différentes dimensions"
//             },
//             {
//                 id: 9,
//                 title: "Nébulose Urbaine",
//                 description: "Abstraction de la vie citadine moderne"
//             },
//             {
//                 id: 10,
//                 title: "Métamorphose",
//                 description: "Transformation continue de la matière digitale"
//             },
//             {
//                 id: 11,
//                 title: "Équilibre Parfait",
//                 description: "Harmonie entre les forces opposées"
//             }
//         ];

//         // Configuration de la scène
//         this.setupLabelRenderer();
        
//         // Créer les éléments de la scène
//         this.createFragments();
//         this.loadTexts();
//         this.createSVGSprites();
//         this.setupEventListeners();

//         // Animation d'entrée
//         gsap.to(this.camera.position, {
//             duration: 2,
//             z: 7,
//             ease: "power2.inOut"
//         });

//         // Ajouter des helpers pour debug
//         const axesHelper = new THREE.AxesHelper(10);
//         this.scene.add(axesHelper);
        
//         const gridHelper = new THREE.GridHelper(20, 20);
//         this.scene.add(gridHelper);

//         // Démarrer l'animation
//         this.animate();
//     }

//     loadHDRI() {
//         const rgbeLoader = new RGBELoader();
//         rgbeLoader.load("src/assets/night.hdr", (texture) => {
//             texture.mapping = THREE.EquirectangularReflectionMapping;
//             this.scene.background = texture;
//             this.scene.environment = texture;
//         });
//     }

//     setupGalleryLights() {
//         // Augmenter l'intensité des lumières
//         const ambient = new THREE.AmbientLight(0xffffff, 2);
//         this.scene.add(ambient);

//         const mainLight = new THREE.DirectionalLight(0xffffff, 3);
//         mainLight.position.set(5, 5, 5);
//         this.scene.add(mainLight);

//         // Ajouter un helper pour voir la direction de la lumière
//         const lightHelper = new THREE.DirectionalLightHelper(mainLight, 5);
//         this.scene.add(lightHelper);

//         // Lumière de remplissage pour les ombres
//         const fillLight = new THREE.DirectionalLight(0xffffff, 1);
//         fillLight.position.set(-5, 5, 5);
//         this.scene.add(fillLight);

//         // Lumière d'accentuation pour les détails
//         const spotLight = new THREE.SpotLight(0xffffff, 2);
//         spotLight.position.set(0, 10, 10);
//         spotLight.angle = Math.PI / 3;
//         spotLight.penumbra = 0.2;
//         spotLight.decay = 1;
//         spotLight.distance = 100;
//         this.scene.add(spotLight);

//         // Lumière de contre-jour pour la profondeur
//         const backLight = new THREE.DirectionalLight(0xffffff, 1);
//         backLight.position.set(0, 5, -10);
//         this.scene.add(backLight);
//     }

//     setupLabelRenderer() {
//         const container = document.getElementById('scene-container');
//         this.labelRenderer = new CSS2DRenderer();
//         this.labelRenderer.setSize(container.offsetWidth, container.offsetHeight);
//         this.labelRenderer.domElement.style.position = 'absolute';
//         this.labelRenderer.domElement.style.top = '0px';
//         this.labelRenderer.domElement.style.pointerEvents = 'none';
//         container.appendChild(this.labelRenderer.domElement);
//     }

//     createFragments() {
//         const textureLoader = new THREE.TextureLoader();
//         console.log("Début du chargement des textures");

//         const mainTexture = textureLoader.load('./src/textures/A1-01.png',     
//             // Callback de succès
//             (texture) => {
//                 console.log("Texture principale chargée avec succès:", texture);
//             },
//             // Callback de progression
//             (xhr) => {
//                 console.log("Progression du chargement de la texture principale:", (xhr.loaded / xhr.total * 100) + '%');
//             },
//             // Callback d'erreur
//             (error) => {
//                 console.error("Erreur lors du chargement de la texture principale:", error);
//                 console.error("URL tentée:", './src/textures/A1-01.png');
//             }
//         );

//         const texture10 = textureLoader.load('./src/textures/A1-02.png',
//             (texture) => console.log("Texture 10 chargée avec succès"),
//             null,
//             (error) => {
//                 console.error("Erreur lors du chargement de la texture 10:", error);
//                 console.error("URL tentée:", './src/textures/A1-02.png');
//             }
//         );

//         const texture11 = textureLoader.load('./src/textures/A1-03.png',
//             (texture) => console.log("Texture 11 chargée avec succès"),
//             null,
//             (error) => {
//                 console.error("Erreur lors du chargement de la texture 11:", error);
//                 console.error("URL tentée:", './src/textures/A1-03.png');
//             }
//         );

//         this.createFragmentsWithTextures(mainTexture, texture10, texture11);
//     }

//     createFragmentsWithTextures(mainTexture, texture10, texture11) {
//         console.log("Création des fragments avec les textures");
//         Array.from({ length: 5 }).forEach((_, i) => {
//             const geometry = new THREE.PlaneGeometry(6, 6, 50, 50);
//             const material = new THREE.MeshStandardMaterial({
//                 map: mainTexture,
//                 metalness: 0.1,
//                 roughness: 0.8,
//                 side: THREE.DoubleSide,
//                 transparent: true,
//                 opacity: 1
//             });

//             const fragment = new THREE.Mesh(geometry, material);
//             const isEven = i % 2 === 0;
            
//             fragment.position.set(
//                 isEven ? -4 : 4,
//                 1,
//                 -5 - (i * 10)
//             );

//             console.log(`Fragment ${i} position:`, fragment.position);

//             const detailGeometry = new THREE.PlaneGeometry(10, 10, 50, 50);
            
//             const detail1 = new THREE.Mesh(
//                 detailGeometry,
//                 new THREE.MeshStandardMaterial({
//                     map: texture10,
//                     metalness: 0.5,
//                     roughness: 0.3,
//                     side: THREE.DoubleSide,
//                     transparent: true,
//                     opacity: 0.5
//                 })
//             );
            
//             const detail2 = new THREE.Mesh(
//                 detailGeometry,
//                 new THREE.MeshStandardMaterial({
//                     map: texture11,
//                     metalness: 0.5,
//                     roughness: 0.3,
//                     side: THREE.DoubleSide,
//                     transparent: true,
//                     opacity: 0.7
//                 })
//             );

//             detail1.position.set(0, 2, -30);
//             detail2.position.set(0, -2, -30);
            
//             detail1.scale.set(0.5, 0.5, 0.5);
//             detail2.scale.set(0.5, 0.5, 0.5);
            
//             fragment.add(detail1);
//             fragment.add(detail2);

//             fragment.userData.id = this.fragmentsData[i].id;
//             this.fragments.push(fragment);
//             this.scene.add(fragment);
//         });
//     }

//     createSVGSprites() {
//         const spriteMap = new THREE.TextureLoader().load('/src/textures/Atelier1.png');
//         const spriteMaterial = new THREE.SpriteMaterial({
//             map: spriteMap,
//             transparent: true,
//             opacity: 2,
//             depthWrite: false,
//             blending: THREE.AdditiveBlending
//         });

//         for (let i = 0; i < 10; i++) {
//             const sprite = new THREE.Sprite(spriteMaterial);
//             this.positionSprite(sprite, true);
//             this.svgSprites.push(sprite);
//             this.scene.add(sprite);
//         }
//     }

//     positionSprite(sprite, initial = false) {
//         const side = Math.random() > 0.5 ? 1 : -1;
//         const z = initial ? Math.random() * -50 : this.camera.position.z - 50;
        
//         sprite.position.set(
//             side * (8 + Math.random() * 4),
//             Math.random() * 10 - 5,
//             z
//         );
        
//         const scale = 0.5 + Math.random() * 0.3;
//         sprite.scale.set(scale, scale, 1);
//         sprite.rotation.z = Math.random() * Math.PI * 2;
//     }

//     setupEventListeners() {
//         let timeoutId = null;
//         window.addEventListener('wheel', (event) => {
//             if (timeoutId) return;
//             timeoutId = setTimeout(() => {
//                 this.onScroll(event);
//                 timeoutId = null;
//             }, 18);
//         }, { passive: false });
//     }

//     onScroll(event) {
//         event.preventDefault();
        
//         const scrollSpeed = 0.1;
//         const minZ = 6;
//         const maxZ = -(this.fragments.length * 20) + minZ;
//         const currentZ = this.camera.position.z;
        
//         let delta = event.deltaY * scrollSpeed;
        
//         if (currentZ - delta > minZ) delta = currentZ - minZ;
//         if (currentZ - delta < maxZ) delta = currentZ - maxZ;
        
//         if (currentZ - delta >= maxZ && currentZ - delta <= minZ) {
//             gsap.to(this.camera.position, {
//                 z: currentZ - delta,
//                 duration: 1.2,
//                 ease: "power3.out",
//                 onUpdate: () => {
//                     const speed = Math.abs(delta);
//                     this.svgSprites.forEach(sprite => {
//                         sprite.material.opacity = THREE.MathUtils.clamp(speed * 20, 0.2, 0.6);
//                     });
//                     this.updateFragments();
//                 }
//             });
//         }
//     }

//     updateFragments() {
//         this.fragments.forEach(fragment => {
//             const distance = fragment.position.z - this.camera.position.z;
            
//             let opacity = 1;
//             if (distance < -5 && distance > -15) {
//                 opacity = (distance + 15) / 10;
//             } else if (distance > 5 && distance < 15) {
//                 opacity = 1 - ((distance - 5) / 10);
//             } else if (distance <= -15 || distance >= 15) {
//                 opacity = 0;
//             }
            
//             fragment.material.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
            
//             const positions = fragment.geometry.attributes.position;
//             for (let i = 0; i < positions.count; i++) {
//                 const x = positions.getX(i);
//                 const y = positions.getY(i);
                
//                 const z = this.waveConfig.amplitude *
//                     Math.sin(x * this.waveConfig.frequency + this.time) *
//                     Math.cos(y * this.waveConfig.frequency + this.time);
                
//                 positions.setZ(i, z);
//             }
//             positions.needsUpdate = true;

//             const label = fragment.children.find(child => child instanceof CSS2DObject);
//             if (label) {
//                 label.element.style.opacity = fragment.material.opacity;
//             }

//             fragment.children.forEach(child => {
//                 if (child instanceof THREE.Mesh) {
//                     child.material.opacity = fragment.material.opacity;
//                 }
//             });
//         });
//     }

//     async loadTexts() {
//         try {
//             const response = await fetch('/src/data/texts.json');
//             if (!response.ok) {
//                 this.texts = {
//                     fragmentTexts: this.fragmentsData.map((f, index) => ({
//                         id: f.id,
//                         title: `Fragment ${index + 1}`,
//                         description: f.description
//                     }))
//                 };
//             } else {
//                 this.texts = await response.json();
//             }
//             this.addTextLabels();
//         } catch (error) {
//             console.error('Error loading texts:', error);
//             this.texts = {
//                 fragmentTexts: this.fragmentsData.map((f, index) => ({
//                     id: f.id,
//                     title: `Fragment ${index + 1}`,
//                     description: f.description
//                 }))
//             };
//             this.addTextLabels();
//         }
//     }

//     addTextLabels() {
//         const mainFragments = this.fragments.filter((_, index) => index < 9);
        
//         mainFragments.forEach((fragment, index) => {
//             const textDiv = document.createElement('div');
//             textDiv.className = 'label';
            
//             const titleDiv = document.createElement('div');
//             titleDiv.className = 'label-title';
//             titleDiv.textContent = this.fragmentsData[index].title;
            
//             const descDiv = document.createElement('div');
//             descDiv.className = 'label-description';
//             descDiv.textContent = this.fragmentsData[index].description;
            
//             textDiv.appendChild(titleDiv);
//             textDiv.appendChild(descDiv);
            
//             textDiv.style.cssText = `
//                 color: white;
//                 padding: 8px;
//                 text-align: center;
//                 width: 200px;
//                 transform: translateY(10px);
//                 text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
//             `;
            
//             titleDiv.style.cssText = `
//                 font-weight: bold;
//                 margin-bottom: 5px;
//             `;
            
//             descDiv.style.cssText = `
//                 font-size: 0.9em;
//                 opacity: 0.8;
//             `;
            
//             const label = new CSS2DObject(textDiv);
//             label.position.set(0, -3.5, 0);
//             textDiv.style.opacity = 0;
//             textDiv.style.transition = 'opacity 0s ease-in-out';
//             fragment.add(label);
//         });
//     }

//     animate() {
//         requestAnimationFrame(() => this.animate());
        
        
//         this.updateFragments();
//         this.svgSprites.forEach(sprite => {
//             sprite.position.z += 0.05;
//             sprite.rotation.z += 0.05;
            
//             if (sprite.position.z > this.camera.position.z + 10) {
//                 this.positionSprite(sprite);
//             }
//         });
        
//         // Vérifier que le rendu se fait bien
//         this.renderer.render(this.scene, this.camera);
//         this.labelRenderer.render(this.scene, this.camera);
//     }

//     onResize() {
//         super.onResize();
//         if (this.labelRenderer) {
//             const container = document.getElementById('scene-container');
//             this.labelRenderer.setSize(container.offsetWidth, container.offsetHeight);
//         }
//     }
// }