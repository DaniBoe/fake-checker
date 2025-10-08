import type { NextApiRequest, NextApiResponse } from "next";
import { callImageClassifier } from "@/lib/classifier";
import { z } from "zod";
import { isAnonymousLimitedFromCookie, makeSetCookieHeaderForAnonIncrement, isFreemiumDisabled } from "@/lib/usage-node";
import { 
  getClientFingerprint, 
  getUsageStats, 
  logUsage, 
  checkRateLimit, 
  detectAbuse, 
  deductPaidCheck 
} from "@/lib/usage-enhanced";

export const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
export const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"]);

const MetaSchema = z.record(z.string(), z.string()).optional();

export const config = {
	api: {
		bodyParser: false,
		externalResolver: false,
	},
};

function parseMultipart(req: NextApiRequest): Promise<{ file?: { buffer: Buffer; mimetype: string; filename: string }; meta?: Record<string, string> }> {
	return new Promise((resolve, reject) => {
		const busboy = require("busboy");
		const bb = busboy({ headers: req.headers });
		let fileBuffer: Buffer | undefined;
		let mime = "";
		let filename = "";
		const meta: Record<string, string> = {};

		bb.on("file", (_name: string, file: any, info: any) => {
			mime = info.mimeType || info.mimetype || "";
			filename = info.filename || "upload";
			const chunks: Buffer[] = [];
			file.on("data", (d: Buffer) => {
				chunks.push(d);
				if (Buffer.concat(chunks).length > MAX_SIZE_BYTES) {
					bb.emit("error", new Error("FILE_TOO_LARGE"));
					file.resume();
				}
			});
			file.on("end", () => { fileBuffer = Buffer.concat(chunks); });
		});

		bb.on("field", (name: string, val: string) => { meta[name] = val; });
		bb.on("error", reject);
		bb.on("close", () => resolve({ file: fileBuffer ? { buffer: fileBuffer, mimetype: mime, filename } : undefined, meta }));
		req.pipe(bb);
	});
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

	// Get client fingerprint for abuse prevention
	const { ipHash, uaHash } = getClientFingerprint(req);
	
	// Get user ID from headers (if available)
	const userId = req.headers['x-user-id'] as string | undefined;
	
	// Check rate limiting (10 requests per hour per IP)
	const rateLimitOk = await checkRateLimit(ipHash, 'check');
	if (!rateLimitOk) {
		return res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
	}
	
	// Check for abuse patterns
	const isAbuse = await detectAbuse(ipHash, uaHash);
	if (isAbuse) {
		return res.status(429).json({ error: "Suspicious activity detected. Please contact support." });
	}

	try {
		const { file, meta } = await parseMultipart(req);
		const userIdFromForm = meta?.userId;
		
		// Use userId from form if available, otherwise from headers
		const finalUserId = userIdFromForm || userId;
		
		// Get usage stats with the correct userId
		const usageStats = await getUsageStats(finalUserId, ipHash, uaHash);
		
		// Check if user is limited (legacy cookie check for backward compatibility)
		// Disabled cookie check since we're using database tracking
		const cookieLimited = false;
		
		// Check if user has exceeded freemium limits
		console.log('🔍 Paywall check:', { 
			isFreemiumDisabled: isFreemiumDisabled(), 
			usageStats, 
			cookieLimited, 
			finalUserId,
			shouldTriggerPaywall: !isFreemiumDisabled() && (usageStats.isLimited || cookieLimited) && !finalUserId
		});
		
		if (!isFreemiumDisabled() && (usageStats.isLimited || cookieLimited) && !finalUserId) {
			console.log('🚫 Triggering paywall for anonymous user');
			return res.status(402).json({ 
				error: "Paywall",
				usage: {
					freeChecksUsed: usageStats.freeChecksUsed,
					paidChecksRemaining: usageStats.paidChecksRemaining,
					checkType: 'free'
				}
			});
		}
		
		// Check if authenticated user has no free checks AND no paid checks
		if (!isFreemiumDisabled() && finalUserId && usageStats.isLimited && usageStats.paidChecksRemaining === 0) {
			return res.status(402).json({ 
				error: "Paywall",
				usage: {
					freeChecksUsed: usageStats.freeChecksUsed,
					paidChecksRemaining: usageStats.paidChecksRemaining,
					checkType: 'free'
				}
			});
		}
		if (!file) return res.status(400).json({ error: "Missing file" });
		if (!ALLOWED_MIME.has(file.mimetype)) return res.status(400).json({ error: "Invalid file type" });
		if (file.buffer.length > MAX_SIZE_BYTES) return res.status(400).json({ error: "File too large" });

		const safeMeta = MetaSchema.parse(meta) || {};
		const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

		// Pass the data URL to the classifier so OpenAI can read it; include original filename in metadata
		const result = await callImageClassifier(dataUrl, { ...safeMeta, filename: file.filename || "upload" });

		// Determine check type and log usage
		let checkType: 'free' | 'paid' = 'free';
		
		if (finalUserId && usageStats.paidChecksRemaining > 0) {
			// User has paid checks, use one of those
			const deducted = await deductPaidCheck(finalUserId);
			if (deducted) {
				checkType = 'paid';
			}
		}
		
		// Always log the usage (free or paid)
		await logUsage(finalUserId || null, ipHash, uaHash, checkType);

		// Get updated usage stats after logging
		const updatedUsageStats = await getUsageStats(finalUserId, ipHash, uaHash);

		// Set cookie for anonymous users (legacy support)
		if (!finalUserId) {
			const setCookie = makeSetCookieHeaderForAnonIncrement(req.headers.cookie);
			if (setCookie) res.setHeader('Set-Cookie', setCookie);
		}
		
		// Add usage info to response
		// If freemium limits are disabled, show a more reasonable usage count
		let displayUsage = {
			freeChecksUsed: updatedUsageStats.freeChecksUsed,
			paidChecksRemaining: updatedUsageStats.paidChecksRemaining,
			checkType
		};
		
		// Override usage display when freemium limits are disabled
		if (isFreemiumDisabled()) {
			// Show actual usage but don't enforce limits
			displayUsage = {
				freeChecksUsed: updatedUsageStats.freeChecksUsed,
				paidChecksRemaining: updatedUsageStats.paidChecksRemaining,
				checkType
			};
		}
		
		const response = {
			...result,
			usage: displayUsage
		};
		
		return res.status(200).json(response);
	} catch (e: any) {
		const msg = e?.message || "Server error";
		if (msg === "FILE_TOO_LARGE") return res.status(400).json({ error: "File too large" });
		return res.status(500).json({ error: msg });
	}
}
