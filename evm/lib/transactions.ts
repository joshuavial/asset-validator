import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, goerli } from 'viem/chains';
import { normalize } from 'viem/ens';

export async function send(recipient:string, privateKey:`0x${string}`){

  const mainnetPublicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  });
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

  if (!recipient) {
    console.error("Please provide a recipient address as an argument");
    process.exit(1);
  }

  if (recipient.endsWith('.eth')) {
    recipient = await mainnetPublicClient.getEnsAddress({name: normalize(recipient)}) as string;
    if (!recipient) {
      console.error("Unable to resolve ENS name");
      process.exit(1);
    }
  }

  const transaction = {
    to: recipient as `0x${string}`,
    value: parseEther("1"),
  };

  const hash = await walletClient.sendTransaction(transaction);
  console.log(`Transaction hash: ${hash}`);
  return hash
}
