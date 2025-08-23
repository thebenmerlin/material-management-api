# Material Management API

A comprehensive REST API for construction site material management with role-based access control, approval workflows, and reporting capabilities.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Material Catalog**: Searchable material database with specifications
- **Indent Management**: Create, approve, and track material indents
- **Order Processing**: Purchase team order management with vendor details
- **Receipt Verification**: Site engineer receipt confirmation with image uploads
- **Reporting**: Monthly cost and indent reports with Excel export
- **Site Isolation**: Data isolation for site engineers

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer (local storage)
- **Validation**: Joi
- **Excel Generation**: ExcelJS
- **Security**: Helmet.js, CORS

## Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Initialize database with sample data
npm run init-db

# Start development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
DB_PATH=./db/material_management.db
UPLOAD_DIR=./uploads
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.100:8081
NODE_ENV=development
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/logout` | User logout | Public |
| POST | `/api/auth/refresh` | Refresh token | Public |

### Materials

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/materials` | Get materials catalog | All roles |
| GET | `/api/materials/categories` | Get material categories | All roles |
| GET | `/api/materials/:id` | Get material by ID | All roles |

### Indents

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/indents` | Create new indent | Site Engineer |
| GET | `/api/indents` | Get indents with filtering | All roles |
| GET | `/api/indents/:id` | Get indent details | All roles |
| PUT | `/api/indents/:id/approve` | Approve/reject indent | Purchase Team, Director |

### Orders

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/orders` | Create order | Purchase Team |
| GET | `/api/orders` | Get orders with filtering | All roles |
| GET | `/api/orders/:id` | Get order details | All roles |
| PUT | `/api/orders/:id` | Update order | Purchase Team |

### Receipts

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/receipts` | Create receipt with images | Site Engineer |
| GET | `/api/receipts` | Get receipts with filtering | All roles |
| GET | `/api/receipts/:id` | Get receipt details | All roles |
| GET | `/api/receipts/dashboard/stats` | Get dashboard statistics | All roles |

### Reports

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/reports/monthly` | Download monthly Excel report | Purchase Team, Director |
| GET | `/api/reports/data` | Get monthly report data (JSON) | Purchase Team, Director |

## Sample Data

The database is initialized with sample users:

| Username | Password | Role | Site |
|----------|----------|------|------|
| engineer1 | password123 | Site Engineer | SITE001 |
| engineer2 | password123 | Site Engineer | SITE002 |
| purchase1 | password123 | Purchase Team | All sites |
| director1 | password123 | Director | All sites |

## API Usage Examples

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "engineer1",
    "password": "password123",
    "site_code": "SITE001"
  }'
```

### Get Materials

```bash
curl -X GET "http://localhost:3000/api/materials?search=cement" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Indent

```bash
curl -X POST http://localhost:3000/api/indents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "material_id": 1,
        "quantity": 100,
        "specifications": {"grade": "53"},
        "estimated_unit_cost": 350
      }
    ]
  }'
```

### Approve Indent

```bash
curl -X PUT http://localhost:3000/api/indents/1/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve"
  }'
```

### Upload Receipt with Images

```bash
curl -X POST http://localhost:3000/api/receipts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "images=@receipt1.jpg" \
  -F "images=@receipt2.jpg" \
  -F "order_id=1" \
  -F "received_date=2024-01-15" \
  -F "items=[{\"order_item_id\":1,\"received_quantity\":50}]"
```

## Role-Based Access Control

### Site Engineer
- Create indents for their assigned site
- View indents, orders, receipts for their site only
- Create receipts with image uploads
- Cannot see pricing information

### Purchase Team
- View all sites' data
- Approve indents (first-tier approval)
- Create and update orders with vendor details
- Access to all pricing information
- Generate monthly reports

### Director
- View all sites' data
- Final approval for indents (second-tier approval)
- Access to all pricing information
- Generate monthly reports

## Security Features

- JWT authentication with 24-hour expiry
- Role-based endpoint access control
- Site data isolation for Site Engineers
- Input validation with Joi schemas
- File upload restrictions (images only, 5MB limit)
- CORS protection
- Helmet.js security headers
- Parameterized SQL queries

## Database Schema

The application uses SQLite with the following main tables:

- `users` - User accounts with roles and site assignments
- `sites` - Construction site information
- `materials` - Material catalog with specifications
- `indents` - Material indent requests with approval workflow
- `indent_items` - Individual items in each indent
- `orders` - Purchase orders with vendor details
- `order_items` - Individual items in each order
- `receipts` - Delivery receipts with verification
- `receipt_items` - Individual items received
- `receipt_images` - Uploaded images for receipts

## Development

### Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run init-db      # Initialize database with sample data
```

### Project Structure

```
api/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/         # API route definitions
│   ├── middleware/     # Authentication, validation, file upload
│   ├── utils/          # Database helpers, validation schemas
│   └── server.ts       # Express app setup
├── db/                 # Database files and schema
├── uploads/            # File upload directory
└── README.md
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a secure `JWT_SECRET`
3. Configure proper CORS origins
4. Set up HTTPS/TLS
5. Use a production database (PostgreSQL recommended)
6. Configure file storage (AWS S3 recommended)
7. Set up proper logging and monitoring

## API Documentation

Visit `http://localhost:3000/api` for interactive API documentation when the server is running.

## Health Check

Visit `http://localhost:3000/health` to check server status.
