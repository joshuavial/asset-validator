import { beforeEach, afterEach, describe, expect, it, vi} from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { parseEther, formatEther, WalletClient, PublicClient } from 'viem'; 

import { send } from '../lib/transactions';

import hre from 'hardhat';

describe('send.ts', () => {
  let walletClient: WalletClient;
  let publicClient: PublicClient;

  beforeEach(async () => {
    vi.mock('viem', async (importOriginal) => {
      const actual = await importOriginal();
      const [mockedWalletClient] = await hre.viem.getWalletClients();
      const mockedPublicClient = await hre.viem.getPublicClient();
      console.log('mocked', mockedPublicClient);
      return {
        ...actual,
        createPublicClient: vi.fn(() => mockedPublicClient),
        createWalletClient: vi.fn(() => mockedWalletClient),
      }
    });
  });

  afterEach(async() => {
    vi.clearAllMocks();
  });

  it('sends a transaction successfully', async () => {

    try {
    const privateKey = generatePrivateKey();
    const recipient = privateKeyToAccount(generatePrivateKey()).address;

    let balance = await publicClient.getBalance({ address: recipient });
    expect(formatEther(balance)).toBe('0');

    const hash = await send(recipient, privateKey);

    // Assertions to verify the transaction was sent
    expect(hash).toBeDefined();
    balance = await publicClient.getBalance({ address: recipient });
    expect(formatEther(balance)).toBe('1.0');
    } catch (e) {
      console.log(e);
    }
  });
});
