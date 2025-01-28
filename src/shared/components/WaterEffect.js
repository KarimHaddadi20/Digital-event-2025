import * as THREE from 'three';

export class WaterEffect {
    constructor(scene, targetMesh) {
        this.scene = scene;
        this.targetMesh = targetMesh;
        this.uniforms = {
            time: { value: 0 },
            amplitude: { value: 0.05 },
            frequency: { value: 3.0 },
            speed: { value: 1.0 }
        };
    }

    init() {
        // Créer le shader de l'eau
        const vertexShader = `
            uniform float time;
            uniform float amplitude;
            uniform float frequency;
            uniform float speed;
            
            varying vec2 vUv;
            varying float noise;
            
            void main() {
                vUv = uv;
                
                // Effet de vague simple
                float wave = amplitude * sin(frequency * position.x + time * speed);
                vec3 newPosition = position;
                newPosition.z += wave;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float time;
            varying vec2 vUv;
            
            void main() {
                vec3 waterColor = vec3(0.0, 0.3, 0.5);
                float brightness = 0.8 + 0.2 * sin(vUv.y * 10.0 + time);
                gl_FragColor = vec4(waterColor * brightness, 0.6);
            }
        `;

        // Appliquer le shader au mesh cible
        this.targetMesh.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true
        });
    }

    update() {
        this.uniforms.time.value += 0.016; // Approximativement 60 FPS
    }

    cleanup() {
        if (this.targetMesh.material) {
            this.targetMesh.material.dispose();
        }
    }
} 