const { sequelize } = require('../config/db');
const User = require('./User');
const OcrRecord = require('./OcrRecord');

// Define associations
User.hasMany(OcrRecord, {
  foreignKey: 'userId',
  as: 'ocrRecords'
});

OcrRecord.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  sequelize,
  User,
  OcrRecord
};