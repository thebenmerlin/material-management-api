-- Material Management Database Schema - PostgreSQL Version

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
    id SERIAL PRIMARY KEY,
    site_code VARCHAR(50) UNIQUE NOT NULL,
    site_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Site Engineer', 'Purchase Team', 'Director')),
    site_id INTEGER,
    full_name VARCHAR(255),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Materials catalog table
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    material_code VARCHAR(100) UNIQUE NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50),
    specifications TEXT, -- JSON string for size, dimensions, color, etc.
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indents table
CREATE TABLE IF NOT EXISTS indents (
    id SERIAL PRIMARY KEY,
    indent_number VARCHAR(100) UNIQUE NOT NULL,
    site_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Purchase Approved', 'Director Approved', 'Rejected', 'Completed')),
    purchase_approved_by INTEGER,
    purchase_approved_at TIMESTAMPTZ,
    director_approved_by INTEGER,
    director_approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    total_estimated_cost DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (purchase_approved_by) REFERENCES users(id),
    FOREIGN KEY (director_approved_by) REFERENCES users(id)
);

-- Indent items table
CREATE TABLE IF NOT EXISTS indent_items (
    id SERIAL PRIMARY KEY,
    indent_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    specifications TEXT, -- JSON string for specific requirements
    estimated_unit_cost DECIMAL(10,2),
    estimated_total_cost DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (indent_id) REFERENCES indents(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (indent_id) REFERENCES indents(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(15,2),
    specifications TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    received_by INTEGER NOT NULL,
    received_date DATE NOT NULL,
    delivery_challan_number VARCHAR(100),
    is_partial BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- Receipt items table
CREATE TABLE IF NOT EXISTS receipt_items (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER NOT NULL,
    order_item_id INTEGER NOT NULL,
    received_quantity DECIMAL(10,2) NOT NULL,
    damaged_quantity DECIMAL(10,2) DEFAULT 0,
    returned_quantity DECIMAL(10,2) DEFAULT 0,
    damage_description TEXT,
    return_reason TEXT,
    condition_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id)
);

-- Receipt images table
CREATE TABLE IF NOT EXISTS receipt_images (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    image_type VARCHAR(50) CHECK (image_type IN ('delivery', 'damage', 'general')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
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

-- Insert default data
INSERT INTO sites (site_code, site_name, location) VALUES 
('SITE001', 'Main Construction Site', 'Downtown Area'),
('SITE002', 'Residential Complex', 'Suburb Area')
ON CONFLICT (site_code) DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, role, full_name, email, site_id) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Director', 'System Administrator', 'admin@company.com', NULL),
('engineer1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Site Engineer', 'Site Engineer 1', 'engineer1@company.com', 1),
('purchase1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Purchase Team', 'Purchase Manager', 'purchase@company.com', NULL)
ON CONFLICT (username) DO NOTHING;

-- Insert sample materials
INSERT INTO materials (material_code, material_name, category, unit, description) VALUES 
('MAT001', 'Portland Cement', 'Cement', 'Bags', 'OPC 53 Grade Cement'),
('MAT002', 'Steel Rebar 12mm', 'Steel', 'Kg', '12mm TMT Steel Bars'),
('MAT003', 'Red Bricks', 'Bricks', 'Pieces', 'Standard Red Clay Bricks'),
('MAT004', 'River Sand', 'Sand', 'Cubic Feet', 'Fine River Sand for Construction'),
('MAT005', 'Aggregate 20mm', 'Aggregate', 'Cubic Feet', '20mm Crushed Stone Aggregate')
ON CONFLICT (material_code) DO NOTHING;
