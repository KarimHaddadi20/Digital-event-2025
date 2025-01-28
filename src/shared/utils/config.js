export const CONFIG = {
    // Configuration générale
    DEBUG: process.env.NODE_ENV === 'development',
    MOBILE_BREAKPOINT: 768,

    // Configuration de la caméra
    CAMERA: {
        FOV: 75,
        NEAR: 0.1,
        FAR: 1000,
        INITIAL_POSITION: { x: 0, y: 0, z: 5 }
    },

    // Configuration des scènes
    SCENES: {
        MIRROR: {
            MIRROR_SIZE: { width: 5, height: 8 },
            WATER_EFFECT: {
                AMPLITUDE: 0.05,
                FREQUENCY: 3.0,
                SPEED: 1.0
            }
        },
        FRAGMENTS: {
            COUNT: 3,
            SIZE: { width: 1, height: 1.5 },
            ROTATION_SPEED: 0.001
        },
        WORKSHOP: {
            MODEL_PATH: '/src/assets/models/workshop.glb',
            CAMERA_POSITIONS: {
                DEFAULT: { x: 0, y: 2, z: 5 },
                DETAIL: { x: 1, y: 1, z: 2 }
            }
        }
    },

    // Configuration des transitions
    TRANSITIONS: {
        DURATION: 1000,
        FADE_COLOR: '#000000'
    },

    // Configuration des contrôles
    CONTROLS: {
        ORBIT: {
            ENABLE_DAMPING: true,
            DAMPING_FACTOR: 0.05,
            MIN_DISTANCE: 2,
            MAX_DISTANCE: 10
        },
        TOUCH: {
            SWIPE_THRESHOLD: 50
        }
    },

    // Configuration du rendu
    RENDERER: {
        PIXEL_RATIO: window.devicePixelRatio,
        SHADOW_MAP_SIZE: 2048,
        ANTIALIAS: true
    }
}; 