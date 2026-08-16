-- AzureMed Hub schema (raw MySQL, no ORM)
-- Run with: mysql -u root -p azuremed_hub < config/azuremed_schema.sql

CREATE DATABASE IF NOT EXISTS azuremed_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE azuremed_hub;

-- ---------------------------------------------------------------------------
-- users: 4 roles.
--   admin  -> full access (/admin), revenue + system config
--   staff  -> healthcare staff/cashiers (/staff), POS + stock, no financials
--   agent  -> front-line portal user operating from the public site ("/")
--   user   -> ordinary customer account on the storefront
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'agent', 'user') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- medicines: inventory + expiry tracking. cost_price is only ever selected
-- by owner-scoped queries in the app layer (never sent to /staff routes) so
-- margin stays owner-only even though the column lives in one shared table.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  description TEXT NULL,
  image_url TEXT NULL,
  selling_price_ks INT NOT NULL,
  cost_price_ks INT NULL,
  stock_qty INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 20,
  expiry_date DATE NULL,
  status ENUM('normal', 'low', 'expired') NOT NULL DEFAULT 'normal',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_medicines_status (status),
  INDEX idx_medicines_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- sales: one row per POS/checkout transaction.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_code VARCHAR(100) NOT NULL UNIQUE,
  handled_by_user_id INT NOT NULL,
  customer_name VARCHAR(255) NULL,
  customer_phone VARCHAR(50) NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
  subtotal_ks INT NOT NULL,
  tax_ks INT NOT NULL DEFAULT 0,
  total_ks INT NOT NULL,
  status ENUM('completed', 'refunded', 'void') NOT NULL DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sales_user FOREIGN KEY (handled_by_user_id) REFERENCES users(id),
  INDEX idx_sales_handled_by (handled_by_user_id),
  INDEX idx_sales_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- sale_items: line items per sale.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  medicine_id INT NOT NULL,
  qty INT NOT NULL,
  unit_price_ks INT NOT NULL,
  total_price_ks INT NOT NULL,
  CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  INDEX idx_sale_items_sale (sale_id),
  INDEX idx_sale_items_medicine (medicine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- ai_detection_logs: one row per AI image-detection request made through
-- /api/ai/detect. image_url points at the saved upload (public/uploads/detections),
-- matched_medicine_id is NULL when nothing scored above the match threshold.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_detection_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  image_url TEXT NOT NULL,
  detected_label VARCHAR(255) NULL,
  confidence DECIMAL(5, 4) NULL,
  matched_medicine_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_logs_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_ai_logs_medicine FOREIGN KEY (matched_medicine_id) REFERENCES medicines(id) ON DELETE SET NULL,
  INDEX idx_ai_logs_user (user_id),
  INDEX idx_ai_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- cart_items: storefront shopping cart, one row per (user, medicine).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  medicine_id INT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_cart_user_medicine UNIQUE (user_id, medicine_id),
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  INDEX idx_cart_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- orders / order_items: customer-placed storefront checkouts (distinct from
-- `sales`, which are staff/agent POS transactions).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(100) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  payment_method ENUM('kpay', 'cod') NOT NULL,
  shipping_name VARCHAR(255) NOT NULL,
  shipping_email VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(50) NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_address TEXT NOT NULL,
  subtotal_ks INT NOT NULL,
  tax_ks INT NOT NULL,
  delivery_fee_ks INT NOT NULL DEFAULT 0,
  discount_ks INT NOT NULL DEFAULT 0,
  promo_code VARCHAR(50) NULL,
  total_ks INT NOT NULL,
  -- Fulfillment pipeline. 'confirmed' means "payment verified, ready to
  -- fulfill" (set by the payment-proof review below) — processing/shipped
  -- are separate staff-driven steps after that, 'delivered' is terminal.
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  -- payment_proof_url: uploaded KBZ Pay screenshot, saved to disk (see
  -- app/api/orders/route.ts) — NULL for COD, which needs no proof.
  -- payment_status: manual review outcome (owner or staff — see
  -- /api/staff/orders). Deliberately not an automated OCR/"is_valid"
  -- verdict — receipt OCR is unreliable enough that a human confirming real
  -- money changed hands is the safer default.
  payment_proof_url TEXT NULL,
  payment_status ENUM('not_required', 'pending_review', 'confirmed', 'rejected') NOT NULL DEFAULT 'not_required',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  medicine_id INT NOT NULL,
  qty INT NOT NULL,
  unit_price_ks INT NOT NULL,
  total_price_ks INT NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- store_settings: single-row (id=1) table of owner-configurable storefront
-- settings. Not a key/value table — the settings list is small and fixed,
-- so plain columns are simpler to read and query than EAV.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_settings (
  id TINYINT NOT NULL PRIMARY KEY DEFAULT 1,
  delivery_fee_ks INT NOT NULL DEFAULT 0,
  -- Orders at or above this subtotal get delivery_fee_ks waived (shown as
  -- FREE at checkout); below it, the configured fee still applies. Every
  -- order still gets delivered either way — there's no in-store pickup
  -- option in this app — this only ever waives the fee, never blocks
  -- checkout. 0 disables the threshold (fee always applies).
  free_delivery_threshold_ks INT NOT NULL DEFAULT 30000,
  low_stock_default_threshold INT NOT NULL DEFAULT 20,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_store_settings_singleton CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO store_settings (id, delivery_fee_ks, free_delivery_threshold_ks, low_stock_default_threshold) VALUES (1, 0, 30000, 20);

-- ---------------------------------------------------------------------------
-- promo_codes: owner-managed percentage discount codes, applied at checkout
-- (app/api/promo/validate/route.ts) and re-validated server-side in
-- app/api/orders/route.ts — the client-computed discount is never trusted.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promo_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_percent TINYINT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_promo_discount_range CHECK (discount_percent BETWEEN 1 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- customer_queries: "Handle Customer Queries" — a customer submits a
-- question via the storefront Support page, Staff/Owner see and answer it
-- from /staff/queries. One reply per query (a simple support inbox, not a
-- full threaded conversation).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_queries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('open', 'answered', 'closed') NOT NULL DEFAULT 'open',
  staff_response TEXT NULL,
  responded_by INT NULL,
  responded_at DATETIME NULL,
  -- Set only for queries submitted through the medicalbot Telegram bot (see
  -- app/api/support/telegram/route.ts) — NULL for ones submitted from the
  -- storefront Support page. user_id still points at a real row (the shared
  -- "Telegram Bot" service account from lib/telegramBot.ts, since a Telegram
  -- user has no website login) but these two columns preserve who actually
  -- asked, so /staff/queries and any future reply-back-to-Telegram feature
  -- can tell real customers apart from each other.
  telegram_chat_id BIGINT NULL,
  telegram_username VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_customer_queries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_customer_queries_responder FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_customer_queries_user (user_id),
  INDEX idx_customer_queries_status (status),
  INDEX idx_customer_queries_telegram_chat (telegram_chat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- staff_todos and staff_attendance (personal task list + check-in/out on the
-- Staff dashboard) were removed — feature deleted, not just hidden. See
-- scripts/applySchema.js for the DROP TABLE that retires them on existing
-- databases.

-- ---------------------------------------------------------------------------
-- reviews: customer testimonials shown on the storefront (Testimonials.jsx).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- NULL for the original owner-seeded demo testimonials; set for any
  -- customer-submitted one. UNIQUE on user_id caps a real customer to one
  -- testimonial (resubmitting edits it) while still allowing any number of
  -- NULL rows (MySQL/MariaDB unique indexes don't treat NULL as a duplicate).
  user_id INT NULL,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NULL,
  comment TEXT NOT NULL,
  rating TINYINT NOT NULL DEFAULT 5,
  avatar_url TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_reviews_user UNIQUE (user_id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_reviews_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- product_reviews: real customer reviews on a specific product. Distinct
-- from `reviews` (owner-curated homepage testimonials, no product link) —
-- these are user-submitted, restricted server-side to customers who actually
-- have a non-cancelled order containing the medicine (see
-- app/api/products/[id]/reviews/route.ts), one review per (user, medicine)
-- so re-submitting edits rather than duplicates.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_reviews_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_product_reviews_user_medicine UNIQUE (user_id, medicine_id),
  CONSTRAINT chk_product_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_product_reviews_medicine (medicine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- password_reset_tokens: "Forgot Password" flow. Only the SHA-256 hash of
-- the token is stored (like a password) — the raw token only ever exists in
-- the emailed link and the requester's browser, never at rest in the DB.
-- Short-lived (30 min) and single-use (used_at set on redemption).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_reset_tokens_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- advertisements: Admin-managed promo slideshow shown on the storefront home
-- page, right below the hero. sort_order controls slide order (lower first);
-- is_active lets an Admin hide a slide without deleting it.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS advertisements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(500) NULL,
  -- Myanmar counterparts, optional — if left blank the storefront falls
  -- back to the English title/description when displaying in Myanmar mode
  -- (see components/AdvertisementSlideshow.tsx), so filling these in is
  -- never required to publish a slide.
  title_my VARCHAR(255) NULL,
  description_my VARCHAR(500) NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_advertisements_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
