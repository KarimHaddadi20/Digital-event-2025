// Imports nécessaires
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

let scene, camera, renderer, controls;
let fragments = [];
let svgSprites = [];
let currentFragmentIndex = 8;
let time = 0;
let labelRenderer;
let texts;

const waveConfig = {
    frequency: 0.8,
    amplitude: 0.2,
    speed: 2
};

// const fragmentsData = Array.from({ length: 11 }, (_, i) => ({
//     id: i + 1,
//     title: `Fragment ${i + 1}`,
//     description: `Description détaillée du fragment ${i + 1}`
// }));

const fragmentsData = [
    {
        id: 1,
        title: "L'Horizon Perdu",
        description: "Une œuvre abstraite évoquant les limites entre ciel et terre"
    },
    {
        id: 2,
        title: "Mélodie Fractale",
        description: "Fragments géométriques inspirés par les motifs musicaux"
    },
    {
        id: 3,
        title: "Échos du Temps",
        description: "Représentation de la mémoire collective à travers les âges"
    },
    {
        id: 4,
        title: "Fusion Organique",
        description: "Mélange harmonieux entre nature et technologie"
    },
    {
        id: 5,
        title: "Résonance Cristalline",
        description: "Structure complexe reflétant la lumière et l'espace"
    },
    {
        id: 6,
        title: "Vagues Numériques",
        description: "Ondulations dynamiques dans l'espace virtuel"
    },
    {
        id: 7,
        title: "Symétrie Brisée",
        description: "Exploration des patterns chaotiques et ordonnés"
    },
    {
        id: 8,
        title: "Confluence",
        description: "Point de rencontre entre différentes dimensions"
    },
    {
        id: 9,
        title: "Nébulose Urbaine",
        description: "Abstraction de la vie citadine moderne"
    },
    {
        id: 10,
        title: "Métamorphose",
        description: "Transformation continue de la matière digitale"
    },
    {
        id: 11,
        title: "Équilibre Parfait",
        description: "Harmonie entre les forces opposées"
    }
];

async function init() {
    const container = document.getElementById('scene-container');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.z = 8;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(5, 5, 5);
    scene.add(ambient, directional);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;

    // Ajouter le CSS2DRenderer
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.offsetWidth, container.offsetHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    createFragments();
    await loadTexts(); // Make sure texts are loaded after fragments
    createSVGSprites();
    setupEventListeners();
    animate();

    // Exemple d'utilisation de GSAP
    gsap.to(camera.position, {
        duration: 2,
        z: 7,
        ease: "power2.inOut"
    });
}



function createFragments() {
    const textureLoader = new THREE.TextureLoader();
    const mainTexture = textureLoader.load('/src/assets/fragment9.svg');
    const texture10 = textureLoader.load('/src/assets/fragment10.svg');
    const texture11 = textureLoader.load('/src/assets/fragment11.svg');

    // Créer d'abord les fragments de détail (en arrière-plan)
    const detailGeometry = new THREE.PlaneGeometry(10, 10, 50, 50);
    
    // Premier détail (fragment 10)
    const detail1 = new THREE.Mesh(
        detailGeometry,
        new THREE.MeshPhysicalMaterial({
            map: texture10,
            metalness: 0.5,
            roughness: 0.3,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        })
    );
    
    // Second détail (fragment 11)
    const detail2 = new THREE.Mesh(
        detailGeometry,
        new THREE.MeshPhysicalMaterial({
            map: texture11,
            metalness: 0.5,
            roughness: 0.3,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        })
    );

    // Position fixe en arrière-plan
    detail1.position.set(8, 3, -18);
    detail2.position.set(8, -3, -10);
    
    detail1.scale.set(0.5, 0.5, 0.5);
    detail2.scale.set(0.5, 0.5, 0.5);
    
    scene.add(detail1);
    scene.add(detail2);

    // Création des fragments principaux
    Array.from({ length: 9 }).forEach((_, i) => {
        const geometry = new THREE.PlaneGeometry(6, 6, 50, 50);
        const material = new THREE.MeshPhysicalMaterial({
            map: mainTexture,
            metalness: 0.5,
            roughness: 0.3,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1
        });

        const fragment = new THREE.Mesh(geometry, material);
        const isEven = i % 2 === 0;
        
        fragment.position.set(
            isEven ? -4 : 4,
            1,
            i * -22
        );

        fragment.userData.id = fragmentsData[i].id;
        fragments.push(fragment);
        scene.add(fragment);
    });
}

function createSVGSprites() {
    const spriteMap = new THREE.TextureLoader().load('/src/assets/fragment.svg');
    const spriteMaterial = new THREE.SpriteMaterial({
        map: spriteMap,
        transparent: true,
        opacity: 2, // Reduced opacity
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    // Reduced number of sprites from 20 to 10


    for (let i = 0; i < 10; i++) {
        const sprite = new THREE.Sprite(spriteMaterial);
        positionSprite(sprite, true);
        svgSprites.push(sprite);
        scene.add(sprite);
    }
}

function positionSprite(sprite, initial = false) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const z = initial ? Math.random() * -50 : camera.position.z - 50;
    
    sprite.position.set(
        side * (8 + Math.random() * 4),
        Math.random() * 10 - 5,
        z
    );
    

        // Reduced scale from 0.5 to 0.2

    const scale = 0.5 + Math.random() * 0.3;
    sprite.scale.set(scale, scale, 1);
    sprite.rotation.z = Math.random() * Math.PI * 2;
}

function setupEventListeners() {
    let timeoutId = null;
    window.addEventListener('wheel', (event) => {
        if (timeoutId) return;
        timeoutId = setTimeout(() => {
            onScroll(event);
            timeoutId = null;
        }, 18);
    }, { passive: false });
    
    window.addEventListener('resize', onResize);
}

function onScroll(event) {
    event.preventDefault();
    
    const scrollSpeed = 0.02;
    const minZ = 6;
    const maxZ = -(fragments.length * 20) + minZ;
    const currentZ = camera.position.z;
    
    let delta = event.deltaY * scrollSpeed;
    
    if (currentZ - delta > minZ) delta = currentZ - minZ;
    if (currentZ - delta < maxZ) delta = currentZ - maxZ;
    
    if (currentZ - delta >= maxZ && currentZ - delta <= minZ) {
        gsap.to(camera.position, {
            z: currentZ - delta,
            duration: 1.2,
            ease: "power3.out",
            onUpdate: () => {
                const speed = Math.abs(delta);
                svgSprites.forEach(sprite => {
                    sprite.material.opacity = THREE.MathUtils.clamp(speed * 20, 0.2, 0.6);
                });
            }
        });
    }
}

function onResize() {
    const container = document.getElementById('scene-container');
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    labelRenderer.setSize(container.offsetWidth, container.offsetHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // time += 0.05 * waveConfig.speed;
    
    updateFragments();
    svgSprites.forEach(sprite => {
        sprite.position.z += 0.05;
        sprite.rotation.z += 0.05;
        
        if (sprite.position.z > camera.position.z + 10) {
            positionSprite(sprite);
        }
    });
    
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function updateFragments() {
    fragments.forEach(fragment => {
        const distance = fragment.position.z - camera.position.z;
        
        let opacity = 1;
        if (distance < -5 && distance > -15) {
            opacity = (distance + 15) / 10;
        } else if (distance > 5 && distance < 15) {
            opacity = 1 - ((distance - 5) / 10);
        } else if (distance <= -15 || distance >= 15) {
            opacity = 0;
        }
        
        fragment.material.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
        
        const positions = fragment.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            
            const z = waveConfig.amplitude *
                Math.sin(x * waveConfig.frequency + time) *
                Math.cos(y * waveConfig.frequency + time);
            
            positions.setZ(i, z);
        }
        positions.needsUpdate = true;

        // Update label opacity to match fragment
        const label = fragment.children.find(child => child instanceof CSS2DObject);
        if (label) {
            label.element.style.opacity = fragment.material.opacity;
        }
    });
}

async function loadTexts() {
    try {
        const response = await fetch('/src/data/texts.json');
        if (!response.ok) {
            // Use fragmentsData as fallback immediately
            texts = {
                fragmentTexts: fragmentsData.map((f, index) => ({
                    id: f.id,
                    title: `Fragment ${index + 1}`,
                    description: f.description
                }))
            };
        } else {
            texts = await response.json();
        }
        addTextLabels();
    } catch (error) {
        console.error('Error loading texts:', error);
        // Fallback data
        texts = {
            fragmentTexts: fragmentsData.map((f, index) => ({
                id: f.id,
                title: `Fragment ${index + 1}`,
                description: f.description
            }))
        };
        addTextLabels();
    }
}

function addTextLabels() {
    // Ne parcourir que les fragments principaux (0-8)
    const mainFragments = fragments.filter((_, index) => index < 9);
    
    mainFragments.forEach((fragment, index) => {
        const textDiv = document.createElement('div');
        textDiv.className = 'label';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'label-title';
        titleDiv.textContent = fragmentsData[index].title;
        
        const descDiv = document.createElement('div');
        descDiv.className = 'label-description';
        descDiv.textContent = fragmentsData[index].description;
        
        textDiv.appendChild(titleDiv);
        textDiv.appendChild(descDiv);
        
        textDiv.style.cssText = `
            color: white;
            padding: 8px;
            text-align: center;
            width: 200px;
            transform: translateY(10px);
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        `;
        
        titleDiv.style.cssText = `
            font-weight: bold;
            margin-bottom: 5px;
        `;
        
        descDiv.style.cssText = `
            font-size: 0.9em;
            opacity: 0.8;
        `;
        
        const label = new CSS2DObject(textDiv);
        label.position.set(0, -3.5, 0);
        textDiv.style.opacity = 0;
        textDiv.style.transition = 'opacity 0s ease-in-out';
        fragment.add(label);
    });
}

function createFragmentLabel(fragment) {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'fragment-label';
    labelDiv.textContent = fragment.title;
    
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, 1.2, 0);
    
    return label;
}

function updateFragmentLabels() {
    fragments.forEach((fragment, index) => {
        if (fragment) {
            const label = createFragmentLabel(fragmentsContent[index]);
            fragment.add(label);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);