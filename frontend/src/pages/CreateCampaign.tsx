import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBalance, useIsConnected, useWallet } from "@fuels/react";
import { Contract } from "../sway-api";
import { CONTRACT_ID } from "../config";
import { styles } from "../styles";
import { bn } from "fuels";

export function CreateCampaign() {
	const navigate = useNavigate();
	const [contract, setContract] = useState<Contract>();
	const [targetGoal, setTargetGoal] = useState<string>("");
	const [deadline, setDeadline] = useState<string>(""); // yyyy-mm-dd
	const [createdId, setCreatedId] = useState<number | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const { isConnected } = useIsConnected();
	const { wallet } = useWallet();
	const { balance } = useBalance({ address: wallet?.address.toAddress() });

	// Fuel base asset commonly uses 9 decimals.
	const BASE_DECIMALS = 9;

	const formattedGoal = useMemo(() => {
		const safe = /^\d+$/.test(targetGoal) ? targetGoal : "0";
		return bn(safe).formatUnits(BASE_DECIMALS);
	}, [targetGoal]);

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
			// Redirect to campaign list after successful creation
			navigate("/campaigns");
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
				Target Goal (base units, u64)
				<input
					type="number"
					inputMode="numeric"
					min="0"
					step={1}
					placeholder="e.g. 1000"
					value={targetGoal}
					onChange={(e) => {
						const v = e.target.value.replace(/[^0-9]/g, "");
						setTargetGoal(v);
					}}
					style={styles.input}
				/>
			</label>

			<div
				style={{ marginTop: 4, marginBottom: 8, color: "#aaa", fontSize: 12 }}
			>
				Preview: ≈ {formattedGoal} ETH
			</div>

			<label>
				Deadline (date)
				<input
					type="datetime-local"
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
