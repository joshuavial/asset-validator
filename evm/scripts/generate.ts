import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

function main() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  console.log('private: ', privateKey);
  console.log('address: ', account.address);
}

main();
