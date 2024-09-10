const { DataTypes, sequelize } = require("../lib/index.js");

const customer = sequelize.define("customer",{
  name : DataTypes.STRING,
  email : DataTypes.STRING,
})

module.exports = { customer }

