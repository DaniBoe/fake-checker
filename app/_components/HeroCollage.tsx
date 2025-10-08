"use client";

const cards = [
	{ variant: "real", rotate: "-8deg", top: "6%", left: "6%" },
	{ variant: "fake", rotate: "7deg", top: "10%", right: "8%" },
	{ variant: "suspicious", rotate: "-2deg", top: "36%", left: "45%" },
	{ variant: "fake", rotate: "-4deg", bottom: "14%", left: "12%" },
	{ variant: "real", rotate: "10deg", bottom: "10%", right: "12%" },
	{ variant: "real", rotate: "-12deg", top: "38%", left: "24%" },
	{ variant: "fake", rotate: "12deg", top: "36%", right: "22%" },
];

type Variant = "real" | "fake" | "suspicious";

function variantClasses(variant: Variant) {
	switch (variant) {
		case "real":
			return {
				bg: "bg-gradient-to-br from-emerald-400/20 via-emerald-500/10 to-emerald-300/20",
				badge: "rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300",
				icon: "✅",
				label: "REAL",
			};
		case "fake":
			return {
				bg: "bg-gradient-to-br from-rose-400/20 via-rose-500/10 to-rose-300/20",
				badge: "rounded-full bg-rose-500/20 px-2 py-0.5 text-rose-300",
				icon: "❌",
				label: "FAKE",
			};
		case "suspicious":
		default:
			return {
				bg: "bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-amber-300/20",
				badge: "rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-300",
				icon: "⚠️",
				label: "SUSPICIOUS",
			};
	}
}

function Card({ variant, style, rotate, label }: { variant: Variant; style: any; rotate: string; label: string }) {
	const v = variantClasses(variant);
	return (
		<figure
			className="pointer-events-none absolute z-0 w-40 rounded-xl border border-white/20 bg-neutral-900/80 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur md:w-52"
			style={{ transform: `rotate(${rotate})`, ...(style as any) }}
		>
			<div className={`relative h-32 w-full overflow-hidden rounded-md md:h-40 ${v.bg}`}>
				<div className="absolute inset-0 grid place-items-center text-4xl opacity-20">{v.icon}</div>
			</div>
			<figcaption className="mt-2 flex items-center justify-between text-xs text-gray-300">
				<span>{variant === 'fake' ? 'Lafufu' : 'Labubu'}</span>
				<span className={v.badge}>{v.label}</span>
			</figcaption>
		</figure>
	);
}

export default function HeroCollage() {
	return (
		<div className="relative mx-auto mt-8 grid max-w-6xl place-items-center px-6">
			<div className="relative h-[420px] w-full">
				{/* Background cards */}
				{cards.map((c, i) => (
					<Card
						key={i}
						variant={c.variant as any}
						rotate={c.rotate}
						label={`#${100 + i}`}
						style={{ top: c.top, bottom: c.bottom, left: c.left, right: c.right }}
					/>
				))}
				
				{/* Foreground Labubu 105 (Real) */}
				<figure
					className="pointer-events-none absolute z-10 w-48 rounded-xl border border-white/30 bg-neutral-900/90 p-3 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur md:w-56"
					style={{ transform: 'rotate(-5deg)', top: '20%', left: '15%' }}
				>
					<div className="relative h-40 w-full overflow-hidden rounded-md md:h-48 bg-gradient-to-br from-emerald-400/20 via-emerald-500/10 to-emerald-300/20">
						<img 
							src="/images/real-labubu.jpg" 
							alt="Real Labubu 105"
							className="w-full h-full object-cover"
						/>
					</div>
					<figcaption className="mt-3 flex items-center justify-between text-sm text-gray-200">
						<span className="font-medium">Labubu</span>
						<span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-300 font-medium">REAL</span>
					</figcaption>
				</figure>
				
				{/* Foreground Labubu 106 (Fake) */}
				<figure
					className="pointer-events-none absolute z-10 w-48 rounded-xl border border-white/30 bg-neutral-900/90 p-3 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur md:w-56"
					style={{ transform: 'rotate(8deg)', top: '25%', right: '15%' }}
				>
					<div className="relative h-40 w-full overflow-hidden rounded-md md:h-48 bg-gradient-to-br from-rose-400/20 via-rose-500/10 to-rose-300/20">
						<img 
							src="/images/fake-labubu.jpg" 
							alt="Fake Labubu 106"
							className="w-full h-full object-cover"
						/>
					</div>
					<figcaption className="mt-3 flex items-center justify-between text-sm text-gray-200">
						<span className="font-medium">Lafufu</span>
						<span className="rounded-full bg-rose-500/20 px-3 py-1 text-rose-300 font-medium">FAKE</span>
					</figcaption>
				</figure>
			</div>
		</div>
	);
}
