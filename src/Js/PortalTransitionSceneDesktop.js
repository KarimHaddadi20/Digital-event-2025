import * as THREE from "three";
import { PortalTransitionSceneBase } from "./PortalTransitionSceneBase.js";

export class PortalTransitionSceneDesktop extends PortalTransitionSceneBase {
  constructor(app, selectedFragmentIndex) {
    super(app, selectedFragmentIndex);
    console.log("Constructor PortalTransitionSceneDesktop - Initialisation");
    this._scrollHandlerInitialized = false;
    this.setupScrollHandler();
    this.createInventoryButton();
    this.createInventory();
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
      const delta = Math.sign(event.deltaY) * 0.6;

      const maxZ = 7; // Position la plus haute (inchangée)
      const fragmentSpacing = 50;
      // Ajuster lastFragmentPosition pour s'arrêter plus tôt
      const lastFragmentPosition = -258; // Suppression du -15 pour s'arrêter avant
      const minZ = lastFragmentPosition + 30; // Ajouter une marge pour s'arrêter avant la fin

      let newZ = this.camera.position.z - delta;

      // Ajouter un effet de ressort aux limites
      if (newZ > maxZ) {
        newZ = maxZ;
      } else if (newZ < minZ) {
        newZ = minZ;
      }

      this.camera.position.z = newZ;

      // Calculer la progression
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
      mainMesh.scale.set(0.8, 1.6, 1.2);
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
    const group = new THREE.Group();

    // Créer le mesh principal pour l'image
    const imageMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 8, 50, 50),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      })
    );

    // Créer le mesh pour la bordure (plus grand)
    const borderGeometry = new THREE.PlaneGeometry(12.4, 8.4);
    const borderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float time;

        void main() {
          vec2 center = vec2(0.5, 0.5);
          float angle = 116.0 * 3.14159 / 180.0;
          vec2 direction = vec2(cos(angle), sin(angle));
          float gradient = dot(vUv - center, direction) * 0.5 + 0.5;

          vec4 color1 = vec4(0.627, 0.627, 0.627, 0.1);
          vec4 color2 = vec4(0.925, 0.925, 0.925, 0.1);
          vec4 finalColor = mix(color1, color2, gradient);

          vec2 border = smoothstep(0.0, 0.02, vUv) * smoothstep(0.0, 0.02, 1.0 - vUv);
          float borderAlpha = min(border.x, border.y);
          
          gl_FragColor = vec4(finalColor.rgb, finalColor.a * borderAlpha);
          
          float borderWidth = 0.02;
          vec2 borderDist = min(vUv, 1.0 - vUv);
          float borderMask = 1.0 - step(borderWidth, min(borderDist.x, borderDist.y));
          gl_FragColor = mix(gl_FragColor, vec4(1.0, 1.0, 1.0, 0.2), borderMask);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
    borderMesh.position.z = -0.01;

    group.add(borderMesh);
    group.add(imageMesh);

    return group;
  }

  createSecondaryMeshes(texture2, texture3) {
    const createSecondaryMesh = (texture) => {
      const group = new THREE.Group();

      // Mesh pour l'image
      const imageMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(4.5, 3, 1, 1),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        })
      );

      // Mesh pour la bordure (plus grand)
      const borderGeometry = new THREE.PlaneGeometry(4.8, 3.3);
      const borderMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float time;

          void main() {
            vec2 center = vec2(0.5, 0.5);
            float angle = 116.0 * 3.14159 / 180.0;
            vec2 direction = vec2(cos(angle), sin(angle));
            float gradient = dot(vUv - center, direction) * 0.5 + 0.5;

            vec4 color1 = vec4(0.627, 0.627, 0.627, 0.1);
            vec4 color2 = vec4(0.925, 0.925, 0.925, 0.1);
            vec4 finalColor = mix(color1, color2, gradient);

            vec2 border = smoothstep(0.0, 0.02, vUv) * smoothstep(0.0, 0.02, 1.0 - vUv);
            float borderAlpha = min(border.x, border.y);
            
            gl_FragColor = vec4(finalColor.rgb, finalColor.a * borderAlpha);
            
            float borderWidth = 0.02;
            vec2 borderDist = min(vUv, 1.0 - vUv);
            float borderMask = 1.0 - step(borderWidth, min(borderDist.x, borderDist.y));
            gl_FragColor = mix(gl_FragColor, vec4(1.0, 1.0, 1.0, 0.2), borderMask);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
      });

      const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
      borderMesh.position.z = -0.01;

      group.add(borderMesh);
      group.add(imageMesh);

      return group;
    };

    return [createSecondaryMesh(texture2), createSecondaryMesh(texture3)];
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

      const fontSize = 16;
      const fontString = `italic 300 ${fontSize}px Fraunces`;
      ctx.font = fontString;
      const lineHeightPercent = 140;
      const lineHeight = (fontSize * lineHeightPercent) / 100;

      // Text setup
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Split text into lines
      const words = quote.split(" ");
      let line = "";
      let lines = [];
      const maxWidth = 900;

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

      const yOffset = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

      // Calculate background dimensions
      const padding = 20;
      const totalTextHeight = lines.length * lineHeight;
      const backgroundHeight = totalTextHeight + padding * 2;
      const backgroundWidth = maxWidth + padding * 2;
      const backgroundX = (canvas.width - backgroundWidth) / 2;
      const backgroundY = yOffset - padding;

      // Create gradient background
      const gradient = ctx.createLinearGradient(
        backgroundX,
        backgroundY,
        backgroundX + backgroundWidth,
        backgroundY + backgroundHeight
      );
      gradient.addColorStop(0.03, "rgba(160, 160, 160, 0.05)");
      gradient.addColorStop(0.13, "rgba(243, 243, 243, 0.05)");
      gradient.addColorStop(0.23, "rgba(195, 195, 195, 0.05)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
      gradient.addColorStop(0.75, "rgba(177, 177, 177, 0.05)");
      gradient.addColorStop(0.86, "rgba(236, 236, 236, 0.05)");
      gradient.addColorStop(0.97, "rgba(153, 153, 153, 0.05)");

      // Apply blur
      ctx.filter = "blur(25px)";

      // Draw background with rounded corners
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(
        backgroundX,
        backgroundY,
        backgroundWidth,
        backgroundHeight,
        5
      );
      ctx.fill();

      // Draw border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
      ctx.lineWidth = 0.625;
      ctx.stroke();

      // Reset blur for text
      ctx.filter = "none";

      // Draw text
      ctx.fillStyle = "rgba(255, 255, 255, 1)";
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
            bottom: 120px;
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
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
        `;

    // Suppression des marges par défaut
    const title = labelDiv.querySelector("h2");
    const subtitle = labelDiv.querySelector(".subtitle");

    subtitle.style.cssText = `
    margin: 0;
    font-size: 16px !important;
    opacity: 0.6;
`;

    title.style.cssText = `
    margin: 0;
    font-style: normal;
    font-size: 18px !important;
    `;

    title.style.fontSize = "18px";
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

    // Désactiver le scroll de la scène
    if (this._currentScrollHandler) {
      window.removeEventListener("wheel", this._currentScrollHandler);
    }

    document.body.classList.add("popup-active");

    popup.innerHTML = `
            <button class="popup-close" aria-label="Fermer" type="button">
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
                                <div class="student-prenom">${student.prenom}</div>
                                <div class="student-classe">
                                    ${student.classe.endsWith(".svg")
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
      
      // Réactiver le scroll de la scène
      if (!this._scrollHandlerInitialized) {
        this.setupScrollHandler();
      } else {
        window.addEventListener("wheel", this._currentScrollHandler, {
          passive: false,
        });
      }
    });

    requestAnimationFrame(() => {
      popup.classList.add("active");
    });
  }

  updateFragments() {
    this.fragments.forEach((fragment, index) => {
      if (!fragment.mesh || !fragment.group) return;

      const distance = fragment.group.position.z - this.camera.position.z;

      //   if (fragment.mesh.geometry.isBufferGeometry) {
      //     this.updateWaveEffect(fragment.mesh);
      //   }

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
    // Supprimer le bouton d'inventaire lors du nettoyage
    const inventoryButton = document.querySelector(".inventory-button");
    if (inventoryButton) {
      inventoryButton.remove();
    }
    super.cleanup();
  }

  createInventoryButton() {
    const button = document.createElement("button");
    button.className = "inventory-button";
    button.textContent = "Inventaire";
    button.addEventListener("click", () => this.toggleInventory());
    document.body.appendChild(button);
  }

  createInventory() {
    if (!document.getElementById("inventory")) {
      const inventory = document.createElement("div");
      inventory.id = "inventory";
      inventory.className = "inventory";
      inventory.innerHTML = `
        <div class="inventory-header">
          <span class="font-aktiv">INVENTAIRE</span>
          <button class="inventory-close" aria-label="Fermer">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        </div>
        <div class="inventory-content">
          <div class="menu-list">
            <a href="#" data-atelier="1" class="menu-item">
              <div class="container-menu-item-img">
                <img src="src/textures/fragmentorga/fragment.interface.web.png" alt="Site Web" class="menu-item-img">
              </div>
              <span class="stroke-white"></span>
              <span class="menu-item-title">Site Web</span>
            </a>
            <a href="#" data-atelier="2" class="menu-item">
              <div class="container-menu-item-img">
                <img src="src/textures/fragmentorga/fragment.videomapping.png" alt="Vidéo Mapping" class="menu-item-img">
              </div>
              <span class="stroke-white"></span>
              <span class="menu-item-title">Vidéo Mapping</span>
            </a>
            <a href="#" data-atelier="3" class="menu-item">
              <div class="container-menu-item-img">
                <img src="src/textures/fragmentorga/fragment.creative.coding.png" alt="Creative Coding" class="menu-item-img">
              </div>
              <span class="stroke-white"></span>
              <span class="menu-item-title">Creative Coding</span>
            </a>
            <a href="#" data-atelier="4" class="menu-item">
              <div class="container-menu-item-img">
                <img src="src/textures/fragmentorga/fragment.gaming.popcorn.png" alt="Gaming & Pop-corn" class="menu-item-img">
              </div>
              <span class="stroke-white"></span>
              <span class="menu-item-title">Gaming & Pop-corn</span>
            </a>
            <a href="#" data-atelier="5" class="menu-item">
              <div class="container-menu-item-img">
                <img src="src/textures/fragmentorga/fragment.video.studio.png" alt="Vidéo" class="menu-item-img">
              </div>
              <span class="stroke-white"></span>
              <span class="menu-item-title">Vidéo</span>
            </a>
            <a href="#" data-atelier="6" class="menu-item">
              <div class="container-menu-item-img">
                <img src="src/textures/fragmentorga/fragment.escape.game.png" alt="Escape Game" class="menu-item-img">
              </div>
              <span class="stroke-white"></span>
              <span class="menu-item-title">Escape Game</span>
            </a>
            <a href="#" data-atelier="7" class="menu-item">
              <div class="container-menu-item-img">
                <img src="src/textures/fragmentorga/fragment.podcast.png" alt="Podcast" class="menu-item-img">
              </div>
              <span class="stroke-white"></span>
              <span class="menu-item-title">Podcast</span>
            </a>
            <a href="#" data-atelier="8" class="menu-item">
              <div class="container-menu-item-img">
                <img src="src/textures/fragmentorga/fragment.photographie.png" alt="Photo" class="menu-item-img">
              </div>
              <span class="stroke-white"></span>
              <span class="menu-item-title">Photo</span>
            </a>
            <a href="#" data-atelier="9" class="menu-item">
              <div class="container-menu-item-img">
                <img src="src/textures/fragmentorga/fragment.ai.driven.visual.stories.png" alt="AI Driven Visual" class="menu-item-img">
              </div>
              <span class="stroke-white"></span>
              <span class="menu-item-title">AI Driven Visual</span>
            </a>
            <a href="#" data-atelier="10" class="menu-item">
              <div class="container-menu-item-img">
                <img src="src/textures/fragmentorga/fragment.game.design.png" alt="Game Design" class="menu-item-img">
              </div>
              <span class="stroke-white"></span>
              <span class="menu-item-title">Game Design</span>
            </a>
            <a href="#" data-atelier="11" class="menu-item">
              <div class="container-menu-item-img">
                <img src="src/textures/fragmentorga/fragment.organisation.png" alt="Contenus RS/Com/Parcours visiteurs/Scénographie" class="menu-item-img">
              </div>
              <span class="stroke-white"></span>
              <span class="menu-item-title">Organisation</span>
            </a>
          </div>
        </div>

      `;
      document.body.appendChild(inventory);

      // Ajouter les gestionnaires d'événements pour la navigation
      const menuItems = inventory.querySelectorAll(".menu-item");
      menuItems.forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const atelierName = item.dataset.atelier;
          this.navigateToAtelier(atelierName);
        });
      });

      // Ajouter le gestionnaire pour le bouton de fermeture
      const closeButton = inventory.querySelector(".inventory-close");
      if (closeButton) {
        closeButton.addEventListener("click", () => this.toggleInventory());
      }
    }
  }

  navigateToAtelier(atelierName) {
    // Masquer l'inventaire
    const inventory = document.getElementById("inventory");
    if (inventory) {
      inventory.classList.remove("open");
    }

    // Nettoyer tous les éléments de la scène actuelle
    const labels = document.querySelectorAll(
      ".fragment-label, .mobile-section-label"
    );
    labels.forEach((label) => label.remove());

    // Nettoyer les fragments
    this.fragments.forEach((fragment) => {
      if (fragment.group) {
        this.scene.remove(fragment.group);
      }
    });
    this.fragments = [];

    // Récupérer l'index de la scène à partir du nom de l'atelier
    const sceneIndex = parseInt(atelierName) - 1;

    // Utiliser mirrorEffect pour la transition
    if (window.mirrorEffect) {
      try {
        window.mirrorEffect.transitionToScene(sceneIndex);
      } catch (error) {
        console.error("Scene transition error:", error);
      }
    }
  }

  toggleInventory() {
    const inventory = document.getElementById("inventory");
    if (inventory) {
      const isOpening = !inventory.classList.contains("open");
      inventory.classList.toggle("open");

      // Gérer la visibilité du bouton d'inventaire
      const inventoryButton = document.querySelector(".inventory-button");
      if (inventoryButton) {
        inventoryButton.style.opacity = isOpening ? "0" : "1";
        inventoryButton.style.pointerEvents = isOpening ? "none" : "auto";
      }
    }
  }
}
