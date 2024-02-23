import { createWalletClient, custom, parseEther } from 'viem';
import { goerli, http, privateKeyToAccount } from 'viem/chains';
import 'viem/window';

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Please set your PRIVATE_KEY in the environment");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    chain: goerli,
    transport: http(),
    account: account,
  });

  let recipient = process.argv[2];
  if (!recipient) {
    console.error("Please provide a recipient address as an argument");
    process.exit(1);
  }

  // If the recipient address is an ENS name, resolve it to the actual address
  if (recipient.endsWith('.eth')) {
    recipient = await walletClient.resolveName(recipient);
    if (!recipient) {
      console.error("Unable to resolve ENS name");
      process.exit(1);
    }
  }

  const transaction = {
    to: recipient,
    value: parseEther("1"),
  };

  const txResponse = await walletClient.sendTransaction(transaction);
  console.log(`Transaction hash: ${txResponse.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
