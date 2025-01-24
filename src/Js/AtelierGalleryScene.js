// Imports nécessaires
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class AtelierGalleryScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.fragments = [];
        this.sideObjects = [];
        this.currentFragmentIndex = 0;
        this.time = 0;

        this.waveConfig = {
            frequency: 0.8,
            amplitude: 0.2,
            speed: 2
        };

        this.fragmentsData = Array.from({ length: 11 }, (_, i) => ({
            id: i + 1,
            description: `Fragment ${i + 1}`
        }));

        this.init();
    }

    init() {
        const container = document.getElementById('scene-container');

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        this.camera.position.z = 6;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(container.offsetWidth, container.offsetHeight);
        this.renderer.setClearColor(0x000000, 0);
        container.appendChild(this.renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        const directional = new THREE.DirectionalLight(0xffffff, 1);
        directional.position.set(5, 5, 5);
        this.scene.add(ambient, directional);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enabled = false;

        this.createFragments();
        this.createSideObjects();
        this.setupEventListeners();
        this.animate();

        gsap.to(this.camera.position, {
            duration: 2,
            z: 5,
            ease: "power2.inOut"
        });
    }

    createFragments() {
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('/src/models/test2.jpg', 
            (texture) => console.log('Texture chargée avec succès'),
            (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% chargé'),
            (error) => console.error('Erreur lors du chargement de la texture:', error)
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

            fragment.userData.id = this.fragmentsData[index].id;
            this.fragments.push(fragment);
            this.scene.add(fragment);
        });
    }

    createSideObjects() {
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
            this.positionSideObject(mesh, true);
            this.sideObjects.push(mesh);
            this.scene.add(mesh);
        }
    }

    positionSideObject(object, initial = false) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const z = initial ? Math.random() * -50 : this.camera.position.z - 50;
        
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

    setupEventListeners() {
        let timeoutId = null;
        window.addEventListener('wheel', (event) => {
            if (timeoutId) return;
            timeoutId = setTimeout(() => {
                this.onScroll(event);
                timeoutId = null;
            }, 16);
        }, { passive: false });
        
        window.addEventListener('resize', () => this.onResize());
    }

    onScroll(event) {
        event.preventDefault();
        
        const scrollSpeed = 0.02;
        const minZ = 6;
        const maxZ = -((this.fragments.length - 1) * 5) + minZ;
        const currentZ = this.camera.position.z;
        
        let delta = event.deltaY * scrollSpeed;
        
        if (currentZ - delta > minZ) delta = currentZ - minZ;
        if (currentZ - delta < maxZ) delta = currentZ - maxZ;
        
        if (currentZ - delta >= maxZ && currentZ - delta <= minZ) {
            gsap.to(this.camera.position, {
                z: currentZ - delta,
                duration: 1.2,
                ease: "power3.out",
                onUpdate: () => {
                    const speed = Math.abs(delta);
                    this.sideObjects.forEach(object => {
                        object.material.opacity = THREE.MathUtils.clamp(speed * 20, 0.2, 0.6);
                    });
                }
            });
        }
    }

    onResize() {
        const container = document.getElementById('scene-container');
        this.camera.aspect = container.offsetWidth / container.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.offsetWidth, container.offsetHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.05 * this.waveConfig.speed;
        
        this.updateFragments();
        this.updateSideObjects();
        
        this.renderer.render(this.scene, this.camera);
    }

    updateFragments() {
        this.fragments.forEach(fragment => {
            const distance = fragment.position.z - this.camera.position.z;
            
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
                
                const z = this.waveConfig.amplitude *
                    Math.sin(x * this.waveConfig.frequency + this.time) *
                    Math.cos(y * this.waveConfig.frequency + this.time);
                
                positions.setZ(i, z);
            }
            positions.needsUpdate = true;
        });
    }

    updateSideObjects() {
        this.sideObjects.forEach(object => {
            object.position.z += 0.1;
            object.rotation.x += 0.01;
            object.rotation.y += 0.01;
            
            if (object.position.z > this.camera.position.z + 10) {
                this.positionSideObject(object);
            }
        });
    }
}