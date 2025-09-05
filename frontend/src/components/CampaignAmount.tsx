import type { BigNumberish, BN } from "fuels";
import { bn } from "fuels";

type Props = {
	label: string;
	value: BigNumberish;
	decimals?: number;
	symbol?: string;
	showBaseUnitsHint?: boolean;
};

export default function CampaignAmount({
	label,
	value,
	decimals = 9,
	symbol = "ETH",
	showBaseUnitsHint = true,
}: Props) {
	const asBn: BN = bn(value as any);
	const formatted = asBn.formatUnits(decimals);
	const raw = asBn.toString();

	return (
		<div>
			<div style={{ color: "#aaa", fontSize: 12 }}>{label}</div>
			<div>
				{formatted} {symbol}
			</div>
			{showBaseUnitsHint && (
				<div style={{ color: "#777", fontSize: 11 }}>({raw} base units)</div>
			)}
		</div>
	);
}
