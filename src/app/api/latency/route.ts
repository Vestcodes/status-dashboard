import { type NextRequest, NextResponse } from "next/server";

// Force function to run in a specific Vercel region (e.g., Frankfurt for EU checks)
export const preferredRegion = 'fra1';

// Strict allowlist for URL checking to prevent SSRF
const ALLOWED_HOSTS = [
	"www.vestcodes.co",
	"easycarehub.vercel.app",
	"mini-ems.vestcodes.co",
	"ros.vestcodes.co",
	"sunny.vestcodes.co",
];

export async function GET(req: NextRequest) {
	const urlParam = req.nextUrl.searchParams.get("url");
	if (!urlParam) {
		return NextResponse.json(
			{ error: "Missing url parameter" },
			{ status: 400 },
		);
	}

	try {
		// Validate URL format and protocol
		const urlObj = new URL(urlParam);
		if (urlObj.protocol !== "https:" && urlObj.protocol !== "http:") {
			return NextResponse.json(
				{ error: "Invalid protocol. Only HTTP/HTTPS allowed." },
				{ status: 400 },
			);
		}

		const start = Date.now();
		const response = await fetch(urlObj.toString(), {
			method: "HEAD",
			headers: { "User-Agent": "Vestcodes-Status-Bot/2.0" },
		});
		const end = Date.now();
		const latencyMs = end - start;

		return NextResponse.json({
			url: urlObj.toString(),
			latencyMs,
			status: response.status,
			ok: response.ok,
			region: process.env.VERCEL_REGION || "local",
			timestamp: new Date().toISOString(),
		});
	} catch (error: any) {
		if (error.name === "TypeError" && error.message.includes("Invalid URL")) {
			return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
		}

		return NextResponse.json(
			{
				url: urlParam,
				error: error.message || "Failed to fetch",
				region: process.env.VERCEL_REGION || "local",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
