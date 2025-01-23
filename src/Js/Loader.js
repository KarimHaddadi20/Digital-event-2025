import * as THREE from 'three';

class Loader {
    constructor() {
        this.cubes = [];
        this.CUBE_COUNT = 20; // Réduit pour une ligne plus claire
        this.init();
    }

    init() {
        // Initialisation Three.js
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('loading-container').appendChild(this.renderer.domElement);
        
        this.createCubes();
        this.setupCamera();
        this.animate();
        this.animateLoading();
    }

    createCubes() {
        // Créer une texture de cercle blanc
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Dessiner un cercle blanc
        ctx.beginPath();
        ctx.arc(16, 16, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        const texture = new THREE.CanvasTexture(canvas);

        // Espacement des points
        const lineWidth = 8;
        const spacing = lineWidth / this.CUBE_COUNT;

        for (let i = 0; i < this.CUBE_COUNT; i++) {
            // Les points sont plus clairs aux extrémités au début
            const distanceFromCenter = Math.abs(i - (this.CUBE_COUNT - 1) / 2);
            const maxDistance = (this.CUBE_COUNT - 1) / 2;
            const intensity = 0.3 + (distanceFromCenter / maxDistance) * 0.7; // Plus clair aux extrémités

            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: intensity
            });

            const point = new THREE.Sprite(material);
            point.scale.set(0.2, 0.2, 1);
            point.position.set(
                (i - this.CUBE_COUNT / 2) * spacing,
                0,
                0
            );
            
            point.userData.baseIntensity = intensity;
            
            this.cubes.push(point);
            this.scene.add(point);
        }

        // Ajuster la caméra
        this.camera.position.set(0, 0, 8);
        this.camera.lookAt(0, 0, 0);
    }

    async animateLoading() {
        const percentageElement = document.getElementById('percentage');
        const mirrorPercentageElement = document.getElementById('mirror-percentage');
        
        return new Promise((resolve) => {
            let progress = { value: 0 };

            gsap.to(progress, {
                value: 1,
                duration: 3,
                onUpdate: () => {
                    const currentPercent = Math.round(progress.value * 100);
                    percentageElement.textContent = `${currentPercent}%`;
                    mirrorPercentageElement.textContent = `${currentPercent}%`;

                    this.cubes.forEach((point, index) => {
                        const centerIndex = (this.CUBE_COUNT - 1) / 2;
                        const distanceFromCenter = Math.abs(index - centerIndex);
                        const maxDistance = centerIndex;
                        
                        const fadeThreshold = (distanceFromCenter / maxDistance);
                        const fadeStart = progress.value - fadeThreshold;
                        const fadeProgress = Math.max(0, fadeStart);
                        
                        const baseOpacity = point.userData.baseIntensity;
                        const targetOpacity = 0.2;
                        
                        point.material.opacity = Math.max(
                            targetOpacity,
                            baseOpacity - (fadeProgress * (baseOpacity - targetOpacity))
                        );
                    });
                },
                onComplete: async () => {
                    // Supprimer le loader
                    document.getElementById('loading-container').remove();
                    
                    // Afficher le contenu principal
                    const mainContent = document.getElementById('main-content');
                    if (mainContent) {
                        mainContent.style.display = 'block';
                        mainContent.style.opacity = '1';
                    }

                    try {
                        // Charger et initialiser MirrorBreakEffect
                        const { default: MirrorBreakEffect } = await import('./app.js');
                        window.mirrorEffect = new MirrorBreakEffect();
                    } catch (error) {
                        console.error('Erreur lors du chargement:', error);
                    }
                    resolve();
                },
                ease: "power1.inOut"
            });
        });
    }

    setupCamera() {
        this.camera.position.z = 15;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        this.cubes.forEach((point, i) => {
            // Animation très subtile
            point.position.y = Math.sin(Date.now() * 0.001 + i * 0.5) * 0.05;
        });

        this.renderer.render(this.scene, this.camera);
    }
}

// Créer une instance du loader quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new Loader();
});

export default Loader;