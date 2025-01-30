// Dans app.js ou un nouveau fichier menu.js
document.addEventListener("DOMContentLoaded", () => {

  const burgerButton = document.getElementById("burger-menu");
  const sideMenu = document.getElementById("side-menu");
  const menuLinks = document.querySelectorAll(".menu-list a");
  const closeButton = document.getElementById("close-menu");
  const menuContent = document.querySelector(".menu-content");

  // Fonction pour gérer le scroll du menu
  const handleMenuScroll = () => {
    if (window.innerHeight < 700) { // Pour les écrans de moins de 700px de hauteur
      menuContent.style.height = '100%';
      menuContent.style.overflowY = 'auto';
      menuContent.style.overflowX = 'hidden';
      
      // Ajouter le style de la scrollbar
      menuContent.style.cssText += `
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
      `;
      
      // Styles spécifiques pour WebKit (Chrome, Safari)
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        .menu-content::-webkit-scrollbar {
          width: 4px;
        }
        .menu-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .menu-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        .menu-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `;
      document.head.appendChild(styleSheet);
    } else {
      menuContent.style.height = '100%';
      menuContent.style.overflowY = 'visible';
    }
  };

  const initializeMenu = () => {
    // Menu toggle functionality
    burgerButton.addEventListener("click", () => {
      const isOpening = !sideMenu.classList.contains("open");
      sideMenu.classList.toggle("open");

      // Ajouter/retirer la classe sur le body pour gérer la visibilité des éléments
      if (isOpening) {
        document.body.classList.add("menu-open");
        handleMenuScroll(); // Appliquer le scroll si nécessaire
      } else {
        document.body.classList.remove("menu-open");
      }
    });

    closeButton.addEventListener("click", () => {
      sideMenu.classList.remove("open");
      document.body.classList.remove("menu-open");
    });

    // Gérer le redimensionnement de la fenêtre
    window.addEventListener('resize', handleMenuScroll);

    // Navigation functionality with scene states
    menuLinks.forEach((link) => {
      link.addEventListener("click", async (e) => {
        e.preventDefault();
        const sceneIndex = parseInt(link.dataset.atelier) - 1;

        // Réinitialiser la barre de progression
        const progressFill = document.querySelector('.scroll-progress-fill');
        if (progressFill) {
            progressFill.style.setProperty('--progress', 0);
        }

        if (window.mirrorEffect) {
          try {
            // Nettoyer tous les éléments de la scène actuelle
            const elements = document.querySelectorAll(
              ".mobile-section-label, .team-label, .quote-container, .subtitle-popup, .popup-content, .mobile-popup, .portal-text, .fragment-label"
            );
            elements.forEach((element) => element.remove());

            // Masquer le bouton Voyager
            const voyagerButton = document.querySelector('button');
            if (voyagerButton && voyagerButton.textContent === 'Voyager') {
              voyagerButton.style.display = 'none';
              voyagerButton.style.opacity = '0';
            }

            // Masquer les instructions du miroir et des fragments
            const mirrorInstructions = document.querySelector('.mirror-instructions');
            const fragmentInstructions = document.querySelector('.fragment-instructions');

            if (mirrorInstructions) {
              mirrorInstructions.style.display = 'none';
              const titleElement = mirrorInstructions.querySelector('.instruction-title');
              const subtitleElement = mirrorInstructions.querySelector('.instruction-subtitle');
              if (titleElement) titleElement.innerHTML = '';
              if (subtitleElement) subtitleElement.textContent = '';
            }

            if (fragmentInstructions) {
              fragmentInstructions.style.display = 'none';
              const titleElement = fragmentInstructions.querySelector('.instruction-title');
              const subtitleElement = fragmentInstructions.querySelector('.instruction-subtitle');
              if (titleElement) titleElement.innerHTML = '';
              if (subtitleElement) subtitleElement.textContent = '';
            }

            // Fermer le menu
            sideMenu.classList.remove("open");
            document.body.classList.remove("menu-open");

            // Transition vers la nouvelle scène
            window.mirrorEffect.transitionToScene(sceneIndex);
          } catch (error) {
            console.error("Scene transition error:", error);
          }
        }
      });
    });
  };

  initializeMenu();
});

// Dans le fichier src/Js/menu.js ou directement dans l'index.html
document.addEventListener("DOMContentLoaded", () => {
  // Sélectionner le bouton retour
  const backButton = document.getElementById("back-button");

  // Ajouter l'écouteur d'événement pour rafraîchir la page
  if (backButton) {
    backButton.addEventListener("click", () => {
      window.location.reload(); // Rafraîchit la page
    });
  }
});

// Dans menu.js
document.addEventListener("DOMContentLoaded", () => {
  const backButton = document.getElementById("back-button");

  // Fonction pour gérer la visibilité du bouton back
  const updateBackButtonVisibility = () => {
    // Vérifier si nous sommes dans une scène de transition
    const isTransitionScene = window.location.hash.includes("transition");
    backButton.style.display = isTransitionScene ? "block" : "none";
  };

  // Écouter les changements de hash pour mettre à jour la visibilité
  window.addEventListener("hashchange", updateBackButtonVisibility);

  // Initialiser l'état
  updateBackButtonVisibility();
});
