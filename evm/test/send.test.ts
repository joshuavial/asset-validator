import { ethers } from 'hardhat';
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { main } from '../scripts/send';

import hre from "hardhat";

describe('send.ts', () => {
  async function deployFixture() {
    // Set up any preconditions here
    return {};
  }

  it('sends a transaction successfully', async () => {
    await loadFixture(deployFixture);

    process.env.PRIVATE_KEY = '0x...';

    // Use the HRE to access Viem clients
    const [walletClient] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    // Set up the recipient address and transaction details
    const recipient = '0xRecipientAddress';
    const transaction = {
      to: recipient,
      value: hre.viem.parseEther("1"),
    };

    // Send the transaction
    const hash = await walletClient.sendTransaction(transaction);
    await publicClient.waitForTransactionReceipt({ hash });

    // Assertions to verify the transaction was sent
    expect(hash).toBeDefined();
  });

  // Additional tests can be added here to cover more scenarios
});
