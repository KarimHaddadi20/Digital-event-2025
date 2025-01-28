export class EventManager {
    constructor() {
        this.events = {};
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isMobile = this.checkMobile();
    }

    init() {
        // Événements de base
        window.addEventListener('resize', () => this.emit('resize'));
        
        // Événements tactiles et souris
        if (this.isMobile) {
            window.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            window.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            window.addEventListener('touchend', () => this.emit('interaction_end'));
        } else {
            window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            window.addEventListener('mousedown', () => this.emit('interaction_start'));
            window.addEventListener('mouseup', () => this.emit('interaction_end'));
        }

        // Événements de visibilité
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.emit('scene_pause');
            } else {
                this.emit('scene_resume');
            }
        });
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    off(eventName, callback) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        }
    }

    emit(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback(data));
        }
    }

    handleMouseMove(event) {
        const normalizedCoords = this.getNormalizedPointerCoords(event.clientX, event.clientY);
        this.emit('pointer_move', normalizedCoords);
    }

    handleTouchStart(event) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
        this.emit('interaction_start');
    }

    handleTouchMove(event) {
        const touch = event.touches[0];
        const normalizedCoords = this.getNormalizedPointerCoords(touch.clientX, touch.clientY);
        this.emit('pointer_move', normalizedCoords);

        // Calculer le swipe
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        
        if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
            this.emit('swipe', { deltaX, deltaY });
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }
    }

    getNormalizedPointerCoords(x, y) {
        return {
            x: (x / window.innerWidth) * 2 - 1,
            y: -(y / window.innerHeight) * 2 + 1
        };
    }

    checkMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    cleanup() {
        // Nettoyer tous les événements
        window.removeEventListener('resize', () => this.emit('resize'));
        window.removeEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.removeEventListener('mousedown', () => this.emit('interaction_start'));
        window.removeEventListener('mouseup', () => this.emit('interaction_end'));
        window.removeEventListener('touchstart', (e) => this.handleTouchStart(e));
        window.removeEventListener('touchmove', (e) => this.handleTouchMove(e));
        window.removeEventListener('touchend', () => this.emit('interaction_end'));
        document.removeEventListener('visibilitychange', () => {});
        
        // Vider les événements enregistrés
        this.events = {};
    }
} 