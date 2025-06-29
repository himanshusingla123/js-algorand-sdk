# Algorand SDK Examples

This repository contains examples of using the Algorand JavaScript SDK for various operations including:

- Account Management
- Transaction Operations
- Smart Contracts
- Advanced Features

## Installation

```bash
npm install
```

## Usage

The `algorand-examples.js` file contains various functions demonstrating Algorand SDK capabilities. You can import and use these functions in your own code, or run the examples directly:

```bash
npm start
```

Note: Most examples that interact with the Algorand network require funded accounts. For testing purposes, you can fund accounts using the [Algorand TestNet Faucet](https://bank.testnet.algorand.network/).

## Examples Included

### Account Management
- Generate new accounts
- Recover accounts from mnemonics
- Create multisignature accounts

### Transaction Operations
- Send payment transactions
- Create and manage assets
- Opt-in to assets
- Transfer assets
- Create atomic transaction groups

### Smart Contracts
- Compile TEAL programs
- Create stateless smart contracts (LogicSig)
- Create stateful smart contracts (Applications)
- Call smart contracts

### Advanced Features
- Multisignature transactions
- ABI method calls using AtomicTransactionComposer

## Network Configuration

The examples connect to Algorand's TestNet through AlgoNode's public API endpoints. You can modify the connection settings in the `getAlgodClient()` and `getIndexerClient()` functions to connect to other networks or your own node.

## Additional Resources

- [Algorand Developer Documentation](https://developer.algorand.org/)
- [Algorand JavaScript SDK Documentation](https://algorand.github.io/js-algorand-sdk/)
- [Algorand TestNet Dispenser](https://bank.testnet.algorand.network/)