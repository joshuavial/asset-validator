import { generatePrivateKey } from 'viem/accounts';

function main() {
  const privateKey = generatePrivateKey();
  console.log(`New Private Key: ${privateKey}`);
}

main();
