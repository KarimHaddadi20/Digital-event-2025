// Dans app.js ou un nouveau fichier menu.js
document.addEventListener("DOMContentLoaded", () => {
  // console.log("DOM Content Loaded");

  const burgerButton = document.getElementById("burger-menu");
  const sideMenu = document.getElementById("side-menu");
  const menuLinks = document.querySelectorAll(".menu-list a");
  const closeButton = document.getElementById("close-menu");

  // // Debug DOM elements
  // console.log({
  //   burgerButton: !!burgerButton,
  //   sideMenu: !!sideMenu,
  //   menuLinksCount: menuLinks.length,
  //   closeButton: !!closeButton,
  // });

  // // Debug menu links data
  // menuLinks.forEach((link, index) => {
  //   console.log(`Link ${index}:`, {
  //     text: link.textContent,
  //     dataset: link.dataset,
  //     href: link.href,
  //   });
  // });

  // console.log("Menu links found:", menuLinks.length);

  const initializeMenu = () => {
    // Menu toggle functionality
    burgerButton.addEventListener("click", () => {
      const isOpening = !sideMenu.classList.contains("open");
      sideMenu.classList.toggle("open");

      // Ajouter/retirer la classe sur le body pour gérer la visibilité des éléments
      if (isOpening) {
        document.body.classList.add("menu-open");
      } else {
        document.body.classList.remove("menu-open");
      }
    });

    closeButton.addEventListener("click", () => {
      sideMenu.classList.remove("open");
      document.body.classList.remove("menu-open");
    });

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
