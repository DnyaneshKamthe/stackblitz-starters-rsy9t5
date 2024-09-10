const express = require("express");
const app = express();
const PORT = 3000;
const { sequelize } = require("./lib/index.js");
const { ticket } = require("./models/ticket.model.js");
const { customer } = require("./models/customer.model.js");
const { agent } = require("./models/agent.model.js");
const { ticketCustomer } = require("./models/ticketCustomer.model.js");
const { ticketAgent } = require("./models/ticketAgent.model.js");
const { Op } = require("@sequelize/core");
const res = require("express/lib/response.js");

app.use(express.json());

//functions
async function getAllTickets() {
  let result = await ticket.findAll();
  let ticketRecords = [];
  for (let i = 0; i < result.length; i++) {
    let ticket = await getTicketDetails(result[i]);
    ticketRecords.push(ticket);
  }
  return { tickets : ticketRecords };
}

async function getTicketDetails(ticketData) {
  const customer = await getTicketCustomers(ticketData.id);
  const agent = await getTicketAgents(ticketData.id);
  
  return {
    ...ticketData.dataValues,
    customer,
    agent,
  };
}

// Helper function to get ticket's associated customers
async function getTicketCustomers(ticketId) {
 
  const ticketCustomers = await ticketCustomer.findAll({
    where: { ticketId },
  });
   console.log("ticketCustomers", ticketCustomers)
  let customerData;
  for (let cus of ticketCustomers) {
    console.log(cus)
    customerData = await customer.findOne(
      { 
        where: { id: cus.customerId },
        attributes: ["id", "name", "email", "createdAt", "updatedAt"]
      },
      
    );
  }
  return customerData;
}

// Helper function to get ticket's associated customers
async function getTicketAgents(ticketId) {
  const ticketAgents = await ticketAgent.findAll({
    where: { ticketId },
  });
  let agentData;
  for (let ag of ticketAgents) {
    agentData = await agent.findOne({ where: { id: ag.agentId } });
  }
  return agentData;
}

async function getTicketData(ticketId){
  let result = await ticket.findOne({
    where : { id : ticketId }
  })
  let ticketData = await getTicketDetails(result);
  return { ticket : ticketData }; 
}

async function getTicketStatus(status){
  let result = await ticket.findAll({
    where : { status : status }
  })
  let ticketRecords = [];
  for (let i = 0; i < result.length; i++)
    {
      let ticket = await getTicketDetails(result[i]);
      ticketRecords.push(ticket);
    }
  return { tickets : ticketRecords };
}

async function sortTicketsByPriority(a,b){
  let result = await ticket.findAll();
  let ticketRecords = [];
  for(let i = 0; i < result.length; i++){
    let ticket = await getTicketDetails(result[i]);
    ticketRecords.push(ticket);
  }
  return ticketRecords.sort((a,b) => a.priority - b.priority);
}

async function createNewTicket(newTicketData){
  let ticketData = await ticket.create(newTicketData);
  let ticketDataDetails = await getTicketDetails(ticketData);
  return { ticket : ticketDataDetails };
}

//seed data
app.get("/seed_db", async (req, res) => {
  await sequelize.sync({ force: true });

  let tickets = await ticket.bulkCreate([
    {
      ticketId: 1,
      title: "Login Issue",
      description: "Cannot login to account",
      status: "open",
      priority: 1,
      customerId: 1,
      agentId: 1,
    },
    {
      ticketId: 2,
      title: "Payment Failure",
      description: "Payment not processed",
      status: "closed",
      priority: 2,
      customerId: 2,
      agentId: 2,
    },
    {
      ticketId: 3,
      title: "Bug Report",
      description: "Found a bug in the system",
      status: "open",
      priority: 3,
      customerId: 1,
      agentId: 1,
    },
  ]);

  let customers = await customer.bulkCreate([
    { customerId: 1, name: "Alice", email: "alice@example.com" },
    { customerId: 2, name: "Bob", email: "bob@example.com" },
  ]);

  let agents = await agent.bulkCreate([
    { agentId: 1, name: "Charlie", email: "charlie@example.com" },
    { agentId: 2, name: "Dave", email: "dave@example.com" },
  ]);

  await ticketCustomer.bulkCreate([
    { ticketId: tickets[0].id, customerId: customers[0].id },
    { ticketId: tickets[2].id, customerId: customers[0].id },
    { ticketId: tickets[1].id, customerId: customers[1].id },
  ]);

  await ticketAgent.bulkCreate([
    { ticketId: tickets[0].id, agentId: agents[0].id },
    { ticketId: tickets[2].id, agentId: agents[0].id },
    { ticketId: tickets[1].id, agentId: agents[1].id },
  ]);

  return res.json({ message: "Database seeded successfully" });
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the BD5_Assignment1" });
});

//tickets
app.get("/tickets", async (req, res) => {
  try {
    let tickets = await getAllTickets();
    return res.status(200).json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//tickets/details/:id
app.get("/tickets/details/:id", async (req, res) =>{
  let ticketId = req.params.id;
  try{
    let ticket = await getTicketData(ticketId);
    return res.status(200).json(ticket);
  }catch(error){
    res.status(500).json({ message: error.message })
  }
})

//tickets/status/:status
app.get("/tickets/status/:status", async (req, res) =>{
  let status = req.params.status;
  try{
    let tickets = await getTicketStatus(status);
    return res.status(200).json(tickets);
  }catch(error){
    res.status(500).json({ message: error.message })
  }
})

//tickets/sort-by-priority
app.get("/tickets/sort-by-priority", async (req, res) =>{
  try{
    let tickets = await sortTicketsByPriority();
    return res.status(200).json(tickets);
  }catch(error){
    res.status(500).json({ message: error.message })
  }
})

//tickets/new
app.post("/tickets/new", async (req, res) =>{
  let newTicketData = req.body;
  try{
    let ticket = await createNewTicket(newTicketData);
    return res.status(200).json(ticket);
  }catch(error){
    res.status(500).json({ message: error.message })
  }
})

// app.post("/tickets/update/:id", async (res,res) => {
//   try{
    
//   }catch(err){
//     res.status(500).json({ message: err.message })
//   }
// })

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
