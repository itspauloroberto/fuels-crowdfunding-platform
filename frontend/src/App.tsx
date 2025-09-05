import { useConnectUI, useIsConnected, useWallet } from "@fuels/react";
import { useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { styles } from "./styles";
import CreateCampaign from "./pages/CreateCampaign";
import ListCampaigns from "./pages/ListCampaigns";
import ShowCampaign from "./pages/ShowCampaign";

export default function App() {
	const { connect, isConnecting } = useConnectUI();
	const { isConnected } = useIsConnected();
	const { wallet } = useWallet();
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<div style={styles.root}>
			<div style={styles.container}>
				{/* Main menu */}
				<div style={styles.menuBar}>
					<div style={{ position: "relative" }}>
						<button
							style={{
								...styles.link,
								cursor: "pointer",
								border: "none",
								width: 210,
							}}
							onClick={() => setMenuOpen((o) => !o)}
						>
							<span>Main Menu</span>
							<span
								style={{
									right: 10,
									position: "absolute",
									top: menuOpen ? 9 : -5,
									fontSize: 26,
									transform: menuOpen ? "rotate(180deg)" : "none",
								}}
							>
								{" "}
								⌄
							</span>
						</button>
						{menuOpen && (
							<div
								style={{
									position: "absolute",
									top: "110%",
									left: 0,
									background: "#1a1a1a",
									border: "1px solid #333",
									borderRadius: 8,
									minWidth: 200,
									boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
									padding: 6,
									zIndex: 20,
								}}
							>
								<Link
									to="/campaigns"
									onClick={() => setMenuOpen(false)}
									style={{
										display: "block",
										color: "#fff",
										textDecoration: "none",
										padding: "8px 10px",
										borderRadius: 6,
									}}
								>
									Show all campaigns
								</Link>
								<Link
									to="/campaign/create"
									onClick={() => setMenuOpen(false)}
									style={{
										display: "block",
										color: "#fff",
										textDecoration: "none",
										padding: "8px 10px",
										borderRadius: 6,
									}}
								>
									Create new campaign
								</Link>
							</div>
						)}
					</div>
				</div>

				{/* Header */}
				<header style={{ ...styles.header, justifyContent: "flex-end" } as any}>
					{!isConnected && (
						<button onClick={() => connect()} style={styles.button}>
							{isConnecting ? "Connecting" : "Connect"}
						</button>
					)}
				</header>

				<Routes>
					<Route index element={<Navigate to="/campaign/create" replace />} />
					<Route path="/campaign/create" element={<CreateCampaign />} />
					<Route path="/campaigns" element={<ListCampaigns />} />
					<Route path="/campaigns/:id/details" element={<ShowCampaign />} />
					<Route
						path="*"
						element={<Navigate to="/campaign/create" replace />}
					/>
				</Routes>

				{/* Footer */}
				{isConnected && (
					<div style={styles.footer as any}>
						Connected: {wallet?.address.toAddress()}
					</div>
				)}
			</div>
		</div>
	);
}
