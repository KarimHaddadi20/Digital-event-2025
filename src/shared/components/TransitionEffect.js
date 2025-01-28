import * as THREE from 'three';

export class TransitionEffect {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.transitionMesh = null;
        this.isTransitioning = false;
        this.onTransitionComplete = null;
    }

    init() {
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                progress: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float progress;
                varying vec2 vUv;
                
                void main() {
                    float alpha = smoothstep(0.0, 1.0, progress);
                    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
                }
            `,
            transparent: true
        });

        this.transitionMesh = new THREE.Mesh(geometry, material);
        this.transitionMesh.renderOrder = 999;
        this.transitionMesh.frustumCulled = false;
        this.camera.add(this.transitionMesh);
        this.transitionMesh.position.z = -1;
    }

    startTransition(callback) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        this.onTransitionComplete = callback;
        
        const duration = 1000; // 1 seconde
        const startTime = Date.now();
        
        const animate = () => {
            if (!this.isTransitioning) return;
            
            const progress = (Date.now() - startTime) / duration;
            
            if (progress >= 1) {
                this.isTransitioning = false;
                if (this.onTransitionComplete) {
                    this.onTransitionComplete();
                }
                return;
            }
            
            this.transitionMesh.material.uniforms.progress.value = progress;
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    cleanup() {
        if (this.transitionMesh) {
            this.camera.remove(this.transitionMesh);
            this.transitionMesh.geometry.dispose();
            this.transitionMesh.material.dispose();
            this.transitionMesh = null;
        }
        this.isTransitioning = false;
        this.onTransitionComplete = null;
    }
} 