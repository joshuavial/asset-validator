import 'dotenv/config';
import 'viem/window';
import { send } from '../lib/transactions.ts';

async function main() {
  let recipient: string | null;
  recipient = process.argv[2];
  const privateKey = process.env.PRIVATE_KEY;

  if (privateKey === undefined) {
    throw new Error("Please set your PRIVATE_KEY in the environment");
  } else if (privateKey.match(/^(0x)?[a-fA-F0-9]{64}$/) === null) {
    throw new Error("Invalid private key");
  }

  return await send(recipient, privateKey as `0x${string}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
