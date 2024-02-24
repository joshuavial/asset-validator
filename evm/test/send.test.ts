import { beforeEach, afterEach, describe, expect, it, vi} from 'vitest';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { parseEther, formatEther, WalletClient, PublicClient, createPublicClient, createWalletClient } from 'viem'; 

import { send } from '../lib/transactions';

import hre from 'hardhat';

describe('send.ts', () => {
  let walletClient: WalletClient;
  let publicClient: PublicClient;

  beforeEach(async () => {
    walletClient = new WalletClient();
    publicClient = new PublicClient();

    vi.mock('viem', () => {
      return {
        createPublicClient: vi.fn(() => publicClient),
        createWalletClient: vi.fn(() => walletClient),
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

    const hash = await send(recipient, privateKey);

    // Assertions to verify the transaction was sent
    expect(hash).toBeDefined();
    balance = await publicClient.getBalance({ address: recipient });
    expect(formatEther(balance)).toBe('1.0');
  });
});
