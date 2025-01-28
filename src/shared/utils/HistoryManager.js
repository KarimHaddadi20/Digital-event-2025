export class HistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        
        // Gérer le bouton retour du navigateur
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.index !== undefined) {
                this.goTo(event.state.index);
            }
        });
    }

    push(state) {
        // Supprimer les états futurs si on navigue depuis un état précédent
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        this.history.push(state);
        this.currentIndex++;

        // Mettre à jour l'historique du navigateur
        window.history.pushState(
            { index: this.currentIndex, ...state },
            '',
            state.path
        );
    }

    back() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            const previousState = this.history[this.currentIndex];
            
            // Mettre à jour l'historique du navigateur
            window.history.pushState(
                { index: this.currentIndex, ...previousState },
                '',
                previousState.path
            );
            
            return previousState;
        }
        return null;
    }

    forward() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            const nextState = this.history[this.currentIndex];
            
            // Mettre à jour l'historique du navigateur
            window.history.pushState(
                { index: this.currentIndex, ...nextState },
                '',
                nextState.path
            );
            
            return nextState;
        }
        return null;
    }

    goTo(index) {
        if (index >= 0 && index < this.history.length) {
            this.currentIndex = index;
            return this.history[index];
        }
        return null;
    }

    getCurrentState() {
        return this.currentIndex >= 0 ? this.history[this.currentIndex] : null;
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
    }
} 