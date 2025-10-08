import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
	// In a real setup, create a signed URL to upload to Supabase Storage or UploadThing.
	// For demo, return 501 to indicate stub.
	return res.status(501).json({ error: "Not implemented in demo. Use direct /api/check upload." });
}




