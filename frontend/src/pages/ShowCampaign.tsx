import { useEffect, useMemo, useState } from "react";
import { useIsConnected, useWallet } from "@fuels/react";
import { useParams, Link } from "react-router-dom";
import { Contract } from "../sway-api";
import { CONTRACT_ID } from "../config";
import { styles } from "../styles";
import type { CampaignOutput } from "../sway-api/contracts/Contract";
import CampaignAmount from "../components/CampaignAmount";
import CampaignContributeDialog from "../components/CampaignContributeDialog";

export default function ShowCampaign() {
	const { id } = useParams<{ id: string }>();
	const idNum = useMemo(() => Number(id), [id]);
	const { isConnected } = useIsConnected();
	const { wallet } = useWallet();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | undefined>();
	const [campaign, setCampaign] = useState<CampaignOutput | undefined>();
	const [isContributing, setIsContributing] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);

	useEffect(() => {
		const fetchCampaign = async () => {
			if (!isConnected || !wallet) return;
			if (!Number.isFinite(idNum) || idNum <= 0) {
				setError("Invalid campaign id");
				return;
			}
			try {
				setLoading(true);
				setError(undefined);
				const contract = new Contract(CONTRACT_ID, wallet);
				const { value } = await contract.functions.get_campaign(idNum).get();
				// value may be Option<Campaign> after ABI sync; handle both
				const campaign = value && value.id ? value : undefined;
				setCampaign(campaign);
			} catch (e) {
				console.error(e);
				setError("Failed to load campaign");
			} finally {
				setLoading(false);
			}
		};
		fetchCampaign();
	}, [idNum, isConnected, wallet]);

	const onOpenDialog = () => {
		if (!isConnected || !wallet) {
			alert("Please connect your Fuel wallet first.");
			return;
		}
		if (!Number.isFinite(idNum) || idNum <= 0) {
			alert("Invalid campaign id.");
			return;
		}
		setDialogOpen(true);
	};

	const submitContribution = async (amount: number) => {
		try {
			setIsContributing(true);
			setError(undefined);
			if (!wallet) throw new Error("Wallet not available");
			const contract = new Contract(CONTRACT_ID, wallet);

			// Resolve base asset id via the connected provider
			const baseAssetId = await wallet.provider.getBaseAssetId();

			// Payable call: forward the same amount as argument using base asset
			const scope = contract.functions
				.contribute(idNum, amount)
				.callParams({ forward: { amount, assetId: baseAssetId } })
				.txParams({ variableOutputs: 1 });

			const { transactionId, waitForResult } = await scope.call();
			console.log("Submitted contribute tx:", transactionId);
			const { value } = await waitForResult();
			console.log("Total raised after contribution:", value.toNumber());

			// Refresh campaign details
			try {
				const { value: refreshed } = await contract.functions
					.get_campaign(idNum)
					.get();
				const c = refreshed && refreshed.id ? refreshed : undefined;
				setCampaign(c);
			} catch (e) {
				console.warn(
					"Contribution succeeded but failed to refresh campaign:",
					e
				);
			}
			setDialogOpen(false);
		} catch (e) {
			console.error(e);
			const msg = String(e?.toString?.() ?? e);
			setError(
				msg.includes("User rejected")
					? "User rejected the transaction."
					: "Contribution failed. Check console for details."
			);
		} finally {
			setIsContributing(false);
		}
	};

	if (!isConnected) return <p>Please connect your Fuel wallet.</p>;
	if (!Number.isFinite(idNum) || idNum <= 0) return <p>Invalid campaign id.</p>;

	return (
		<div style={{ maxWidth: 960, width: "100%" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<h3 style={{ margin: 0 }}>Campaign #{idNum} Details</h3>
				<Link to="/campaigns" style={styles.link}>
					Back to list
				</Link>
			</div>

			{loading && <p>Loading…</p>}
			{error && <p style={{ color: "#f55" }}>{error}</p>}
			{!loading && !error && !campaign && <p>Campaign not found.</p>}

			{campaign && (
				<div
					style={{
						border: "1px solid #333",
						borderRadius: 8,
						padding: 12,
						background: "#121212",
						marginTop: 12,
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<strong>Campaign #{campaign.id.toNumber()}</strong>
					</div>
					<div
						style={{
							marginTop: 8,
							display: "grid",
							gridTemplateColumns: "repeat(3, 1fr)",
							gap: 8,
						}}
					>
						<CampaignAmount label="Target Goal" value={campaign.target_goal} />
						<CampaignAmount
							label="Total Raised"
							value={campaign.total_raised}
						/>
						<div>
							<div style={{ color: "#aaa", fontSize: 12 }}>Deadline</div>
							<div>
								{new Date(campaign.deadline.toNumber()).toLocaleString()}
							</div>
						</div>
					</div>

					<div style={{ marginTop: 16, display: "flex", gap: 12 }}>
						<button
							onClick={onOpenDialog}
							disabled={isContributing}
							style={styles.button}
						>
							Contribute
						</button>
					</div>
				</div>
			)}

			<CampaignContributeDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onConfirm={submitContribution}
				loading={isContributing}
			/>
		</div>
	);
}
