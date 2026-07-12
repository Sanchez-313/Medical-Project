-- AzureMed Hub schema (raw MySQL, no ORM)
-- Run with: mysql -u root -p azuremed_hub < config/azuremed_schema.sql

CREATE DATABASE IF NOT EXISTS azuremed_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE azuremed_hub;

-- ---------------------------------------------------------------------------
-- users: 4 roles.
--   owner  -> full access (/admin), revenue + system config
--   staff  -> healthcare staff/cashiers (/staff), POS + stock, no financials
--   agent  -> front-line portal user operating from the public site ("/")
--   user   -> ordinary customer account on the storefront
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner', 'staff', 'agent', 'user') NOT NULL DEFAULT 'user',
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
