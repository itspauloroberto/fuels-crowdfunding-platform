import { useEffect, useState } from "react";
import {
	useBalance,
	useConnectUI,
	useIsConnected,
	useWallet,
} from "@fuels/react";
import { Contract } from "./sway-api";

// Use Vite env for contract ID so we can switch per-network easily
const CONTRACT_ID =
	import.meta.env?.VITE_CONTRACT_ID ||
	"0x0000000000000000000000000000000000000";
// when developing sometimes its quickest to just put your contract_id here but dont forget to remove!

export default function App() {
	const [contract, setContract] = useState<Contract>();
	const [targetGoal, setTargetGoal] = useState<string>("");
	const [deadline, setDeadline] = useState<string>("");
	const [createdId, setCreatedId] = useState<number | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const { connect, isConnecting } = useConnectUI();
	const { isConnected } = useIsConnected();
	const { wallet } = useWallet();
	const { balance } = useBalance({
		address: wallet?.address.toAddress(),
	});

	useEffect(() => {
		if (isConnected && wallet) {
			const swayContract = new Contract(CONTRACT_ID, wallet);
			setContract(swayContract);
		}
	}, [isConnected, wallet]);

	const handleCreateCampaign = async () => {
		if (!contract) return alert("Contract not loaded");

		const goal = Number(targetGoal);
		const endMs = new Date(deadline).getTime();

		if (!Number.isFinite(goal) || Number.isNaN(endMs)) {
			return alert("Please enter valid numbers for goal and deadline.");
		}

		try {
			setIsCreating(true);
			const call = await contract.functions.create_campaign(goal, endMs).call();
			const { value } = await call.waitForResult();
			setCreatedId(value.toNumber());
		} catch (error) {
			console.error(error);
			alert("Failed to create campaign. Check console for details.");
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<div style={styles.root}>
			<div style={styles.container}>
				{isConnected ? (
					<>
						<h3 style={styles.label}>Create Campaign</h3>

						<label>
							Target Goal (u64)
							<input
								type="number"
								min="0"
								value={targetGoal}
								onChange={(e) => setTargetGoal(e.target.value)}
								style={styles.input}
							/>
						</label>

						<label>
							Deadline (date)
							<input
								type="date"
								value={deadline}
								onChange={(e) => setDeadline(e.target.value)}
								style={styles.input}
							/>
						</label>

						{balance && balance.toNumber() === 0 ? (
							<p>
								Get testnet funds from the{" "}
								<a
									target="_blank"
									rel="noopener noreferrer"
									href={`https://faucet-testnet.fuel.network/?address=${wallet?.address.toAddress()}`}
								>
									Fuel Faucet
								</a>{" "}
								to create a campaign.
							</p>
						) : (
							<button
								onClick={handleCreateCampaign}
								style={styles.button}
								disabled={isCreating}
							>
								{isCreating ? "Creating…" : "Create Campaign"}
							</button>
						)}

						{createdId !== null && <p>Created campaign id: {createdId}</p>}

						<p>Your Fuel Wallet address is:</p>
						<p>{wallet?.address.toAddress()}</p>
					</>
				) : (
					<button onClick={() => connect()} style={styles.button}>
						{isConnecting ? "Connecting" : "Connect"}
					</button>
				)}
			</div>
		</div>
	);
}

const styles = {
	root: {
		display: "grid",
		placeItems: "center",
		height: "100vh",
		width: "100vw",
		backgroundColor: "black",
	} as React.CSSProperties,
	container: {
		color: "#ffffffec",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
	} as React.CSSProperties,
	label: {
		fontSize: "28px",
	},
	button: {
		borderRadius: "8px",
		margin: "24px 0px",
		backgroundColor: "#707070",
		fontSize: "16px",
		color: "#ffffffec",
		border: "none",
		outline: "none",
		height: "60px",
		padding: "0 1rem",
		cursor: "pointer",
	},
	input: {
		marginTop: "8px",
		marginBottom: "16px",
		height: "40px",
		borderRadius: "6px",
		padding: "0 0.5rem",
		border: "1px solid #444",
		backgroundColor: "#1a1a1a",
		color: "#ffffffec",
		width: "280px",
		display: "block",
	},
};
