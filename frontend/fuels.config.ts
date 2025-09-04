import { createConfig } from 'fuels';

export default createConfig({
  contracts: [
        '../contract',
  ],
  output: './src/sway-api',
  // Point CLI deploy/build provider to Fuel Testnet
  // Set PRIVATE_KEY in your env to deploy
  providerUrl: 'https://testnet.fuel.network/v1/graphql',
});

/**
 * Check the docs:
 * https://docs.fuel.network/docs/fuels-ts/fuels-cli/config-file/
 */
