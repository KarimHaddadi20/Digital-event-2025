import * as THREE from 'three';

class Loader {
    constructor() {
        this.init();
    }

    init() {
        const loadingContainer = document.getElementById('loading-container');
        
        // Créer le titre
        const title = document.createElement('div');
        title.className = 'loading-title';
        title.innerHTML = `
            <span class="font-aktiv">Digital Event</span>
            <span class="font-fraunces">Edition 2025</span>
        `;
        loadingContainer.insertBefore(title, loadingContainer.firstChild);
        
        // Créer le conteneur des points
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'dots-container';
        dotsContainer.style.cssText = `
            display: flex;
            gap: 32px;
            margin: 10px 0;
            justify-content: center;
            align-items: center;
        `;
        
        // Déterminer le nombre de points en fonction de la taille de l'écran
        const numberOfDots = window.innerWidth <= 768 ? 8 : 12;
        
        // Créer les points
        for (let i = 0; i < numberOfDots; i++) {
            const dot = document.createElement('div');
            dot.className = 'loading-dot';
            dot.style.cssText = `
                width: 5px;
                height: 5px;
                background-color: white;
                transform: rotate(45deg);
                opacity: 0.3;
                transition: opacity 0.5s ease;
            `;
            dotsContainer.appendChild(dot);
        }
        
        // Insérer le conteneur entre le pourcentage et son reflet
        const percentage = document.getElementById('percentage');
        const mirrorPercentage = document.getElementById('mirror-percentage');
        percentage.after(dotsContainer);
        
        this.dots = dotsContainer.children;
        this.animateLoading();
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
                    percentageElement.textContent = `${currentPercent}%`;
                    mirrorPercentageElement.textContent = `${currentPercent}%`;

                    // Animation des points
                    const centerIndex = Math.floor(this.dots.length / 2);
                    Array.from(this.dots).forEach((dot, index) => {
                        const distanceFromCenter = Math.abs(index - centerIndex);
                        const maxDistance = centerIndex;
                        const opacity = Math.max(0.3, 1 - (distanceFromCenter / maxDistance));
                        dot.style.opacity = opacity;
                    });
                },
                onComplete: async () => {
                    try {
                        // Précharger la scène du miroir
                        const { MirrorBreakEffect } = await import('./MirrorBreakEffect.js');
                        const mirrorEffect = new MirrorBreakEffect();
                        
                        // Timeout de sécurité de 3 secondes
                        const timeout = setTimeout(() => {
                            document.getElementById('loading-container').remove();
                            document.getElementById('main-content').style.display = 'block';
                            document.querySelector('.navbar').style.display = 'block';
                            document.querySelector('.footer').style.display = 'block';
                            window.mirrorEffect = mirrorEffect;
                            resolve();
                        }, 1000);
                        
                        // Une fois que la scène est prête
                        mirrorEffect.onReady = () => {
                            clearTimeout(timeout);
                            document.getElementById('loading-container').remove();
                            const mainContent = document.getElementById('main-content');
                            if (mainContent) {
                                mainContent.style.display = 'block';
                            }
                            document.querySelector('.navbar').style.display = 'block';
                            document.querySelector('.footer').style.display = 'block';
                            window.mirrorEffect = mirrorEffect;
                            resolve();
                        };
                    } catch (error) {
                        console.error('Erreur lors du chargement:', error);
                    }
                },
                ease: "power1.inOut"
            });
        });
    }
}

// Créer une instance du loader quand le DOM est chargé
window.addEventListener('DOMContentLoaded', () => {
    new Loader();
});

export { Loader };