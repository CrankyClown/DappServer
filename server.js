const express = require('express');
const { google } = require('googleapis');
const keys = require('./google-credentials.json');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const SPREADSHEET_ID = '1jlJKdpE9T_O92NI_oCIMts7hBHNEiAarKCRSEYWvwYE';
const SHEET_NAME = 'Sheet1';

app.post('/api/save-address', async (req, res) => {
  const { ethAddress, solAddress } = req.body;

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: keys,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Retrieve all the existing rows
    const existingEntries = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:B`,
    });

    const rows = existingEntries.data.values || [];
    const existingRow = rows.find(row => row[0] === ethAddress);

    if (existingRow) {
      return res.status(400).send(`Ethereum address ${ethAddress} is already registered with Solana address: ${existingRow[1]}`);
    }

    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:B`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [[ethAddress, solAddress]],
      },
    };

    await sheets.spreadsheets.values.append(request);

    res.status(200).send('Address saved successfully');
  } catch (error) {
    console.error('Error saving address:', error);
    res.status(500).send(`Failed to save address: ${error.message}`);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
