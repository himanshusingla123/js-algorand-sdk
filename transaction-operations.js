// Algorand Transaction Operations Examples

const algosdk = require('algosdk');

/**
 * Get an Algod client connected to TestNet
 * @returns {algosdk.Algodv2} Algod client
 */
function getAlgodClient() {
  const algodToken = '';
  const algodServer = 'https://testnet-api.algonode.cloud';
  const algodPort = '';
  
  const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
  return algodClient;
}

/**
 * Create and send a payment transaction
 * @param {Object} sender - Sender account
 * @param {string|Object} receiver - Receiver address or account
 * @param {number} amount - Amount in microAlgos
 * @param {string} note - Optional note to include
 * @returns {Promise<Object>} Transaction result
 */
async function sendPayment(sender, receiver, amount, note = "") {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters from the network
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Convert receiver to string if it's an account object
    const receiverAddress = typeof receiver === 'string' ? receiver : receiver.addr.toString();
    
    // Create the payment transaction
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: sender.addr,
      receiver: receiverAddress,
      amount: amount,
      note: note ? new TextEncoder().encode(note) : undefined,
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(sender.sk);
    
    // Submit the transaction to the network
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Payment Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Transaction confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error sending payment:", error);
    throw error;
  }
}

/**
 * Create and send an asset creation transaction
 * @param {Object} creator - Creator account
 * @param {string} assetName - Name of the asset
 * @param {string} unitName - Unit name of the asset
 * @param {number} totalIssuance - Total supply of the asset
 * @param {number} decimals - Number of decimals for the asset
 * @param {string} url - Optional URL for the asset
 * @param {Uint8Array} metadataHash - Optional metadata hash
 * @returns {Promise<number>} Asset ID
 */
async function createAsset(creator, assetName, unitName, totalIssuance, decimals, url = "", metadataHash = undefined) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the asset creation transaction
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      sender: creator.addr,
      total: totalIssuance,
      decimals: decimals,
      defaultFrozen: false,
      manager: creator.addr,
      reserve: creator.addr,
      freeze: creator.addr,
      clawback: creator.addr,
      unitName: unitName,
      assetName: assetName,
      assetURL: url,
      assetMetadataHash: metadataHash,
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(creator.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Asset Creation Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Asset created in round:", confirmedTxn.confirmedRound);
    
    // Get the asset ID
    const assetId = confirmedTxn.assetIndex;
    console.log("Asset ID:", assetId);
    
    return assetId;
  } catch (error) {
    console.error("Error creating asset:", error);
    throw error;
  }
}

/**
 * Modify an existing asset's configuration
 * @param {Object} manager - Manager account
 * @param {number} assetId - Asset ID
 * @param {string|Object} newManager - New manager address or account (optional)
 * @param {string|Object} newReserve - New reserve address or account (optional)
 * @param {string|Object} newFreeze - New freeze address or account (optional)
 * @param {string|Object} newClawback - New clawback address or account (optional)
 * @returns {Promise<Object>} Transaction result
 */
async function configureAsset(manager, assetId, newManager = undefined, newReserve = undefined, newFreeze = undefined, newClawback = undefined) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Convert addresses to strings if they're account objects
    const managerAddr = newManager ? (typeof newManager === 'string' ? newManager : newManager.addr.toString()) : undefined;
    const reserveAddr = newReserve ? (typeof newReserve === 'string' ? newReserve : newReserve.addr.toString()) : undefined;
    const freezeAddr = newFreeze ? (typeof newFreeze === 'string' ? newFreeze : newFreeze.addr.toString()) : undefined;
    const clawbackAddr = newClawback ? (typeof newClawback === 'string' ? newClawback : newClawback.addr.toString()) : undefined;
    
    // Create the asset configuration transaction
    const txn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
      sender: manager.addr,
      assetIndex: assetId,
      manager: managerAddr,
      reserve: reserveAddr,
      freeze: freezeAddr,
      clawback: clawbackAddr,
      strictEmptyAddressChecking: false,
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(manager.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Asset Configuration Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Asset configuration updated in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error configuring asset:", error);
    throw error;
  }
}

/**
 * Opt-in to an asset
 * @param {Object} account - Account to opt-in
 * @param {number} assetId - Asset ID
 * @returns {Promise<Object>} Transaction result
 */
async function optInToAsset(account, assetId) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the asset opt-in transaction
    // Opt-in is simply a 0 amount asset transfer to yourself
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: account.addr,
      receiver: account.addr,
      amount: 0,
      assetIndex: assetId,
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(account.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Opt-in Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Opt-in confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error opting in to asset:", error);
    throw error;
  }
}

/**
 * Transfer an asset
 * @param {Object} sender - Sender account
 * @param {string|Object} receiver - Receiver address or account
 * @param {number} assetId - Asset ID
 * @param {number} amount - Amount to transfer
 * @returns {Promise<Object>} Transaction result
 */
async function transferAsset(sender, receiver, assetId, amount) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Convert receiver to string if it's an account object
    const receiverAddress = typeof receiver === 'string' ? receiver : receiver.addr.toString();
    
    // Create the asset transfer transaction
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: sender.addr,
      receiver: receiverAddress,
      amount: amount,
      assetIndex: assetId,
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(sender.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Asset Transfer Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Asset transfer confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error transferring asset:", error);
    throw error;
  }
}

/**
 * Freeze or unfreeze an asset for a specific account
 * @param {Object} freezeManager - Freeze manager account
 * @param {string|Object} accountToFreeze - Account to freeze/unfreeze
 * @param {number} assetId - Asset ID
 * @param {boolean} freeze - True to freeze, false to unfreeze
 * @returns {Promise<Object>} Transaction result
 */
async function freezeAsset(freezeManager, accountToFreeze, assetId, freeze) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Convert account to string if it's an account object
    const accountAddress = typeof accountToFreeze === 'string' ? accountToFreeze : accountToFreeze.addr.toString();
    
    // Create the asset freeze transaction
    const txn = algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject({
      sender: freezeManager.addr,
      freezeTarget: accountAddress,
      assetIndex: assetId,
      frozen: freeze,
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(freezeManager.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Asset Freeze Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Asset freeze operation confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error freezing asset:", error);
    throw error;
  }
}

/**
 * Revoke (clawback) assets from an account
 * @param {Object} clawbackManager - Clawback manager account
 * @param {string|Object} revokeFrom - Account to revoke from
 * @param {string|Object} revokeTo - Account to send revoked assets to
 * @param {number} assetId - Asset ID
 * @param {number} amount - Amount to revoke
 * @returns {Promise<Object>} Transaction result
 */
async function revokeAsset(clawbackManager, revokeFrom, revokeTo, assetId, amount) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Convert addresses to strings if they're account objects
    const revokeFromAddress = typeof revokeFrom === 'string' ? revokeFrom : revokeFrom.addr.toString();
    const revokeToAddress = typeof revokeTo === 'string' ? revokeTo : revokeTo.addr.toString();
    
    // Create the asset revoke transaction
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: clawbackManager.addr,
      receiver: revokeToAddress,
      assetSender: revokeFromAddress,
      amount: amount,
      assetIndex: assetId,
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(clawbackManager.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Asset Revoke Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Asset revoke operation confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error revoking asset:", error);
    throw error;
  }
}

/**
 * Destroy an asset
 * @param {Object} manager - Manager account
 * @param {number} assetId - Asset ID
 * @returns {Promise<Object>} Transaction result
 */
async function destroyAsset(manager, assetId) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the asset destroy transaction
    const txn = algosdk.makeAssetDestroyTxnWithSuggestedParamsFromObject({
      sender: manager.addr,
      assetIndex: assetId,
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(manager.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Asset Destroy Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Asset destroyed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error destroying asset:", error);
    throw error;
  }
}

/**
 * Create and send a group of transactions atomically
 * @param {Object} sender - Sender account
 * @param {Array<Object>} receivers - Array of receiver accounts
 * @param {number} amount - Amount to send to each receiver
 * @returns {Promise<Object>} Transaction result
 */
async function sendAtomicTransactions(sender, receivers, amount) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create payment transactions for each receiver
    const txns = receivers.map((receiver, index) => {
      return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: sender.addr,
        receiver: typeof receiver === 'string' ? receiver : receiver.addr,
        amount: amount,
        note: new TextEncoder().encode(`Payment ${index + 1} in atomic group`),
        suggestedParams: suggestedParams
      });
    });
    
    // Group the transactions
    algosdk.assignGroupID(txns);
    
    // Sign the transactions
    const signedTxns = txns.map(txn => txn.signTxn(sender.sk));
    
    // Submit the transaction group
    const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
    console.log("Atomic Transaction Group ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Atomic transactions confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error sending atomic transactions:", error);
    throw error;
  }
}

/**
 * Create a transaction with a lease to prevent duplicates
 * @param {Object} sender - Sender account
 * @param {string|Object} receiver - Receiver address or account
 * @param {number} amount - Amount to send
 * @param {Uint8Array} lease - 32-byte lease value
 * @returns {Promise<Object>} Transaction result
 */
async function sendTransactionWithLease(sender, receiver, amount, lease) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Convert receiver to string if it's an account object
    const receiverAddress = typeof receiver === 'string' ? receiver : receiver.addr.toString();
    
    // Create the payment transaction with lease
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: sender.addr,
      receiver: receiverAddress,
      amount: amount,
      lease: lease, // 32-byte value to prevent duplicate submissions
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(sender.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Transaction with Lease ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Transaction confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error sending transaction with lease:", error);
    throw error;
  }
}

// Example usage
async function runTransactionExamples() {
  try {
    console.log("===== ALGORAND TRANSACTION EXAMPLES =====");
    
    // Generate accounts for testing
    const account1 = algosdk.generateAccount();
    const account2 = algosdk.generateAccount();
    const account3 = algosdk.generateAccount();
    
    console.log("Account 1:", account1.addr.toString());
    console.log("Account 2:", account2.addr.toString());
    console.log("Account 3:", account3.addr.toString());
    
    // Note: The following examples require funded accounts
    console.log("\nThe following examples require funded accounts on TestNet and won't execute successfully without them.");
    console.log("To fund test accounts, use the Algorand TestNet faucet: https://bank.testnet.algorand.network/");
    
    /*
    // Send a payment transaction
    console.log("\n----- Payment Transaction -----");
    await sendPayment(account1, account2, 1000000, "Example payment");
    
    // Create an asset
    console.log("\n----- Asset Creation -----");
    const assetId = await createAsset(account1, "Example Token", "EX", 1000000, 0);
    
    // Configure the asset
    console.log("\n----- Asset Configuration -----");
    await configureAsset(account1, assetId, account1.addr, account1.addr, undefined, undefined);
    
    // Opt-in to the asset
    console.log("\n----- Asset Opt-in -----");
    await optInToAsset(account2, assetId);
    
    // Transfer the asset
    console.log("\n----- Asset Transfer -----");
    await transferAsset(account1, account2, assetId, 1000);
    
    // Freeze the asset
    console.log("\n----- Asset Freeze -----");
    await freezeAsset(account1, account2, assetId, true);
    
    // Unfreeze the asset
    console.log("\n----- Asset Unfreeze -----");
    await freezeAsset(account1, account2, assetId, false);
    
    // Revoke (clawback) the asset
    console.log("\n----- Asset Revoke -----");
    await revokeAsset(account1, account2, account1, assetId, 500);
    
    // Send atomic transactions
    console.log("\n----- Atomic Transactions -----");
    await sendAtomicTransactions(account1, [account2, account3], 1000000);
    
    // Send transaction with lease
    console.log("\n----- Transaction with Lease -----");
    const lease = new Uint8Array(32); // Create a 32-byte lease value
    // Fill with random values
    for (let i = 0; i < lease.length; i++) lease[i] = Math.floor(Math.random() * 256);
    await sendTransactionWithLease(account1, account2, 1000000, lease);
    
    // Destroy the asset
    console.log("\n----- Asset Destruction -----");
    await destroyAsset(account1, assetId);
    */
    
    console.log("\n===== TRANSACTION EXAMPLES COMPLETE =====");
  } catch (error) {
    console.error("Error running transaction examples:", error);
  }
}

// Run the examples
// runTransactionExamples();

// Export functions for use in other files
module.exports = {
  getAlgodClient,
  sendPayment,
  createAsset,
  configureAsset,
  optInToAsset,
  transferAsset,
  freezeAsset,
  revokeAsset,
  destroyAsset,
  sendAtomicTransactions,
  sendTransactionWithLease,
  runTransactionExamples
};