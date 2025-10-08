"use client";

type Verdict = "REAL" | "FAKE" | "SUSPICIOUS";

function verdictStyles(verdict: Verdict) {
	switch (verdict) {
		case "REAL":
			return { badge: "bg-emerald-500/20 text-emerald-300", border: "border-emerald-400/30" };
		case "FAKE":
			return { badge: "bg-rose-500/20 text-rose-300", border: "border-rose-400/40" };
		case "SUSPICIOUS":
		default:
			return { badge: "bg-amber-500/20 text-amber-300", border: "border-amber-400/30" };
	}
}

export default function ResultCard({ result }: { result: { label: string; reason: string; confidence: number } }) {
	const label = result.label;
	const verdict: Verdict = label === "Likely Authentic" ? "REAL" : label === "Fake" ? "FAKE" : "SUSPICIOUS";
	const styles = verdictStyles(verdict);
	return (
		<div className={`rounded-lg border ${styles.border} bg-neutral-900/60 p-5 backdrop-blur`}> 
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold text-white">Result</h3>
				<span className="text-sm text-gray-300">Confidence: {(result.confidence * 100).toFixed(0)}%</span>
			</div>
			<div className="mt-3 flex items-center gap-3">
				<span className={`rounded-md px-3 py-1 text-sm font-semibold ${styles.badge}`}>{verdict}</span>
				<span className="text-sm text-gray-300">({label})</span>
			</div>
			<p className="mt-3 text-gray-200">{result.reason}</p>
		</div>
	);
}
