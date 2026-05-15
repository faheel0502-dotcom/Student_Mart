const { pool } = require('./config/db');

const seedProducts = async () => {
  try {
    // 1. Get a user to act as a seller
    const [users] = await pool.query('SELECT id FROM users LIMIT 1');
    let sellerId;
    if (users.length === 0) {
      const [result] = await pool.query(`
        INSERT INTO users (full_name, email, password_hash, college_name) 
        VALUES ('System Seeder', 'seeder@studentmart.com', 'hashedpassword', 'Example University')
      `);
      sellerId = result.insertId;
    } else {
      sellerId = users[0].id;
    }

    // 2. Get categories
    const [categories] = await pool.query('SELECT id, name FROM categories');
    if (categories.length === 0) {
      console.log('No categories found. Creating some...');
      await pool.query(`INSERT INTO categories (name, slug, icon) VALUES 
        ('Electronics', 'electronics', 'laptop'),
        ('Books', 'books', 'book'),
        ('Furniture', 'furniture', 'sofa'),
        ('Clothing', 'clothing', 'shirt')
      `);
      const [newCats] = await pool.query('SELECT id, name FROM categories');
      categories.push(...newCats);
    }

    const dummyProducts = [
      {
        categoryName: 'Textbooks',
        items: [
          { title: 'Calculus Early Transcendentals', desc: '8th edition. Clean pages, no highlights. Great for Math 101.', price: 40, img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80' },
          { title: 'Introduction to Algorithms', desc: 'CLRS 3rd Edition. Essential for computer science students.', price: 60, img: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80' }
        ]
      },
      {
        categoryName: 'Electronics',
        items: [
          { title: 'MacBook Pro 13"', desc: '2020 MacBook Pro in good condition. M1 chip, 8GB RAM, 256GB SSD.', price: 800, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
          { title: 'Sony WH-1000XM4', desc: 'Noise cancelling headphones. Barely used, comes with case.', price: 150, img: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80' }
        ]
      },
      {
        categoryName: 'Furniture',
        items: [
          { title: 'IKEA Office Chair', desc: 'Comfortable mesh office chair. Moving out sale.', price: 25, img: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=800&q=80' },
          { title: 'Study Desk', desc: 'Wooden study desk with 2 drawers. Perfect for dorm rooms.', price: 45, img: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80' }
        ]
      },
      {
        categoryName: 'Clothing',
        items: [
          { title: 'University Hoodie', desc: 'Size M. Warm and comfortable, worn a few times.', price: 15, img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80' },
          { title: 'Denim Jacket', desc: 'Vintage denim jacket. Good condition, stylish for everyday wear.', price: 30, img: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80' }
        ]
      },
      {
        categoryName: 'Sports',
        items: [
          { title: 'Basketball', desc: 'Spalding indoor/outdoor basketball. Used for one semester.', price: 10, img: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80' },
          { title: 'Yoga Mat', desc: 'Non-slip yoga mat with carrying strap. Excellent condition.', price: 15, img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80' }
        ]
      },
      {
        categoryName: 'Stationery',
        items: [
          { title: 'Drafting Kit', desc: 'Complete architecture drafting kit with T-square and compass.', price: 20, img: 'https://images.unsplash.com/photo-1583485088034-697b5a624baf?auto=format&fit=crop&w=800&q=80' },
          { title: 'Scientific Calculator', desc: 'Texas Instruments TI-30XS. Required for most STEM classes.', price: 12, img: 'https://images.unsplash.com/photo-1583088580009-2d947c3e90a6?auto=format&fit=crop&w=800&q=80' }
        ]
      },
      {
        categoryName: 'Cycles',
        items: [
          { title: 'Mountain Bike', desc: '21-speed mountain bike. Perfect for getting around campus.', price: 85, img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80' }
        ]
      },
      {
        categoryName: 'Instruments',
        items: [
          { title: 'Acoustic Guitar', desc: 'Yamaha acoustic guitar. Comes with gig bag and some picks.', price: 120, img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80' }
        ]
      },
      {
        categoryName: 'Others',
        items: [
          { title: 'Mini Fridge', desc: 'Dorm-sized mini fridge. Works perfectly, very clean.', price: 50, img: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80' }
        ]
      }
    ];

    for (const group of dummyProducts) {
      let catId = categories.find(c => c.name.toLowerCase().includes(group.categoryName.toLowerCase()))?.id;
      if (!catId) catId = categories[0].id; // fallback

      for (const item of group.items) {
        const [prodResult] = await pool.query(
          `INSERT INTO products (seller_id, category_id, title, description, price, condition_type, status, location, is_negotiable) 
           VALUES (?, ?, ?, ?, ?, 'good', 'active', 'Campus', 1)`,
          [sellerId, catId, item.title, item.desc, item.price]
        );
        
        await pool.query(
          `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)`,
          [prodResult.insertId, item.img]
        );
      }
    }

    console.log('✅ Random products seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();
