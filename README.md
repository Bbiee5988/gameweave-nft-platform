# GameWeave NFT Platform

A cross-game NFT interoperability platform built on the Stacks blockchain, enabling seamless NFT transfers and interactions across multiple gaming ecosystems.

## Project Overview

The GameWeave NFT Platform aims to solve the problem of siloed, game-specific NFT ecosystems by providing a secure and extensible registry for game platforms to integrate and interact with each other's NFTs. This allows players to use their in-game NFTs across multiple gaming environments, fostering a true cross-game NFT economy.

Key features of the GameWeave platform include:

- Secure and decentralized platform registration and verification
- Robust access control and authorization mechanisms
- Unique platform identifiers and metadata tracking
- Read-only functions for querying platform details and verification status

The core component of the platform is the GameWeave Registry contract, which manages the registration, verification, and lookup of participating game platforms.

## Contract Architecture

The GameWeave Registry contract is designed to provide a secure and extensible platform for cross-game NFT interoperability. It has the following key features:

**Data Structures**:
- `platforms`: A map that stores registered platform details, including the platform name, description, contract address, verification status, and activity status.
- `platform-ids-by-contract-address`: A map that stores the platform ID for a given contract address, enabling efficient lookups.
- `next-platform-id`: A data variable that keeps track of the next available platform ID.

**Public Functions**:
- `register-platform`: Allows the contract owner to register a new game platform with the registry, subject to various validation checks.
- `verify-platform`: Enables the contract owner to mark a registered platform as "verified", indicating that it has been reviewed and approved.
- `get-platform-details`: A read-only function that retrieves the details of a registered platform.
- `get-platform-id-by-address`: A read-only function that looks up the platform ID for a given contract address.
- `is-platform-verified`: A read-only function that checks the verification status of a registered platform.
- `toggle-registration-pause`: Allows the contract owner to temporarily pause or unpause the platform registration process.

**Authorization and Security**:
- The contract owner (the deployer) is the only principal allowed to perform administrative actions, such as verifying platforms and pausing/unpausing registration.
- Validation checks are performed to ensure that the provided contract addresses are valid and do not belong to the contract owner or the transaction sender.
- Error codes with explicit error types are used to provide detailed information about various failure scenarios.

## Installation & Setup

Prerequisites:
- Clarinet: A development environment and testing framework for Clarity smart contracts.

Installation steps:
1. Clone the repository: `git clone https://github.com/your-username/gameweave-nft-platform.git`
2. Navigate to the project directory: `cd gameweave-nft-platform`
3. Install dependencies: `clarinet install`

## Usage Guide

To interact with the GameWeave Registry contract, you can use the following Clarity functions:

**Register a new platform**:
```clarity
(contract-call? 'gameweave-registry 'register-platform 'GamePlatform1 'First game platform description 'ST3J95HBZXJY2HPWW7GGPJJX771LBM9XWJPX1M9N)
```

**Verify a registered platform**:
```clarity
(contract-call? 'gameweave-registry 'verify-platform 1)
```

**Retrieve platform details**:
```clarity
(contract-call? 'gameweave-registry 'get-platform-details 1)
```

**Check platform verification status**:
```clarity
(contract-call? 'gameweave-registry 'is-platform-verified 1)
```

**Pause/Unpause platform registration**:
```clarity
(contract-call? 'gameweave-registry 'toggle-registration-pause)
```

Refer to the [Contract Architecture](#contract-architecture) section for a detailed explanation of each function's purpose and behavior.

## Testing

The GameWeave Registry contract has a comprehensive test suite that covers the following scenarios:

1. **Platform Registration**:
   - Successful registration with valid details
   - Preventing duplicate platform registrations
   - Handling registration during a paused state

2. **Platform Verification**:
   - Verifying platforms by the contract owner
   - Preventing unauthorized platform verification

3. **Authorization and Access Control**:
   - Ensuring only the contract owner can pause/unpause registration

4. **Error Handling**:
   - Preventing registration with an invalid contract address
   - Handling requests for non-existent platform details

5. **Read-Only Functions**:
   - Retrieving platform details
   - Checking platform verification status

To run the tests, use the following command:
```
clarinet test
```

## Security Considerations

The GameWeave Registry contract has several security features and considerations:

**Permissions and Authorization**:
- Only the contract owner (the deployer) is allowed to perform administrative actions, such as verifying platforms and pausing/unpausing registration.
- Access control is enforced using the `is-contract-owner` function, which checks if the transaction sender is the contract owner.

**Data Validation**:
- The contract performs extensive validation checks when registering a new platform, including checking for duplicate contract addresses and invalid contract addresses.
- Error codes with explicit error types are used to provide detailed information about various failure scenarios.

**Registration Pause**:
- The contract owner can temporarily pause the platform registration process if needed, preventing new registrations until it is resumed.

**Upgradability**:
- The current implementation does not provide a way to upgrade the contract, as it is designed to be a standalone registry. However, future versions could explore upgradability mechanisms if needed.

## Examples

**Registering a new platform**:
```clarity
(contract-call? 'gameweave-registry 'register-platform 'GamePlatform1 'First game platform description 'ST3J95HBZXJY2HPWW7GGPJJX771LBM9XWJPX1M9N)
```
This call registers a new platform with the name "GamePlatform1", a description of "First game platform description", and the contract address "ST3J95HBZXJY2HPWW7GGPJJX771LBM9XWJPX1M9N".

**Verifying a registered platform**:
```clarity
(contract-call? 'gameweave-registry 'verify-platform 1)
```
This call verifies the platform with the ID 1, marking it as an approved and trusted platform.

**Retrieving platform details**:
```clarity
(contract-call? 'gameweave-registry 'get-platform-details 1)
```
This call retrieves the details of the platform with the ID 1, including its name, description, contract address, verification status, and activity status.