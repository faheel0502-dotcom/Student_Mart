const { pool } = require('./config/db');

const dummyProducts = [
  { title: 'Calculus Early Transcendentals', img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80' },
  { title: 'Introduction to Algorithms', img: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80' },
  { title: 'MacBook Pro 13"', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
  { title: 'Sony WH-1000XM4', img: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80' },
  { title: 'IKEA Office Chair', img: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=800&q=80' },
  { title: 'Study Desk', img: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80' },
  { title: 'University Hoodie', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80' },
  { title: 'Denim Jacket', img: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80' },
  { title: 'Basketball', img: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80' },
  { title: 'Yoga Mat', img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80' },
  { title: 'Drafting Kit', img: 'https://images.unsplash.com/photo-1583485088034-697b5a624baf?auto=format&fit=crop&w=800&q=80' },
  { title: 'Scientific Calculator', img: 'https://images.unsplash.com/photo-1583088580009-2d947c3e90a6?auto=format&fit=crop&w=800&q=80' },
  { title: 'Mountain Bike', img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80' },
  { title: 'Acoustic Guitar', img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80' },
  { title: 'Mini Fridge', img: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80' },
  // Adding default images for real products based on their titles just to fix the UI:
  { title: 'Drafter', img: 'https://images.unsplash.com/photo-1583485088034-697b5a624baf?auto=format&fit=crop&w=800&q=80' },
  { title: 'Books ', img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80' },
  { title: 'Airpods - Madrabbit', img: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80' },
  { title: 'Test Book', img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80' },
];

async function run() {
  const [products] = await pool.query('SELECT id, title FROM products');
  for (const p of products) {
    const dummy = dummyProducts.find(d => p.title.includes(d.title.trim()));
    if (dummy) {
      await pool.query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)', [p.id, dummy.img]);
    } else {
      // generic fallback image
      await pool.query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)', [p.id, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80']);
    }
  }
  console.log('Images restored');
  process.exit(0);
}
run();
