// Algorand Smart Contracts Examples

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
 * Compile a TEAL program
 * @param {string} programSource - TEAL source code
 * @returns {Promise<Uint8Array>} Compiled program bytes
 */
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

/**
 * Create a stateless smart contract (LogicSig)
 * @param {string} programSource - TEAL source code
 * @param {Array<Uint8Array>} args - Optional arguments for the program
 * @returns {Promise<algosdk.LogicSigAccount>} LogicSig account
 */
async function createLogicSignature(programSource, args = []) {
  try {
    // Compile the program
    const programBytes = await compileProgram(programSource);
    
    // Create a LogicSigAccount (escrow account)
    const logicSigAccount = new algosdk.LogicSigAccount(programBytes, args);
    console.log("LogicSig Address:", logicSigAccount.address().toString());
    
    return logicSigAccount;
  } catch (error) {
    console.error("Error creating logic signature:", error);
    throw error;
  }
}

/**
 * Create a delegated LogicSig
 * @param {string} programSource - TEAL source code
 * @param {Object} delegatingAccount - Account delegating signature authority
 * @param {Array<Uint8Array>} args - Optional arguments for the program
 * @returns {Promise<algosdk.LogicSigAccount>} Delegated LogicSig account
 */
async function createDelegatedLogicSignature(programSource, delegatingAccount, args = []) {
  try {
    // Compile the program
    const programBytes = await compileProgram(programSource);
    
    // Create a LogicSigAccount
    const logicSigAccount = new algosdk.LogicSigAccount(programBytes, args);
    
    // Sign the logic signature with the delegating account
    logicSigAccount.sign(delegatingAccount.sk);
    
    console.log("Delegated LogicSig created for account:", delegatingAccount.addr.toString());
    
    return logicSigAccount;
  } catch (error) {
    console.error("Error creating delegated logic signature:", error);
    throw error;
  }
}

/**
 * Send a transaction using a LogicSig
 * @param {algosdk.LogicSigAccount} logicSigAccount - LogicSig account
 * @param {string|Object} receiver - Receiver address or account
 * @param {number} amount - Amount to send
 * @returns {Promise<Object>} Transaction result
 */
async function sendWithLogicSignature(logicSigAccount, receiver, amount) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Convert receiver to string if it's an account object
    const receiverAddress = typeof receiver === 'string' ? receiver : receiver.addr.toString();
    
    // Create the payment transaction
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: logicSigAccount.address().toString(),
      receiver: receiverAddress,
      amount: amount,
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction with the LogicSig
    const signedTxn = algosdk.signLogicSigTransaction(txn, logicSigAccount);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn.blob).do();
    console.log("LogicSig Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("LogicSig transaction confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error sending with LogicSig:", error);
    throw error;
  }
}

/**
 * Create a stateful smart contract (Application)
 * @param {Object} creator - Creator account
 * @param {string} approvalProgram - TEAL source for approval program
 * @param {string} clearProgram - TEAL source for clear program
 * @param {number} globalInts - Number of global ints
 * @param {number} globalBytes - Number of global byte slices
 * @param {number} localInts - Number of local ints
 * @param {number} localBytes - Number of local byte slices
 * @returns {Promise<number>} Application ID
 */
async function createApplication(
  creator, 
  approvalProgram, 
  clearProgram, 
  globalInts = 1, 
  globalBytes = 1, 
  localInts = 1, 
  localBytes = 1
) {
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
      numGlobalByteSlices: globalBytes,
      numGlobalInts: globalInts,
      numLocalByteSlices: localBytes,
      numLocalInts: localInts
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

/**
 * Update an existing application
 * @param {Object} creator - Creator account
 * @param {number} appId - Application ID
 * @param {string} approvalProgram - New TEAL source for approval program
 * @param {string} clearProgram - New TEAL source for clear program
 * @returns {Promise<Object>} Transaction result
 */
async function updateApplication(creator, appId, approvalProgram, clearProgram) {
  try {
    const algodClient = getAlgodClient();
    
    // Compile the approval program
    const compiledApprovalProgram = await compileProgram(approvalProgram);
    
    // Compile the clear program
    const compiledClearProgram = await compileProgram(clearProgram);
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the application update transaction
    const txn = algosdk.makeApplicationUpdateTxnFromObject({
      sender: creator.addr,
      suggestedParams: suggestedParams,
      appIndex: appId,
      approvalProgram: compiledApprovalProgram,
      clearProgram: compiledClearProgram
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(creator.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Application Update Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Application updated in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error updating application:", error);
    throw error;
  }
}

/**
 * Opt-in to an application
 * @param {Object} account - Account to opt-in
 * @param {number} appId - Application ID
 * @returns {Promise<Object>} Transaction result
 */
async function optInToApplication(account, appId) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the application opt-in transaction
    const txn = algosdk.makeApplicationOptInTxnFromObject({
      sender: account.addr,
      suggestedParams: suggestedParams,
      appIndex: appId
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(account.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Application Opt-in Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Application opt-in confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error opting in to application:", error);
    throw error;
  }
}

/**
 * Call an application (NoOp)
 * @param {Object} sender - Sender account
 * @param {number} appId - Application ID
 * @param {Array<string|Uint8Array>} appArgs - Application arguments
 * @param {Array<string|Object>} accounts - Optional accounts to include
 * @param {Array<number>} foreignApps - Optional foreign apps to include
 * @param {Array<number>} foreignAssets - Optional foreign assets to include
 * @returns {Promise<Object>} Transaction result
 */
async function callApplication(
  sender, 
  appId, 
  appArgs = [], 
  accounts = [], 
  foreignApps = [], 
  foreignAssets = []
) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Convert string arguments to Uint8Array
    const convertedArgs = appArgs.map(arg => {
      if (typeof arg === 'string') {
        return new TextEncoder().encode(arg);
      }
      return arg;
    });
    
    // Convert account objects to strings
    const convertedAccounts = accounts.map(acct => {
      return typeof acct === 'string' ? acct : acct.addr.toString();
    });
    
    // Create the application call transaction
    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      sender: sender.addr,
      suggestedParams: suggestedParams,
      appIndex: appId,
      appArgs: convertedArgs,
      accounts: convertedAccounts,
      foreignApps: foreignApps,
      foreignAssets: foreignAssets
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

/**
 * Delete an application
 * @param {Object} creator - Creator account
 * @param {number} appId - Application ID
 * @returns {Promise<Object>} Transaction result
 */
async function deleteApplication(creator, appId) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the application deletion transaction
    const txn = algosdk.makeApplicationDeleteTxnFromObject({
      sender: creator.addr,
      suggestedParams: suggestedParams,
      appIndex: appId
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(creator.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Application Deletion Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Application deleted in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error deleting application:", error);
    throw error;
  }
}

/**
 * Close out from an application
 * @param {Object} account - Account to close out
 * @param {number} appId - Application ID
 * @returns {Promise<Object>} Transaction result
 */
async function closeOutFromApplication(account, appId) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the application close out transaction
    const txn = algosdk.makeApplicationCloseOutTxnFromObject({
      sender: account.addr,
      suggestedParams: suggestedParams,
      appIndex: appId
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(account.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Application Close Out Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Application close out confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error closing out from application:", error);
    throw error;
  }
}

/**
 * Clear state from an application
 * @param {Object} account - Account to clear state
 * @param {number} appId - Application ID
 * @returns {Promise<Object>} Transaction result
 */
async function clearApplicationState(account, appId) {
  try {
    const algodClient = getAlgodClient();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the application clear state transaction
    const txn = algosdk.makeApplicationClearStateTxnFromObject({
      sender: account.addr,
      suggestedParams: suggestedParams,
      appIndex: appId
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(account.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Application Clear State Transaction ID:", txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    console.log("Application clear state confirmed in round:", confirmedTxn.confirmedRound);
    
    return confirmedTxn;
  } catch (error) {
    console.error("Error clearing application state:", error);
    throw error;
  }
}

/**
 * Read global state from an application
 * @param {number} appId - Application ID
 * @returns {Promise<Object>} Global state
 */
async function readGlobalState(appId) {
  try {
    const algodClient = getAlgodClient();
    
    // Get the application
    const application = await algodClient.getApplicationByID(appId).do();
    
    // Extract global state
    const globalState = {};
    
    if (application.params['global-state']) {
      for (const stateItem of application.params['global-state']) {
        const key = Buffer.from(stateItem.key, 'base64').toString();
        let value;
        
        if (stateItem.value.type === 1) {
          // Byte value
          value = Buffer.from(stateItem.value.bytes, 'base64').toString();
        } else {
          // Integer value
          value = stateItem.value.uint;
        }
        
        globalState[key] = value;
      }
    }
    
    console.log("Global State:", globalState);
    
    return globalState;
  } catch (error) {
    console.error("Error reading global state:", error);
    throw error;
  }
}

/**
 * Read local state for an account from an application
 * @param {string|Object} account - Account address or object
 * @param {number} appId - Application ID
 * @returns {Promise<Object>} Local state
 */
async function readLocalState(account, appId) {
  try {
    const algodClient = getAlgodClient();
    
    // Convert account to string if it's an account object
    const accountAddress = typeof account === 'string' ? account : account.addr.toString();
    
    // Get the account information
    const accountInfo = await algodClient.accountInformation(accountAddress).do();
    
    // Find the local state for the application
    const localState = {};
    
    if (accountInfo['apps-local-state']) {
      const appLocalState = accountInfo['apps-local-state'].find(app => app.id === appId);
      
      if (appLocalState && appLocalState['key-value']) {
        for (const stateItem of appLocalState['key-value']) {
          const key = Buffer.from(stateItem.key, 'base64').toString();
          let value;
          
          if (stateItem.value.type === 1) {
            // Byte value
            value = Buffer.from(stateItem.value.bytes, 'base64').toString();
          } else {
            // Integer value
            value = stateItem.value.uint;
          }
          
          localState[key] = value;
        }
      }
    }
    
    console.log("Local State:", localState);
    
    return localState;
  } catch (error) {
    console.error("Error reading local state:", error);
    throw error;
  }
}

// Example usage
async function runSmartContractExamples() {
  try {
    console.log("===== ALGORAND SMART CONTRACT EXAMPLES =====");
    
    // Generate accounts for testing
    const creator = algosdk.generateAccount();
    const user = algosdk.generateAccount();
    
    console.log("Creator Account:", creator.addr.toString());
    console.log("User Account:", user.addr.toString());
    
    // Note: The following examples require funded accounts
    console.log("\nThe following examples require funded accounts on TestNet and won't execute successfully without them.");
    console.log("To fund test accounts, use the Algorand TestNet faucet: https://bank.testnet.algorand.network/");
    
    /*
    // Create a stateless smart contract (LogicSig)
    console.log("\n----- Stateless Smart Contract (LogicSig) -----");
    const programSource = `#pragma version 6
      // Simple stateless contract that always approves
      int 1
      return`;
    const logicSigAccount = await createLogicSignature(programSource);
    
    // Create a delegated LogicSig
    console.log("\n----- Delegated LogicSig -----");
    const delegatedLogicSig = await createDelegatedLogicSignature(programSource, creator);
    
    // Create a stateful smart contract (Application)
    console.log("\n----- Stateful Smart Contract (Application) -----");
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
      
      txn OnCompletion
      int OptIn
      ==
      bnz handle_optin
      
      txn OnCompletion
      int CloseOut
      ==
      bnz handle_closeout
      
      txn OnCompletion
      int UpdateApplication
      ==
      bnz handle_update
      
      txn OnCompletion
      int DeleteApplication
      ==
      bnz handle_delete
      
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
      // Check if we're incrementing the counter
      txna ApplicationArgs 0
      byte "increment"
      ==
      bnz increment
      
      // Check if we're decrementing the counter
      txna ApplicationArgs 0
      byte "decrement"
      ==
      bnz decrement
      
      // Default: reject
      int 0
      return
      
      increment:
      // Increment counter
      byte "counter"
      dup
      app_global_get
      int 1
      +
      app_global_put
      int 1
      return
      
      decrement:
      // Decrement counter
      byte "counter"
      dup
      app_global_get
      int 1
      -
      app_global_put
      int 1
      return
      
      handle_optin:
      // Initialize user's local counter to 0
      int 0
      byte "local_counter"
      int 0
      app_local_put
      int 1
      return
      
      handle_closeout:
      int 1
      return
      
      handle_update:
      int 1
      return
      
      handle_delete:
      int 1
      return`;
    
    const clearProgram = `#pragma version 6
      // Always approve clear state
      int 1
      return`;
    
    const appId = await createApplication(creator, approvalProgram, clearProgram);
    
    // Opt-in to the application
    console.log("\n----- Application Opt-in -----");
    await optInToApplication(user, appId);
    
    // Call the application
    console.log("\n----- Application Call -----");
    await callApplication(creator, appId, ["increment"]);
    
    // Read global state
    console.log("\n----- Read Global State -----");
    const globalState = await readGlobalState(appId);
    
    // Read local state
    console.log("\n----- Read Local State -----");
    const localState = await readLocalState(user, appId);
    
    // Update the application
    console.log("\n----- Application Update -----");
    const updatedApprovalProgram = `#pragma version 6
      // Updated counter application with a new feature
      txn ApplicationID
      int 0
      ==
      bnz handle_create
      
      txn OnCompletion
      int NoOp
      ==
      bnz handle_noop
      
      txn OnCompletion
      int OptIn
      ==
      bnz handle_optin
      
      txn OnCompletion
      int CloseOut
      ==
      bnz handle_closeout
      
      txn OnCompletion
      int UpdateApplication
      ==
      bnz handle_update
      
      txn OnCompletion
      int DeleteApplication
      ==
      bnz handle_delete
      
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
      // Check if we're incrementing the counter
      txna ApplicationArgs 0
      byte "increment"
      ==
      bnz increment
      
      // Check if we're decrementing the counter
      txna ApplicationArgs 0
      byte "decrement"
      ==
      bnz decrement
      
      // Check if we're resetting the counter
      txna ApplicationArgs 0
      byte "reset"
      ==
      bnz reset
      
      // Default: reject
      int 0
      return
      
      increment:
      // Increment counter
      byte "counter"
      dup
      app_global_get
      int 1
      +
      app_global_put
      int 1
      return
      
      decrement:
      // Decrement counter
      byte "counter"
      dup
      app_global_get
      int 1
      -
      app_global_put
      int 1
      return
      
      reset:
      // Reset counter to 0
      byte "counter"
      int 0
      app_global_put
      int 1
      return
      
      handle_optin:
      // Initialize user's local counter to 0
      int 0
      byte "local_counter"
      int 0
      app_local_put
      int 1
      return
      
      handle_closeout:
      int 1
      return
      
      handle_update:
      int 1
      return
      
      handle_delete:
      int 1
      return`;
    
    await updateApplication(creator, appId, updatedApprovalProgram, clearProgram);
    
    // Call the updated application with the new feature
    console.log("\n----- Updated Application Call -----");
    await callApplication(creator, appId, ["reset"]);
    
    // Close out from the application
    console.log("\n----- Application Close Out -----");
    await closeOutFromApplication(user, appId);
    
    // Delete the application
    console.log("\n----- Application Deletion -----");
    await deleteApplication(creator, appId);
    */
    
    console.log("\n===== SMART CONTRACT EXAMPLES COMPLETE =====");
  } catch (error) {
    console.error("Error running smart contract examples:", error);
  }
}

// Run the examples
// runSmartContractExamples();

// Export functions for use in other files
module.exports = {
  getAlgodClient,
  compileProgram,
  createLogicSignature,
  createDelegatedLogicSignature,
  sendWithLogicSignature,
  createApplication,
  updateApplication,
  optInToApplication,
  callApplication,
  deleteApplication,
  closeOutFromApplication,
  clearApplicationState,
  readGlobalState,
  readLocalState,
  runSmartContractExamples
};