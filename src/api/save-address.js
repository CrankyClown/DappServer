require('dotenv').config();
const mongoose = require('mongoose');
const Address = require('../models/Address');
const { PublicKey } = require('@solana/web3.js');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { ethAddress, solAddress } = req.body;

    let isValid = true;
    try {
      const key = new PublicKey(solAddress);
      isValid = PublicKey.isOnCurve(key);
    } catch (error) {
      isValid = false;
    }

    if (!isValid) {
      return res.status(400).send('Invalid Solana Address');
    }

    const newAddress = new Address({ ethAddress, solAddress });
    await newAddress.save();
    res.status(200).send('Address saved!');
  } else {
    res.status(405).send('Method Not Allowed');
  }
};
