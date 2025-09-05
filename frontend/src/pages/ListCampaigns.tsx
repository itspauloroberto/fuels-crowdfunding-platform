import { useEffect, useState } from "react";
import { useIsConnected, useWallet } from "@fuels/react";
import { Link } from "react-router-dom";
import { Contract } from "../sway-api";
import { CONTRACT_ID } from "../config";
import type { CampaignOutput } from "../sway-api/contracts/Contract";
import type { Vec } from "../sway-api/contracts/common";
import CampaignAmount from "../components/CampaignAmount";

export function ListCampaigns() {
	const { isConnected } = useIsConnected();
	const { wallet } = useWallet();
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | undefined>(undefined);
	const [campaigns, setCampaigns] = useState<Vec<CampaignOutput>>([]);

	const fetchCampaigns = async () => {
		if (!isConnected || !wallet) return;
		try {
			setLoading(true);
			setError(undefined);
			// Simulations use the connected account to fund the dry-run.
			// An unlocked wallet is required by the SDK for simulate().
			const contract = new Contract(CONTRACT_ID, wallet);
			const { value } = await contract.functions.list_campaigns().get();
			setCampaigns(value as Vec<CampaignOutput>);
		} catch (e) {
			console.error(e);
			const msg = String(e?.toString?.() ?? e);
			if (
				msg.includes("unlocked wallet") ||
				msg.includes("Wallet is required")
			) {
				setError("Please unlock your Fuel Wallet and try again.");
			} else {
				setError("Failed to fetch campaigns");
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCampaigns();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isConnected, wallet]);

	if (!isConnected)
		return <p>Please connect your Fuel wallet to list campaigns.</p>;

	return (
		<div style={{ maxWidth: 960, width: "100%" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<h3 style={{ margin: 0 }}>Campaigns</h3>
				<button
					onClick={fetchCampaigns}
					disabled={loading}
					style={{
						borderRadius: 8,
						background: "#707070",
						color: "#fff",
						border: "none",
						padding: "8px 12px",
						cursor: "pointer",
					}}
				>
					{loading ? "Refreshing…" : "Refresh"}
				</button>
			</div>

			{error && <p style={{ color: "#f55" }}>{error}</p>}

			{campaigns.length === 0 && !loading && <p>No campaigns found.</p>}

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 12,
					marginTop: 12,
				}}
			>
				{campaigns.map((campaign) => {
					const id = campaign.id.toNumber();
					const deadlineMs = campaign.deadline.toNumber();
					const deadlineStr = new Date(deadlineMs).toLocaleString();
					const ownerBits =
						("Address" in campaign.owner && campaign.owner.Address?.bits) ||
						("ContractId" in campaign.owner &&
							campaign.owner.ContractId?.bits) ||
						"";

					return (
						<div
							key={id}
							style={{
								border: "1px solid #333",
								borderRadius: 8,
								padding: 12,
								background: "#121212",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<strong>Campaign #{id}</strong>
								<small style={{ color: "#aaa" }}>
									Owner: {ownerBits.slice(0, 10)}…{ownerBits.slice(-6)}
								</small>
							</div>
							<div
								style={{
									marginTop: 8,
									display: "grid",
									gridTemplateColumns: "repeat(3, 1fr)",
									gap: 8,
								}}
							>
								<CampaignAmount
									label="Target Goal"
									value={campaign.target_goal}
								/>
								<CampaignAmount
									label="Total Raised"
									value={campaign.total_raised}
								/>
								<div>
									<div style={{ color: "#aaa", fontSize: 12 }}>Deadline</div>
									<div>{deadlineStr}</div>
								</div>
								<div style={{ marginTop: 8 }}>
									<Link
										to={`/campaigns/${id}/details`}
										style={{ color: "#8bd", textDecoration: "underline" }}
									>
										View details →
									</Link>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default ListCampaigns;
