ALTER TABLE products
    ADD COLUMN IF NOT EXISTS expiry_date DATE NULL AFTER stock;

INSERT INTO products (id, name, slug, category, price_ks, stock, expiry_date, image_url, description, is_active)
VALUES
    (79, 'ဦးချိန်တီ(U Chain Te)', 'u-chain-te-79', 'MyanmarMedicine', 2200, 15, '2027-06-30', NULL, 'Headaches, minor fevers, stomach upset, and fatigue.', 1),
    (80, 'Generlog Oral', 'generlog-oral-80', 'EnglishMedicine', 4200, 18, '2027-08-31', NULL, 'Oral antibiotic medicine commonly used for bacterial infections. Use only as directed by the label or a healthcare professional.', 1),
    (81, 'Gentalene-C Cream', 'gentalene-c-cream-81', 'EnglishMedicine', 3900, 14, '2027-07-31', NULL, 'Topical cream commonly used for inflamed or irritated skin conditions. Apply as directed.', 1),
    (82, 'Win (Methylated Spirit)', 'win-methylated-spirit-82', 'MyanmarMedicine', 2500, 10, '2028-01-31', NULL, 'Topical antiseptic spirit used for external cleaning and hygiene support. For external use only.', 1),
    (83, 'Enervon-C', 'enervon-c-83', 'EnglishMedicine', 6500, 22, '2027-11-30', NULL, 'Multivitamin supplement with vitamin C to support daily wellness and energy.', 1),
    (84, 'Axiona', 'axiona-84', 'EnglishMedicine', 2800, 16, '2027-09-30', NULL, 'Pain relief medicine commonly used for mild to moderate aches and fever support. Use as directed.', 1),
    (85, 'Ribovit Tablet', 'ribovit-tablet-85', 'EnglishMedicine', 4800, 12, '2027-10-31', NULL, 'Vitamin B complex supplement used to support energy and nutritional balance.', 1),
    (86, 'Kotase', 'kotase-86', 'EnglishMedicine', 3000, 9, '2027-05-31', NULL, 'Digestive support medicine commonly used for stomach comfort and digestion support.', 1),
    (87, 'Multivitaminus', 'multivitaminus-87', 'EnglishMedicine', 5200, 20, '2027-12-31', NULL, 'Multivitamin supplement used to support daily nutritional needs and general wellness.', 1),
    (88, 'SEZO-B Cream', 'sezo-b-cream-88', 'EnglishMedicine', 3600, 11, '2027-08-31', NULL, 'Topical cream used for minor skin irritation and surface discomfort. Apply as directed.', 1),
    (89, 'Fungiderm Cream', 'fungiderm-cream-89', 'EnglishMedicine', 4300, 13, '2027-10-31', NULL, 'Antifungal cream commonly used for fungal skin infections and itching. Apply as directed.', 1)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    slug = VALUES(slug),
    category = VALUES(category),
    price_ks = VALUES(price_ks),
    stock = VALUES(stock),
    expiry_date = VALUES(expiry_date),
    description = VALUES(description),
    is_active = 1,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO inventory_items (product_id, name, sku, category, stock, total_stock, price_ks, status)
VALUES
    (79, 'ဦးချိန်တီ(U Chain Te)', 'MED-0079', 'MyanmarMedicine', 15, 15, 2200, 'low'),
    (80, 'Generlog Oral', 'MED-0080', 'EnglishMedicine', 18, 18, 4200, 'low'),
    (81, 'Gentalene-C Cream', 'MED-0081', 'EnglishMedicine', 14, 14, 3900, 'low'),
    (82, 'Win (Methylated Spirit)', 'MED-0082', 'MyanmarMedicine', 10, 10, 2500, 'low'),
    (83, 'Enervon-C', 'MED-0083', 'EnglishMedicine', 22, 22, 6500, 'low'),
    (84, 'Axiona', 'MED-0084', 'EnglishMedicine', 16, 16, 2800, 'low'),
    (85, 'Ribovit Tablet', 'MED-0085', 'EnglishMedicine', 12, 12, 4800, 'low'),
    (86, 'Kotase', 'MED-0086', 'EnglishMedicine', 9, 9, 3000, 'low'),
    (87, 'Multivitaminus', 'MED-0087', 'EnglishMedicine', 20, 20, 5200, 'low'),
    (88, 'SEZO-B Cream', 'MED-0088', 'EnglishMedicine', 11, 11, 3600, 'low'),
    (89, 'Fungiderm Cream', 'MED-0089', 'EnglishMedicine', 13, 13, 4300, 'low')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    sku = VALUES(sku),
    category = VALUES(category),
    stock = VALUES(stock),
    total_stock = VALUES(total_stock),
    price_ks = VALUES(price_ks),
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;
