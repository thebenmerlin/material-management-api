-- Material Management Database Schema

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_code VARCHAR(50) UNIQUE NOT NULL,
    site_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Site Engineer', 'Purchase Team', 'Director')),
    site_id INTEGER,
    full_name VARCHAR(255),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Materials catalog table
CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_code VARCHAR(100) UNIQUE NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50),
    specifications TEXT, -- JSON string for size, dimensions, color, etc.
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indents table
CREATE TABLE IF NOT EXISTS indents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indent_number VARCHAR(100) UNIQUE NOT NULL,
    site_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Purchase Approved', 'Director Approved', 'Rejected', 'Completed')),
    purchase_approved_by INTEGER,
    purchase_approved_at DATETIME,
    director_approved_by INTEGER,
    director_approved_at DATETIME,
    rejection_reason TEXT,
    total_estimated_cost DECIMAL(15,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (purchase_approved_by) REFERENCES users(id),
    FOREIGN KEY (director_approved_by) REFERENCES users(id)
);

-- Indent items table
CREATE TABLE IF NOT EXISTS indent_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indent_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    specifications TEXT, -- JSON string for specific requirements
    estimated_unit_cost DECIMAL(10,2),
    estimated_total_cost DECIMAL(15,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (indent_id) REFERENCES indents(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indent_id INTEGER NOT NULL,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    vendor_name VARCHAR(255),
    vendor_contact VARCHAR(255),
    vendor_address TEXT,
    order_date DATE,
    expected_delivery_date DATE,
    total_amount DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Partially Received', 'Completed', 'Cancelled')),
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (indent_id) REFERENCES indents(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(15,2),
    specifications TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    received_by INTEGER NOT NULL,
    received_date DATE NOT NULL,
    delivery_challan_number VARCHAR(100),
    is_partial BOOLEAN DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- Receipt items table
CREATE TABLE IF NOT EXISTS receipt_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id INTEGER NOT NULL,
    order_item_id INTEGER NOT NULL,
    received_quantity DECIMAL(10,2) NOT NULL,
    damaged_quantity DECIMAL(10,2) DEFAULT 0,
    returned_quantity DECIMAL(10,2) DEFAULT 0,
    damage_description TEXT,
    return_reason TEXT,
    condition_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id)
);

-- Receipt images table
CREATE TABLE IF NOT EXISTS receipt_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id INTEGER NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    image_type VARCHAR(50) CHECK (image_type IN ('delivery', 'damage', 'general')),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_site_id ON users(site_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_indents_site_id ON indents(site_id);
CREATE INDEX IF NOT EXISTS idx_indents_status ON indents(status);
CREATE INDEX IF NOT EXISTS idx_indents_created_by ON indents(created_by);
CREATE INDEX IF NOT EXISTS idx_indent_items_indent_id ON indent_items(indent_id);
CREATE INDEX IF NOT EXISTS idx_indent_items_material_id ON indent_items(material_id);
CREATE INDEX IF NOT EXISTS idx_orders_indent_id ON orders(indent_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);
