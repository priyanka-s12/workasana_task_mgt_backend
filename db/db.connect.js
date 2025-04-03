const mongoose = require('mongoose');
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI;

const initializeDatabase = async () => {
  await mongoose
    .connect(MONGODB_URI)
    .then(() => console.log('Connected to database'))
    .catch((error) => console.log('Error connecting to database', error));
};

module.exports = { initializeDatabase };
