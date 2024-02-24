import { beforeEach, afterEach, describe, expect, it, vi} from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { parseEther, formatEther, WalletClient, PublicClient } from 'viem'; 

import { send } from '../lib/transactions';

import hre from 'hardhat';

describe('send.ts', () => {
  let walletClient: WalletClient;
  let publicClient: PublicClient;

  beforeEach(async () => {
    [walletClient] = await hre.viem.getWalletClients(); 
    publicClient = await hre.viem.getPublicClient();
    console.log(walletClient.chain);

    vi.mock('viem', () => {
      const actual = await importOriginal();
      console.log('mocked');
      return {
        createPublicClient: vi.fn(() => publicClient),
        createWalletClient: vi.fn(() => walletClient),
        ...viem
        ...actual
      }
    });
  });

  afterEach(async() => {
    vi.clearAllMocks();
  });

  it('sends a transaction successfully', async () => {
    // Test implementation remains unchanged

    const privateKey = generatePrivateKey();
    const recipient = privateKeyToAccount(generatePrivateKey()).address;

    let balance = await publicClient.getBalance({ address: recipient });
    expect(formatEther(balance)).toBe('0');
    console.log(walletClient.privateKey);

    const hash = send(recipient, privateKey);
    await publicClient.waitForTransactionReceipt({ hash });

    // Assertions to verify the transaction was sent
    expect(hash).toBeDefined();
    balance = await publicClient.getBalance({ address: recipient });
    expect(formatEther(balance)).toBe('1.0');
  });
});
