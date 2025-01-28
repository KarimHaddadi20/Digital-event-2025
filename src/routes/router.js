import { TransitionEffect } from '../shared/components/TransitionEffect';
import { HistoryManager } from '../shared/utils/HistoryManager';

export class Router {
    constructor() {
        this.routes = {
            '/': () => this.loadScene('scene1-mirror'),
            '/fragments': () => this.loadScene('scene2-fragments'),
            '/workshop': () => this.loadScene('scene3-workshop')
        };

        this.currentScene = null;
        this.transitionEffect = null;
        this.historyManager = new HistoryManager();

        // Initialiser le bouton retour
        this.backButton = document.querySelector('#back-button');
        if (this.backButton) {
            this.backButton.addEventListener('click', () => this.handleBackButton());
            // Cacher le bouton sur la page d'accueil
            this.updateBackButtonVisibility();
        }

        window.addEventListener('popstate', () => this.handleRoute());
        this.handleRoute();
    }

    async loadScene(sceneName, isBack = false) {
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

            // Mettre à jour l'historique seulement si ce n'est pas une navigation retour
            if (!isBack) {
                const path = this.getPathForScene(sceneName);
                this.historyManager.push({
                    path,
                    sceneName
                });
            }

            // Mettre à jour la visibilité du bouton retour
            this.updateBackButtonVisibility();

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

    handleBackButton() {
        const previousState = this.historyManager.back();
        if (previousState) {
            this.loadScene(previousState.sceneName, true);
        } else {
            // Si pas d'état précédent, retourner à l'accueil
            this.navigateTo('/');
        }
    }

    updateBackButtonVisibility() {
        if (this.backButton) {
            const currentState = this.historyManager.getCurrentState();
            this.backButton.style.display = currentState && currentState.path !== '/' ? 'block' : 'none';
        }
    }

    getPathForScene(sceneName) {
        switch (sceneName) {
            case 'scene1-mirror':
                return '/';
            case 'scene2-fragments':
                return '/fragments';
            case 'scene3-workshop':
                return '/workshop';
            default:
                return '/';
        }
    }
} 