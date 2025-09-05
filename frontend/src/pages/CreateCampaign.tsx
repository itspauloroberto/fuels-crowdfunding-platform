import { useEffect, useState } from "react";
import { useBalance, useIsConnected, useWallet } from "@fuels/react";
import { Contract } from "../sway-api";
import { CONTRACT_ID } from "../config";
import { styles } from "../styles";

export function CreateCampaign() {
	const [contract, setContract] = useState<Contract>();
	const [targetGoal, setTargetGoal] = useState<string>("");
	const [deadline, setDeadline] = useState<string>(""); // yyyy-mm-dd
	const [createdId, setCreatedId] = useState<number | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const { isConnected } = useIsConnected();
	const { wallet } = useWallet();
	const { balance } = useBalance({ address: wallet?.address.toAddress() });

	useEffect(() => {
		if (isConnected && wallet) {
			const c = new Contract(CONTRACT_ID, wallet);
			setContract(c);
		} else {
			setContract(undefined);
		}
	}, [isConnected, wallet]);

	const clearForm = () => {
		setTargetGoal("");
		setDeadline("");
	};

	const onCreateCampaign = async () => {
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
			clearForm();
		} catch (error) {
			console.error(error);
			alert("Failed to create campaign. Check console for details.");
		} finally {
			setIsCreating(false);
		}
	};

	if (!isConnected) {
		return <p>Please connect your Fuel wallet to create a campaign.</p>;
	}

	return (
		<div>
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
					onClick={onCreateCampaign}
					style={styles.button}
					disabled={isCreating}
				>
					{isCreating ? "Creating…" : "Create Campaign"}
				</button>
			)}

			{createdId !== null && <p>Created campaign id: {createdId}</p>}
		</div>
	);
}

export default CreateCampaign;
