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
  try {
    const [customer, agent] = await Promise.all([
      getTicketCustomers(ticketData.id),
      getTicketAgents(ticketData.id)
    ]);

    // console.log("Customer data fetched:", customer);
    // console.log("Agent data fetched:", agent);

    return {
      ...ticketData.dataValues,
      customer,
      agent,
    };
  } catch (err) {
    console.error("Error fetching ticket details:", err.message);
    throw err;
  }
}



// Helper function to get ticket's associated customers
async function getTicketCustomers(ticketId) {
  const ticketCustomers = await ticketCustomer.findAll({
    where: { ticketId },
  });
  if(ticketCustomers.length === 0) {
    res.status(400).json({message : "No Customers found for this ticketId"})
  }
  let customerData;
  for (let cus of ticketCustomers) {
    // console.log(cus)
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
  if(ticketAgents.length === 0) {
    res.status(400).json({message : "No Agents found for this ticketId"})
  }
  let agentData;
  for (let ag of ticketAgents) {
    agentData = await agent.findOne({ where: { id: ag.agentId } });
  }
  return agentData;
}

async function getTicketData(ticketId){
  let result = await ticket.findOne({
    where : { id : ticketId },
    attributes : {exclude : ['customerId', 'agentId']}
  })
  let ticketData = await getTicketDetails(result);
  // console.log("result",result, ticketData)
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

app.post("/tickets/update/:id", async (req, res) => {
  try {
    const ticketId = req.params.id;
    
    // Find the ticket using id
    const ticketDetails = await ticket.findByPk(ticketId);
    
    // If no ticket found
    if (!ticketDetails) {
      return res.status(400).json({ message: "No such ticket found with this id" });
    }

    // Destructure request body to get data
    const { title, description, status, priority, customerId, agentId } = req.body;

   

    // Prepare the updated ticket data
    const updatedTicket = {};
    // Check for each field in request body and add it to the update object if present
    if (title) updatedTicket.title = title;
    if (description) updatedTicket.description = description;
    if (status) updatedTicket.status = status;
    if (priority) updatedTicket.priority = priority;


    // Update the ticket details
    await ticket.update(updatedTicket, { where: { id: ticketId } });
   

    // Handle customerId updates
    if (customerId) {
      // Delete old customer-ticket association and create a new one
      await ticketCustomer.destroy({ where: { ticketId } });
      await ticketCustomer.create({ ticketId, customerId });
    }

    // Handle agentId updates
    if (agentId) {
      // Delete old agent-ticket association and create a new one
      await ticketAgent.destroy({ where: { ticketId } });
      await ticketAgent.create({ ticketId, agentId });
    }
    // Fetch updated ticket details
    const updatedTicketDetails = await getTicketData(ticketId);

    return res.status(200).json(updatedTicketDetails);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/ticketCustomer/:id", async (req, res) => {
  try {
    const ticketId = req.params.id;

    // Find all records where ticketId matches
    const results = await ticketCustomer.findAll({
      where: { ticketId }
    });

    console.log(results);
    
    // If no results found, return a 404
    if (results.length === 0) {
      return res.status(404).json({ message: "No customers found for this ticket ID" });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching ticket customers:", error.message);
    res.status(500).json({ message: error.message });
  }
});

app.post("/tickets/delete", async (req, res) => {
  try {
    const  ticketId  = req.body.id; // Use req.params to get ticketId from the URL
    // Delete the ticket and related records
    await ticket.destroy({ where: { id: ticketId } });
    await ticketCustomer.destroy({ where: { ticketId } });
    await ticketAgent.destroy({ where: { ticketId } });

    // Send a success response with the actual ticketId
    res.status(200).json({ message: `Ticket with ID ${ticketId} deleted successfully.` });

  } catch (error) {
    // Handle errors and respond with a 500 status code
    return res.status(500).json({ message: error.message });
  }
});




app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
