# 🎯 PROCHAINES ÉTAPES - PHOTOBOOK API

## 🔧 Action Immédiate Requise

### 1. Générer les Clés JWT (URGENT)

Votre système Windows n'a pas OpenSSL en ligne de commande. Voici 3 solutions :

#### **Solution A - Installer Git for Windows (RECOMMANDÉ)**
1. Télécharger : https://git-scm.com/download/win
2. Installer avec les options par défaut
3. Ouvrir **Git Bash**
4. Naviguer vers votre projet :
   ```bash
   cd /c/wamp64/www/sanohphotography/photobook-api
   ```
5. Exécuter :
   ```bash
   openssl genrsa -out config/jwt/private.pem -aes256 -passout pass:70ae24c2e47f6cde3b3f6006f75f606ad599b56ff8cffc5b0dbbe5b31a41f8c4 4096
   openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem -passin pass:70ae24c2e47f6cde3b3f6006f75f606ad599b56ff8cffc5b0dbbe5b31a41f8c4
   ```

#### **Solution B - Via Symfony CLI (si PHP OpenSSL fonctionne)**
```bash
php bin/console lexik:jwt:generate-keypair
```

#### **Solution C - Utiliser OpenSSL depuis WAMP**
Si vous avez Apache dans WAMP, cherchez `openssl.exe` dans :
```
C:\wamp64\bin\apache\apache2.x.x\bin\openssl.exe
```

Puis exécutez :
```cmd
cd C:\wamp64\www\sanohphotography\photobook-api
"C:\wamp64\bin\apache\apache2.x.x\bin\openssl.exe" genrsa -out config/jwt/private.pem -aes256 -passout pass:70ae24c2e47f6cde3b3f6006f75f606ad599b56ff8cffc5b0dbbe5b31a41f8c4 4096
"C:\wamp64\bin\apache\apache2.x.x\bin\openssl.exe" rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem -passin pass:70ae24c2e47f6cde3b3f6006f75f606ad599b56ff8cffc5b0dbbe5b31a41f8c4
```

### 2. Configurer la Base de Données

Créez un fichier `.env.local` avec votre configuration MySQL :

```env
DATABASE_URL="mysql://root:votreMotDePasse@127.0.0.1:3306/photobook_db?serverVersion=8.0&charset=utf8mb4"
```

Puis créez la base de données :
```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

### 3. Tester l'Authentification

Une fois les clés JWT générées, testez l'inscription :

```bash
# Via PowerShell
Invoke-WebRequest -Uri "http://localhost/photobook-api/public/api/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@photobook.com","password":"admin123","firstName":"Admin","lastName":"PhotoBook","phone":"+224620000000"}'
```

Puis testez la connexion :

```bash
Invoke-WebRequest -Uri "http://localhost/photobook-api/public/api/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@photobook.com","password":"admin123"}'
```

---

## 🚀 Développement des Fonctionnalités

Maintenant que la base est solide, voici les fonctionnalités à développer selon le cahier des charges :

### Sprint 1 - Authentification Complète (2 semaines)
- [x] Inscription client
- [x] Connexion JWT
- [x] Route `/api/me`
- [ ] **Refresh Token** - Renouvellement automatique du JWT
- [ ] **Confirmation Email** - Envoi email après inscription
- [ ] **Reset Password** - Réinitialisation mot de passe oublié
- [ ] **Validation Email** - Contraintes sur les entités (NotBlank, Email, etc.)

### Sprint 2 - Vitrine Publique (2 semaines)
- [ ] **Galerie Photos**
  - Endpoint `/api/gallery` avec filtres (période, catégorie)
  - Pagination
  - Ordre par date de prise de vue
- [ ] **Services**
  - CRUD complet services
  - Catégorisation (Événementiel, Commercial, Personnel)
  - Gestion des tarifs
- [ ] **Avis Clients**
  - Affichage avis approuvés
  - Calcul note moyenne
  - Répartition par étoiles
- [ ] **Contact**
  - Traitement formulaire contact
  - Email de notification au photographe

### Sprint 3 - Système de Réservation (2 semaines)
- [ ] **Calcul Disponibilités**
  - Algorithme de calcul créneaux libres
  - Prise en compte des disponibilités employés
  - Gestion des slots bloqués
- [ ] **Workflow Réservation**
  - Statuts : EN_ATTENTE → CONFIRMEE → EN_COURS → TERMINEE → ANNULEE
  - Transitions avec validations
  - Assignation automatique employé
- [ ] **Notifications Email**
  - Email confirmation réservation
  - Email rappel J-1
  - Email annulation

### Sprint 4 - Gestion Photos & Albums (2 semaines)
- [ ] **Upload Photos**
  - Multi-upload avec VichUploader
  - Génération thumbnails automatique
  - Extraction métadonnées EXIF
  - Compression/Optimisation
- [ ] **Albums**
  - Association album ↔ réservation
  - Tri/Ordre des photos
  - Photos en vedette (featured)
- [ ] **Téléchargement**
  - Génération ZIP à la demande
  - Lien sécurisé avec expiration
  - Watermark optionnel

### Sprint 5 - RH & Modération (2 semaines)
- [ ] **Gestion Employés**
  - CRUD employés
  - Association User ↔ Employee
  - Rôles et compétences
- [ ] **Disponibilités**
  - Disponibilités récurrentes (jours/heures de travail)
  - Disponibilités ponctuelles
  - Congés et absences
- [ ] **Modération Avis**
  - File d'attente modération
  - Approbation/Rejet avec notification
  - Limitation 1 avis par client par réservation

### Sprint 6 - Espace Client & Planning (2 semaines)
- [ ] **Dashboard Client**
  - Mes réservations (en cours, passées)
  - Mes albums photos
  - Mes avis
  - Téléchargements disponibles
- [ ] **Planning Employé**
  - Vue calendrier hebdomadaire/mensuelle
  - Drag & drop pour réorganisation
  - Export iCal/Google Calendar
  - Notifications changements

### Sprint 7 - Dashboard Admin (2 semaines)
- [ ] **KPIs Temps Réel**
  - Réservations du jour
  - Revenus du mois
  - Avis en attente
  - Photos uploadées
- [ ] **Statistiques**
  - Graphiques évolution (réservations, revenus)
  - Répartition par type de service
  - Performance employés
  - Taux de satisfaction
- [ ] **Exports**
  - Export CSV réservations
  - Export PDF statistiques
  - Rapports mensuels automatiques

### Sprint 8 - Facturation & Production (2 semaines)
- [ ] **Génération Factures**
  - PDF avec dompdf
  - Numérotation automatique
  - Mentions légales
  - Envoi email au client
- [ ] **Suivi Paiements**
  - Statuts : EN_ATTENTE, PAYEE, ANNULEE
  - Relances automatiques
  - Historique paiements
- [ ] **Tests Automatisés**
  - Tests unitaires entités
  - Tests fonctionnels API
  - Couverture > 70%
- [ ] **Déploiement**
  - Configuration production
  - HTTPS + SSL
  - Backup automatique BDD

---

## 📚 Améliorations Recommandées

### Sécurité
- [ ] Rate limiting (éviter brute force)
- [ ] CSRF protection sur formulaires
- [ ] Validation inputs stricte
- [ ] Logs des actions sensibles
- [ ] 2FA optionnel pour admins

### Performance
- [ ] Cache Redis pour sessions/queries
- [ ] CDN pour assets statiques
- [ ] Lazy loading images
- [ ] Compression Gzip/Brotli
- [ ] Database indexing optimisé

### UX/UI
- [ ] Internationalisation (FR/EN)
- [ ] Mode sombre
- [ ] Notifications push (PWA)
- [ ] Recherche avancée
- [ ] Filtres intelligents

### DevOps
- [ ] Docker Compose pour dev
- [ ] CI/CD avec GitHub Actions
- [ ] Environnements staging/prod
- [ ] Monitoring (Sentry)
- [ ] Analytics (Matomo)

---

## 📖 Documentation à Créer

1. **README.md** - Installation et configuration
2. **API_DOCUMENTATION.md** - Endpoints et exemples
3. **ARCHITECTURE.md** - Diagrammes et flux
4. **CONTRIBUTING.md** - Guide contribution
5. **CHANGELOG.md** - Historique versions

---

## 🛠️ Commandes Utiles

### Développement
```bash
# Lancer le serveur de dev
php bin/console server:start

# Ou avec Symfony CLI
symfony server:start

# Vider le cache
php bin/console cache:clear

# Créer une entité
php bin/console make:entity

# Créer un controller
php bin/console make:controller

# Créer une migration
php bin/console make:migration

# Exécuter les migrations
php bin/console doctrine:migrations:migrate
```

### Tests
```bash
# Lancer tous les tests
php bin/phpunit

# Tests avec couverture
php bin/phpunit --coverage-html var/coverage

# Valider le schéma
php bin/console doctrine:schema:validate
```

### Qualité Code
```bash
# Analyser le code
vendor/bin/phpstan analyse src

# Fixer le code style
vendor/bin/php-cs-fixer fix
```

---

## 🎓 Ressources Utiles

- **Symfony Docs** : https://symfony.com/doc/current/index.html
- **API Platform** : https://api-platform.com/docs/
- **Doctrine ORM** : https://www.doctrine-project.org/
- **JWT Bundle** : https://github.com/lexik/LexikJWTAuthenticationBundle
- **VichUploader** : https://github.com/dustin10/VichUploaderBundle

---

**Bon développement ! 🚀**

*N'oubliez pas de générer les clés JWT avant de commencer !*
