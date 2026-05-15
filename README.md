# StudentMart — Campus Marketplace 🎓

A full-stack student marketplace where college students can **buy and sell** used items — textbooks, electronics, furniture, cycles, and more — with real-time chat, Razorpay payment integration, and a complete admin dashboard.

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Bootstrap 5, CSS Variables |
| Backend | Node.js, Express 4 |
| Database | MySQL (mysql2/promise) |
| Real-time | Socket.IO |
| Payments | Razorpay |
| Image Upload | Cloudinary |
| Auth | JWT (access + refresh tokens) |

---

## ✨ Features

### 👤 Users
- Register/Login with JWT authentication
- Browse & filter products (category, condition, price, search)
- Product detail page with image gallery
- Real-time chat with sellers (Socket.IO)
- Buy products via Razorpay
- Wishlist management
- Order history (bought & sold)
- Profile editing with avatar upload

### 🏷️ Sellers
- Pay ₹5 listing fee via Razorpay to publish a product
- Upload up to 5 product images (Cloudinary)
- Manage own listings

### 🛡️ Admin Panel
- Dashboard with revenue stats
- User management (ban/unban)
- Product moderation (remove listings)
- Transaction history

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+
- Cloudinary account
- Razorpay account (test mode works)

### 1. Database Setup
```sql
-- Run the schema file in MySQL Workbench or CLI:
mysql -u root -p < server/config/schema.sql
```

### 2. Server Setup
```bash
cd server
# Edit .env with your actual credentials (DB, JWT, Cloudinary, Razorpay)
nano .env
npm install
npm run dev        # starts on http://localhost:5000
```

### 3. Client Setup
```bash
cd client
npm install
npm start          # starts on http://localhost:3000
```

### 4. Or use the root launcher (opens 2 terminal windows)
```bash
npm run dev
```

---

## ⚙️ Environment Variables (`server/.env`)

```env
PORT=5000
NODE_ENV=development

# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=studentmart_db

# JWT
JWT_SECRET=your_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay (use test keys for development)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret

# Platform fees (INR)
POSTING_FEE=5
PLATFORM_FEE=5

CLIENT_URL=http://localhost:3000
```

---

## 📁 Project Structure

```
Martt/
├── server/
│   ├── config/
│   │   ├── db.js            # MySQL pool
│   │   ├── cloudinary.js    # Multer + Cloudinary
│   │   ├── razorpay.js      # Razorpay instance
│   │   └── schema.sql       # Database schema
│   ├── controllers/         # Business logic
│   ├── middleware/auth.js   # JWT + role guards
│   ├── routes/              # Express routers
│   ├── sockets/chatSocket.js # Socket.IO real-time chat
│   └── index.js             # Entry point
│
└── client/
    ├── public/
    │   └── index.html       # Razorpay SDK loaded here
    └── src/
        ├── components/      # Navbar, BottomNav, ProductCard
        ├── context/         # AuthContext, SocketContext
        ├── css/global.css   # Design system + tokens
        ├── layouts/         # MainLayout, AdminLayout
        ├── pages/           # All page components
        │   └── admin/       # Admin dashboard pages
        └── services/        # Axios API service layer
```

---

## 🔌 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/products` | Get all products (filtered) |
| GET | `/api/products/:id` | Get product detail |
| POST | `/api/products` | Create listing (auth + payment) |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment signature |
| POST | `/api/payments/purchase` | Complete product purchase |
| GET | `/api/chat/conversations` | Get all conversations |
| POST | `/api/chat/conversations` | Start/get conversation |
| GET | `/api/admin/dashboard` | Admin stats |

---

## 🎮 Admin Account
To create an admin, update a user's role in MySQL:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## 📝 Notes
- Razorpay runs in **test mode** by default — use test card: `4111 1111 1111 1111`
- Images are stored on **Cloudinary** — product images are resized to 800×800, avatars to 200×200
- Socket.IO handles **real-time messaging** and **typing indicators**
- Rate limiting: 300 req/15min globally, 20 req/15min for auth routes
