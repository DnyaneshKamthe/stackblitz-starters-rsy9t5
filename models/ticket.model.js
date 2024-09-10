const { DataTypes, sequelize } = require("../lib/index.js");

const ticket = sequelize.define("ticket",{
  title : DataTypes.STRING,
  description : DataTypes.STRING,
  status : DataTypes.STRING,
  priority : DataTypes.STRING,
  customerId : DataTypes.INTEGER,
  agentId : DataTypes.INTEGER,
})

module.exports = { ticket }