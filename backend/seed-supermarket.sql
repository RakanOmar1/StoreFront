INSERT INTO categories (name, description)
VALUES
  ('Fresh Produce', 'Fresh fruit and vegetables'),
  ('Dairy & Eggs', 'Milk, cheese, yogurt, and eggs'),
  ('Bakery', 'Bread and baked goods'),
  ('Pantry', 'Everyday cooking and cupboard essentials'),
  ('Beverages', 'Cold drinks, juice, coffee, and tea'),
  ('Snacks', 'Sweet and savory snacks'),
  ('Household', 'Cleaning and household essentials')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO products (name, price, category, description, url, images, category_id)
SELECT seed.name, seed.price, seed.category, seed.description, seed.url,
       jsonb_build_array(seed.url), categories.id
FROM (VALUES
  ('Bananas 1 kg', 4, 'Fresh Produce', 'Naturally sweet fresh bananas, approximately 1 kg.', 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=900&q=80'),
  ('Red Apples 1 kg', 7, 'Fresh Produce', 'Crisp red apples selected for freshness.', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=900&q=80'),
  ('Tomatoes 1 kg', 6, 'Fresh Produce', 'Ripe tomatoes for salads, sandwiches, and cooking.', 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80'),
  ('Fresh Milk 1 L', 7, 'Dairy & Eggs', 'Pasteurized whole milk in a one-liter carton.', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80'),
  ('Free-Range Eggs 12 Pack', 14, 'Dairy & Eggs', 'A dozen fresh free-range eggs.', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=900&q=80'),
  ('Greek Yogurt 500 g', 11, 'Dairy & Eggs', 'Thick and creamy natural Greek-style yogurt.', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80'),
  ('Whole Wheat Bread', 10, 'Bakery', 'Soft sliced whole-wheat loaf baked for everyday meals.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80'),
  ('Butter Croissants 4 Pack', 16, 'Bakery', 'Flaky butter croissants, ready for breakfast.', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80'),
  ('Basmati Rice 1 kg', 13, 'Pantry', 'Long-grain aromatic basmati rice.', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80'),
  ('Italian Pasta 500 g', 8, 'Pantry', 'Durum-wheat pasta for quick family meals.', 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?auto=format&fit=crop&w=900&q=80'),
  ('Extra Virgin Olive Oil 750 ml', 35, 'Pantry', 'Cold-pressed extra virgin olive oil.', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80'),
  ('Orange Juice 1 L', 12, 'Beverages', 'Refreshing orange juice with no added sugar.', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=80'),
  ('Ground Coffee 250 g', 24, 'Beverages', 'Medium-roast ground coffee with a balanced flavor.', 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80'),
  ('Sea Salt Potato Chips 150 g', 9, 'Snacks', 'Crunchy potato chips seasoned with sea salt.', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=900&q=80'),
  ('Dark Chocolate 100 g', 12, 'Snacks', 'Rich dark chocolate bar with 70% cocoa.', 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=900&q=80'),
  ('Dishwashing Liquid 750 ml', 15, 'Household', 'Concentrated lemon-scented dishwashing liquid.', 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=80'),
  ('Paper Towels 6 Rolls', 22, 'Household', 'Strong and absorbent two-ply paper towels.', 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=900&q=80')
) AS seed(name, price, category, description, url)
JOIN categories ON categories.name = seed.category
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = seed.name);
