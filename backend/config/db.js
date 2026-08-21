const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');

// Configure reliable DNS servers to avoid querySrv ENOTFOUND on local network
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // ignore if restricted
}

let isConnected = false;

const autoBootstrapStaff = async () => {
  try {
    const User = require('../models/User');
    const adminExists = await User.findOne({ email: 'admin@mobilehub.com' });
    if (adminExists) return;

    console.log('⚡ Auto-bootstrapping staff accounts on new database connection...');
    const staffAccounts = [
      {
        name: 'Mobixa Admin',
        email: 'admin@mobilehub.com',
        password: 'admin123',
        role: 'admin',
        phone: '+94771234567',
        isSuperAdmin: true,
        isActive: true,
        permissions: {
          inventory: true, finance: true, products: true, sales: true,
          reports: true, employees: true, suppliers: true, customers: true,
          rewards: true, vouchers: true, settings: true
        }
      },
      {
        name: 'Nisha Perera',
        email: 'manager@mobilehub.com',
        password: 'manager123',
        role: 'manager',
        phone: '+94772345678',
        isActive: true,
        permissions: { employees: true, products: true, sales: true, suppliers: true, reports: true, inventory: true }
      },
      {
        name: 'Dilshan Fernando',
        email: 'cashier@mobilehub.com',
        password: 'cashier123',
        role: 'cashier',
        phone: '+94773456789',
        isActive: true,
        employeeInfo: { salary: 45000, department: 'Sales', joinDate: new Date('2025-01-15') }
      },
      {
        name: 'Kamal Silva',
        email: 'delivery@mobilehub.com',
        password: 'delivery123',
        role: 'deliveryGuy',
        phone: '+94774567890',
        isActive: true,
        employeeInfo: { salary: 35000, department: 'Logistics', joinDate: new Date('2025-03-01') }
      },
      {
        name: 'Sahan Jayawardena',
        email: 'stock@mobilehub.com',
        password: 'stock123',
        role: 'stockEmployee',
        phone: '+94775678901',
        isActive: true,
        employeeInfo: { salary: 40000, department: 'Warehouse', joinDate: new Date('2025-02-10') }
      }
    ];

    for (const acc of staffAccounts) {
      let user = await User.findOne({ email: acc.email });
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(acc.password, salt);
        await User.create({ ...acc, password: hashedPassword });
        console.log(`✅ Auto-created: ${acc.email} (${acc.role})`);
      }
    }
  } catch (err) {
    console.error('Auto-bootstrap error:', err.message);
  }
};

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  try {
    let atlasUri = process.env.MONGO_URI;

    if (!atlasUri) {
      const dbUser = process.env.DB_USER;
      const dbPassword = process.env.DB_PASSWORD;
      const dbName = process.env.DB_NAME;
      if (dbUser && dbPassword && dbName) {
        atlasUri = `mongodb+srv://${dbUser}:${encodeURIComponent(dbPassword)}@cluster0.xqltkqh.mongodb.net/${dbName}?retryWrites=true&w=majority`;
      }
    }

    if (!atlasUri) {
      console.error('Missing MongoDB configuration. Set MONGO_URI.');
      return;
    }

    // Ensure database name is explicitly attached if URI has no db path before options
    if (atlasUri.includes('.mongodb.net/?')) {
      atlasUri = atlasUri.replace('.mongodb.net/?', '.mongodb.net/mobile_shop?');
    } else if (atlasUri.endsWith('.mongodb.net') || atlasUri.endsWith('.mongodb.net/')) {
      atlasUri = atlasUri.replace(/\/$/, '') + '/mobile_shop';
    }

    const conn = await mongoose.connect(atlasUri);
    isConnected = !!conn.connections[0].readyState;
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto bootstrap core staff if database is brand new
    await autoBootstrapStaff();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
  }
};

module.exports = connectDB;
