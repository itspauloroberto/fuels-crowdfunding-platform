import { useEffect, useMemo, useState } from "react";
import { bn } from "fuels";
import { styles } from "../styles";

type Props = {
	open: boolean;
	onClose: () => void;
	onConfirm: (amountBaseUnits: number) => Promise<void> | void;
	loading?: boolean;
};

// Fuel base asset commonly uses 9 decimals. The preview renders base units
// as a fixed 9-decimal representation via BN.formatUnits(9), e.g., 1 -> 0.000000001 ETH
const BASE_DECIMALS = 9;

export default function CampaignContributeDialog({
	open,
	onClose,
	onConfirm,
	loading,
}: Props) {
	const [amount, setAmount] = useState<string>(""); // integer base units

	useEffect(() => {
		if (!open) setAmount("");
	}, [open]);

	const formatted = useMemo(() => {
		const safe = /^\d+$/.test(amount) ? amount : "0";
		return bn(safe).formatUnits(BASE_DECIMALS);
	}, [amount]);

	if (!open) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="contribute-title"
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.6)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1000,
			}}
			onClick={onClose}
		>
			<div
				style={{
					background: "#121212",
					color: "#fff",
					border: "1px solid #333",
					borderRadius: 12,
					width: "min(520px, 90vw)",
					padding: 16,
					boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<h3 id="contribute-title" style={{ margin: 0 }}>
						Contribute
					</h3>
					<button
						onClick={onClose}
						style={{ ...styles.button, background: "#444" }}
					>
						×
					</button>
				</div>

				<div style={{ marginTop: 12 }}>
					<label style={{ display: "block" }}>
						<div style={{ color: "#aaa", fontSize: 12, marginBottom: 6 }}>
							Amount (base units, u64)
						</div>
						<input
							type="number"
							inputMode="numeric"
							min={1}
							step={1}
							placeholder="e.g. 1000"
							value={amount}
							onChange={(e) => {
								const v = e.target.value.replace(/[^0-9]/g, "");
								setAmount(v);
							}}
							style={{
								width: "100%",
								borderRadius: 8,
								border: "1px solid #333",
								background: "#1a1a1a",
								color: "#fff",
								padding: "10px 12px",
								outline: "none",
							}}
						/>
					</label>
					<div style={{ marginTop: 8, color: "#aaa", fontSize: 12 }}>
						Preview: ≈ {formatted} ETH
					</div>
				</div>

				<div
					style={{
						display: "flex",
						gap: 8,
						justifyContent: "flex-end",
						marginTop: 16,
					}}
				>
					<button
						onClick={onClose}
						style={{ ...styles.button, background: "#444" }}
						disabled={!!loading}
					>
						Cancel
					</button>
					<button
						onClick={async () => {
							const n = Number(amount);
							if (!Number.isFinite(n) || n <= 0) return;
							await onConfirm(n);
						}}
						style={styles.button}
						disabled={!!loading || !amount}
					>
						{loading ? "Sending…" : "Send"}
					</button>
				</div>
			</div>
		</div>
	);
}
