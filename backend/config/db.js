const mongoose = require('mongoose');

let isConnected = false;

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

    const conn = await mongoose.connect(atlasUri);
    isConnected = !!conn.connections[0].readyState;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
  }
};

module.exports = connectDB;
