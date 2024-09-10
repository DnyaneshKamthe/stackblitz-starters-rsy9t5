const { DataTypes, sequelize } = require("../lib/index.js");
const { agent } = require("./agent.model.js");
const { ticket } = require("./ticket.model.js");

const ticketAgent = sequelize.define('ticketAgent',{
  ticketId : {
    type : DataTypes.INTEGER,
    allowNull : false,
    references : {
      model : 'ticket',
      key : 'id',
    }
  },
  agentId : {
    type : DataTypes.INTEGER,
    allowNull : false,
    references : {
      model : 'agent',
      key : 'id',
    },
  }
})

ticket.belongsToMany(agent, { through : ticketAgent })
agent.belongsToMany(ticket, { through : ticketAgent })

module.exports = { ticketAgent }