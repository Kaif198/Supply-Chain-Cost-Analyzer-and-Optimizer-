# Red Bull Austria Supply Chain Intelligence Platform

A comprehensive supply chain management platform for Red Bull Austria featuring route optimization, cost calculation, analytics dashboards, and real-time mapping with dark mode Red Bull branding.

## 🚀 Features

- **Route Optimization**: Multi-mode optimization (fastest, cheapest, greenest, balanced) with real-time calculations
- **Cost Calculator**: Comprehensive delivery cost analysis with warehouse selection
- **Interactive Map**: Real-time route visualization with color-coded polylines and numbered markers
- **Analytics Dashboard**: Performance metrics, delivery history, and insights
- **Fleet Management**: Vehicle tracking and capacity management
- **Premise Management**: Location management with 108+ Austrian venues
- **Dark Mode**: Red Bull branded dark theme with smooth transitions
- **Real-time Data**: 521+ historical deliveries for accurate analytics

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for blazing fast builds
- TailwindCSS for styling
- React Query for data fetching
- Recharts for analytics
- Leaflet for mapping
- React Router for navigation

### Backend
- Node.js + Express + TypeScript
- Prisma ORM with PostgreSQL
- JWT authentication
- Redis caching (optional)
- Winston logging
- Swagger API documentation

### Database
- PostgreSQL (Neon serverless)
- 108 premises across Austria
- 3 vehicle types
- 521 historical deliveries

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Neon account)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd red-bull-supply-chain
```

2. **Backend Setup**
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-secret-key-here"
PORT=3000
NODE_ENV=development
```

Run migrations and seed:
```bash
npx prisma migrate dev
npx prisma generate
npm run seed
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
```

## 🚀 Running Locally

**Backend** (from backend folder):
```bash
npm run dev
```
Server runs on http://localhost:3000

**Frontend** (from frontend folder):
```bash
npm run dev
```
App runs on http://localhost:5173

**Default Login**:
- Username: `admin`
- Password: `admin123`

## 🌐 Deployment

### Vercel Deployment (Frontend)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: 
     - `VITE_API_URL`: Your backend URL

### Backend Deployment Options

**Option 1: Railway**
1. Connect GitHub repo
2. Select backend folder
3. Add environment variables
4. Deploy

**Option 2: Render**
1. New Web Service
2. Connect repo, select backend folder
3. Build: `npm install && npx prisma generate`
4. Start: `npm start`
5. Add environment variables

**Option 3: Heroku**
```bash
cd backend
heroku create your-app-name
heroku addons:create heroku-postgresql:mini
git push heroku main
heroku run npx prisma migrate deploy
heroku run npm run seed
```

### Database (Neon)

1. Create account at neon.tech
2. Create new project
3. Copy connection string
4. Update DATABASE_URL in backend .env
5. Run migrations: `npx prisma migrate deploy`

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── repositories/    # Database access layer
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilities
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── package.json
└── README.md
```

## 🎨 Features Showcase

### Route Optimization
- 4 optimization modes with different algorithms
- Real-time cost, distance, and CO2 calculations
- Interactive map with color-coded routes
- Numbered stop markers

### Cost Calculator
- Dynamic warehouse selection
- Multi-premise cost analysis
- Detailed cost breakdown (fuel, labor, vehicle, carbon)
- Alpine terrain and overtime calculations

### Analytics Dashboard
- Delivery performance metrics
- Cost trends over time
- Vehicle utilization charts
- Category-wise analysis

### Dark Mode
- Red Bull branded color scheme (#DC0032)
- Smooth 200ms transitions
- Glassmorphism effects
- Custom scrollbar styling

## 🧪 Testing

**Backend Tests**:
```bash
cd backend
npm test
```

**Frontend Tests**:
```bash
cd frontend
npm test
```

## 📝 API Documentation

Once backend is running, visit:
- Swagger UI: http://localhost:3000/api-docs

## 🔐 Security

- JWT-based authentication
- Bcrypt password hashing
- Helmet.js security headers
- Rate limiting
- CORS configuration
- Input validation with Zod

## 🤝 Contributing

This is a demo project for Red Bull Austria recruitment. Not accepting contributions.

## 📄 License

Private project - All rights reserved

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- Red Bull Austria for the opportunity
- Built with modern web technologies
- Inspired by real-world supply chain challenges

---

**Note**: This is a demonstration project showcasing full-stack development capabilities for Red Bull Austria recruitment.
