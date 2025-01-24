import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { AtelierGalleryScene } from './AtelierGalleryScene.js';

class FragmentManager {
    constructor(app) {
        this.app = app;
        this.fragments = [];
        this.hoveredFragment = null;
        this.isAnimatingFragment = false;
        this.atelierNames = [
            "Atelier 1", "Atelier 2", "Atelier 3",
            "Atelier 4", "Atelier 5", "Atelier 6",
            "Atelier 7", "Atelier 8", "Atelier 9",
            "Atelier 10", "Atelier 11"
        ];
        
        this.setupUI();
        this.initRaycaster();
    }

    setupUI() {
        this.textElement = document.createElement("div");
        this.textElement.style.position = "fixed";
        this.textElement.style.right = "50px";
        this.textElement.style.top = "50%";
        this.textElement.style.transform = "translateY(-50%)";
        this.textElement.style.color = "white";
        this.textElement.style.padding = "20px";
        this.textElement.style.background = "rgba(0, 0, 0, 0.7)";
        this.textElement.style.borderRadius = "10px";
        this.textElement.style.display = "none";
        this.textElement.style.fontSize = "24px";
        this.textElement.style.fontFamily = "Arial, sans-serif";
        this.textElement.style.transition = "opacity 0.3s ease";
        document.body.appendChild(this.textElement);
    }

    initRaycaster() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    loadMirrorModel() {
        const loader = new GLTFLoader();
        loader.load(
            "src/models/mirrorsolo.glb",
            (gltf) => {
                this.app.mirror = gltf.scene;

                const box = new THREE.Box3().setFromObject(this.app.mirror);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());

                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 230 / maxDim;
                this.app.mirror.scale.multiplyScalar(scale);

                this.app.mirror.position.set(
                    -center.x * scale,
                    -center.y * scale + 35,
                    -240
                );

                this.app.mirror.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshPhysicalMaterial({
                            metalness: 1,
                            roughness: 0,
                            transmission: 0.1,
                            thickness: 10,
                            envMap: this.app.scene.environment,
                            envMapIntensity: 1.5,
                            clearcoat: 10,
                            clearcoatRoughness: 0.06,
                            transparent: false,
                            opacity: 0.7,
                            side: THREE.DoubleSide,
                            depthWrite: false,
                        });
                    }
                });

                this.app.scene.add(this.app.mirror);
                this.createFragments();

                document.querySelector(".loading-screen").style.display = "none";
            },
            undefined,
            (error) => {
                console.error("Erreur de chargement du modèle:", error);
            }
        );
    }

    createFragments() {
        const loader = new GLTFLoader();
        
        const atelierConfig = [
            { index: 1, row: 0, position: 0 },
            { index: 2, row: 0, position: 1 },
            { index: 3, row: 0, position: 2 },
            { index: 4, row: 1, position: 0 },
            { index: 5, row: 1, position: 1 },
            { index: 6, row: 1, position: 2 },
            { index: 7, row: 2, position: 0 },
            { index: 8, row: 2, position: 1 },
            { index: 9, row: 2, position: 2 },
            { index: 10, row: 3, position: 0 },
            { index: 11, row: 3, position: 1 }
        ];

        atelierConfig.forEach(config => {
            const fileName = `src/models/fragments3/monde${config.index}.glb`;
            loader.load(
                fileName,
                (gltf) => {
                    const fragment = gltf.scene;
                    const rowCount = config.row === 3 ? 2 : 3;

                    fragment.scale.set(1, 1, 1);
                    fragment.rotation.set(0, 0, 0);
                    fragment.position.x = config.position - (rowCount - 1) / 2;
                    fragment.position.y = -config.row - 55;
                    fragment.position.z = -150;

                    fragment.visible = false;
                    fragment.userData.index = config.index - 1;
                    fragment.userData.isClickable = true;
                    fragment.userData.atelierName = this.atelierNames[config.index - 1];

                    this.fragments.push(fragment);
                    this.app.scene.add(fragment);
                },
                undefined,
                (error) => {
                    console.error(`Erreur lors du chargement du fichier ${fileName}:`, error);
                }
            );
        });
    }

    breakMirror() {
        if (this.app.isBreaking) return;
        this.app.isBreaking = true;

        this.app.mirror.visible = false;
        this.fragments.forEach((fragment) => {
            fragment.visible = true;
        });

        this.app.camera.position.z = 5;

        const audio = new Audio("brokenglass.mp3");
        audio.play();
    }

    moveFragmentForward(fragment) {
        if (fragment.userData.originalY === undefined) {
            fragment.userData.originalY = fragment.position.y;
            fragment.userData.originalZ = fragment.position.z;
        }

        const duration = 1500;
        const startZ = fragment.position.z;
        const targetZ = fragment.userData.originalZ + 10;
        const startTime = Date.now();

        const moveForward = () => {
            const currentTime = Date.now();
            const progress = Math.min((currentTime - startTime) / duration, 1);
            fragment.position.z = THREE.MathUtils.lerp(startZ, targetZ, progress);
            if (progress < 1) {
                requestAnimationFrame(moveForward);
            }
        };

        moveForward();

        const levitationDuration = 3000;
        const levitationStartTime = Date.now();
        const amplitude = 0.7;

        const animate = () => {
            if (this.hoveredFragment !== fragment) return;

            const currentTime = Date.now();
            const elapsed = currentTime - levitationStartTime;
            const progress = (elapsed % levitationDuration) / levitationDuration;

            fragment.position.y = fragment.userData.originalY + Math.sin(progress * Math.PI * 2) * amplitude;

            requestAnimationFrame(animate);
        };

        animate();
    }

    resetFragmentPosition(fragment) {
        const duration = 1500;
        const startY = fragment.position.y;
        const targetY = fragment.userData.originalY;
        const startZ = fragment.position.z;
        const targetZ = fragment.userData.originalZ;
        const startTime = Date.now();

        const animate = () => {
            const currentTime = Date.now();
            const progress = Math.min((currentTime - startTime) / duration, 1);

            fragment.position.y = THREE.MathUtils.lerp(startY, targetY, progress);
            fragment.position.z = THREE.MathUtils.lerp(startZ, targetZ, progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    animateFragmentFall(fragment) {
        if (this.isAnimatingFragment) return;
        this.isAnimatingFragment = true;

        this.app.controls.enabled = false;

        this.fragments.forEach((f) => {
            if (f !== fragment) {
                f.userData.isClickable = false;
                f.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material = child.material.clone();
                        child.material.transparent = true;
                        child.material.opacity = 0.5;
                    }
                });
            }
        });

        const fallDuration = 1500;
        const startPosition = fragment.position.clone();
        const fallTarget = new THREE.Vector3(
            startPosition.x,
            startPosition.y - 15,
            startPosition.z + 5
        );
        const startRotation = fragment.rotation.clone();
        const targetRotation = new THREE.Euler(
            startRotation.x + Math.PI * 2,
            startRotation.y + Math.PI,
            startRotation.z + Math.PI / 2
        );
        const startTime = Date.now();

        const animateFall = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / fallDuration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            fragment.position.lerpVectors(startPosition, fallTarget, easeProgress);

            if (progress < 1) {
                requestAnimationFrame(animateFall);
            } else {
                this.startImmersionAnimation(fragment);
            }
        };

        animateFall();
    }

    startImmersionAnimation(fragment) {
        const immersionDuration = 1500;
        const startTime = Date.now();
        const startFragmentPos = fragment.position.clone();
        const index = fragment.userData.index;

        const finalPositions = [
            { x: -30, y: -140, z: 5 },
            { x: 0, y: -145, z: 5 },
            { x: 35, y: -145, z: 10 },
            { x: -30, y: -90, z: 8 },
            { x: 0, y: -90, z: 8 },
            { x: 35, y: -100, z: 5 },
            { x: -30, y: -40, z: 7 },
            { x: 0, y: -40, z: 7 },
            { x: 35, y: -45, z: 6 },
            { x: -20, y: 0, z: 4 },
            { x: 35, y: 0, z: 4 }
        ];

        const finalPosition = this.app.camera.position.clone();
        finalPosition.x += finalPositions[index].x;
        finalPosition.y += finalPositions[index].y;
        finalPosition.z += finalPositions[index].z;

        const animateImmersion = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / immersionDuration, 1);

            const ease = 1 - Math.pow(1 - progress, 3);
            fragment.position.lerpVectors(startFragmentPos, finalPosition, ease);

            if (progress < 1) {
                requestAnimationFrame(animateImmersion);
            } else {
                this.app.controls.enabled = true;
                
                while(this.app.scene.children.length > 0) { 
                    this.app.scene.remove(this.app.scene.children[0]); 
                }
                
                this.app.isBreaking = false;
                this.isAnimatingFragment = false;
                
                const galleryScene = new AtelierGalleryScene();
                
                galleryScene.currentFragmentIndex = index;
            }
        };

        animateImmersion();
    }

    onMouseMove(event) {
        if (!this.app.isBreaking || this.isAnimatingFragment) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.app.camera);
        const intersects = this.raycaster.intersectObjects(this.fragments, true);

        if (intersects.length > 0) {
            let fragmentObject = intersects[0].object;
            
            while (fragmentObject.parent && !fragmentObject.userData.atelierName) {
                fragmentObject = fragmentObject.parent;
            }

            if (fragmentObject.userData && fragmentObject.userData.atelierName) {
                if (this.hoveredFragment !== fragmentObject) {
                    if (this.hoveredFragment) {
                        this.resetFragmentPosition(this.hoveredFragment);
                    }

                    this.hoveredFragment = fragmentObject;
                    this.moveFragmentForward(this.hoveredFragment);

                    this.textElement.textContent = fragmentObject.userData.atelierName;
                    this.textElement.style.display = "block";
                    this.textElement.style.opacity = "1";
                }
            }
        } else {
            if (this.hoveredFragment) {
                this.resetFragmentPosition(this.hoveredFragment);
                this.hoveredFragment = null;
                this.textElement.style.opacity = "0";
                setTimeout(() => {
                    this.textElement.style.display = "none";
                }, 300);
            }
        }
    }

    handleFragmentClick(event) {
        if (this.isAnimatingFragment) return;

        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(mouse, this.app.camera);
        const intersects = this.raycaster.intersectObjects(this.fragments, true);

        if (intersects.length > 0) {
            let clickedFragment = intersects[0].object;
            
            while (clickedFragment.parent && !clickedFragment.userData.atelierName) {
                clickedFragment = clickedFragment.parent;
            }

            if (clickedFragment.userData && 
                clickedFragment.userData.atelierName && 
                clickedFragment.userData.isClickable !== false) {
                this.animateFragmentFall(clickedFragment);
            }
        }
    }

    animateFragments() {
        const time = Date.now() * 0.001;

        this.fragments.forEach((fragment, index) => {
            const offset = index * (Math.PI / 6);
            const levitationAmplitude = 0.002;
            const levitationSpeed = 0.5;

            fragment.position.y += Math.sin(time * levitationSpeed + offset) * levitationAmplitude;
        });
    }
}

export { FragmentManager }; 