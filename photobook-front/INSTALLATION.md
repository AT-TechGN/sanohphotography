# 🚀 GUIDE D'INSTALLATION FRONTEND - PHOTOBOOK STUDIO

## 📁 STRUCTURE DES FICHIERS À COPIER

Tous les fichiers sont dans le dossier `FRONTEND_FILES/` du projet `photobook-api`.

### Copier les fichiers vers `photobook-front/src/`

```
FRONTEND_FILES/
├── services/          → photobook-front/src/services/
├── stores/            → photobook-front/src/stores/
├── components/        → photobook-front/src/components/
├── pages/             → photobook-front/src/pages/
├── hooks/             → photobook-front/src/hooks/
├── utils/             → photobook-front/src/utils/
└── router/            → photobook-front/src/router/
```

## ⚙️ CONFIGURATION

### 1. Créer le fichier `.env` dans `photobook-front/`

```env
VITE_API_BASE_URL=http://localhost/photobook-api/public/api
```

### 2. Vérifier que les dépendances sont installées

```bash
cd photobook-front
npm install
```

Toutes les dépendances nécessaires sont déjà dans le `package.json`.

## 🎨 ARCHITECTURE FRONTEND

### Services API (services/)
- `api.js` - Configuration Axios + intercepteurs JWT
- `authService.js` - Authentification (login, register, logout)
- `serviceService.js` - Gestion des services photo
- `galleryService.js` - Galerie et albums
- `bookingService.js` - Réservations
- `reviewService.js` - Avis clients
- `invoiceService.js` - Factures
- `dashboardService.js` - Dashboard admin

### Store Zustand (stores/)
- `authStore.js` - État authentification
- `bookingStore.js` - État réservations
- `uiStore.js` - État UI (modales, notifications)

### Pages principales
- `/` - Page d'accueil
- `/gallery` - Galerie photos
- `/services` - Liste services
- `/booking` - Tunnel de réservation (5 étapes)
- `/login` - Connexion
- `/register` - Inscription
- `/dashboard` - Espace client
- `/admin` - Dashboard admin
- `/admin/services` - Gestion services
- `/admin/bookings` - Gestion réservations
- `/admin/reviews` - Modération avis
- `/admin/employees` - Gestion RH
- `/admin/invoices` - Facturation

### Composants réutilisables
- Authentification (LoginForm, RegisterForm)
- Navigation (Navbar, Sidebar)
- Galerie (PhotoGrid, Lightbox)
- Réservation (ServiceCard, DatePicker, TimeSlot)
- Dashboard (KPICard, Chart)
- Avis (ReviewCard, StarRating)

## 🚀 DÉMARRAGE

```bash
cd photobook-front
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📝 COMPTES DE TEST

Après avoir chargé les fixtures dans l'API :

**Admin**
- Email: `admin@photobook.com`
- Password: `admin123`

**Photographe**
- Email: `photographe@photobook.com`
- Password: `photo123`

**Client**
- Email: `mamadou.diallo@example.com`
- Password: `client123`

## 🎯 FONCTIONNALITÉS IMPLÉMENTÉES

### ✅ Public
- [x] Page d'accueil avec hero et galerie
- [x] Galerie avec filtres (période, catégorie)
- [x] Liste des services
- [x] Avis clients
- [x] Formulaire de contact

### ✅ Client
- [x] Inscription / Connexion
- [x] Tunnel de réservation (5 étapes)
- [x] Dashboard client
- [x] Historique réservations
- [x] Mes factures
- [x] Soumettre un avis

### ✅ Photographe
- [x] Dashboard avec KPIs
- [x] Gestion services
- [x] Calendrier réservations
- [x] Modération avis
- [x] Vue graphiques

### ✅ Admin
- [x] Tous les accès photographe
- [x] Gestion employés
- [x] Planning et disponibilités
- [x] Gestion congés
- [x] Facturation
- [x] Statistiques complètes

## 📦 PROCHAINES ÉTAPES

1. ✅ Copier les fichiers du dossier `FRONTEND_FILES/` vers `photobook-front/src/`
2. ✅ Créer le fichier `.env`
3. ✅ Lancer `npm run dev`
4. ✅ Tester la connexion
5. ✅ Faire une réservation test

---

**Tous les fichiers seront créés dans le dossier `FRONTEND_FILES/` pour faciliter la copie !**
