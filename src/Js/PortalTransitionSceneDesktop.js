import * as THREE from "three";
import { PortalTransitionSceneBase } from "./PortalTransitionSceneBase.js";

export class PortalTransitionSceneDesktop extends PortalTransitionSceneBase {
  constructor(app, selectedFragmentIndex) {
    super(app, selectedFragmentIndex);
    console.log("Constructor PortalTransitionSceneDesktop - Initialisation");
    this._scrollHandlerInitialized = false;
    this.setupScrollHandler();
  }

  setupScrollHandler() {
    console.log(
      "Setup Scroll Handler appelé - État initialized:",
      this._scrollHandlerInitialized
    );
    if (this._scrollHandlerInitialized) {
      console.log("Handler déjà initialisé - sortie");
      return;
    }
    this._scrollHandlerInitialized = true;
    console.log("Initialisation du nouveau handler de scroll");

    const handleScroll = (event) => {
      event.preventDefault();
      const delta = Math.sign(event.deltaY) * 0.3;

      const maxZ = 7;
      const fragmentSpacing = 50;
      const lastFragmentPosition = -260 - 15;
      const minZ = lastFragmentPosition;

      let newZ = this.camera.position.z - delta;
      newZ = Math.max(minZ, Math.min(maxZ, newZ));
      this.camera.position.z = newZ;

      const progress = Math.min(
        Math.abs(maxZ - this.camera.position.z) / Math.abs(maxZ - minZ),
        1
      );
      if (this.progressFill) {
        this.progressFill.style.setProperty("--progress", progress);
      }
    };

    if (this._currentScrollHandler) {
      console.log("Nettoyage de l'ancien handler");
      window.removeEventListener("wheel", this._currentScrollHandler);
    }

    this._currentScrollHandler = handleScroll;
    window.addEventListener("wheel", this._currentScrollHandler, {
      passive: false,
    });
    console.log("Nouveau handler installé");
    document.body.style.overflow = "hidden";
  }

  async setupFragments() {
    try {
      const response = await fetch("./src/data/portalData.json");
      const data = await response.json();
      const atelierData = data[`atelier${this.selectedFragmentIndex + 1}`];

      const sections = [
        {
          type: "standard",
          position: "left",
          mainImage: atelierData.sets[0].image1,
          secondaryImages: [
            atelierData.sets[0].image2,
            atelierData.sets[0].image3,
          ],
          title: atelierData.sets[0].title,
          subtitle: atelierData.sets[0].subtitle,
          zPosition: -10,
        },
        {
          type: "standard",
          position: "right",
          mainImage: atelierData.sets[1].image1,
          secondaryImages: [
            atelierData.sets[1].image2,
            atelierData.sets[1].image3,
          ],
          title: atelierData.sets[1].title,
          subtitle: atelierData.sets[1].subtitle,
          zPosition: -60,
        },
        {
          type: "standard",
          position: "left",
          mainImage: atelierData.sets[2].image1,
          secondaryImages: [
            atelierData.sets[2].image2,
            atelierData.sets[2].image3,
          ],
          title: atelierData.sets[2].title,
          subtitle: atelierData.sets[2].subtitle,
          zPosition: -110,
        },
        {
          type: "quote",
          position: "right",
          mainImage: atelierData.sets[3].image1,
          secondaryImages: [
            atelierData.sets[3].image2,
            atelierData.sets[3].image3,
          ],
          quotes: [
            atelierData.sets[3].quote1,
            atelierData.sets[3].quote2,
            atelierData.sets[3].quote3,
          ],
          title: atelierData.sets[3].title,
          subtitle: atelierData.sets[3].subtitle,
          zPosition: -160,
        },
        {
          type: "team",
          position: "center",
          image: atelierData.sets[4].image1,
          team: atelierData.sets[4].team,
          students: atelierData.sets[4].students,
          zPosition: -240,
        },
      ];

      for (const section of sections) {
        await this.createSection(section);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async createSection(section) {
    const textureLoader = new THREE.TextureLoader();
    const group = new THREE.Group();
    let mainMesh;

    if (section.type === "team" || section.type === "quote") {
      group.position.set(0, 0, section.zPosition);
    } else {
      const baseOffset = section.position === "left" ? -8 : 8;
      group.position.set(baseOffset, 0, section.zPosition);
    }

    // Création de l'image principale
    let mainTexture;
    if (section.type === "team") {
      mainTexture = await this.loadTexture(
        textureLoader,
        section.image1 || section.image
      );
      mainMesh = this.createMainMesh(mainTexture);
      mainMesh.scale.set(1.2, 1.2, 1.2);
    } else {
      mainTexture = await this.loadTexture(textureLoader, section.mainImage);
      mainMesh = this.createMainMesh(mainTexture);
    }

    group.add(mainMesh);

    // Gestion des images secondaires
    if (section.type !== "team" && section.secondaryImages) {
      const [texture2, texture3] = await Promise.all([
        this.loadTexture(textureLoader, section.secondaryImages[0]),
        this.loadTexture(textureLoader, section.secondaryImages[1]),
      ]);

      const [detail1, detail2] = this.createSecondaryMeshes(texture2, texture3);

      if (section.type === "quote") {
        const quotesMeshes = this.createQuoteMeshes(section.quotes);

        // Premier ensemble (image droite, quote gauche)
        mainMesh.position.set(5, 0, 0);
        mainMesh.userData = { direction: "right", initialX: 5, initialZ: 0 };
        mainMesh.rotation.y = -0.1;

        quotesMeshes[0].position.set(-3.5, 0, -1);
        quotesMeshes[0].userData = {
          direction: "left",
          initialX: -3.5,
          initialZ: -1,
        };
        quotesMeshes[0].scale.set(0.8, 0.8, 1);
        group.add(quotesMeshes[0]);

        // Deuxième ensemble (image gauche, quote droite)
        detail1.position.set(-3.5, 0, -15);
        detail1.userData = { direction: "left", initialX: -3.5, initialZ: -15 };
        detail1.rotation.y = 0.1;

        quotesMeshes[1].position.set(5, 0, -16);
        quotesMeshes[1].userData = {
          direction: "right",
          initialX: 5,
          initialZ: -16,
        };
        quotesMeshes[1].scale.set(0.8, 0.8, 1);
        group.add(quotesMeshes[1]);

        // Troisième ensemble (image droite, quote gauche)
        detail2.position.set(5, 0, -30);
        detail2.userData = { direction: "right", initialX: 5, initialZ: -30 };
        detail2.rotation.y = -0.1;

        quotesMeshes[2].position.set(-3.5, 0, -31);
        quotesMeshes[2].userData = {
          direction: "left",
          initialX: -3.5,
          initialZ: -31,
        };
        quotesMeshes[2].scale.set(0.8, 0.8, 1);
        group.add(quotesMeshes[2]);
      } else {
        // Positionnement normal pour toutes les autres sections
        const secondaryOffset = section.position === "left" ? 12 : -12;
        detail1.position.set(secondaryOffset, 0.5, -5);
        const extraOffset = section.position === "left" ? 4 : -4;
        detail2.position.set(secondaryOffset * 1.2 + extraOffset, -2, -10);
      }

      group.add(detail1, detail2);
    }

    this.scene.add(group);
    this.fragments.push({
      mesh: mainMesh,
      group: group,
      exitDirection: section.position,
    });

    // Ajout du label approprié
    if (section.type === "team") {
      this.addTeamLabel(group, section);
    } else {
      this.addFragmentLabel(group, section);
    }
  }

  createMainMesh(texture) {
    return new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8, 50, 50),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      })
    );
  }

  createSecondaryMeshes(texture2, texture3) {
    const geometry = new THREE.PlaneGeometry(3, 3, 1, 1);
    const material2 = new THREE.MeshBasicMaterial({
      map: texture2,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const material3 = new THREE.MeshBasicMaterial({
      map: texture3,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });

    return [
      new THREE.Mesh(geometry, material2),
      new THREE.Mesh(geometry, material3),
    ];
  }

  createQuoteImage(texture) {
    return new THREE.Mesh(
      new THREE.PlaneGeometry(6, 4),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      })
    );
  }

  createQuoteMeshes(quotes) {
    return quotes.map((quote) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");

      const fontSize = 64; // Taille de la police en pixels
      const lineHeightPercent = 140; // Hauteur de ligne en pourcentage (ex : 140%)
      const lineHeight = (fontSize * lineHeightPercent) / 100; // Convertir en pixels

      ctx.fillStyle = "rgba(255, 255, 255, 1)"; // Blanc opaque
      ctx.font = `italic 900 ${fontSize}px Fraunces`; // Style de la police
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Diviser le texte pour une meilleure présentation
      const words = quote.split(" ");
      let line = "";
      let lines = [];
      const maxWidth = 900; // Largeur maximale du texte

      words.forEach((word) => {
        const testLine = line + word + " ";
        if (ctx.measureText(testLine).width > maxWidth) {
          lines.push(line);
          line = word + " ";
        } else {
          line = testLine;
        }
      });
      lines.push(line);

      // Centrer verticalement les lignes
      const yOffset = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

      // Dessiner chaque ligne avec espacement calculé
      lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, yOffset + i * lineHeight);
      });

      const texture = new THREE.CanvasTexture(canvas);

      return new THREE.Mesh(
        new THREE.PlaneGeometry(6.2, 2),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        })
      );
    });
  }

  addFragmentLabel(fragment, section) {
    const labelDiv = document.createElement("div");
    labelDiv.className = "fragment-label";
    labelDiv.style.pointerEvents = "auto";
    labelDiv.innerHTML = `
            <div class="label-content">
                <h2>${section.title}</h2>
                <p class="subtitle">${section.subtitle}</p>
            </div>
        `;

    document.body.appendChild(labelDiv);

    fragment.userData = { label: labelDiv };

    labelDiv.style.cssText = `
            position: fixed;
            left: ${section.position === "left" ? "40px" : "auto"};
            right: ${section.position === "right" ? "40px" : "auto"};
            bottom: 40px;
            color: white;
            text-align: ${section.position};
            pointer-events: auto;
            transition: opacity 0.1s linear;
            z-index: 1000;
            opacity: ${fragment.position.z === -10 ? 1 : 0};
        `;

    const labelContent = labelDiv.querySelector(".label-content");
    labelContent.style.cssText = `
            display: flex;
            width: 502px;
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
        `;

    // Suppression des marges par défaut
    const title = labelDiv.querySelector("h2");
    const subtitle = labelDiv.querySelector(".subtitle");
    title.style.margin = "0";
    subtitle.style.margin = "0";
  }

  addTeamLabel(fragment, section) {
    const labelDiv = document.createElement("div");
    labelDiv.className = "fragment-label team-label";
    labelDiv.style.pointerEvents = "auto";
    labelDiv.innerHTML = `
            <div class="label-content">
                <p class="team-link">${section.team}</p>
            </div>
        `;

    document.body.appendChild(labelDiv);

    const teamLink = labelDiv.querySelector(".team-link");
    teamLink.addEventListener("click", () => {
      this.showTeamPopup(section.students);
    });

    fragment.userData = { label: labelDiv };

    labelDiv.style.cssText = `
            position: fixed;
            left: 50%;
            transform: translateX(-50%);
            bottom: 15%;
            color: white;
            text-align: center;
            pointer-events: auto;
            transition: opacity 0.3s ease;
            z-index: 1000;
            font-size: 1.2em;
            font-weight: bold;
            opacity: 0.9;
        `;
  }

  showTeamPopup(students) {
    let popup = document.querySelector(".subtitle-popup");
    if (!popup) {
      popup = document.createElement("div");
      popup.className = "subtitle-popup";
      document.body.appendChild(popup);
    }

    document.body.classList.add("popup-active");

    popup.innerHTML = `            <button class="popup-close" aria-label="Fermer" type="button">
                <svg viewBox="0 0 24 24">
                    <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            <div class="popup-content">
                <div class="students-list">
                    <div class="students-header">
                        <div class="header-nom">Nom</div>
                        <div class="header-prenom">Prénom</div>
                        <div class="header-classe">Classe</div>
                    </div>
                    <div class="students-rows">
                        ${students
                          .map(
                            (student) => `
                            <div class="student-row">
                                <div class="student-nom">${student.nom}</div>
                                <div class="student-prenom">${
                                  student.prenom
                                }</div>
                                <div class="student-classe">
                                    ${
                                      student.classe.endsWith(".svg")
                                        ? `<img src="${student.classe}" alt="Classe" class="classe-icon"/>`
                                        : student.classe
                                    }
                                </div>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            </div>
        `;

    const closeButton = popup.querySelector(".popup-close");
    closeButton.addEventListener("click", () => {
      document.body.classList.remove("popup-active");
      popup.remove();
    });

    requestAnimationFrame(() => {
      popup.classList.add("active");
    });
  }

  updateFragments() {
    this.fragments.forEach((fragment, index) => {
      if (!fragment.mesh || !fragment.group) return;

      const distance = fragment.group.position.z - this.camera.position.z;

      if (fragment.mesh.geometry.isBufferGeometry) {
        this.updateWaveEffect(fragment.mesh);
      }

      let opacity = 0.9;
      const fadeDistance = 20;
      const startFadeDistance = 15;

      if (distance > startFadeDistance) {
        opacity = Math.max(
          0,
          0.9 * (1 - (distance - startFadeDistance) / fadeDistance)
        );
      } else if (distance < -startFadeDistance) {
        opacity = Math.max(
          0,
          0.9 * (1 - (Math.abs(distance) - startFadeDistance) / fadeDistance)
        );
      }

      // Appliquer l'opacité à tous les éléments du groupe
      fragment.group.traverse((child) => {
        if (child.material) {
          if (child.userData.initialZ) {
            // C'est une image secondaire, calculer son opacité en fonction de sa profondeur
            const secondaryDistance =
              child.userData.initialZ +
              fragment.group.position.z -
              this.camera.position.z;
            let secondaryOpacity = 0.9;

            if (secondaryDistance > startFadeDistance) {
              secondaryOpacity = Math.max(
                0,
                0.9 *
                  (1 - (secondaryDistance - startFadeDistance) / fadeDistance)
              );
            } else if (secondaryDistance < -startFadeDistance) {
              secondaryOpacity = Math.max(
                0,
                0.9 *
                  (1 -
                    (Math.abs(secondaryDistance) - startFadeDistance) /
                      fadeDistance)
              );
            }

            child.material.opacity = secondaryOpacity;
          } else {
            // Image principale
            child.material.opacity = opacity;
          }
        }
      });

      // Gestion de l'opacité des labels
      if (fragment.group.userData && fragment.group.userData.label) {
        const label = fragment.group.userData.label;
        const cameraZ = this.camera.position.z;

        if (fragment.group.position.z === -130 || index === 4) {
          // Section team
          label.style.opacity = opacity;
        } else {
          // Logique pour les sections normales
          if (index === 0 && cameraZ > -30) {
            // Première section
            label.style.opacity = 1;
          } else if (index === 1 && cameraZ <= -30 && cameraZ > -80) {
            // Deuxième section
            label.style.opacity = 1;
          } else if (index === 2 && cameraZ <= -80 && cameraZ > -130) {
            // Troisième section
            label.style.opacity = 1;
          } else if (index === 3 && cameraZ <= -130 && cameraZ > -180) {
            // Quatrième section
            label.style.opacity = 1;
          } else {
            label.style.opacity = 0;
          }
        }
      }
    });
  }

  cleanup() {
    console.log("Cleanup appelé - Suppression du handler");
    if (this._currentScrollHandler) {
      window.removeEventListener("wheel", this._currentScrollHandler);
    }
    super.cleanup();
  }
}
