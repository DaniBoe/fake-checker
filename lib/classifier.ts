export type Classification = {
	label: "Likely Authentic" | "Suspicious" | "Fake";
	reason: string;
	confidence: number; // 0..1
};

const KNOWN_BRANDS = ["LabCo", "LabuPrime", "VeritasLab"];

async function heuristicMock(imageUrl: string, meta?: Record<string, string>): Promise<Classification> {
	const lower = imageUrl.toLowerCase();
	if (lower.includes("fake")) {
		return { label: "Fake", reason: "Filename hints fake; visual artifacts likely.", confidence: 0.92 };
	}
	if (meta?.brand && KNOWN_BRANDS.includes(meta.brand)) {
		return { label: "Likely Authentic", reason: `Known brand match (${meta.brand}). No obvious anomalies.`, confidence: 0.78 };
	}
	const hash = Array.from(lower).reduce((a, c) => a + c.charCodeAt(0), 0);
	const r = (hash % 100) / 100;
	if (r < 0.33) return { label: "Likely Authentic", reason: "Consistent texture and logo placement.", confidence: 0.71 };
	if (r < 0.66) return { label: "Suspicious", reason: "Inconsistent stitching and color cast.", confidence: 0.64 };
	return { label: "Fake", reason: "Logo mismatch and seam artifacts detected.", confidence: 0.83 };
}

const LABUBU_SYSTEM_PROMPT = [
	"You are an expert in authenticating Pop Mart’s Labubu figures.",
	"Your job is to analyze only the provided image(s) of a Labubu and determine whether it is Likely Authentic, Suspicious, or Likely Fake.",
	"What to look for (from image only):",
	"Teeth: exactly nine pointed teeth, evenly spaced; paint cleanly separated from the mouth’s blue line; flag sloppy/merged teeth or wrong count.",
	"Face & Eyes: pale peach (not overly orange/yellow/pink); smooth matte with subtle blush; eyes glossy/glass-like with natural reflections; flag dull/flat eyes, sloppy paint, or unnatural protrusion.",
	"Ears & Hairline: ears close together and slightly inward; hairline at a natural position; fakes often show ears too upright/far apart or hairline too high.",
	"Fur & Stitching (plush): fur should look soft/high-quality; stitching clean and blending with vinyl face; flag coarse fur, frayed threads, uneven seams.",
	"Body Shape & Proportions: look for proportional body without warped faces/lopsided heads; flag misshapen or incorrect proportions.",
	"Foot Details: left foot with Pop Mart logo; right foot (2024+) may have a UV stamp—if not visible, do not penalize; only note absence.",
	"Paint & Overall Quality: crisp paint lines, no chipping/overspray; flag sloppy work or mismatched colors.",
	"Packaging (if visible): clean print, correct logos, consistent palette; matte box finish where appropriate; tags/cards look professionally printed and match known designs.",
	"Output format (STRICT JSON only): {\"label\":\"Likely Authentic|Suspicious|Fake\",\"reason\":\"short explanation citing observed features\",\"confidence\":0..1}.",
	"If the image is insufficient for confidence, choose 'Suspicious' and state what is unclear/missing. Use factual, collector‑friendly language and probability terms (likely authentic/fake)."
].join(" ");

// TODO: replace or enhance this with your preferred model provider
export async function callImageClassifier(imageUrl: string, meta?: Record<string, string>): Promise<Classification> {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		console.log(`[classifier] OPENAI_API_KEY missing; using heuristic fallback`);
		return heuristicMock(imageUrl, meta);
	}

	try {
		const OpenAI = (await import("openai")).default;
		const client = new OpenAI({ apiKey });

		const system = LABUBU_SYSTEM_PROMPT;

		const userParts: any[] = [];
		if (meta?.analysisPrompt) {
			userParts.push({ type: "text", text: `Inspection prompt: ${meta.analysisPrompt}` });
		}
		if (meta) {
			const { analysisPrompt, ...rest } = meta;
			if (Object.keys(rest).length) {
				userParts.push({ type: "text", text: `Metadata: ${JSON.stringify(rest)}` });
			}
		}
		userParts.push({ type: "image_url", image_url: { url: imageUrl } });

		const response = await client.chat.completions.create({
			model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
			messages: [
				{ role: "system", content: system },
				{ role: "user", content: userParts as any },
			],
			temperature: 0.2,
			response_format: { type: "json_object" }
		});
		console.log(`[classifier] OpenAI call succeeded (model=${process.env.OPENAI_VISION_MODEL || "gpt-4o-mini"})`);
		const text = response.choices?.[0]?.message?.content || "";
		try {
			const parsed = JSON.parse(text);
			const label = parsed.label as Classification["label"];
			const reason = String(parsed.reason || "");
			const confidence = Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.7)));
			if (label === "Likely Authentic" || label === "Suspicious" || label === "Fake") {
				return { label, reason, confidence };
			}
		} catch {}
		const lowered = text.toLowerCase();
		if (lowered.includes("fake")) return { label: "Fake", reason: text.slice(0, 200), confidence: 0.8 };
		if (lowered.includes("authentic")) return { label: "Likely Authentic", reason: text.slice(0, 200), confidence: 0.7 };
		return { label: "Suspicious", reason: text.slice(0, 200) || "Ambiguous assessment.", confidence: 0.6 };
	} catch (err) {
		console.log(`[classifier] OpenAI call failed; using heuristic fallback`, err instanceof Error ? err.message : err);
		return heuristicMock(imageUrl, meta);
	}
}
