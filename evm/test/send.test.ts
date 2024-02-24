import { beforeEach, afterEach, describe, expect, it, vi} from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { parseEther, formatEther, createPublicClient, createWalletClient} from 'viem'; 

import { send } from '../lib/transactions';

import hre from 'hardhat';

vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPublicClient: vi.fn(),
    createWalletClient: vi.fn(),
  }
});

describe('send.ts', () => {

  afterEach(async() => {
    vi.clearAllMocks();
  });

  it('sends a transaction successfully', async () => {
    const [walletClient] = await hre.viem.getWalletClients();
    let publicClient = await hre.viem.getPublicClient();
    createWalletClient.mockImplementation(() => walletClient);
    createPublicClient.mockImplementation(() => publicClient);

    const privateKey = generatePrivateKey();
    const recipient = privateKeyToAccount(generatePrivateKey()).address;

    let balance = await publicClient.getBalance({ address: recipient });
    expect(formatEther(balance)).toBe('0');

    const hash = await send(recipient, privateKey);

    // Assertions to verify the transaction was sent
    expect(hash).toBeDefined();
    balance = await publicClient.getBalance({ address: recipient });
    expect(formatEther(balance)).toBe('1');
  });
});
