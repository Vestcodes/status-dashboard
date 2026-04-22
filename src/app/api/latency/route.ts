import { type NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const preferredRegion = ["iad1", "fra1", "sin1"];

export async function GET(req: NextRequest) {
	const url = req.nextUrl.searchParams.get("url");
	if (!url) {
		return NextResponse.json(
			{ error: "Missing url parameter" },
			{ status: 400 },
		);
	}

	try {
		const start = Date.now();
		const response = await fetch(url, {
			method: "HEAD",
			headers: { "User-Agent": "Vestcodes-Status-Bot/1.0" },
		});
		const end = Date.now();
		const latencyMs = end - start;

		return NextResponse.json({
			url,
			latencyMs,
			status: response.status,
			ok: response.ok,
			region: process.env.VERCEL_REGION || "local",
			timestamp: new Date().toISOString(),
		});
	} catch (error: any) {
		return NextResponse.json(
			{
				url,
				error: error.message || "Failed to fetch",
				region: process.env.VERCEL_REGION || "local",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
