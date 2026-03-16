-- ============================================================
-- SanohPhotography - Données de démonstration
-- Exécuter dans votre base de données MySQL/MariaDB
-- ============================================================

-- Vider les tables existantes (ordre important pour les FK)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE review;
TRUNCATE TABLE booking;
TRUNCATE TABLE invoice;
TRUNCATE TABLE album;
TRUNCATE TABLE photo;
TRUNCATE TABLE availability;
TRUNCATE TABLE blocked_slot;
TRUNCATE TABLE employee;
TRUNCATE TABLE service;
TRUNCATE TABLE user;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- UTILISATEURS
-- Mot de passe : admin123 pour admin, client123 pour clients
-- (hashé avec bcrypt - compatible Symfony)
-- ============================================================

INSERT INTO `user` (email, roles, password, first_name, last_name, phone, avatar, is_active, created_at) VALUES

-- Admin
('admin@sanohphotography.com',
 '["ROLE_ADMIN"]',
 '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Sanoh', 'Admin', '+224620000001', NULL, 1, NOW()),

-- Photographe
('photographe@sanohphotography.com',
 '["ROLE_PHOTOGRAPHE"]',
 '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Mamadou', 'Sanoh', '+224620000002', NULL, 1, NOW()),

-- Employé
('employe@sanohphotography.com',
 '["ROLE_EMPLOYE"]',
 '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Fatoumata', 'Diallo', '+224620000003', NULL, 1, NOW()),

-- Clients
('client1@example.com',
 '["ROLE_CLIENT"]',
 '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Ibrahima', 'Bah', '+224621111111', NULL, 1, DATE_SUB(NOW(), INTERVAL 30 DAY)),

('client2@example.com',
 '["ROLE_CLIENT"]',
 '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Aissatou', 'Sow', '+224622222222', NULL, 1, DATE_SUB(NOW(), INTERVAL 20 DAY)),

('client3@example.com',
 '["ROLE_CLIENT"]',
 '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Mohamed', 'Camara', '+224623333333', NULL, 1, DATE_SUB(NOW(), INTERVAL 10 DAY));

-- ============================================================
-- EMPLOYÉ (lié à l'utilisateur employé - id 3)
-- ============================================================

INSERT INTO `employee` (position, contract_type, hourly_rate, hire_date, is_active, specializations, bio, user_id) VALUES
('Photographe Assistant', 'CDI', '15000.00', '2024-01-15', 1,
 '["portrait","mariage","famille"]',
 'Photographe passionnée avec 3 ans d expérience.',
 3);

-- ============================================================
-- DISPONIBILITÉS de l'employé (lundi à vendredi 9h-18h)
-- ============================================================

INSERT INTO `availability` (day_of_week, start_time, end_time, is_recurring, specific_date, employee_id) VALUES
(1, '09:00:00', '18:00:00', 1, NULL, 1),
(2, '09:00:00', '18:00:00', 1, NULL, 1),
(3, '09:00:00', '18:00:00', 1, NULL, 1),
(4, '09:00:00', '18:00:00', 1, NULL, 1),
(5, '09:00:00', '18:00:00', 1, NULL, 1),
(6, '09:00:00', '14:00:00', 1, NULL, 1);

-- ============================================================
-- SERVICES PHOTOGRAPHIQUES
-- ============================================================

INSERT INTO `service` (name, category, description, duration_min, base_price, max_participants, thumbnail, is_active, sort_order) VALUES

('Mariage Complet',
 'mariage',
 'Couverture complète de votre mariage, de la préparation à la soirée. Inclut 2 photographes, retouches premium et album photo luxe.',
 480, 3500000.00, 200, NULL, 1, 1),

('Fiançailles',
 'fiancailles',
 'Séance romantique pour immortaliser vos fiançailles dans un cadre idyllique.',
 120, 800000.00, 2, NULL, 1, 2),

('Baptême',
 'bapteme',
 'Immortalisez ce moment unique avec des photos professionnelles de la cérémonie et de la réception.',
 180, 800000.00, 50, NULL, 1, 3),

('Anniversaire',
 'anniversaire',
 'Capturez la joie et les sourires de votre anniversaire en famille ou entre amis.',
 120, 600000.00, 30, NULL, 1, 4),

('Portrait Individuel',
 'portrait',
 'Séance photo professionnelle pour votre portrait, CV, profil LinkedIn ou réseaux sociaux.',
 60, 300000.00, 1, NULL, 1, 5),

('Photo de Famille',
 'famille',
 'Séance photo conviviale pour immortaliser votre famille dans un cadre naturel ou en studio.',
 90, 450000.00, 10, NULL, 1, 6),

('Grossesse & Maternité',
 'grossesse',
 'Sublimez votre grossesse avec une séance photo artistique et émouvante.',
 90, 500000.00, 2, NULL, 1, 7),

('Mode & Catalogue',
 'mode',
 'Shooting professionnel pour votre book de mode, catalogue produit ou campagne publicitaire.',
 120, 750000.00, 5, NULL, 1, 8),

('Photo Corporate',
 'corporate',
 'Photos professionnelles pour votre entreprise : portraits équipe, événements corporate, locaux.',
 180, 1200000.00, 50, NULL, 1, 9),

('Book Artistique',
 'book_artistique',
 'Créez votre book professionnel avec un shooting artistique personnalisé selon votre univers.',
 120, 750000.00, 1, NULL, 1, 10);

-- ============================================================
-- AVIS CLIENTS (pour la page d'accueil)
-- ============================================================

INSERT INTO `review` (rating, title, content, status, is_featured, moderated_at, created_at, client_id) VALUES

(5, 'Mariage parfait !',
 'Sanoh Photography a capturé chaque moment magique de notre mariage avec une sensibilité remarquable. Les photos sont d une beauté exceptionnelle, nous sommes ravis !',
 'approved', 1, NOW(), DATE_SUB(NOW(), INTERVAL 15 DAY), 4),

(5, 'Séance portrait réussie',
 'J avais besoin de photos professionnelles pour mon CV et LinkedIn. Le résultat dépasse mes attentes ! Très bonne ambiance pendant la séance.',
 'approved', 1, NOW(), DATE_SUB(NOW(), INTERVAL 8 DAY), 5),

(5, 'Photos de famille magnifiques',
 'Nous avons fait une séance en famille avec nos 3 enfants. Le photographe a été très patient et a su capturer des moments naturels et spontanés. Superbe travail !',
 'approved', 0, NOW(), DATE_SUB(NOW(), INTERVAL 5 DAY), 6),

(4, 'Très satisfaite du résultat',
 'Photos de grossesse sublimes, cadre romantique et photographe très professionnel. Je recommande vivement !',
 'approved', 0, NOW(), DATE_SUB(NOW(), INTERVAL 3 DAY), 4);

-- ============================================================
-- RÉSUMÉ
-- ============================================================
-- Comptes créés (mot de passe : "password" pour tous) :
--   admin@sanohphotography.com      → Admin
--   photographe@sanohphotography.com → Photographe
--   employe@sanohphotography.com     → Employé
--   client1@example.com             → Client Ibrahima Bah
--   client2@example.com             → Client Aissatou Sow
--   client3@example.com             → Client Mohamed Camara
--
-- 10 services actifs créés
-- 4 avis approuvés pour la page d'accueil
-- 1 employé avec disponibilités lundi-samedi
-- ============================================================

SELECT CONCAT('✓ ', COUNT(*), ' services créés') AS résultat FROM service;
SELECT CONCAT('✓ ', COUNT(*), ' utilisateurs créés') AS résultat FROM user;
SELECT CONCAT('✓ ', COUNT(*), ' avis créés') AS résultat FROM review;
