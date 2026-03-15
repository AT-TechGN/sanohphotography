# Corrections complètes — Backend + Frontend Admin
## SanohPhotography

---

## Fichiers à remplacer

### Backend (`photobook-api/`)

| Fichier corrigé | Destination |
|---|---|
| `backend/src/Controller/Api/BookingController.php`  | `src/Controller/Api/BookingController.php`  |
| `backend/src/Controller/Api/EmployeeController.php` | `src/Controller/Api/EmployeeController.php` |
| `backend/src/Controller/Api/ServiceController.php`  | `src/Controller/Api/ServiceController.php`  |
| `backend/src/Controller/Api/InvoiceController.php`  | `src/Controller/Api/InvoiceController.php`  |
| `backend/src/Controller/Api/DashboardController.php`| `src/Controller/Api/DashboardController.php`|
| `backend/config/security.yaml`                      | `config/packages/security.yaml`             |

### Frontend (`photobook-front/`)

| Fichier corrigé | Destination |
|---|---|
| `frontend/src/services/bookingService.js`              | `src/services/bookingService.js`              |
| `frontend/src/services/invoiceService.js`              | `src/services/invoiceService.js`              |
| `frontend/src/services/employeeService.js`             | `src/services/employeeService.js`             |
| `frontend/src/pages/admin/BookingsManagement.jsx`      | `src/pages/admin/BookingsManagement.jsx`      |
| `frontend/src/components/booking/BookingStep5.jsx`     | `src/components/booking/BookingStep5.jsx`     |

---

## Bugs critiques corrigés

### 🔴 BACKEND — BookingController

**Bug 1 : Mauvais setters dans create()**
```php
// AVANT (crash — ces méthodes n'existent pas sur l'entité)
$booking->setScheduledDate($scheduledDate);
$booking->setScheduledTime($scheduledTime);

// APRÈS (vrais setters de l'entité Booking)
$booking->setBookingDate($bookingDate);
$booking->setStartTime($startTime);
```

**Bug 2 : Route GET /api/bookings/{id} manquante**
Le frontend appelait `bookingService.getById()` → 404. Route ajoutée.

**Bug 3 : Routes admin complètement manquantes → 404 systématiques**
- `bookingService.getAllBookings()` → appelait `GET /admin/bookings` → **404**
  Correction : nouvelle route `GET /bookings/admin-list`
- `bookingService.updateBookingStatus()` → appelait `PATCH /admin/bookings/:id/status` → **404**
  Correction : nouvelle route `PATCH /bookings/:id/admin-status`
- `bookingService.assignEmployee()` → appelait `PATCH /admin/bookings/:id/assign` → route ajoutée ✓

**Bug 4 : DashboardController utilisait b.bookingDate dans certains endroits**
Harmonisé. getUpcomingEvents() utilisait `$booking->getEmployee()->getFirstName()` mais
Employee n'a pas firstName directement → passe par `Employee->getUser()->getFirstName()`.

---

### 🔴 BACKEND — EmployeeController

**Bug 5 : Routes CRUD complètement manquantes**
```
POST   /api/employees        → employeeService.create()  → 404
PUT    /api/employees/:id    → employeeService.update()  → 404
DELETE /api/employees/:id    → employeeService.delete()  → 404
GET    /api/employees/:id    → employeeService.getById() → 404
```
Toutes ces routes ont été ajoutées.

**Bug 6 : Employee n'a pas firstName/lastName directement**
L'entité Employee est liée à User via `$employee->getUser()`.
Le frontend attendait `employee.firstName` → il fallait exposer `employee.getUser()->getFirstName()`.
La sérialisation centralisée corrige cela.

**Nouveau : create() crée aussi le User associé**
Un employé = un compte User avec ROLE_EMPLOYEE + une entité Employee liée.

---

### 🔴 BACKEND — ServiceController

**Bug 7 : Routes CRUD complètement manquantes**
```
POST   /api/services         → serviceService.create()  → 404
PUT    /api/services/:id     → serviceService.update()  → 404
DELETE /api/services/:id     → serviceService.delete()  → 404
GET    /api/services/:id     → serviceService.getById() → 404
```
Toutes ces routes ont été ajoutées avec validation Symfony.

**Amélioration : delete() intelligent**
Si le service a des réservations actives → désactivation au lieu de suppression.

---

### 🔴 BACKEND — InvoiceController

**Bug 8 : Route GET /api/invoices manquante**
```
GET /api/invoices → invoiceService.getAll() → 404
```
Route ajoutée avec pagination et filtre par statut.

---

### 🟡 FRONTEND — bookingService.js

```js
// AVANT → 404
getAllBookings()    → GET /admin/bookings
updateBookingStatus() → PATCH /admin/bookings/:id/status

// APRÈS → routes correctes
getAllBookings()    → GET /bookings/admin-list
updateBookingStatus() → PATCH /bookings/:id/admin-status
```

---

### 🟡 FRONTEND — invoiceService.js

```js
// AVANT → 404
getAll() → GET /invoices

// APRÈS → route ajoutée au backend
getAll() → GET /invoices ✓
```

---

### 🟡 FRONTEND — BookingsManagement.jsx

- Affichage correct de `scheduledDate`/`scheduledTime` (les champs exposés par la sérialisation)
- Ajout modal assignation d'employé (fonctionnalité manquante)
- Suppression du bouton "Voir détails" qui pointait vers `/admin/bookings/:id` (route inexistante)

---

### 🟡 FRONTEND — BookingStep5.jsx

- Affichage du message d'erreur serveur (avant : message générique seulement)
- Écran de succès avant redirection

---

## Architecture des rôles (rappel)

```
ROLE_ADMIN > ROLE_PHOTOGRAPHE > ROLE_EMPLOYE/EMPLOYEE > ROLE_CLIENT
```

`ROLE_EMPLOYEE` ajouté comme alias de `ROLE_EMPLOYE` dans security.yaml
pour cohérence avec les valeurs stockées en base.
