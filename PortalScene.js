import * as THREE from 'three';

export class PortalScene {
    constructor(fragment, originalCamera) {
        this.scene = new THREE.Scene();
        this.camera = originalCamera.clone();
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        
        this.fragment = fragment.clone();
        
        // Centrer le point de pivot du fragment dès sa création
        const box = new THREE.Box3().setFromObject(this.fragment);
        const center = box.getCenter(new THREE.Vector3());
        this.fragment.geometry.center();
        
        this.isComplete = false;
        this.init();
    }

    init() {
        // Configuration du renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('scene-container').appendChild(this.renderer.domElement);

        // Ajout du fragment cloné à la nouvelle scène
        this.scene.add(this.fragment);
        
        // Ajout des lumières
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(ambientLight);
        this.scene.add(directionalLight);

        // Démarrer l'animation
        this.startPortalAnimation();
    }

    startPortalAnimation() {
        const startPosition = this.fragment.position.clone();
        this.fallAnimation(startPosition);
    }

    fallAnimation(startPosition) {
        const fallTarget = new THREE.Vector3(
            startPosition.x,
            -20,
            startPosition.z
        );
        
        const duration = 1000;
        const startTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeProgress = progress * progress;
            
            this.fragment.position.lerpVectors(startPosition, fallTarget, easeProgress);
            this.fragment.rotation.x += 0.1;
            this.fragment.rotation.z += 0.1;
            
            this.renderer.render(this.scene, this.camera);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setTimeout(() => this.rushToCamera(), 500);
            }
        };
        
        animate();
    }

    rushToCamera() {
        const startPosition = this.fragment.position.clone();
        const cameraTarget = new THREE.Vector3(0, 0, 2);
        const duration = 1500;
        const startTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeProgress = Math.pow(progress, 3);
            
            this.fragment.position.lerpVectors(startPosition, cameraTarget, easeProgress);
            
            // Rotation progressive vers la caméra
            this.fragment.rotation.x = THREE.MathUtils.lerp(this.fragment.rotation.x, 0, easeProgress);
            this.fragment.rotation.y = THREE.MathUtils.lerp(this.fragment.rotation.y, 0, easeProgress);
            this.fragment.rotation.z = THREE.MathUtils.lerp(this.fragment.rotation.z, 0, easeProgress);
            
            // Mise à l'échelle progressive
            const scale = 1 + easeProgress * 2;
            this.fragment.scale.set(scale, scale, scale);
            
            this.renderer.render(this.scene, this.camera);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setTimeout(() => this.enterPortal(), 500);
            }
        };
        
        animate();
    }

    enterPortal() {
        // Positionner le fragment
        this.fragment.position.set(0, 0, 2);
        this.fragment.rotation.set(0, 0, 0);
        
        // Centrer la caméra sur l'axe X et Y
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        
        const startZ = this.camera.position.z;
        const duration = 2000;
        const startTime = Date.now();
        
        const startScale = this.fragment.scale.x;
        const targetScale = 50;
        
        // Effet de fondu au blanc
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'white';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 2s';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '1000';
        document.body.appendChild(overlay);

        const animate = () => {
            const currentTime = Date.now();
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeProgress = Math.pow(progress, 2);
            
            // Avancer la caméra uniquement sur l'axe Z
            this.camera.position.z = startZ - easeProgress * 5;
            
            // Augmenter la taille du fragment
            const currentScale = THREE.MathUtils.lerp(startScale, targetScale, easeProgress);
            this.fragment.scale.set(currentScale, currentScale, currentScale);
            
            // Effet de fondu au blanc
            overlay.style.opacity = easeProgress.toString();
            
            this.renderer.render(this.scene, this.camera);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isComplete = true;
                setTimeout(() => {
                    this.dispose();
                    overlay.remove();
                }, 500);
            }
        };
        
        animate();
    }

    dispose() {
        // Nettoyer la scène
        this.renderer.dispose();
        this.renderer.domElement.remove();
    }
} 