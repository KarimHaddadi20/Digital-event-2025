import * as THREE from 'three';

class Loader {
    constructor() {
        this.CUBE_COUNT = 7;
        this.cubes = [];
        this.init();
    }

    init() {
        // Créer les éléments DOM nécessaires s'ils n'existent pas
        this.createDOMElements();
        this.animateLoading();
    }

    createDOMElements() {
        // Créer le conteneur de chargement s'il n'existe pas
        let loadingContainer = document.getElementById('loading-container');
        if (!loadingContainer) {
            loadingContainer = document.createElement('div');
            loadingContainer.id = 'loading-container';
            document.body.appendChild(loadingContainer);
        }

        // Créer le titre de chargement
        let loadingTitle = loadingContainer.querySelector('.loading-title');
        if (!loadingTitle) {
            loadingTitle = document.createElement('div');
            loadingTitle.className = 'loading-title';
            loadingTitle.innerHTML = `
                <span class="font-aktiv">Digital Event</span>
                <span class="font-fraunces">Edition 2025</span>
            `;
            loadingContainer.appendChild(loadingTitle);
        }

        // Créer les éléments de pourcentage
        let percentage = document.getElementById('percentage');
        if (!percentage) {
            percentage = document.createElement('div');
            percentage.id = 'percentage';
            percentage.textContent = '0%';
            loadingContainer.appendChild(percentage);
        }

        let mirrorPercentage = document.getElementById('mirror-percentage');
        if (!mirrorPercentage) {
            mirrorPercentage = document.createElement('div');
            mirrorPercentage.id = 'mirror-percentage';
            mirrorPercentage.textContent = '0%';
            loadingContainer.appendChild(mirrorPercentage);
        }

        // Créer le contenu principal s'il n'existe pas
        let mainContent = document.getElementById('main-content');
        if (!mainContent) {
            mainContent = document.createElement('div');
            mainContent.id = 'main-content';
            mainContent.style.display = 'none';
            document.body.appendChild(mainContent);
        }

        // Créer la navbar si elle n'existe pas
        let navbar = document.querySelector('.navbar');
        if (!navbar) {
            navbar = document.createElement('nav');
            navbar.className = 'navbar';
            navbar.style.display = 'none';
            document.body.appendChild(navbar);
        }

        // Créer le footer s'il n'existe pas
        let footer = document.querySelector('.footer');
        if (!footer) {
            footer = document.createElement('footer');
            footer.className = 'footer';
            footer.style.display = 'none';
            document.body.appendChild(footer);
        }
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
                duration: 1,
                onUpdate: () => {
                    const currentPercent = Math.round(progress.value * 100);
                    if (percentageElement) {
                        percentageElement.textContent = `${currentPercent}%`;
                    }
                    if (mirrorPercentageElement) {
                        mirrorPercentageElement.textContent = `${currentPercent}%`;
                    }

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
                    try {
                        // Précharger la scène du miroir
                        const { MirrorBreakEffect } = await import('./MirrorBreakEffect.js');
                        const mirrorEffect = new MirrorBreakEffect();
                        
                        // Timeout de sécurité de 3 secondes
                        const timeout = setTimeout(() => {
                            const loadingContainer = document.getElementById('loading-container');
                            const mainContent = document.getElementById('main-content');
                            const navbar = document.querySelector('.navbar');
                            const footer = document.querySelector('.footer');

                            if (loadingContainer) loadingContainer.remove();
                            if (mainContent) mainContent.style.display = 'block';
                            if (navbar) navbar.style.display = 'block';
                            if (footer) footer.style.display = 'block';

                            window.mirrorEffect = mirrorEffect;
                            resolve();
                        }, 1000);
                        
                        // Une fois que la scène est prête
                        mirrorEffect.onReady = () => {
                            clearTimeout(timeout);
                            
                            const loadingContainer = document.getElementById('loading-container');
                            const mainContent = document.getElementById('main-content');
                            const navbar = document.querySelector('.navbar');
                            const footer = document.querySelector('.footer');

                            if (loadingContainer) loadingContainer.remove();
                            if (mainContent) mainContent.style.display = 'block';
                            if (navbar) navbar.style.display = 'block';
                            if (footer) footer.style.display = 'block';

                            window.mirrorEffect = mirrorEffect;
                            resolve();
                        };
                    } catch (error) {
                        console.error('Erreur lors du chargement de la scène:', error);
                        resolve();
                    }
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
window.addEventListener('DOMContentLoaded', () => {
    new Loader();
});

export { Loader };