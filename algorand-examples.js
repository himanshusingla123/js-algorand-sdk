// Algorand SDK Examples
// This file demonstrates key features of the Algorand JavaScript SDK

const algosdk = require('algosdk');

// ===== ACCOUNT MANAGEMENT =====

// Generate a new account
function generateAccount() {
  const account = algosdk.generateAccount();
  console.log("Account Address:", account.addr.toString());
  
  // Convert the account private key to a mnemonic phrase for backup
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  console.log("Account Mnemonic:", mnemonic);
  
  return { account, mnemonic };
}

// Recover an account from a mnemonic phrase
function recoverAccount(mnemonic) {
  const recoveredAccount = algosdk.mnemonicToSecretKey(mnemonic);
  console.log("Recovered Account Address:", recoveredAccount.addr.toString());
  return recoveredAccount;
}

// ===== CONNECTING TO NETWORKS =====

// Connect to AlgoNode's TestNet
function getAlgodClient() {
  const algodToken = '';
  const algodServer = 'https://testnet-api.algonode.cloud';
  const algodPort = '';
  
  const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
  return algodClient;
}

// Connect to AlgoNode's TestNet Indexer
function getIndexerClient() {
  const indexerToken = '';
  const indexerServer = 'https://testnet-idx.algonode.cloud';
  const indexerPort = '';
  
  const indexerClient = new algosdk.Indexer(indexerToken, indexerServer, indexerPort);
  return indexerClient;
}

// ===== TRANSACTION OPERATIONS =====

// Create and send a payment transaction
async function sendPayment(sender, receiver, amount, note) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters from the network
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the payment transaction
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: sender.addr,
      receiver: receiver.addr,
      amount: amount,
      note: new TextEncoder().encode(note),
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(sender.sk);
    
    // Submit the transaction to the network
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Transaction confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error sending payment:", error);
    throw error;
  }
}

// Create and send an asset creation transaction
async function createAsset(creator, assetName, unitName, totalIssuance, decimals) {
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
      assetURL: "https://example.com",
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

// Opt-in to an asset
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

// Transfer an asset
async function transferAsset(sender, receiver, assetId, amount) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the asset transfer transaction
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: sender.addr,
      receiver: receiver.addr,
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

// ===== ATOMIC TRANSACTIONS =====

// Create and send a group of transactions atomically
async function sendAtomicTransactions(sender, receiver1, receiver2, amount) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create two payment transactions
    const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: sender.addr,
      receiver: receiver1.addr,
      amount: amount,
      note: new TextEncoder().encode("First payment in atomic group"),
      suggestedParams: suggestedParams
    });
    
    const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: sender.addr,
      receiver: receiver2.addr,
      amount: amount,
      note: new TextEncoder().encode("Second payment in atomic group"),
      suggestedParams: suggestedParams
    });
    
    // Group the transactions
    const txnGroup = [txn1, txn2];
    algosdk.assignGroupID(txnGroup);
    
    // Sign the transactions
    const signedTxn1 = txn1.signTxn(sender.sk);
    const signedTxn2 = txn2.signTxn(sender.sk);
    const signedTxnGroup = [signedTxn1, signedTxn2];
    
    // Submit the transaction group
    const { txId } = await algodClient.sendRawTransaction(signedTxnGroup).do();
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

// ===== SMART CONTRACTS =====

// Compile a TEAL program
async function compileProgram(programSource) {
  try {
    const algodClient = getAlgodClient();
    
    // Compile the program
    const compiledProgram = await algodClient.compile(programSource).do();
    console.log("Program compiled successfully");
    
    // Decode the program bytes
    const programBytes = new Uint8Array(Buffer.from(compiledProgram.result, "base64"));
    
    return programBytes;
  } catch (error) {
    console.error("Error compiling program:", error);
    throw error;
  }
}

// Create a stateless smart contract (LogicSig)
async function createLogicSignature(programSource) {
  try {
    // Compile the program
    const programBytes = await compileProgram(programSource);
    
    // Create a LogicSigAccount (escrow account)
    const logicSigAccount = new algosdk.LogicSigAccount(programBytes);
    console.log("LogicSig Address:", logicSigAccount.address().toString());
    
    return logicSigAccount;
  } catch (error) {
    console.error("Error creating logic signature:", error);
    throw error;
  }
}

// Create a stateful smart contract (Application)
async function createApplication(creator, approvalProgram, clearProgram) {
  try {
    const algodClient = getAlgodClient();
    
    // Compile the approval program
    const compiledApprovalProgram = await compileProgram(approvalProgram);
    
    // Compile the clear program
    const compiledClearProgram = await compileProgram(clearProgram);
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the application creation transaction
    const txn = algosdk.makeApplicationCreateTxnFromObject({
      sender: creator.addr,
      suggestedParams: suggestedParams,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram: compiledApprovalProgram,
      clearProgram: compiledClearProgram,
      numGlobalByteSlices: 1,
      numGlobalInts: 1,
      numLocalByteSlices: 1,
      numLocalInts: 1
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(creator.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Application Creation Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Application created in round:", confirmedTxn.confirmedRound);
    
    // Get the application ID
    const appId = confirmedTxn.applicationIndex;
    console.log("Application ID:", appId);
    
    return appId;
  } catch (error) {
    console.error("Error creating application:", error);
    throw error;
  }
}

// Call a stateful smart contract
async function callApplication(sender, appId, appArgs) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the application call transaction
    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      sender: sender.addr,
      suggestedParams: suggestedParams,
      appIndex: appId,
      appArgs: appArgs.map(arg => new TextEncoder().encode(arg))
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(sender.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Application Call Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Application call confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error calling application:", error);
    throw error;
  }
}

// ===== ADVANCED FEATURES =====

// Create a multisignature account
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

// Sign a transaction with a multisignature account
async function sendMultisigTransaction(multisigParams, signers, receiver, amount) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the payment transaction
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: algosdk.multisigAddress(multisigParams).toString(),
      receiver: receiver.addr,
      amount: amount,
      note: new TextEncoder().encode("Multisig transaction"),
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction with the first signer
    let signedTxn = algosdk.signMultisigTransaction(txn, multisigParams, signers[0].sk);
    
    // Add signatures from other signers
    for (let i = 1; i < signers.length; i++) {
      signedTxn = algosdk.appendSignMultisigTransaction(signedTxn.blob, multisigParams, signers[i].sk);
    }
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn.blob).do();
    console.log("Multisig Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Multisig transaction confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error sending multisig transaction:", error);
    throw error;
  }
}

// Use the Atomic Transaction Composer for ABI method calls
async function callABIMethod(sender, appId, methodName, methodArgs) {
  try {
    const algodClient = getAlgodClient();
    
    // Define a simple ABI contract
    const contract = new algosdk.ABIContract({
      name: "Example Contract",
      methods: [
        {
          name: methodName,
          args: [
            { type: "string", name: "message" }
          ],
          returns: { type: "uint64" }
        }
      ]
    });
    
    // Get the method by name
    const method = contract.getMethodByName(methodName);
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create an AtomicTransactionComposer
    const atc = new algosdk.AtomicTransactionComposer();
    
    // Add the method call
    atc.addMethodCall({
      appID: appId,
      method: method,
      methodArgs: methodArgs,
      sender: sender.addr,
      suggestedParams: suggestedParams,
      signer: algosdk.makeBasicAccountTransactionSigner(sender)
    });
    
    // Execute the transaction
    const result = await atc.execute(algodClient, 5);
    console.log("ABI Method Call Transaction ID:", result.txIDs[0]);
    console.log("ABI Method Call Result:", result.methodResults[0].returnValue);
    
    return result;
  } catch (error) {
    console.error("Error calling ABI method:", error);
    throw error;
  }
}

// ===== EXAMPLE USAGE =====

async function runExamples() {
  try {
    console.log("===== ALGORAND SDK EXAMPLES =====");
    
    // Generate accounts for testing
    console.log("\n----- Account Management -----");
    const { account: account1, mnemonic: mnemonic1 } = generateAccount();
    const { account: account2 } = generateAccount();
    const { account: account3 } = generateAccount();
    
    // Recover account from mnemonic
    const recoveredAccount = recoverAccount(mnemonic1);
    console.log("Account recovery successful:", account1.addr.toString() === recoveredAccount.addr.toString());
    
    // Note: The following examples would work on a real network with funded accounts
    console.log("\nThe following examples require funded accounts on TestNet and won't execute successfully without them.");
    console.log("To fund test accounts, use the Algorand TestNet faucet: https://bank.testnet.algorand.network/");
    
    /*
    // Send a payment transaction
    console.log("\n----- Payment Transaction -----");
    await sendPayment(account1, account2, 1000000, "Example payment");
    
    // Create an asset
    console.log("\n----- Asset Creation -----");
    const assetId = await createAsset(account1, "Example Token", "EX", 1000000, 0);
    
    // Opt-in to the asset
    console.log("\n----- Asset Opt-in -----");
    await optInToAsset(account2, assetId);
    
    // Transfer the asset
    console.log("\n----- Asset Transfer -----");
    await transferAsset(account1, account2, assetId, 1000);
    
    // Send atomic transactions
    console.log("\n----- Atomic Transactions -----");
    await sendAtomicTransactions(account1, account2, account3, 1000000);
    
    // Create a stateless smart contract
    console.log("\n----- Stateless Smart Contract -----");
    const programSource = `#pragma version 6
      // Simple stateless contract that always approves
      int 1
      return`;
    const logicSigAccount = await createLogicSignature(programSource);
    
    // Create a stateful smart contract
    console.log("\n----- Stateful Smart Contract -----");
    const approvalProgram = `#pragma version 6
      // Simple counter application
      txn ApplicationID
      int 0
      ==
      bnz handle_create
      
      txn OnCompletion
      int NoOp
      ==
      bnz handle_noop
      
      // Default: reject
      int 0
      return
      
      handle_create:
      // Initialize counter to 0
      byte "counter"
      int 0
      app_global_put
      int 1
      return
      
      handle_noop:
      // Increment counter
      byte "counter"
      dup
      app_global_get
      int 1
      +
      app_global_put
      int 1
      return`;
    
    const clearProgram = `#pragma version 6
      // Always approve clear state
      int 1
      return`;
    
    const appId = await createApplication(account1, approvalProgram, clearProgram);
    
    // Call the stateful smart contract
    console.log("\n----- Stateful Smart Contract Call -----");
    await callApplication(account1, appId, ["increment"]);
    
    // Create a multisignature account
    console.log("\n----- Multisignature Account -----");
    const { multisigParams } = createMultisigAccount(
      [account1.addr, account2.addr, account3.addr],
      2
    );
    
    // Send a multisignature transaction
    console.log("\n----- Multisignature Transaction -----");
    await sendMultisigTransaction(multisigParams, [account1, account2], account3, 1000000);
    
    // Call an ABI method
    console.log("\n----- ABI Method Call -----");
    await callABIMethod(account1, appId, "increment", ["Hello, ABI!"]);
    */
    
    console.log("\n===== EXAMPLES COMPLETE =====");
  } catch (error) {
    console.error("Error running examples:", error);
  }
}

// Run the examples
// runExamples();

// Export functions for use in other files
module.exports = {
  // Account Management
  generateAccount,
  recoverAccount,
  
  // Network Connections
  getAlgodClient,
  getIndexerClient,
  
  // Transaction Operations
  sendPayment,
  createAsset,
  optInToAsset,
  transferAsset,
  sendAtomicTransactions,
  
  // Smart Contracts
  compileProgram,
  createLogicSignature,
  createApplication,
  callApplication,
  
  // Advanced Features
  createMultisigAccount,
  sendMultisigTransaction,
  callABIMethod,
  
  // Example Runner
  runExamples
};