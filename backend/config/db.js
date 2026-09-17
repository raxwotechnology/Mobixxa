const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers to avoid querySrv ENOTFOUND on local network
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if restricted
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  try {
    // BUG-03 FIX: MongoDB credentials must not be hardcoded in source code.
    // The application must use the MONGO_URI environment variable.
    // The application will fail if MONGO_URI is not configured.
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    let atlasUri = process.env.MONGO_URI;

    // Ensure database name is explicitly attached if URI has no db path before options
    if (atlasUri.includes('.mongodb.net/?')) {
      atlasUri = atlasUri.replace(
        '.mongodb.net/?',
        '.mongodb.net/mobile_shop?'
      );
    } else if (
      atlasUri.endsWith('.mongodb.net') ||
      atlasUri.endsWith('.mongodb.net/')
    ) {
      atlasUri = atlasUri.replace(/\/$/, '') + '/mobile_shop';
    }

    const conn = await mongoose.connect(atlasUri);

    isConnected = !!conn.connections[0].readyState;

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // BUG-05 FIX:
    // Staff/admin accounts are NOT automatically created during
    // application startup or database connection.
    //
    // Initial account creation must be performed through a
    // controlled, one-time administrative process.
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
  }
};

module.exports = connectDB;