# Angular Forms Clone

Un clone de Google Forms développé avec Angular 19, offrant une interface moderne et intuitive pour créer et gérer des formulaires en ligne.

## 🚀 Fonctionnalités

### Gestion des formulaires
- ✅ Création et édition de formulaires
- ✅ 8 types de questions différents (texte court, texte long, choix multiple, cases à cocher, liste déroulante, nombre, date, email)
- ✅ Drag & drop pour réorganiser les questions
- ✅ Preview en temps réel
- ✅ Duplication de formulaires et questions
- ✅ Activation/désactivation des formulaires

### Collecte des réponses
- ✅ Interface de réponse responsive
- ✅ Validation en temps réel
- ✅ Barre de progression
- ✅ Support de l'authentification optionnelle
- ✅ Sauvegarde automatique des brouillons

### Analyse des réponses
- ✅ Vue résumé avec statistiques
- ✅ Vue individuelle pour parcourir les réponses
- ✅ Vue tableau pour une vision d'ensemble
- ✅ Export CSV des réponses
- ✅ Graphiques et visualisations

### Fonctionnalités techniques
- ✅ Architecture modulaire et scalable
- ✅ Signals Angular pour la réactivité
- ✅ Guards pour la protection des routes
- ✅ Intercepteurs HTTP pour l'authentification
- ✅ Gestion centralisée des erreurs
- ✅ Animations fluides
- ✅ Design responsive

## 📋 Prérequis

- Node.js (v18 ou supérieur)
- Angular CLI (v19)
- MongoDB (pour le backend)
- Un backend API compatible (FastAPI recommandé)

## 🛠️ Installation

1. **Cloner le projet**
```bash
git clone https://github.com/votre-username/angular-forms-clone.git
cd angular-forms-clone
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**

Modifier le fichier `src/environments/environment.ts` :
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api' // URL de votre API
};
```

4. **Installer Angular CDK (pour le drag & drop)**
```bash
npm install @angular/cdk
```

## 🚀 Démarrage

### Mode développement
```bash
ng serve
```
L'application sera accessible sur `http://localhost:4200`

### Build de production
```bash
ng build --configuration production
```

## 📁 Structure du projet

```
src/
├── app/
│   ├── core/                    # Services singleton, guards, intercepteurs
│   │   ├── services/           # Services métier
│   │   ├── guards/             # Guards de navigation
│   │   ├── interceptors/       # Intercepteurs HTTP
│   │   └── models/             # Modèles TypeScript
│   │
│   ├── shared/                 # Composants réutilisables
│   │   ├── components/         # Composants partagés
│   │   └── services/           # Services utilitaires
│   │
│   ├── features/               # Modules fonctionnels
│   │   ├── auth/              # Authentification
│   │   ├── dashboard/         # Tableau de bord
│   │   └── forms/             # Gestion des formulaires
│   │
│   └── layouts/               # Layouts de l'application
│
├── assets/
│   └── styles/                # Styles globaux CSS
│       ├── variables.css      # Variables CSS
│       ├── animations.css     # Animations
│       └── utilities.css      # Classes utilitaires
│
└── environments/              # Configuration par environnement
```

## 🔧 Configuration API

L'application nécessite une API backend qui expose les endpoints suivants :

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription

### Formulaires
- `GET /api/forms` - Liste des formulaires
- `GET /api/forms/:id` - Détails d'un formulaire
- `POST /api/forms` - Créer un formulaire
- `PATCH /api/forms/:id` - Modifier un formulaire
- `DELETE /api/forms/:id` - Supprimer un formulaire

### Questions
- `GET /api/forms/:id/questions` - Questions d'un formulaire
- `POST /api/forms/:id/questions` - Ajouter une question
- `PATCH /api/forms/:id/questions/:questionId` - Modifier une question
- `DELETE /api/forms/:id/questions/:questionId` - Supprimer une question
- `POST /api/forms/:id/questions/reorder` - Réordonner les questions

### Réponses
- `POST /api/forms/:id/submit` - Soumettre une réponse
- `GET /api/forms/:id/responses` - Liste des réponses
- `GET /api/responses/:id` - Détails d'une réponse

## 🎨 Personnalisation

### Thème et couleurs
Les variables CSS sont définies dans `src/assets/styles/variables.css`. Vous pouvez personnaliser :
- Les couleurs primaires et secondaires
- Les espacements
- Les ombres
- Les border-radius
- Les breakpoints responsive

### Animations
Les animations sont définies dans `src/assets/styles/animations.css`. Vous pouvez ajouter ou modifier les animations selon vos besoins.

## 🧪 Tests

### Tests unitaires
```bash
ng test
```

### Tests e2e
```bash
ng e2e
```

## 📦 Déploiement

### Build
```bash
ng build --configuration production
```

### Déploiement sur un serveur
1. Copier le contenu du dossier `dist/` sur votre serveur
2. Configurer votre serveur web (nginx, Apache) pour servir l'application
3. S'assurer que toutes les routes redirigent vers `index.html` (SPA)

### Exemple de configuration nginx
```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/angular-forms;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend-api:8000;
    }
}
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT.

## 🙏 Remerciements

- Angular Team pour le framework
- Material Design pour les icônes
- Google Forms pour l'inspiration

## 📧 Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.