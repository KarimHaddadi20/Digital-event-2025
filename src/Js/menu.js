// Dans app.js ou un nouveau fichier menu.js
document.addEventListener("DOMContentLoaded", () => {
  const burgerButton = document.getElementById("burger-menu");
  const sideMenu = document.getElementById("side-menu");
  const menuLinks = document.querySelectorAll(".menu-list a");
  const closeButton = document.getElementById("close-menu"); // Ajout de cette ligne

  // Ajout du listener pour le bouton close
  closeButton.addEventListener("click", () => {
    sideMenu.classList.remove("open");
  });

  // Toggle menu
  burgerButton.addEventListener("click", () => {
    sideMenu.classList.toggle("open");
  });

  // Handle menu item clicks
  menuLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const atelierIndex = parseInt(link.dataset.atelier) - 1;

      // Fermer le menu
      sideMenu.classList.remove("open");

      // Transition vers l'atelier sélectionné
      if (window.mirrorEffect) {
        window.mirrorEffect.switchToGalleryScene(atelierIndex);
      }
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!sideMenu.contains(e.target) && !burgerButton.contains(e.target)) {
      sideMenu.classList.remove("open");
    }
  });
});
