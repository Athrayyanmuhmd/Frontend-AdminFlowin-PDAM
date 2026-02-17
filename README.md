# Flowin Admin Panel

> **Panel Administrasi Terintegrasi untuk Pengelolaan Operasional Smart Water Meter**
> PERUMDAM Tirta Daroy Kota Banda Aceh

[![Next.js](https://img.shields.io/badge/Next.js-15.1.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/MUI-6.0-007FFF?logo=mui)](https://mui.com/)
[![Apollo Client](https://img.shields.io/badge/Apollo%20Client-4.1-311C87?logo=apollo-graphql)](https://www.apollographql.com/docs/react/)

## 📋 Overview

Flowin Admin Panel adalah aplikasi web administrasi berbasis Next.js untuk mengelola operasional sistem smart water meter PDAM yang melayani 14.000 pengguna. Sistem ini menyediakan dashboard eksekutif, manajemen pelanggan, billing, operasi lapangan, monitoring SCADA, dan sistem pelaporan terintegrasi.

## ✨ Key Features

### 🎯 Dashboard & Analytics
- Executive dashboard dengan real-time metrics
- Operational dashboard untuk monitoring harian
- Visualisasi data dengan Chart.js
- KPI tracking dan trending

### 👥 Customer Management
- Customer Information System (CIS)
- Profile management pelanggan
- Kelompok pelanggan dan tarif
- Integrasi dengan smart meter

### 💰 Billing & Payment
- Automated monthly billing generation
- Payment processing via Midtrans
- Invoice management
- Payment history tracking
- Overdue monitoring

### 🔧 Field Operations
- Work order management
- Technician assignment
- Survey data collection
- RAB (budget estimate) processing
- Connection application workflow

### 📊 SCADA & Monitoring
- Real-time smart meter monitoring
- Water usage analytics
- Leak detection
- Remote meter configuration

### 📱 Mobile Interface
- Responsive design untuk teknisi lapangan
- Mobile-optimized work order interface
- Field data collection

### 📈 Reporting System
- Operational reports
- Financial reports
- Compliance reports
- Custom report generation

## 🚀 Tech Stack

**Frontend Framework:**
- Next.js 15.1.0 (App Router)
- React 19
- TypeScript 5.0

**UI/UX:**
- Material-UI v6
- Tailwind CSS
- Chart.js untuk visualisasi data
- Responsive & mobile-first design

**State Management:**
- Redux Toolkit
- Apollo Client v4 cache

**API Integration:**
- Apollo Client v4 (GraphQL)
- Axios (REST fallback)

**Testing:**
- Jest (unit tests)
- Cypress (E2E tests)
- React Testing Library

**Code Quality:**
- ESLint
- TypeScript strict mode
- Prettier (code formatting)

## 📦 Installation

### Prerequisites

- Node.js 18+ atau 20+
- npm atau yarn
- Backend API running (GraphQL endpoint)

### Setup

```bash
# Clone repository
git clone https://github.com/Athrayyanmuhmd/flowin_adminPanel_FE.git
cd flowin_adminPanel_FE

# Install dependencies
npm install --legacy-peer-deps

# Setup environment variables
cp env.example .env.local

# Edit .env.local dengan konfigurasi Anda
nano .env.local
```

### Environment Variables

Create `.env.local` file:

```env
# Backend API URL
NEXT_PUBLIC_BASE_URL=http://localhost:5000/api

# App Metadata
NEXT_PUBLIC_APP_NAME=Flowin Admin Panel
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
# Server runs on http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

### Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🔐 Authentication

**Admin Login:**
- Endpoint: `/auth/login`
- Role: Admin atau Technician
- JWT-based authentication
- Token stored in localStorage

**Default Admin Account (Development):**
```
Email: admin@test.com
Password: admin123
```

⚠️ **Change default credentials in production!**

## 📱 Main Routes

```
/auth/login                          # Login page
/dashboard                           # Main dashboard
/customers/customer-info             # Customer management
/customers/customer-groups           # Tariff groups
/billing                             # Billing management
/operations/connection-data          # Connection applications
/operations/survey-data              # Survey data
/operations/rab-connection           # Budget estimates
/operations/work-orders              # Work orders
/monitoring/smart-meter              # Smart meter monitoring
/monitoring/scada                    # SCADA integration
/reports/*                           # Reporting system
/mobile/technician                   # Mobile interface
```

## 🏗️ Project Structure

```
flowin_adminPanel_FE/
├── app/
│   ├── (pages)/                    # App Router pages
│   │   ├── auth/                   # Authentication
│   │   ├── dashboard/              # Dashboards
│   │   ├── customers/              # Customer management
│   │   ├── billing/                # Billing system
│   │   ├── operations/             # Field operations
│   │   ├── monitoring/             # SCADA & meters
│   │   ├── reports/                # Reports
│   │   └── mobile/                 # Mobile UI
│   ├── components/                 # Reusable components
│   ├── layouts/                    # Layout components
│   ├── lib/                        # Libraries & utilities
│   │   └── graphql/                # GraphQL queries & hooks
│   ├── services/                   # Service layer
│   ├── store/                      # Redux store
│   ├── types/                      # TypeScript types
│   └── utils/                      # Utility functions
├── public/                         # Static assets
├── .env.local                      # Environment variables (not in git)
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind configuration
└── tsconfig.json                   # TypeScript configuration
```

## 🔌 GraphQL Integration

This application uses **Apollo Client v4** for GraphQL:

```typescript
// Example: Using GraphQL hooks
import { useQuery } from '@apollo/client/react';
import { GET_ALL_CUSTOMERS } from '@/lib/graphql/queries/customers';

function CustomerList() {
  const { loading, error, data } = useQuery(GET_ALL_CUSTOMERS);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return <CustomerTable data={data.getAllPengguna} />;
}
```

**GraphQL Queries Location:** `lib/graphql/queries/`
**GraphQL Mutations Location:** `lib/graphql/mutations/`
**Custom Hooks Location:** `lib/graphql/hooks/`

## 🌍 Localization

- **Primary Language:** Bahasa Indonesia
- **Date Format:** DD/MM/YYYY
- **Currency:** Indonesian Rupiah (IDR)
- **Timezone:** Asia/Jakarta

## 🔒 Security Features

- JWT authentication with secure token storage
- Role-based access control (RBAC)
- Permission-based UI rendering
- Protected routes with authentication guard
- CORS configuration
- Input validation
- XSS protection

## 📊 Performance Optimization

- Server-side rendering (SSR)
- Code splitting
- Image optimization
- Lazy loading components
- Apollo Client caching
- Memoization for expensive computations

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is developed as part of a thesis/final project (TA) at Universitas Syiah Kuala.

**Researcher:** Athar Rayyan Muhammad (2208107010074)

**Thesis Title:** Rancang Bangun Website Administrasi Terintegrasi untuk Pengelolaan Operasional Smart Water Meter pada PERUMDAM Tirta Daroy Kota Banda Aceh

## 🔗 Related Repositories

- **Backend API:** [flowin_adminPanel_BE](https://github.com/Athrayyanmuhmd/flowin_adminPanel_BE)

## 📞 Contact

**Athar Rayyan Muhammad**

Email: athrayyanmuhmd@gmail.com

GitHub: [@Athrayyanmuhmd](https://github.com/Athrayyanmuhmd)

---

Made with ❤️ for PERUMDAM Tirta Daroy Banda Aceh
