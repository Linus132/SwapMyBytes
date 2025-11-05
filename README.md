# SwapMyBytes: Ein gamifiziertes File-Sharing Experiment

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Eine mobile-first Web-Anwendung mit einer unkonventionellen Idee: Lade eine Datei hoch, erhalte eine zufällige Datei von einem anderen Nutzer zurück und manage sie in deiner persönlichen Sammlung.


![App Preview](./docs/swapmybytes-preview.svg)


## 💡 Projekt-Konzept & Ursprung

Dieses Projekt wurde von einem Team aus sechs Studenten im Wintersemester 2024/2025 als Abschlussprojekt für die Vorlesung "Mobile Web Applications" an der Hochschule der Medien Stuttgart entwickelt.

Die Kernidee ist ein spielerischer Ansatz zum Thema File-Sharing. Anstatt Dateien gezielt zu tauschen, überlassen die Nutzer den Austausch dem Zufall. Ein System aus Likes, einer öffentlichen Bestenliste und die automatische Löschung aller Dateien nach 7 Tagen schaffen ein sich ständig veränderndes, dynamisches Erlebnis und fördern die Neugier der Nutzer.

### Kern-Features

*   ⬆️ **Anonymer Dateiupload:** Nutzer können beliebige Dateien hochladen.
*   🎲 **Zufälliger Dateientausch:** Direkt nach dem Upload erhält der Nutzer eine zufällige Datei aus dem Pool aller hochgeladenen Dateien.
*   📂 **"Meine Dateien"-Sammlung:** Alle erhaltenen Dateien werden in einer persönlichen Übersicht gesammelt.
*   👍 **Like- & Bestenlisten-System:** Die beliebtesten Dateien erscheinen auf einer öffentlichen "Trending"-Seite und können von jedem heruntergeladen werden.
*   🗑️ **Automatische Löschung:** Alle Dateien werden nach 7 Tagen unwiderruflich gelöscht, um für ständige Abwechslung zu sorgen.
*   🎮 **Gamifiziertes Roulette-Element:** Ein Glücksrad gibt Nutzern die Chance, eine zufällige Datei aus den Sammlungen aller anderen Nutzer zu entfernen.

## 🛠️ Tech-Stack

Die Anwendung wurde als Full-Stack TypeScript-Projekt konzipiert und umgesetzt.

*   **Frontend:** React, MaterialUI (MUI), Vite
*   **Backend:** Node.js, Express.js (RESTful API)
*   **Datenbank:** MongoDB mit Mongoose
*   **Infrastruktur & Containerisierung:** Docker, Docker Compose
*   **Testing:** Jest (Backend Unit- & E2E-Tests), Cypress (Frontend E2E-Tests)

## 🚀 Lokales Setup

Das gesamte Projekt ist containerisiert und kann mit Docker Compose einfach gestartet werden.

**Voraussetzungen:**
*   Docker & Docker Compose müssen installiert sein.

**Anleitung:**
1.  **Repository klonen:**
    ```bash
    git clone https://github.com/Linus132/SwapMyBytes.git
    cd SwapMyBytes
    ```
2.  **`.env`-Datei aus Vorlage erstellen:**
    Es gibt eine `.env.example`-Datei im Hauptverzeichnis. Erstelle eine Kopie davon und nenne sie `.env`.
    ```bash
    cp .env.example .env
    ```

3.  **Secrets generieren (WICHTIG!):**
    Öffne die neu erstellte `.env`-Datei. Finde die folgenden leeren Variablen und fülle sie mit beliebigen, langen und zufälligen Zeichenketten. Du kannst z.B. einen Online-Passwort-Generator verwenden.
    ```env
    SMB_PRIVATE_KEY_ACCESS_TOKEN=HIER_DEINEN_ZUFÄLLIGEN_SCHLÜSSEL_EINFÜGEN
    SMB_PRIVATE_KEY_REFRESH_TOKEN=HIER_DEINEN_ANDEREN_ZUFÄLLIGEN_SCHLÜSSEL_EINFÜGEN
    ```
    Ohne diese Schlüssel wird der Login-Prozess mit einem `500 Internal Server Error` fehlschlagen.

4.  **Anwendung starten:**
    ```bash
    docker compose up --build -d
    ```
    Warte einen Moment, bis alle Container gestartet sind.

5.  **Anwendung im Browser öffnen:**
    Öffne deinen Browser und navigiere zu **[http://127.0.0.1:5080](http://127.0.0.1:5080)**.

6.  **Demo-Nutzer:**
    Beim ersten Start werden automatisch drei Demo-Nutzer (`smb1`, `smb2`, `smb3`) mit dem Passwort `testuserpassword123!` angelegt, mit denen du dich einloggen und die Anwendung testen kannst.
