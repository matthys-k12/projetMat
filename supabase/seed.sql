-- =====================================================================
-- IT Request Manager — données de démonstration
-- =====================================================================

insert into public.categories (name, description) values
  ('Ordinateurs portables', 'PC portables professionnels'),
  ('Ordinateurs fixes',     'Unités centrales et stations de travail'),
  ('Écrans',                'Moniteurs externes'),
  ('Claviers',              'Claviers filaires et sans fil'),
  ('Souris',                'Souris et trackpads'),
  ('Téléphones',            'Smartphones professionnels'),
  ('Casques',               'Casques audio et micro-casques'),
  ('Adaptateurs',           'Adaptateurs, câbles et hubs'),
  ('Accessoires',           'Stations d''accueil, sacoches, supports')
on conflict (name) do nothing;

insert into public.materials (name, description, category_id, total_quantity, available_quantity, minimum_stock)
select v.name, v.description, c.id, v.total, v.available, v.min_stock
from (values
  ('Dell Latitude 5440',          'Portable 14" — Intel Core i5, 16 Go RAM, SSD 512 Go.',     'Ordinateurs portables', 12,  8, 3),
  ('HP EliteBook 840 G10',        'Portable 14" — Intel Core i7, 16 Go RAM, SSD 512 Go.',     'Ordinateurs portables',  8,  2, 2),
  ('MacBook Air 13" M3',          'Apple M3, 16 Go RAM, SSD 512 Go.',                          'Ordinateurs portables',  4,  0, 1),
  ('Dell OptiPlex 7010',          'Unité centrale Intel Core i5, 16 Go RAM, SSD 512 Go.',     'Ordinateurs fixes',      6,  5, 2),
  ('Écran Dell 24" P2423',        'Écran 24" Full HD, réglable en hauteur, USB-C.',            'Écrans',                20, 14, 4),
  ('Écran LG 27" 4K',             'Écran 27" UHD, IPS, USB-C 65 W.',                           'Écrans',                 6,  2, 2),
  ('Clavier Logitech MX Keys',    'Clavier sans fil rétroéclairé, AZERTY.',                    'Claviers',              15, 11, 3),
  ('Souris Logitech MX Master 3S','Souris sans fil ergonomique, silencieuse.',                 'Souris',                15,  9, 3),
  ('iPhone 15',                   'Smartphone professionnel 128 Go.',                          'Téléphones',             5,  3, 1),
  ('Casque Jabra Evolve2 55',     'Micro-casque sans fil avec réduction de bruit.',            'Casques',               10,  1, 2),
  ('Adaptateur USB-C multiport',  'HDMI 4K, USB-A x2, Ethernet, charge 100 W.',                'Adaptateurs',           25, 20, 5),
  ('Station d''accueil Dell WD19','Dock USB-C, double écran, 130 W.',                          'Accessoires',            8,  6, 2)
) as v(name, description, category, total, available, min_stock)
join public.categories c on c.name = v.category;

-- ---------------------------------------------------------------------
-- Comptes de démonstration
-- 1. Supabase Dashboard > Authentication > Users > "Add user" (cocher "Auto Confirm") :
--      admin@itrm.demo / Admin123!      metadata: {"first_name":"Koffi","last_name":"N'Guessan"}
--      aya@itrm.demo   / User123!       metadata: {"first_name":"Aya","last_name":"Kouassi"}
--    Le trigger on_auth_user_created crée automatiquement les profils (rôle USER).
-- 2. Promouvoir l'admin (SQL Editor) :
--      update public.profiles set role = 'ADMIN' where email = 'admin@itrm.demo';
-- ---------------------------------------------------------------------
