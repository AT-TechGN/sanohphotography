# 📚 DOCUMENTATION API - PHOTOBOOK STUDIO

**Version :** 1.0  
**Base URL :** `http://localhost:8000/api`  
**Date :** 10 mars 2026

---

## 📑 TABLE DES MATIÈRES

1. [Authentification](#authentification)
2. [Services](#services)
3. [Galerie Photos](#galerie-photos)
4. [Réservations](#réservations)
5. [Avis Clients](#avis-clients)
6. [Employés & RH](#employés--rh)
7. [Factures](#factures)
8. [Dashboard Admin](#dashboard-admin)
9. [Codes d'erreur](#codes-derreur)

---

## 🔐 AUTHENTIFICATION

### POST /api/register
Inscription d'un nouveau client.

**Accès :** Public  
**Body :**
```json
{
  "email": "client@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+224620000000"
}
```

**Réponse :** `201 Created`
```json
{
  "message": "Inscription réussie",
  "user": {
    "id": 1,
    "email": "client@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### POST /api/login
Connexion et obtention du JWT.

**Accès :** Public  
**Body :**
```json
{
  "email": "client@example.com",
  "password": "password123"
}
```

**Réponse :** `200 OK`
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "def50200..."
}
```

---

### GET /api/me
Obtenir les informations de l'utilisateur connecté.

**Accès :** `ROLE_CLIENT`  
**Headers :** `Authorization: Bearer {token}`

**Réponse :** `200 OK`
```json
{
  "id": 1,
  "email": "client@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["ROLE_CLIENT"],
  "phone": "+224620000000",
  "avatar": null
}
```

---

## 🎨 SERVICES

### GET /api/services/active
Obtenir tous les services actifs.

**Accès :** Public  
**Query params :** Aucun

**Réponse :** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Mariage Complet",
    "category": "mariage",
    "description": "Couverture complète...",
    "durationMin": 480,
    "basePrice": "3500000",
    "isActive": true,
    "sortOrder": 1
  }
]
```

---

### GET /api/services/by-category/{category}
Obtenir les services d'une catégorie spécifique.

**Accès :** Public  
**Paramètres :** 
- `category` : mariage, portrait, grossesse, etc.

**Réponse :** `200 OK` (même structure que /active)

---

### GET /api/services/categories
Obtenir les catégories avec comptage.

**Accès :** Public

**Réponse :** `200 OK`
```json
[
  {
    "category": "mariage",
    "count": 3
  },
  {
    "category": "portrait",
    "count": 2
  }
]
```

---

### PATCH /api/services/{id}/toggle-active
Activer/désactiver un service.

**Accès :** `ROLE_PHOTOGRAPHE`

**Réponse :** `200 OK`
```json
{
  "message": "Statut modifié avec succès",
  "isActive": true
}
```

---

### POST /api/services/reorder
Réorganiser l'ordre d'affichage des services.

**Accès :** `ROLE_PHOTOGRAPHE`  
**Body :**
```json
{
  "order": [
    {"id": 1, "sortOrder": 0},
    {"id": 3, "sortOrder": 1},
    {"id": 2, "sortOrder": 2}
  ]
}
```

**Réponse :** `200 OK`

---

## 📸 GALERIE PHOTOS

### GET /api/gallery
Obtenir les photos de la galerie publique avec filtres.

**Accès :** Public  
**Query params :**
- `period` : today | week | month | all (défaut: all)
- `category` : mariage, portrait, etc. (optionnel)
- `page` : numéro de page (défaut: 1)
- `limit` : photos par page (défaut: 24, max: 50)

**Réponse :** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "filePath": "/uploads/photos/abc123.jpg",
      "thumbnailPath": "/uploads/thumbnails/abc123.jpg",
      "takenAt": "2026-03-01T14:30:00+00:00",
      "isFeatured": true,
      "album": {
        "id": 5,
        "title": "Mariage Marie & Amadou"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 156,
    "totalPages": 7
  }
}
```

---

### GET /api/gallery/featured
Obtenir les photos en vedette (page d'accueil).

**Accès :** Public  
**Query params :**
- `limit` : nombre de photos (défaut: 10, max: 20)

**Réponse :** `200 OK` (tableau de photos)

---

### GET /api/gallery/albums
Obtenir les albums publics.

**Accès :** Public  
**Query params :**
- `page` : numéro de page (défaut: 1)
- `limit` : albums par page (défaut: 12, max: 20)

**Réponse :** `200 OK` (structure paginée)

---

### GET /api/gallery/stats
Statistiques de la galerie.

**Accès :** Public

**Réponse :** `200 OK`
```json
{
  "totalPhotos": 1543,
  "totalAlbums": 87,
  "photosByPeriod": {
    "today": 12,
    "week": 156,
    "month": 423
  }
}
```

---

## 📅 RÉSERVATIONS

### GET /api/bookings/available-slots
Obtenir les créneaux disponibles pour un service.

**Accès :** Public  
**Query params :**
- `service_id` : ID du service (requis)
- `date` : date au format Y-m-d (requis)

**Réponse :** `200 OK`
```json
{
  "date": "2026-03-15",
  "service": {
    "id": 1,
    "name": "Portrait Individuel",
    "duration": 60
  },
  "slots": [
    {
      "startTime": "09:00",
      "endTime": "10:00",
      "datetime": "2026-03-15T09:00:00+00:00",
      "employee": {
        "id": 2,
        "firstName": "Amadou",
        "lastName": "Barry"
      },
      "available": true
    }
  ]
}
```

---

### POST /api/bookings
Créer une nouvelle réservation.

**Accès :** `ROLE_CLIENT`  
**Body :**
```json
{
  "service_id": 1,
  "scheduled_date": "2026-03-15",
  "scheduled_time": "09:00",
  "participants": 1,
  "notes": "Préférence pour fond blanc",
  "total_price": "350000"
}
```

**Réponse :** `201 Created`
```json
{
  "message": "Réservation créée avec succès",
  "booking": {
    "id": 45,
    "service": {...},
    "scheduledDate": "2026-03-15",
    "scheduledTime": "09:00",
    "status": "pending",
    "assignedEmployee": {...}
  }
}
```

---

### GET /api/bookings/my-bookings
Obtenir les réservations du client connecté.

**Accès :** `ROLE_CLIENT`  
**Query params :**
- `status` : pending | confirmed | completed | cancelled (optionnel)

**Réponse :** `200 OK` (tableau de réservations)

---

### PATCH /api/bookings/{id}/confirm
Confirmer une réservation (photographe).

**Accès :** `ROLE_PHOTOGRAPHE`

**Réponse :** `200 OK`

---

### PATCH /api/bookings/{id}/cancel
Annuler une réservation.

**Accès :** `ROLE_CLIENT` (propriétaire) ou `ROLE_PHOTOGRAPHE`  
**Body :**
```json
{
  "reason": "Empêchement de dernière minute"
}
```

**Réponse :** `200 OK`

---

### PATCH /api/bookings/{id}/start
Démarrer une séance photo.

**Accès :** `ROLE_EMPLOYE`

**Réponse :** `200 OK`

---

### PATCH /api/bookings/{id}/complete
Terminer une séance photo.

**Accès :** `ROLE_EMPLOYE`

**Réponse :** `200 OK`

---

### GET /api/bookings/calendar
Vue calendrier des réservations.

**Accès :** `ROLE_PHOTOGRAPHE`  
**Query params :**
- `start_date` : date début (requis)
- `end_date` : date fin (requis)

**Réponse :** `200 OK` (tableau de réservations)

---

### GET /api/bookings/stats
Statistiques des réservations.

**Accès :** `ROLE_PHOTOGRAPHE`

**Réponse :** `200 OK`
```json
{
  "todayBookings": 5,
  "monthBookings": 78,
  "pendingBookings": 12,
  "statusDistribution": {
    "pending": 12,
    "confirmed": 45,
    "completed": 156,
    "cancelled": 8
  }
}
```

---

## ⭐ AVIS CLIENTS

### GET /api/reviews/approved
Obtenir les avis approuvés (public).

**Accès :** Public  
**Query params :**
- `page` : numéro de page (défaut: 1)
- `limit` : avis par page (défaut: 10, max: 50)

**Réponse :** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "rating": 5,
      "title": "Photographe exceptionnel !",
      "content": "Les photos de notre mariage...",
      "status": "approved",
      "isFeatured": true,
      "createdAt": "2026-02-15T10:30:00+00:00",
      "client": {
        "firstName": "Mamadou",
        "lastName": "Diallo"
      }
    }
  ],
  "pagination": {...}
}
```

---

### POST /api/reviews/submit
Soumettre un nouvel avis.

**Accès :** `ROLE_CLIENT`  
**Body :**
```json
{
  "rating": 5,
  "title": "Excellent service",
  "content": "Je recommande vivement ce photographe..."
}
```

**Réponse :** `201 Created`

---

### GET /api/reviews/pending
Obtenir les avis en attente de modération.

**Accès :** `ROLE_PHOTOGRAPHE`

**Réponse :** `200 OK` (tableau d'avis)

---

### PATCH /api/reviews/{id}/approve
Approuver un avis.

**Accès :** `ROLE_PHOTOGRAPHE`

**Réponse :** `200 OK`

---

### PATCH /api/reviews/{id}/reject
Rejeter un avis.

**Accès :** `ROLE_PHOTOGRAPHE`

**Réponse :** `200 OK`

---

### PATCH /api/reviews/{id}/toggle-featured
Mettre/retirer de la vedette.

**Accès :** `ROLE_PHOTOGRAPHE`

**Réponse :** `200 OK`

---

### GET /api/reviews/stats
Statistiques des avis.

**Accès :** Public

**Réponse :** `200 OK`
```json
{
  "averageRating": 4.78,
  "totalReviews": 234,
  "pendingReviews": 8,
  "distribution": {
    "1": 2,
    "2": 5,
    "3": 18,
    "4": 67,
    "5": 142
  }
}
```

---

## 👥 EMPLOYÉS & RH

### GET /api/employees/active
Obtenir les employés actifs.

**Accès :** `ROLE_ADMIN`

**Réponse :** `200 OK` (tableau d'employés)

---

### GET /api/employees/{id}/availabilities
Obtenir les disponibilités d'un employé.

**Accès :** `ROLE_ADMIN`

**Réponse :** `200 OK`
```json
[
  {
    "id": 1,
    "dayOfWeek": 1,
    "startTime": "09:00:00",
    "endTime": "18:00:00"
  }
]
```

---

### POST /api/employees/{id}/availabilities
Ajouter une disponibilité récurrente.

**Accès :** `ROLE_ADMIN`  
**Body :**
```json
{
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "18:00"
}
```

**Réponse :** `201 Created`

---

### DELETE /api/employees/availabilities/{id}
Supprimer une disponibilité.

**Accès :** `ROLE_ADMIN`

**Réponse :** `200 OK`

---

### GET /api/employees/{id}/blocked-slots
Obtenir les congés/absences.

**Accès :** `ROLE_ADMIN`  
**Query params :**
- `start_date` : date début (optionnel)
- `end_date` : date fin (optionnel)

**Réponse :** `200 OK` (tableau de slots bloqués)

---

### POST /api/employees/{id}/blocked-slots
Ajouter un congé/absence.

**Accès :** `ROLE_ADMIN`  
**Body :**
```json
{
  "start_datetime": "2026-03-20 09:00:00",
  "end_datetime": "2026-03-25 18:00:00",
  "reason": "Congés annuels"
}
```

**Réponse :** `201 Created`

---

### DELETE /api/employees/blocked-slots/{id}
Supprimer un congé/absence.

**Accès :** `ROLE_ADMIN`

**Réponse :** `200 OK`

---

### GET /api/employees/{id}/weekly-schedule
Planning hebdomadaire d'un employé.

**Accès :** `ROLE_ADMIN`  
**Query params :**
- `week_start` : date de début (défaut: lundi de cette semaine)

**Réponse :** `200 OK`

---

## 💰 FACTURES

### POST /api/invoices
Créer une facture pour une réservation.

**Accès :** `ROLE_ADMIN`  
**Body :**
```json
{
  "booking_id": 45,
  "amount": "350000",
  "due_date": "2026-04-15",
  "notes": "Paiement en 2 fois possible"
}
```

**Réponse :** `201 Created`

---

### GET /api/invoices/{id}/pdf
Télécharger une facture en PDF.

**Accès :** `ROLE_CLIENT` (propriétaire) ou `ROLE_ADMIN`

**Réponse :** `200 OK` (fichier PDF)

---

### PATCH /api/invoices/{id}/mark-paid
Marquer une facture comme payée.

**Accès :** `ROLE_ADMIN`  
**Body :**
```json
{
  "payment_method": "Mobile Money"
}
```

**Réponse :** `200 OK`

---

### PATCH /api/invoices/{id}/cancel
Annuler une facture.

**Accès :** `ROLE_ADMIN`

**Réponse :** `200 OK`

---

### GET /api/invoices/my-invoices
Obtenir les factures du client connecté.

**Accès :** `ROLE_CLIENT`

**Réponse :** `200 OK` (tableau de factures)

---

### GET /api/invoices/stats
Statistiques des factures.

**Accès :** `ROLE_ADMIN`

**Réponse :** `200 OK`
```json
{
  "monthRevenue": 12500000,
  "pendingAmount": 2300000,
  "statusCounts": {
    "pending": 15,
    "paid": 234,
    "cancelled": 3
  },
  "overdueInvoices": 5
}
```

---

### GET /api/invoices/export
Exporter les factures en CSV.

**Accès :** `ROLE_ADMIN`  
**Query params :**
- `start_date` : date début (optionnel)
- `end_date` : date fin (optionnel)

**Réponse :** `200 OK` (fichier CSV)

---

## 📊 DASHBOARD ADMIN

### GET /api/dashboard/kpis
KPIs temps réel.

**Accès :** `ROLE_PHOTOGRAPHE`

**Réponse :** `200 OK`
```json
{
  "todayBookings": 5,
  "monthRevenue": 12500000,
  "pendingReviews": 8,
  "monthPhotos": 456,
  "newClients": 23,
  "confirmationRate": 87.5
}
```

---

### GET /api/dashboard/charts
Graphiques statistiques.

**Accès :** `ROLE_PHOTOGRAPHE`  
**Query params :**
- `days` : nombre de jours (défaut: 30, max: 90)

**Réponse :** `200 OK`
```json
{
  "bookings": [...],
  "revenue": [...],
  "serviceDistribution": [...],
  "reviewsDistribution": [...]
}
```

---

### GET /api/dashboard/activity-feed
Flux d'activité récente.

**Accès :** `ROLE_PHOTOGRAPHE`  
**Query params :**
- `limit` : nombre d'activités (défaut: 20, max: 50)

**Réponse :** `200 OK` (tableau d'activités)

---

### GET /api/dashboard/employee-performance
Performance des employés.

**Accès :** `ROLE_ADMIN`

**Réponse :** `200 OK`

---

### GET /api/dashboard/platform-stats
Statistiques globales de la plateforme.

**Accès :** `ROLE_ADMIN`

**Réponse :** `200 OK`

---

### GET /api/dashboard/upcoming-events
Prochains événements/rappels.

**Accès :** `ROLE_PHOTOGRAPHE`

**Réponse :** `200 OK`

---

## ❌ CODES D'ERREUR

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Données invalides ou manquantes |
| 401 | Unauthorized | Token JWT manquant ou invalide |
| 403 | Forbidden | Permissions insuffisantes |
| 404 | Not Found | Ressource non trouvée |
| 409 | Conflict | Conflit (ex: créneau déjà réservé) |
| 422 | Unprocessable Entity | Validation échouée |
| 500 | Internal Server Error | Erreur serveur |

---

## 📌 NOTES IMPORTANTES

1. **Authentification** : Tous les endpoints protégés nécessitent le header `Authorization: Bearer {token}`
2. **Pagination** : Les endpoints paginés retournent toujours la structure `{data: [...], pagination: {...}}`
3. **Dates** : Format ISO 8601 (Y-m-d ou Y-m-d H:i:s)
4. **Montants** : En Francs Guinéens (GNF), format string pour éviter les pertes de précision
5. **Validation** : Les erreurs de validation retournent `{errors: {field: message}}`

---

**Documentation générée automatiquement - PhotoBook Studio API v1.0**
