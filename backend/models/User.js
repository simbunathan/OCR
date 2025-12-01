// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/db');
// const bcrypt = require('bcryptjs');

// const User = sequelize.define('User', {
//   id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true
//   },
//   username: {
//     type: DataTypes.STRING(50),
//     allowNull: false,
//     unique: true,
//     validate: {
//       len: [3, 50]
//     }
//   },
//   email: {
//     type: DataTypes.STRING(100),
//     allowNull: false,
//     unique: true,
//     validate: {
//       isEmail: true
//     }
//   },
//   password: {
//     type: DataTypes.STRING(255),
//     allowNull: false
//   }
// }, {
//   tableName: 'users',
//   timestamps: true,
//   hooks: {
//     beforeCreate: async (user) => {
//       if (user.password) {
//         const salt = await bcrypt.genSalt(10);
//         user.password = await bcrypt.hash(user.password, salt);
//       }
//     },
//     beforeUpdate: async (user) => {
//       if (user.changed('password')) {
//         const salt = await bcrypt.genSalt(10);
//         user.password = await bcrypt.hash(user.password, salt);
//       }
//     }
//   }
// });

// // Instance method to compare password
// User.prototype.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// module.exports = User;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'users',  // make sure the table name matches your queries
  timestamps: true
});

module.exports = User;
