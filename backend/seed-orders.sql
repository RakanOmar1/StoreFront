-- Mock customers reuse the local demo admin's password hash, so every demo
-- customer can be accessed with password 000000.
INSERT INTO users (name, firstname, lastname, email, phone, address, city, role, is_active, password_digest)
SELECT customer.name, customer.firstname, customer.lastname, customer.email, customer.phone,
       customer.address, customer.city, 'CUSTOMER', TRUE, admin.password_digest
FROM (VALUES
  ('Noa Cohen', 'Noa', 'Cohen', 'noa.cohen@example.local', '050-555-0101', '12 Herzl Street', 'Tel Aviv'),
  ('Daniel Levi', 'Daniel', 'Levi', 'daniel.levi@example.local', '050-555-0102', '8 Jaffa Road', 'Jerusalem'),
  ('Maya Mizrahi', 'Maya', 'Mizrahi', 'maya.mizrahi@example.local', '050-555-0103', '24 Hanassi Boulevard', 'Haifa'),
  ('Omer Peretz', 'Omer', 'Peretz', 'omer.peretz@example.local', '050-555-0104', '5 Rager Avenue', 'Beer Sheva')
) AS customer(name, firstname, lastname, email, phone, address, city)
CROSS JOIN LATERAL (
  SELECT password_digest FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1
) admin
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  firstname = EXCLUDED.firstname,
  lastname = EXCLUDED.lastname,
  address = EXCLUDED.address,
  city = EXCLUDED.city;

WITH mock_orders(email, created_at, status, payment_status, payment_method, delivery_type, delivery_address) AS (
  VALUES
    ('noa.cohen@example.local',    TIMESTAMP '2026-03-08 10:15:00', 'DELIVERED',        'PAID',     'ONLINE', 'DELIVERY', '12 Herzl Street, Tel Aviv'),
    ('daniel.levi@example.local',  TIMESTAMP '2026-03-19 17:40:00', 'DELIVERED',        'PAID',     'CASH',   'PICKUP',   NULL),
    ('maya.mizrahi@example.local', TIMESTAMP '2026-04-04 09:20:00', 'CANCELLED',        'REFUNDED', 'ONLINE', 'DELIVERY', '24 Hanassi Boulevard, Haifa'),
    ('omer.peretz@example.local',  TIMESTAMP '2026-04-22 13:05:00', 'DELIVERED',        'PAID',     'ONLINE', 'PICKUP',   NULL),
    ('noa.cohen@example.local',    TIMESTAMP '2026-05-11 18:30:00', 'DELIVERED',        'PAID',     'CASH',   'DELIVERY', '12 Herzl Street, Tel Aviv'),
    ('daniel.levi@example.local',  TIMESTAMP '2026-05-26 11:10:00', 'DELIVERED',        'PAID',     'ONLINE', 'DELIVERY', '8 Jaffa Road, Jerusalem'),
    ('maya.mizrahi@example.local', TIMESTAMP '2026-06-07 16:45:00', 'DELIVERED',        'PAID',     'ONLINE', 'PICKUP',   NULL),
    ('omer.peretz@example.local',  TIMESTAMP '2026-06-21 12:00:00', 'CANCELLED',        'FAILED',   'ONLINE', 'DELIVERY', '5 Rager Avenue, Beer Sheva'),
    ('noa.cohen@example.local',    TIMESTAMP '2026-07-03 08:55:00', 'DELIVERED',        'PAID',     'CASH',   'PICKUP',   NULL),
    ('daniel.levi@example.local',  TIMESTAMP '2026-07-18 19:25:00', 'OUT_FOR_DELIVERY', 'PAID',     'ONLINE', 'DELIVERY', '8 Jaffa Road, Jerusalem'),
    ('maya.mizrahi@example.local', TIMESTAMP '2026-08-06 14:35:00', 'PREPARING',        'PAID',     'ONLINE', 'DELIVERY', '24 Hanassi Boulevard, Haifa'),
    ('omer.peretz@example.local',  TIMESTAMP '2026-08-14 10:05:00', 'CONFIRMED',        'PENDING',  'CASH',   'PICKUP',   NULL),
    ('noa.cohen@example.local',    TIMESTAMP '2026-08-22 17:15:00', 'PENDING',          'PENDING',  'ONLINE', 'DELIVERY', '12 Herzl Street, Tel Aviv')
)
INSERT INTO orders (user_id, total_amount, status, payment_status, payment_method, delivery_type, delivery_address, created_at, updated_at)
SELECT users.id, 0, mock_orders.status, mock_orders.payment_status, mock_orders.payment_method,
       mock_orders.delivery_type, mock_orders.delivery_address, mock_orders.created_at, mock_orders.created_at
FROM mock_orders
JOIN users ON users.email = mock_orders.email
WHERE NOT EXISTS (
  SELECT 1 FROM orders
  WHERE orders.user_id = users.id AND orders.created_at = mock_orders.created_at
);

WITH mock_items(email, created_at, product_name, quantity) AS (
  VALUES
    ('noa.cohen@example.local',    TIMESTAMP '2026-03-08 10:15:00', 'Bananas 1 kg', 2),
    ('noa.cohen@example.local',    TIMESTAMP '2026-03-08 10:15:00', 'Fresh Milk 1 L', 1),
    ('noa.cohen@example.local',    TIMESTAMP '2026-03-08 10:15:00', 'Whole Wheat Bread', 1),
    ('daniel.levi@example.local',  TIMESTAMP '2026-03-19 17:40:00', 'Basmati Rice 1 kg', 2),
    ('daniel.levi@example.local',  TIMESTAMP '2026-03-19 17:40:00', 'Italian Pasta 500 g', 3),
    ('maya.mizrahi@example.local', TIMESTAMP '2026-04-04 09:20:00', 'Extra Virgin Olive Oil 750 ml', 1),
    ('maya.mizrahi@example.local', TIMESTAMP '2026-04-04 09:20:00', 'Red Apples 1 kg', 2),
    ('omer.peretz@example.local',  TIMESTAMP '2026-04-22 13:05:00', 'Ground Coffee 250 g', 2),
    ('omer.peretz@example.local',  TIMESTAMP '2026-04-22 13:05:00', 'Dark Chocolate 100 g', 3),
    ('noa.cohen@example.local',    TIMESTAMP '2026-05-11 18:30:00', 'Tomatoes 1 kg', 2),
    ('noa.cohen@example.local',    TIMESTAMP '2026-05-11 18:30:00', 'Free-Range Eggs 12 Pack', 1),
    ('noa.cohen@example.local',    TIMESTAMP '2026-05-11 18:30:00', 'Greek Yogurt 500 g', 2),
    ('daniel.levi@example.local',  TIMESTAMP '2026-05-26 11:10:00', 'Paper Towels 6 Rolls', 2),
    ('daniel.levi@example.local',  TIMESTAMP '2026-05-26 11:10:00', 'Dishwashing Liquid 750 ml', 1),
    ('maya.mizrahi@example.local', TIMESTAMP '2026-06-07 16:45:00', 'Butter Croissants 4 Pack', 2),
    ('maya.mizrahi@example.local', TIMESTAMP '2026-06-07 16:45:00', 'Orange Juice 1 L', 2),
    ('omer.peretz@example.local',  TIMESTAMP '2026-06-21 12:00:00', 'Extra Virgin Olive Oil 750 ml', 2),
    ('noa.cohen@example.local',    TIMESTAMP '2026-07-03 08:55:00', 'Sea Salt Potato Chips 150 g', 3),
    ('noa.cohen@example.local',    TIMESTAMP '2026-07-03 08:55:00', 'Dark Chocolate 100 g', 2),
    ('daniel.levi@example.local',  TIMESTAMP '2026-07-18 19:25:00', 'Red Apples 1 kg', 2),
    ('daniel.levi@example.local',  TIMESTAMP '2026-07-18 19:25:00', 'Fresh Milk 1 L', 3),
    ('daniel.levi@example.local',  TIMESTAMP '2026-07-18 19:25:00', 'Whole Wheat Bread', 2),
    ('maya.mizrahi@example.local', TIMESTAMP '2026-08-06 14:35:00', 'Basmati Rice 1 kg', 1),
    ('maya.mizrahi@example.local', TIMESTAMP '2026-08-06 14:35:00', 'Italian Pasta 500 g', 2),
    ('maya.mizrahi@example.local', TIMESTAMP '2026-08-06 14:35:00', 'Tomatoes 1 kg', 2),
    ('omer.peretz@example.local',  TIMESTAMP '2026-08-14 10:05:00', 'Free-Range Eggs 12 Pack', 2),
    ('omer.peretz@example.local',  TIMESTAMP '2026-08-14 10:05:00', 'Fresh Milk 1 L', 2),
    ('noa.cohen@example.local',    TIMESTAMP '2026-08-22 17:15:00', 'Bananas 1 kg', 3),
    ('noa.cohen@example.local',    TIMESTAMP '2026-08-22 17:15:00', 'Greek Yogurt 500 g', 1),
    ('noa.cohen@example.local',    TIMESTAMP '2026-08-22 17:15:00', 'Orange Juice 1 L', 1)
)
INSERT INTO order_products (order_id, product_id, quantity, price)
SELECT orders.id, products.id, mock_items.quantity, products.price
FROM mock_items
JOIN users ON users.email = mock_items.email
JOIN orders ON orders.user_id = users.id AND orders.created_at = mock_items.created_at
JOIN products ON products.name = mock_items.product_name
WHERE NOT EXISTS (
  SELECT 1 FROM order_products
  WHERE order_products.order_id = orders.id AND order_products.product_id = products.id
);

UPDATE orders
SET total_amount = totals.amount
FROM (
  SELECT order_id, SUM(quantity * price) AS amount
  FROM order_products
  GROUP BY order_id
) totals
WHERE orders.id = totals.order_id
  AND orders.user_id IN (SELECT id FROM users WHERE email LIKE '%@example.local');
