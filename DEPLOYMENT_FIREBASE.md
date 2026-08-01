# Guide de Déploiement : Firebase Hosting & Cloud Functions pour Dekel.Formation

Ce projet est configuré pour héberger le frontend Single-Page Application (React + Vite) sur **Firebase Hosting** et les APIs / webhooks sur **Firebase Cloud Functions**.

---

## 📁 Structure des Fichiers de Configuration

- `firebase.json` : Définit la configuration de Firebase Hosting (fichiers statiques dans `dist`) et les règles de redirection `/api/**` vers la Cloud Function `api` (région `us-east4`).
- `.firebaserc` : Contient l'ID du projet Firebase cible (`gen-lang-client-0934022789`).
- `firestore.rules` : Les règles de sécurité pour Firestore.
- `/functions` : Le dossier contenant le code TypeScript de la Cloud Function (Node.js 22, région `us-east4`).

---

## 🚀 Étapes de Déploiement

### 1. Installer Firebase CLI (si ce n'est pas encore fait)
```bash
npm install -g firebase-tools
```

### 2. Se Connecter à Firebase
```bash
firebase login
```

### 3. Installer les dépendances du dossier `functions`
```bash
cd functions
npm install
cd ..
```

### 4. Compiler l'application Frontend et la Cloud Function
```bash
npm run build
npm run build:functions
```

### 5. Déployer sur Firebase
Pour tout déployer d'un coup (Hosting + Cloud Functions + Firestore Rules) :
```bash
firebase deploy
```

Ou pour déployer séparément :
- **Uniquement le Frontend (Hosting)** :
  ```bash
  firebase deploy --only hosting
  ```
- **Uniquement les Cloud Functions** :
  ```bash
  firebase deploy --only functions
  ```
- **Uniquement les règles Firestore** :
  ```bash
  firebase deploy --only firestore:rules
  ```

---

## 🛠️ Tester localement avec les émulateurs Firebase
Pour tester le Hosting et les Functions sur votre machine locale avant le déploiement :
```bash
firebase emulators:start
```
