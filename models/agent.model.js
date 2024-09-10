const { DataTypes, sequelize } = require("../lib/index.js");

const agent = sequelize.define('agent', {
  name : DataTypes.STRING,
  email : DataTypes.STRING,
})

module.exports = { agent }