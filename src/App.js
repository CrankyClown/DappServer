import React, { useState, useEffect } from 'react';
import { Web3ReactProvider, useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import Web3 from 'web3';
import base58 from 'bs58';
import './App.css';  // Import the CSS file

const injected = new InjectedConnector({ supportedChainIds: [1, 3, 4, 5, 42] });

const contractAddresses = [
  "0xc0aD5B5bAbe71C7b1664A4B301673333ecaAF582", 
  "0xf7F88D2a9497c974Cd5f132a3dB6A9ab82df78Cd"
];

const contractABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  }
];

const getLibrary = (provider) => {
  return new Web3(provider);
};

function WalletConnection() {
  const { activate, active, account, library } = useWeb3React();
  const [solAddress, setSolAddress] = useState('');
  const [ownsNFT, setOwnsNFT] = useState(false);
  const [registeredSolAddress, setRegisteredSolAddress] = useState(null);
  const [isSolAddressValid, setIsSolAddressValid] = useState(false); // Initial state set to false
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const connectWallet = async () => {
    try {
      console.log("Attempting to connect wallet...");
      await activate(injected);
      console.log("Wallet connected successfully");
    } catch (error) {
      console.error("Error connecting wallet", error);
    }
  };

  useEffect(() => {
    if (active && account && library) {
      checkNFTOwnership();
      fetchRegisteredSolAddress();
    }
  }, [active, account, library]);

  const checkNFTOwnership = async () => {
    try {
      console.log("Checking NFT ownership for account:", account);
      let owns = false;
      for (let address of contractAddresses) {
        const contract = new library.eth.Contract(contractABI, address);
        const balance = await contract.methods.balanceOf(account).call({ from: account });
        console.log(`Balance of contract ${address} for account ${account}:`, balance);
        if (parseInt(balance) > 0) {
          owns = true;
          break;
        }
      }
      setOwnsNFT(owns);
      if (!owns) {
        console.log("No NFTs found for the required contracts.");
      }
    } catch (error) {
      console.error("Error checking NFT ownership", error);
    }
  };

  const fetchRegisteredSolAddress = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/get-sol-address?ethAddress=${account}`);
      if (response.ok) {
        const data = await response.json();
        setRegisteredSolAddress(data.solAddress);
      } else {
        console.log("No registered Solana address found.");
      }
    } catch (error) {
      console.error("Error fetching registered Solana address", error);
    }
  };

  const handleSolAddressChange = (event) => {
    const address = event.target.value;
    setSolAddress(address);
    setIsSolAddressValid(validateSolanaAddress(address));
  };

  const validateSolanaAddress = (address) => {
    if (!address || address.trim() === '') {
      return false; // Invalid if address is empty or just whitespace
    }

    try {
      const decoded = base58.decode(address);
      return decoded.length === 32;
    } catch (error) {
      return false;
    }
  };

  const saveAddress = async () => {
    if (!isSolAddressValid) {
      alert('Invalid Solana address.');
      return;
    }

    console.log("Saving address:", { ethAddress: account, solAddress });
    try {
      const response = await fetch('http://localhost:5001/api/save-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ethAddress: account, solAddress }),
      });

      if (response.ok) {
        setSuccessMessage('Address saved successfully!');
        setErrorMessage(null); // Clear any previous error messages
        setRegisteredSolAddress(solAddress);
      } else {
        const errorText = await response.text();
        const formattedErrorMessage = `Ethereum address:\n\n${account} \n\nis already registered with\n\nSolana address:\n\n${errorText.split('Solana address:')[1]}`;
        setErrorMessage(formattedErrorMessage);
        setSuccessMessage(null); // Clear any previous success messages
      }
    } catch (error) {
      console.error('Network error occurred while saving address:', error);
      alert('Failed to save address due to a network error.');
    }
  };

  return (
    <div className="container">
      <h1>Retro Raccoons Eth-Sol Portal</h1>
      {!active ? (
        <button onClick={connectWallet} className="center-button">Connect MetaMask</button>
      ) : (
        <div className="wallet-info">
          {ownsNFT ? (
            <>
              <div className="wallet-field">
                <p>Connected account: {account}</p>
              </div>
              <div className="address-entry">
                {registeredSolAddress ? (
                  <p>Your registered Solana address is: {registeredSolAddress}</p>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Enter Solana Address"
                      value={solAddress}
                      onChange={handleSolAddressChange}
                      style={{ borderColor: isSolAddressValid ? 'initial' : 'red' }}
                    />
                    <button onClick={saveAddress} disabled={!isSolAddressValid}>Save Address</button>
                    {!isSolAddressValid && <p style={{ color: 'red' }}>Invalid Solana address.</p>}
                  </>
                )}
              </div>
              {errorMessage && (
                <div className="error-message">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="success-message">
                  {successMessage}
                </div>
              )}
            </>
          ) : (
            <p>You do not own an NFT from the required collection.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <WalletConnection />
    </Web3ReactProvider>
  );
}
