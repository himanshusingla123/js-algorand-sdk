// Algorand Account Management Examples

const algosdk = require('algosdk');

/**
 * Generate a new Algorand account
 * @returns {Object} Object containing the account and mnemonic
 */
function generateAccount() {
  // Generate a new account
  const account = algosdk.generateAccount();
  console.log("Generated Account Address:", account.addr.toString());
  
  // Convert the account private key to a mnemonic phrase for backup
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  console.log("Account Mnemonic:", mnemonic);
  
  return { account, mnemonic };
}

/**
 * Recover an account from a mnemonic phrase
 * @param {string} mnemonic - The mnemonic phrase
 * @returns {Object} The recovered account
 */
function recoverAccount(mnemonic) {
  const recoveredAccount = algosdk.mnemonicToSecretKey(mnemonic);
  console.log("Recovered Account Address:", recoveredAccount.addr.toString());
  return recoveredAccount;
}

/**
 * Create a multisignature account
 * @param {Array<string|Address>} addresses - Array of addresses
 * @param {number} threshold - Number of signatures required
 * @returns {Object} Object containing multisig parameters and address
 */
function createMultisigAccount(addresses, threshold) {
  // Create the multisig metadata
  const multisigParams = {
    version: 1,
    threshold: threshold,
    addrs: addresses
  };
  
  // Get the multisig address
  const multisigAddress = algosdk.multisigAddress(multisigParams);
  console.log("Multisig Address:", multisigAddress.toString());
  
  return { multisigParams, multisigAddress };
}

/**
 * Check account information on the blockchain
 * @param {string} address - The account address to check
 * @returns {Promise<Object>} Account information
 */
async function checkAccountInfo(address) {
  try {
    // Connect to the Algorand node
    const algodToken = '';
    const algodServer = 'https://testnet-api.algonode.cloud';
    const algodPort = '';
    
    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
    
    // Get account information
    const accountInfo = await algodClient.accountInformation(address).do();
    console.log("Account Balance:", accountInfo.amount, "microAlgos");
    console.log("Account Status:", accountInfo.status);
    
    // Check if account has any assets
    if (accountInfo.assets && accountInfo.assets.length > 0) {
      console.log("Account Assets:");
      accountInfo.assets.forEach(asset => {
        console.log(`- Asset ID: ${asset['asset-id']}, Amount: ${asset.amount}`);
      });
    }
    
    // Check if account has any created apps
    if (accountInfo['created-apps'] && accountInfo['created-apps'].length > 0) {
      console.log("Created Applications:", accountInfo['created-apps'].length);
    }
    
    return accountInfo;
  } catch (error) {
    console.error("Error checking account info:", error);
    throw error;
  }
}

/**
 * Create a rekeyed account (delegate signing authority)
 * @param {Object} account - The account to rekey
 * @param {Object} authAccount - The account to delegate authority to
 * @returns {Promise<Object>} Transaction result
 */
async function rekeyAccount(account, authAccount) {
  try {
    // Connect to the Algorand node
    const algodToken = '';
    const algodServer = 'https://testnet-api.algonode.cloud';
    const algodPort = '';
    
    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create a payment transaction with rekey-to field
    // This is a self-payment with 0 amount, but it includes the rekey-to field
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: account.addr,
      receiver: account.addr,
      amount: 0,
      rekeyTo: authAccount.addr,
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction with the original account
    const signedTxn = txn.signTxn(account.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Rekey Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Rekey transaction confirmed in round:", confirmedTxn.confirmedRound);
    
    console.log(`Account ${account.addr.toString()} has been rekeyed to ${authAccount.addr.toString()}`);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error rekeying account:", error);
    throw error;
  }
}

/**
 * Sign a transaction with a rekeyed account
 * @param {Object} originalAccount - The original account (now rekeyed)
 * @param {Object} authAccount - The account with signing authority
 * @param {string} receiverAddress - The recipient address
 * @param {number} amount - The amount to send
 * @returns {Promise<Object>} Transaction result
 */
async function sendWithRekeyedAccount(originalAccount, authAccount, receiverAddress, amount) {
  try {
    // Connect to the Algorand node
    const algodToken = '';
    const algodServer = 'https://testnet-api.algonode.cloud';
    const algodPort = '';
    
    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create a payment transaction from the original account
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: originalAccount.addr,
      receiver: receiverAddress,
      amount: amount,
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction with the auth account (which has signing authority)
    const signedTxn = txn.signTxn(authAccount.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Transaction confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error sending with rekeyed account:", error);
    throw error;
  }
}

// Example usage
async function runAccountExamples() {
  try {
    console.log("===== ALGORAND ACCOUNT MANAGEMENT EXAMPLES =====");
    
    // Generate new accounts
    console.log("\n----- Generating Accounts -----");
    const { account: account1, mnemonic: mnemonic1 } = generateAccount();
    const { account: account2 } = generateAccount();
    const { account: account3 } = generateAccount();
    
    // Recover account from mnemonic
    console.log("\n----- Recovering Account -----");
    const recoveredAccount = recoverAccount(mnemonic1);
    console.log("Account recovery successful:", account1.addr.toString() === recoveredAccount.addr.toString());
    
    // Create a multisignature account
    console.log("\n----- Creating Multisig Account -----");
    const { multisigParams, multisigAddress } = createMultisigAccount(
      [account1.addr, account2.addr, account3.addr],
      2
    );
    
    // Note: The following examples require funded accounts
    console.log("\nThe following examples require funded accounts on TestNet and won't execute successfully without them.");
    console.log("To fund test accounts, use the Algorand TestNet faucet: https://bank.testnet.algorand.network/");
    
    /*
    // Check account information
    console.log("\n----- Checking Account Info -----");
    await checkAccountInfo(account1.addr.toString());
    
    // Rekey an account
    console.log("\n----- Rekeying Account -----");
    await rekeyAccount(account1, account2);
    
    // Send a transaction with the rekeyed account
    console.log("\n----- Sending with Rekeyed Account -----");
    await sendWithRekeyedAccount(account1, account2, account3.addr.toString(), 1000000);
    */
    
    console.log("\n===== ACCOUNT EXAMPLES COMPLETE =====");
  } catch (error) {
    console.error("Error running account examples:", error);
  }
}

// Run the examples
// runAccountExamples();

// Export functions for use in other files
module.exports = {
  generateAccount,
  recoverAccount,
  createMultisigAccount,
  checkAccountInfo,
  rekeyAccount,
  sendWithRekeyedAccount,
  runAccountExamples
};