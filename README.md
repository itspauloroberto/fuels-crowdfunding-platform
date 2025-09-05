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
- Copy your Fuel address and fund it on Testnet via the faucet (https://faucet-testnet.fuel.network/).

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
Option A — Using forc (recommended)
- `cd contract`
- `forc build`
- `forc deploy --testnet`
- Save the printed Contract ID (0x...) to use on Step 6)

Option B — Using Fuels CLI (uses the provided `frontend/fuels.config.ts`)
- `cd frontend`
- `export PRIVATE_KEY=0x...` (same key funded on Testnet)
- `npx fuels deploy`
- Save the printed Contract ID (0x...) to use on Step 6)

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
- Enter a target goal (in base units) and a deadline (date and time).
- The app converts the selected date to milliseconds (`new Date(value).getTime()`) and passes as `u64` to the contract.
- Click “Create Campaign” and approve the transaction in your wallet.
- The app displays the created campaign on the list.

## List the available campaigns
- Click on Main Menu -> Show all Campaigns
- App should fetch and load all the available campaigns on the contract you are vieweing.


## View campaign details 
- Go to the campaigns list and click "View details ->" on a campaign
- You should access a detailed page for the Campaign containing the campaign information
- There is also a contribute button who opens a dialog modal that you can use to contribute to the campaign

## Contribute to a campaign
- Go to the campaigns list and click "View details ->" on a campaign
- Click on the "Contribute" button on the campaign details
- A modal dialog should open having a input that you can type the amount in base units that you want to contribute for this campaign.
- Click "Send" button after informing the amount.
- Your wallet will open and you will need to sign to confirm the transaction.
- After the contribution is done you will be redirected to the campaign list to check the new total raised after your contribution.

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


# TODOs - Things that i would like to do if i had time
1. Implement Claim functionality to claim campaigns after they met the treshold goal of contributions.
2. Implement Refund functionality to contributors be able to refund the contributions done if the campaign does not meet the goal until the deadline has ended.
3. Implement functionality to cancel a Campaign and refund all the funds to the contributors.
4. Implement differentiation on the frontend about campaigns that were claimed or cancelled already or the deadline has already passed, so contributors could see it clear on the list.
5. Implement filtering on the Campaigns so the users can filter by claimed or cancelled or refundable.
6. Implement API to serve resources related to Campaigns that are not recommended to be stored on the blockchain network such as "Title" and "Description" or "Image", so the application UI / UX could be improved by adding those.
7. Add a type enum to the Campaign that indicates if the campaign is "all or nothing" or "flexible" when it comes to the owner withdraw funds from it
  - Flexible -> owner can claim / withdraw funds without reaching the goal
  - All or Nothing -> owner can only claim / withdraw funds after the campaign did reach the goal
8. Add a type enum to the campaign to indicate whether it has a Soft or Hard cap when it comes to contributions after reaching the goal:
  - Soft Cap: Users can contribute to the campaign even after reaching the goal
  - Hard Cap: Users can no longer contribute to the campaign if it has already reached the goal
9. Implement user authentication to create user profiles and attach profiles to campaigns / contributions and wallet addresses to profiles.
10. Rewrite contract tests to live at the sway contract instead of cargo to be able to run them using `forc test`, right now they are run using `forc build` and `cargo test`.
11. Add frontend end-to-end and unit tests.
12. Separate styles from TSX files and avoid using inline styles.
13. Implement Context to maintain a few things in the memory to avoid unnecessary frontend API calls
14. Optimistic updates on frontend to improve UX
15. Refactor the entire UI to something more fancy and beautiful (its looking ugly right now)
