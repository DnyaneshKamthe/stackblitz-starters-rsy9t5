const { DataTypes, sequelize } = require("../lib/index.js");
const { customer } = require("./customer.model.js");
const { ticket } = require("./ticket.model.js");

const ticketCustomer = sequelize.define('ticketCustomer',{
  ticketId : {
    type : DataTypes.INTEGER,
    allowNull : false,
    references : {
      model : 'ticket',
      key : 'id',
    }
  },
  customerId : {
    type : DataTypes.INTEGER,
    allowNull : false,
    references : {
      model : 'customer',
      key : 'id',
    },
  }
})

ticket.belongsToMany(customer, { through : ticketCustomer })
customer.belongsToMany(ticket, { through : ticketCustomer })

module.exports = { ticketCustomer }