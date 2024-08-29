require('dotenv').config();
const mongoose = require('mongoose');
const Address = require('../models/Address');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

module.exports = async (req, res) => {
  const { password } = req.body;

  if (password !== 'AABB') {
    return res.status(401).send('Unauthorized');
  }

  const addresses = await Address.find({});
  let csv = 'Ethereum Address,Solana Address\n';
  addresses.forEach(address => {
    csv += `${address.ethAddress},${address.solAddress}\n`;
  });
  res.header('Content-Type', 'text/csv');
  res.attachment('addresses.csv');
  res.send(csv);
};
