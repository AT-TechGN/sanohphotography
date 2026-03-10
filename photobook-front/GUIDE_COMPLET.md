# 🎨 GUIDE COMPLET FRONTEND - PHOTOBOOK STUDIO

## 📁 STRUCTURE DES FICHIERS CRÉÉS (33 fichiers)

```
FRONTEND_FILES/
│
├── App.jsx                          # Point d'entrée principal
├── .env.example                     # Configuration environnement
│
├── services/ (8 fichiers)
│   ├── api.js                       # Configuration Axios + intercepteurs JWT
│   ├── authService.js               # Authentification
│   ├── bookingService.js            # Réservations
│   ├── dashboardService.js          # Dashboard admin
│   ├── employeeService.js           # Employés/RH
│   ├── galleryService.js            # Galerie photos
│   ├── invoiceService.js            # Facturation
│   ├── reviewService.js             # Avis clients
│   └── serviceService.js            # Services photographiques
│
├── stores/ (3 fichiers)
│   ├── authStore.js                 # État authentification (Zustand)
│   ├── bookingStore.js              # État réservation (5 étapes)
│   └── uiStore.js                   # État UI (modales, notifications)
│
├── components/
│   ├── auth/ (2 fichiers)
│   │   ├── LoginForm.jsx            # Formulaire de connexion
│   │   └── RegisterForm.jsx         # Formulaire d'inscription
│   │
│   ├── booking/ (5 fichiers)
│   │   ├── BookingStep1.jsx         # Étape 1 : Choix service
│   │   ├── BookingStep2.jsx         # Étape 2 : Choix date
│   │   ├── BookingStep3.jsx         # Étape 3 : Choix créneau
│   │   ├── BookingStep4.jsx         # Étape 4 : Informations
│   │   └── BookingStep5.jsx         # Étape 5 : Confirmation
│   │
│   └── common/ (4 fichiers)
│       ├── Footer.jsx               # Pied de page
│       ├── Loading.jsx              # Indicateur de chargement
│       ├── Navbar.jsx               # Barre de navigation
│       └── Notification.jsx         # Système de notifications
│
├── pages/ (7 fichiers)
│   ├── AdminDashboard.jsx           # Dashboard admin avec KPIs
│   ├── BookingPage.jsx              # Page tunnel de réservation
│   ├── ClientDashboard.jsx          # Dashboard client
│   ├── GalleryPage.jsx              # Galerie photos publique
│   ├── HomePage.jsx                 # Page d'accueil
│   ├── LoginPage.jsx                # Page de connexion
│   ├── RegisterPage.jsx             # Page d'inscription
│   └── ServicesPage.jsx             # Liste des services
│
├── layouts/ (2 fichiers)
│   ├── AdminLayout.jsx              # Layout avec sidebar admin
│   └── MainLayout.jsx               # Layout principal (navbar + footer)
│
└── router/
    └── AppRouter.jsx                # Configuration des routes
```

---

## 🚀 INSTALLATION ET DÉMARRAGE

### Étape 1 : Copier les fichiers

**Option A - Script PowerShell automatique (RECOMMANDÉ)**
```bash
cd photobook-api
powershell -ExecutionPolicy Bypass -File .\COPY_TO_FRONTEND.ps1
```

**Option B - Copie manuelle**
```bash
# Copier tout le contenu de FRONTEND_FILES/ vers photobook-front/src/
```

### Étape 2 : Créer le fichier .env

Dans `photobook-front/`, créer `.env` :
```env
VITE_API_BASE_URL=http://localhost/photobook-api/public/api
```

### Étape 3 : Installer les dépendances (si pas déjà fait)

```bash
cd photobook-front
npm install
```

Vérifier que ces packages sont installés :
- react
- react-dom
- react-router-dom
- axios
- zustand
- tailwindcss

### Étape 4 : Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:5173**

---

## 🎯 FONCTIONNALITÉS IMPLÉMENTÉES

### ✅ MODULE PUBLIC

#### Page d'accueil (HomePage.jsx)
- Hero section avec CTA
- Photos en vedette (6 photos)
- Avis clients avec note moyenne
- Call to action réservation

#### Galerie (GalleryPage.jsx)
- Filtrage par période (today/week/month/all)
- Filtrage par catégorie
- Grille masonry responsive
- Pagination complète
- Lightbox pour agrandir les photos
- Statistiques affichées

#### Services (ServicesPage.jsx)
- Liste de tous les services actifs
- Filtrage par catégorie
- Affichage prix, durée, max participants
- Bouton "Réserver" direct

### ✅ MODULE AUTHENTIFICATION

#### Inscription (RegisterForm.jsx)
- Validation complète des champs
- Vérification email unique
- Confirmation mot de passe
- Messages d'erreur personnalisés
- Redirection automatique vers login

#### Connexion (LoginForm.jsx)
- Authentification JWT
- Stockage token + user
- Comptes de test affichés
- Gestion erreurs
- Redirection selon rôle

### ✅ MODULE RÉSERVATION (5 ÉTAPES)

#### Tunnel complet (BookingPage.jsx)
**Étape 1 :** Sélection service
- Affichage tous services actifs
- Informations complètes (prix, durée)
- Sélection visuelle

**Étape 2 :** Choix de la date
- Calendrier HTML5
- Blocage dates passées
- Validation obligatoire

**Étape 3 :** Choix du créneau
- **Appel API créneaux disponibles**
- Affichage employé assigné
- Gestion "aucun créneau"
- Sélection visuelle

**Étape 4 :** Informations client
- Nombre de participants
- Notes/demandes spéciales
- Validation limites

**Étape 5 :** Confirmation
- Récapitulatif complet
- Prix total
- **Création réservation via API**
- Informations importantes
- Redirection vers dashboard

### ✅ MODULE CLIENT

#### Dashboard Client (ClientDashboard.jsx)
- Message de bienvenue personnalisé
- 3 actions rapides (réserver, galerie, avis)
- **Mes réservations** (via API)
  - Affichage statut avec couleurs
  - Date, heure, employé
  - Filtrage par statut
- **Mes factures** (via API)
  - Numéro, date, montant
  - Statut (payée/en attente)

### ✅ MODULE ADMIN

#### Dashboard Admin (AdminDashboard.jsx)
- **6 KPIs temps réel** (via API)
  - Réservations du jour
  - Revenus du mois
  - Avis en attente
  - Photos uploadées
  - Nouveaux clients
  - Taux de confirmation
- **4 Actions rapides**
  - Liens vers modules de gestion
- **Prochaines séances** (7 jours)
  - Liste des réservations à venir
  - Client, date, photographe

#### Layout Admin (AdminLayout.jsx)
- **Sidebar fixe** avec menu
- Navigation contextuelle
- Informations utilisateur
- Bouton déconnexion
- Restriction rôles (ADMIN only pour certains menus)

### ✅ STORES ZUSTAND

#### authStore.js
```javascript
- login(credentials)
- register(data)
- logout()
- hasRole(role)
- refreshUser()
```

#### bookingStore.js
```javascript
- nextStep() / previousStep()
- selectService(service)
- selectDate(date)
- selectSlot(slot)
- updateClientInfo(info)
- getBookingData()
- reset()
```

#### uiStore.js
```javascript
- toggleSidebar()
- openModal(name) / closeModal(name)
- addNotification(notification)
- showSuccess(message)
- showError(message)
- openLightbox(images, index)
```

### ✅ SYSTÈME DE NOTIFICATIONS

- Notifications automatiques
- 4 types : success, error, warning, info
- Auto-disparition configurable
- Fermeture manuelle
- Animation slide-in

### ✅ COMPOSANTS RÉUTILISABLES

- **Navbar** : Navigation responsive avec menu mobile
- **Footer** : 4 colonnes (À propos, Liens, Contact, Réseaux)
- **Loading** : Spinner personnalisé (3 tailles)
- **Notification** : Toast notifications

---

## 🔐 GESTION DE L'AUTHENTIFICATION

### Workflow JWT
1. **Login** → Token stocké dans localStorage
2. **Intercepteur Axios** → Ajoute `Authorization: Bearer {token}` automatiquement
3. **Erreur 401** → Déconnexion automatique + redirection login
4. **User info** → Stocké dans localStorage + Zustand

### Protection des routes
```jsx
<ProtectedRoute roles={['ROLE_CLIENT']}>
  <BookingPage />
</ProtectedRoute>
```

### Vérification rôles
```javascript
const { hasRole } = useAuthStore();
if (hasRole('ROLE_ADMIN')) {
  // Afficher menu admin
}
```

---

## 📱 RESPONSIVE DESIGN

Toutes les pages sont **100% responsive** avec Tailwind CSS :
- **Mobile** : 320px - 767px (1 colonne)
- **Tablet** : 768px - 1023px (2 colonnes)
- **Desktop** : 1024px+ (3-4 colonnes)

---

## 🎨 PALETTE DE COULEURS

- **Primary** : Blue-600 (#2563eb)
- **Success** : Green-600 (#16a34a)
- **Warning** : Yellow-600 (#ca8a04)
- **Error** : Red-600 (#dc2626)
- **Gray** : Gray-50 à Gray-900

---

## 🔗 ROUTES DISPONIBLES

### Routes publiques
- `/` - Page d'accueil
- `/gallery` - Galerie photos
- `/services` - Liste services
- `/login` - Connexion
- `/register` - Inscription

### Routes client (ROLE_CLIENT)
- `/booking` - Tunnel de réservation
- `/dashboard` - Dashboard client

### Routes admin (ROLE_PHOTOGRAPHE, ROLE_ADMIN)
- `/admin` - Dashboard admin
- `/admin/bookings` - Gestion réservations
- `/admin/services` - Gestion services
- `/admin/reviews` - Modération avis
- `/admin/employees` - Gestion employés (ADMIN only)
- `/admin/invoices` - Facturation (ADMIN only)

---

## 🧪 COMPTES DE TEST

**Admin**
```
Email: admin@photobook.com
Password: admin123
```

**Photographe**
```
Email: photographe@photobook.com
Password: photo123
```

**Client**
```
Email: mamadou.diallo@example.com
Password: client123
```

---

## 📦 PROCHAINES ÉTAPES (À DÉVELOPPER)

Les pages suivantes sont **préparées dans le router** mais nécessitent encore les composants :

### 🔜 À implémenter
1. **Gestion réservations admin** (`/admin/bookings`)
   - Calendrier avec drag & drop
   - Confirmer/Annuler réservations
   - Filtres avancés

2. **Gestion services** (`/admin/services`)
   - CRUD complet
   - Upload thumbnails
   - Réorganisation drag & drop

3. **Modération avis** (`/admin/reviews`)
   - File d'attente
   - Approuver/Rejeter
   - Mettre en vedette

4. **Gestion employés** (`/admin/employees`)
   - CRUD employés
   - Disponibilités récurrentes
   - Planning congés

5. **Facturation** (`/admin/invoices`)
   - Liste factures
   - Téléchargement PDF
   - Export CSV
   - Marquer comme payée

6. **Upload photos**
   - Multi-upload drag & drop
   - Création albums
   - Association réservation

7. **Lightbox avancée**
   - Navigation clavier
   - Zoom
   - Fullscreen

---

## ⚡ OPTIMISATIONS POSSIBLES

- **React Query** pour le cache API
- **Lazy loading** des routes
- **Image optimization** (WebP, lazy load)
- **PWA** (Service Worker)
- **Internationalization** (i18n)
- **Dark mode**
- **Tests unitaires** (Vitest)

---

## 🐛 DEBUGGING

### Vérifier la connexion API
```javascript
// Dans console du navigateur
localStorage.getItem('token')
localStorage.getItem('user')
```

### Tester les services
```javascript
import authService from './services/authService';
authService.login({ email: 'admin@photobook.com', password: 'admin123' });
```

### Logs réseau
- Ouvrir DevTools → Network
- Vérifier les appels `/api/*`
- Vérifier le header `Authorization`

---

## 📚 RESSOURCES

- **React Router** : https://reactrouter.com/
- **Zustand** : https://zustand-demo.pmnd.rs/
- **Axios** : https://axios-http.com/
- **Tailwind CSS** : https://tailwindcss.com/

---

## ✅ RÉCAPITULATIF

**33 fichiers créés** couvrant :
- ✅ 8 services API complets
- ✅ 3 stores Zustand
- ✅ 11 composants React
- ✅ 8 pages complètes
- ✅ 2 layouts
- ✅ 1 router avec protection routes
- ✅ Système de réservation complet (5 étapes)
- ✅ Dashboards client & admin
- ✅ Authentification JWT complète

**Fonctionnalités principales :**
- ✅ Page d'accueil avec hero + galerie
- ✅ Galerie avec filtres avancés
- ✅ Liste services par catégorie
- ✅ Tunnel réservation 5 étapes
- ✅ Dashboard client (réservations + factures)
- ✅ Dashboard admin (KPIs + prochaines séances)
- ✅ Authentification complète
- ✅ Système de notifications
- ✅ Responsive 100%

**L'application frontend est PRÊTE à être connectée à l'API ! 🚀**

---

**Guide créé le 10 mars 2026**
