import { initializeDatabase, DatabaseHelper } from './db';
import bcrypt from 'bcryptjs';

const initializeWithSampleData = async (): Promise<void> => {
    try {
        // Initialize database schema
        initializeDatabase();

        // Insert sample sites
        const sites = [
            { site_code: 'SITE001', site_name: 'Downtown Construction Project', location: 'Downtown District' },
            { site_code: 'SITE002', site_name: 'Residential Complex Phase 1', location: 'North Zone' },
            { site_code: 'SITE003', site_name: 'Commercial Plaza Development', location: 'Business District' }
        ];

        sites.forEach(site => {
            DatabaseHelper.executeInsert(
                'INSERT OR IGNORE INTO sites (site_code, site_name, location) VALUES (?, ?, ?)',
                [site.site_code, site.site_name, site.location]
            );
        });

        // Insert sample users with hashed passwords
        const users = [
            { username: 'engineer1', password: 'password123', role: 'Site Engineer', site_id: 1, full_name: 'John Engineer', email: 'john@site1.com' },
            { username: 'engineer2', password: 'password123', role: 'Site Engineer', site_id: 2, full_name: 'Jane Engineer', email: 'jane@site2.com' },
            { username: 'purchase1', password: 'password123', role: 'Purchase Team', site_id: null, full_name: 'Mike Purchase', email: 'mike@company.com' },
            { username: 'director1', password: 'password123', role: 'Director', site_id: null, full_name: 'Sarah Director', email: 'sarah@company.com' }
        ];

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            DatabaseHelper.executeInsert(
                'INSERT OR IGNORE INTO users (username, password_hash, role, site_id, full_name, email) VALUES (?, ?, ?, ?, ?, ?)',
                [user.username, hashedPassword, user.role, user.site_id, user.full_name, user.email]
            );
        }

        // Insert sample materials
        const materials = [
            {
                material_code: 'CEM001',
                material_name: 'Portland Cement',
                category: 'Cement',
                unit: 'Bags',
                specifications: JSON.stringify({ grade: '53', weight: '50kg' }),
                description: 'High quality Portland cement for construction'
            },
            {
                material_code: 'STL001',
                material_name: 'Steel Rebar',
                category: 'Steel',
                unit: 'Tons',
                specifications: JSON.stringify({ diameter: ['8mm', '10mm', '12mm', '16mm'], grade: 'Fe500' }),
                description: 'High tensile strength steel reinforcement bars'
            },
            {
                material_code: 'BRK001',
                material_name: 'Red Clay Bricks',
                category: 'Bricks',
                unit: 'Pieces',
                specifications: JSON.stringify({ size: '230x110x75mm', class: 'First Class' }),
                description: 'Standard red clay bricks for construction'
            },
            {
                material_code: 'SND001',
                material_name: 'River Sand',
                category: 'Aggregates',
                unit: 'Cubic Feet',
                specifications: JSON.stringify({ type: 'Fine', grade: 'Zone II' }),
                description: 'Fine river sand for concrete and masonry'
            },
            {
                material_code: 'GRV001',
                material_name: 'Crushed Stone',
                category: 'Aggregates',
                unit: 'Cubic Feet',
                specifications: JSON.stringify({ size: ['10mm', '20mm', '40mm'] }),
                description: 'Crushed stone aggregate for concrete'
            },
            {
                material_code: 'PNT001',
                material_name: 'Exterior Paint',
                category: 'Paint',
                unit: 'Liters',
                specifications: JSON.stringify({ type: 'Acrylic', colors: ['White', 'Cream', 'Light Blue', 'Light Green'] }),
                description: 'Weather resistant exterior paint'
            }
        ];

        materials.forEach(material => {
            DatabaseHelper.executeInsert(
                'INSERT OR IGNORE INTO materials (material_code, material_name, category, unit, specifications, description) VALUES (?, ?, ?, ?, ?, ?)',
                [material.material_code, material.material_name, material.category, material.unit, material.specifications, material.description]
            );
        });

        console.log('Database initialized with sample data successfully!');
        console.log('\nSample Login Credentials:');
        console.log('Site Engineer: engineer1 / password123 (Site: SITE001)');
        console.log('Site Engineer: engineer2 / password123 (Site: SITE002)');
        console.log('Purchase Team: purchase1 / password123');
        console.log('Director: director1 / password123');

    } catch (error) {
        console.error('Error initializing database with sample data:', error);
        throw error;
    }
};

// Run initialization if this file is executed directly
if (require.main === module) {
    initializeWithSampleData()
        .then(() => {
            console.log('Database initialization completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database initialization failed:', error);
            process.exit(1);
        });
}

export { initializeWithSampleData };
