import { TransitionEffect } from '../shared/components/TransitionEffect';

export class Router {
    constructor() {
        this.routes = {
            '/': () => this.loadScene('scene1-mirror'),
            '/fragments': () => this.loadScene('scene2-fragments'),
            '/workshop': () => this.loadScene('scene3-workshop')
        };

        this.currentScene = null;
        this.transitionEffect = null;

        window.addEventListener('popstate', () => this.handleRoute());
        this.handleRoute();
    }

    async loadScene(sceneName) {
        // Si une scène est déjà chargée, on effectue une transition
        if (this.currentScene) {
            if (this.transitionEffect) {
                await new Promise(resolve => {
                    this.transitionEffect.startTransition(() => {
                        this.cleanupCurrentScene();
                        resolve();
                    });
                });
            } else {
                this.cleanupCurrentScene();
            }
        }

        try {
            // Charger et initialiser la nouvelle scène
            const module = await import(`../scenes/${sceneName}/index.js`);
            this.currentScene = new module.default();
            await this.currentScene.init();

            // Initialiser l'effet de transition si ce n'est pas déjà fait
            if (!this.transitionEffect && this.currentScene.sceneManager) {
                this.transitionEffect = new TransitionEffect(
                    this.currentScene.sceneManager.scene,
                    this.currentScene.sceneManager.camera
                );
                this.transitionEffect.init();
            }

        } catch (error) {
            console.error(`Erreur lors du chargement de la scène ${sceneName}:`, error);
            // Rediriger vers la page d'accueil en cas d'erreur
            if (window.location.pathname !== '/') {
                this.navigateTo('/');
            }
        }
    }

    cleanupCurrentScene() {
        if (this.currentScene) {
            this.currentScene.cleanup();
            this.currentScene = null;
        }
    }

    handleRoute() {
        const path = window.location.pathname;
        const route = this.routes[path] || this.routes['/'];
        route();
    }

    navigateTo(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }
} 