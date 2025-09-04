Fuels Crowdfunding Platform

# Overview
- Sway smart contract implementing simple crowdfunding campaigns (create-only MVP).
- React + Fuels frontend to create a campaign and view the created id.
- Targets Fuel Testnet; uses Fuels TypeScript SDK for wallet connectivity and bindings.

## Repo Structure
- `contract/`: Sway contract and tests.
- `frontend/`: React app wired to the deployed contract.

## Prerequisites
- Fuel toolchain: install via `fuelup` (includes `forc` and friends).
  - Install: `curl https://install.fuel.network | sh` (then follow prompts)
  - Verify: `forc --version`
- Node.js 18+ and npm.
- Git.
- Fuel Wallet browser extension (recommended) or a CLI-generated private key for deployments.

## How to run it?

1) Create a Wallet (Fuel Tools)
Option A — Browser wallet (recommended for interacting with the dApp)
- Install Fuel Wallet extension and create a wallet: https://wallet.fuel.network/
- Copy your Fuel address and fund it on Testnet via the faucet.

Option B — CLI private key (for deploys via CLI)
- Ensure you have a private key. If you don’t have one, you can generate with any secure method you prefer. Export it as env var when deploying: `export PRIVATE_KEY=0x...`
- Fund the corresponding address on Testnet via the faucet (see below).

2) Get Testnet Funds
- Faucet: https://faucet-testnet.fuel.network/
- Paste your Fuel address and request funds.

3) Build the Contract Locally (ABI generation)
- From repo root:
  - `cd contract`
  - `forc build`
- Artifacts are generated under `contract/out/debug/`, including `contract-abi.json`.

4) Deploy the Contract to Fuel Testnet
Option A — Using forc (if available in your toolchain)
- `cd contract`
- `forc build`
- `forc deploy --testnet`
- Save the printed Contract ID (0x...).

Option B — Using Fuels CLI (uses the provided `frontend/fuels.config.ts`)
- `cd frontend`
- `export PRIVATE_KEY=0x...` (same key funded on Testnet)
- `npx fuels deploy`
- Save the printed Contract ID (0x...).

5) Sync Frontend Bindings (TypeScript `sway-api`)
- The frontend provides a script to build the contract and regenerate bindings via Fuels CLI:
- From repo root: `cd frontend`
- Run: `npm run abi:sync`
  - Internally runs: `forc build -p ../contract && fuels build`
  - Outputs TypeScript bindings to `frontend/src/sway-api/`.

6) Configure Frontend Environment
- In `frontend/`, create `.env` (or `.env.local`) and set:
- `VITE_CONTRACT_ID=0xYOUR_DEPLOYED_CONTRACT_ID`

7) Install Frontend Dependencies and Run
- `cd frontend`
- `npm ci` (or `npm install`)
- `npm run dev`
- Open the printed local URL; connect your Fuel wallet.

# Using the Application

## Create a New Crowdfunding Campaign
- Enter a target goal (u64) and a deadline (date).
- The app converts the selected date to milliseconds (`new Date(value).getTime()`) and passes as `u64` to the contract.
- Click “Create Campaign” and approve the transaction in your wallet.
- The app displays the created campaign id returned by the contract.

# Run Contract Tests (Rust + fuels-rs)
- Build Sway first to ensure ABI/bin exist:
  - `cd contract && forc build`
- Run all tests from `contract/`:
  - `cargo test`
- See test output (no capture):
  - `cargo test -- --nocapture`
- Run a single test:
  - `cargo test test_create_campaign_returns_incrementing_id -- --nocapture`
- Add or modify tests:
  - Create files under `contract/tests/*.rs`.
  - Use `abigen!` pointing to `out/debug/contract-abi.json` and load `./out/debug/contract.bin` (see `tests/harness.rs`).
  - If you change the Sway ABI, re-run `forc build` before `cargo test`.

## Notes
- Frontend network is set to Fuel Testnet by default and uses `@fuels/connectors` to connect.
- If you change contract fields or ABI, re-run `npm run abi:sync` in `frontend/`.
- The Sway contract currently supports campaign creation and basic getters; contributions/refunds can be added iteratively.


## TODOs
1. Implement API to serve resources related to Campaigns that are not necessary to be stored on the blockchain network.
2. Implement TODO improvements to crowdfunding smart contract listed on the sway contract file.
3. Implement user authentication to create profiles and attach profiles to campaigns / contributions.
4. List contributions and campaigns and its details on the frontend.