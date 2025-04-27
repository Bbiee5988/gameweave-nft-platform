import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Error Code Constants (matching those in the contract)
const ERR_UNAUTHORIZED = 100;
const ERR_PLATFORM_EXISTS = 101;
const ERR_PLATFORM_NOT_FOUND = 102;
const ERR_REGISTRATION_PAUSED = 103;
const ERR_INVALID_CONTRACT_ADDRESS = 104;

// Helper function to register a platform
function registerPlatform(
  chain: Chain, 
  sender: Account, 
  name: string, 
  description: string, 
  contractAddress: Account
) {
  return chain.mineBlock([
    Tx.contractCall(
      'gameweave-registry', 
      'register-platform', 
      [
        types.ascii(name), 
        types.ascii(description), 
        types.principal(contractAddress.address)
      ],
      sender.address
    )
  ]);
}

// 1. Platform Registration Tests
Clarinet.test({
  name: "Platform Registration: Successful registration with valid details",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const platform1 = accounts.get('wallet_1')!;

    const block = registerPlatform(
      chain, 
      deployer, 
      'GamePlatform1', 
      'First game platform description', 
      platform1
    );

    // Verify successful registration
    block.receipts[0].result.expectOk().expectUint(1); // First platform should have ID 1

    // Verify platform details can be retrieved
    const platformDetails = chain.callReadOnlyFn(
      'gameweave-registry', 
      'get-platform-details', 
      [types.uint(1)], 
      deployer.address
    );
    
    platformDetails.result.expectSome();
    
    // Check specific details
    const details = platformDetails.result.expectSomeValue();
    details['name'].expectAscii('GamePlatform1');
    details['verified'].expectBool(false);
    details['active'].expectBool(true);
  }
});

Clarinet.test({
  name: "Platform Registration: Prevent duplicate platform registrations",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const platform1 = accounts.get('wallet_1')!;

    // First registration should succeed
    const firstRegistration = registerPlatform(
      chain, 
      deployer, 
      'GamePlatform1', 
      'First game platform description', 
      platform1
    );
    firstRegistration.receipts[0].result.expectOk();

    // Second registration with same contract address should fail
    const secondRegistration = registerPlatform(
      chain, 
      deployer, 
      'GamePlatform2', 
      'Another platform description', 
      platform1
    );
    
    secondRegistration.receipts[0].result
      .expectErr()
      .expectUint(ERR_PLATFORM_EXISTS);
  }
});

Clarinet.test({
  name: "Platform Registration: Handle registration during paused state",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const platform1 = accounts.get('wallet_1')!;

    // Pause registration
    const pauseBlock = chain.mineBlock([
      Tx.contractCall('gameweave-registry', 'toggle-registration-pause', [], deployer.address)
    ]);
    pauseBlock.receipts[0].result.expectOk();

    // Attempt to register during pause
    const registrationBlock = registerPlatform(
      chain, 
      deployer, 
      'GamePlatform1', 
      'Platform description', 
      platform1
    );
    
    registrationBlock.receipts[0].result
      .expectErr()
      .expectUint(ERR_REGISTRATION_PAUSED);
  }
});

// 2. Platform Verification Tests
Clarinet.test({
  name: "Platform Verification: Verify platforms by contract owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const platform1 = accounts.get('wallet_1')!;

    // First register a platform
    const registrationBlock = registerPlatform(
      chain, 
      deployer, 
      'GamePlatform1', 
      'First game platform description', 
      platform1
    );
    registrationBlock.receipts[0].result.expectOk();

    // Verify the platform
    const verifyBlock = chain.mineBlock([
      Tx.contractCall(
        'gameweave-registry', 
        'verify-platform', 
        [types.uint(1)], 
        deployer.address
      )
    ]);
    
    verifyBlock.receipts[0].result.expectOk();

    // Check verification status
    const verificationStatus = chain.callReadOnlyFn(
      'gameweave-registry', 
      'is-platform-verified', 
      [types.uint(1)], 
      deployer.address
    );
    
    verificationStatus.result.expectBool(true);
  }
});

Clarinet.test({
  name: "Platform Verification: Prevent unauthorized platform verification",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const platform1 = accounts.get('wallet_1')!;
    const randomUser = accounts.get('wallet_2')!;

    // First register a platform
    const registrationBlock = registerPlatform(
      chain, 
      deployer, 
      'GamePlatform1', 
      'First game platform description', 
      platform1
    );
    registrationBlock.receipts[0].result.expectOk();

    // Attempt verification by unauthorized user
    const verifyBlock = chain.mineBlock([
      Tx.contractCall(
        'gameweave-registry', 
        'verify-platform', 
        [types.uint(1)], 
        randomUser.address
      )
    ]);
    
    verifyBlock.receipts[0].result
      .expectErr()
      .expectUint(ERR_UNAUTHORIZED);
  }
});

// 3. Authorization and Access Control Tests
Clarinet.test({
  name: "Authorization: Only contract owner can pause/unpause registration",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const randomUser = accounts.get('wallet_1')!;

    // Attempt to pause by unauthorized user
    const unauthorizedPauseBlock = chain.mineBlock([
      Tx.contractCall(
        'gameweave-registry', 
        'toggle-registration-pause', 
        [], 
        randomUser.address
      )
    ]);
    
    unauthorizedPauseBlock.receipts[0].result
      .expectErr()
      .expectUint(ERR_UNAUTHORIZED);

    // Pause by deployer (authorized) should succeed
    const authorizedPauseBlock = chain.mineBlock([
      Tx.contractCall(
        'gameweave-registry', 
        'toggle-registration-pause', 
        [], 
        deployer.address
      )
    ]);
    
    authorizedPauseBlock.receipts[0].result.expectOk();
  }
});

// 4. Error Handling Tests
Clarinet.test({
  name: "Error Handling: Invalid contract address prevents registration",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // Attempt to register with deployer's address (which is not allowed)
    const registrationBlock = registerPlatform(
      chain, 
      deployer, 
      'GamePlatform1', 
      'Platform description', 
      deployer
    );
    
    registrationBlock.receipts[0].result
      .expectErr()
      .expectUint(ERR_INVALID_CONTRACT_ADDRESS);
  }
});

Clarinet.test({
  name: "Error Handling: Get non-existent platform details",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // Try to get details for non-existent platform
    const platformDetails = chain.callReadOnlyFn(
      'gameweave-registry', 
      'get-platform-details', 
      [types.uint(999)], 
      deployer.address
    );
    
    platformDetails.result.expectNone();
  }
});

// 5. Read-Only Function Tests
Clarinet.test({
  name: "Read-Only: Retrieve platform details and check verification status",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const platform1 = accounts.get('wallet_1')!;

    // Register platform
    const registrationBlock = registerPlatform(
      chain, 
      deployer, 
      'GamePlatform1', 
      'Platform description', 
      platform1
    );
    registrationBlock.receipts[0].result.expectOk();

    // Verify platform
    const verifyBlock = chain.mineBlock([
      Tx.contractCall(
        'gameweave-registry', 
        'verify-platform', 
        [types.uint(1)], 
        deployer.address
      )
    ]);
    verifyBlock.receipts[0].result.expectOk();

    // Retrieve platform details
    const platformDetails = chain.callReadOnlyFn(
      'gameweave-registry', 
      'get-platform-details', 
      [types.uint(1)], 
      deployer.address
    );
    
    const details = platformDetails.result.expectSomeValue();
    details['name'].expectAscii('GamePlatform1');
    details['verified'].expectBool(true);

    // Check verification status
    const verificationStatus = chain.callReadOnlyFn(
      'gameweave-registry', 
      'is-platform-verified', 
      [types.uint(1)], 
      deployer.address
    );
    
    verificationStatus.result.expectBool(true);
  }
});