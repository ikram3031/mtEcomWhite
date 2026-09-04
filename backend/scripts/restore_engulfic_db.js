// Automated database restoration and seed script for Engulfic
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const restoreEngulfic = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:11223345@127.0.0.1:27017/engulfic-db?authSource=admin';
  console.log('Connecting to MongoDB...');
  
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');
    
    const db = mongoose.connection.db;

    // 1. Restore Categories
    const categoriesFile = path.join(__dirname, '../data/engulfic_categories.json');
    if (fs.existsSync(categoriesFile)) {
      const raw = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
      const catList = raw.data || raw;
      if (Array.isArray(catList) && catList.length > 0) {
        console.log(`Seeding ${catList.length} categories...`);
        const catCol = db.collection('categories');
        await catCol.deleteMany({});
        const docs = catList.map(c => ({
          ...c,
          _id: new mongoose.Types.ObjectId(c._id),
          parent: c.parent ? new mongoose.Types.ObjectId(c.parent) : null,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date()
        }));
        await catCol.insertMany(docs);
        console.log('Categories restored successfully.');
      }
    }

    // 2. Restore Products
    const productsFile = path.join(__dirname, '../data/engulfic_products.json');
    if (fs.existsSync(productsFile)) {
      const raw = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
      const prodList = raw.data || raw;
      if (Array.isArray(prodList) && prodList.length > 0) {
        console.log(`Seeding ${prodList.length} products...`);
        const prodCol = db.collection('products');
        await prodCol.deleteMany({});
        const docs = prodList.map(p => ({
          ...p,
          _id: new mongoose.Types.ObjectId(p._id || p.id),
          categories: Array.isArray(p.categories) ? p.categories.map(cat => ({
            ...cat,
            _id: new mongoose.Types.ObjectId(cat._id),
            parent: cat.parent ? new mongoose.Types.ObjectId(cat.parent) : null
          })) : [],
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date()
        }));
        await prodCol.insertMany(docs);
        console.log('Products restored successfully.');
      }
    }

    // 3. Ensure Default Admin User
    const usersCol = db.collection('users');
    const existingAdmin = await usersCol.findOne({ role: 'Owner' });
    if (!existingAdmin) {
      console.log('Creating initial Owner/Admin user...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('11223345', salt);
      await usersCol.insertOne({
        name: 'Engulfic Admin',
        email: 'info@engulfic.com',
        passwordHash,
        role: 'Owner',
        phone: '01700000000',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Initial Owner user created: info@engulfic.com / 11223345');
    }

    console.log('=============================================');
    console.log('Engulfic Database Restore Completed 100%!');
    console.log('=============================================');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

restoreEngulfic();
