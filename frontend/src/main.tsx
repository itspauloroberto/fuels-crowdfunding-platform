import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FuelProvider } from "@fuels/react";
import {
	FuelWalletConnector,
	FuelWalletDevelopmentConnector,
} from "@fuels/connectors";
import { CHAIN_IDS } from "fuels";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<FuelProvider
				fuelConfig={{
					connectors: [
						new FuelWalletConnector(),
						new FuelWalletDevelopmentConnector(),
					],
				}}
				networks={[
					{
						chainId: CHAIN_IDS.fuel.testnet,
						url: "https://testnet.fuel.network/v1/graphql",
						bridgeURL:
							"https://app-testnet.fuel.network/bridge?from=eth&to=fuel&auto_close=true",
					},
				]}
			>
				<App />
			</FuelProvider>
		</QueryClientProvider>
	</StrictMode>
);
