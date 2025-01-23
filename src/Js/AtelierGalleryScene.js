// Imports nécessaires
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let fragments = [];
let sideObjects = [];
let currentFragmentIndex = 0;
let time = 0;

const waveConfig = {
    frequency: 0.8,
    amplitude: 0.2,
    speed: 2
};

const fragmentsData = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    description: `Fragment ${i + 1}`
}));

function init() {
    const container = document.getElementById('scene-container');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.z = 6;

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

    createFragments();
    createSideObjects();
    setupEventListeners();
    animate();

    // Exemple d'utilisation de GSAP
    gsap.to(camera.position, {
        duration: 2,
        z: 5,
        ease: "power2.inOut"
    });
}

function createFragments() {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('/src/models/test2.jpg', 
        function(texture) {
            console.log('Texture chargée avec succès');
        },
        function(xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% chargé');
        },
        function(error) {
            console.error('Erreur lors du chargement de la texture:', error);
        }
    );

    Array.from({ length: 11 }).forEach((_, index) => {
        const geometry = new THREE.PlaneGeometry(6, 6, 50, 50);
        const material = new THREE.MeshPhysicalMaterial({
            map: texture,
            metalness: 0.5,
            roughness: 0.3,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1
        });

        const fragment = new THREE.Mesh(geometry, material);
        const isEven = index % 2 === 0;
        
        fragment.position.set(
            isEven ? -4 : 4,
            (Math.random() - 0.5) * 2,
            index * -5
        );

        fragment.userData.id = fragmentsData[index].id;
        fragments.push(fragment);
        scene.add(fragment);
    });
}

function createSideObjects() {
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.6
    });

    for (let i = 0; i < 100; i++) {
        const mesh = new THREE.Mesh(geometry, material.clone());
        positionSideObject(mesh, true);
        sideObjects.push(mesh);
        scene.add(mesh);
    }
}

function positionSideObject(object, initial = false) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const z = initial ? Math.random() * -50 : camera.position.z - 50;
    
    object.position.set(
        side * (8 + Math.random() * 4),
        Math.random() * 10 - 5,
        z
    );
    
    const scale = 0.5 + Math.random() * 0.5;
    object.scale.set(scale, scale, scale);
    
    object.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
}

function setupEventListeners() {
    let timeoutId = null;
    window.addEventListener('wheel', (event) => {
        if (timeoutId) return;
        timeoutId = setTimeout(() => {
            onScroll(event);
            timeoutId = null;
        }, 16);
    }, { passive: false });
    
    window.addEventListener('resize', onResize);
}

function onScroll(event) {
    event.preventDefault();
    
    const scrollSpeed = 0.02;
    const minZ = 6;
    const maxZ = -((fragments.length - 1) * 5) + minZ;
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
                sideObjects.forEach(object => {
                    object.material.opacity = THREE.MathUtils.clamp(speed * 20, 0.2, 0.6);
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
}

function animate() {
    requestAnimationFrame(animate);
    
    time += 0.05 * waveConfig.speed;
    
    updateFragments();
    updateSideObjects();
    
    renderer.render(scene, camera);
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
    });
}

function updateSideObjects() {
    sideObjects.forEach(object => {
        object.position.z += 0.1;
        object.rotation.x += 0.01;
        object.rotation.y += 0.01;
        
        if (object.position.z > camera.position.z + 10) {
            positionSideObject(object);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);