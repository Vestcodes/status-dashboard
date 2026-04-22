import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/latency/route";

global.fetch = vi.fn();

describe("GET /api/latency", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.VERCEL_REGION = "iad1";
	});

	it("returns 400 if url is missing", async () => {
		const req = new NextRequest("http://localhost/api/latency");
		const res = await GET(req);
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toBe("Missing url parameter");
	});

	it("returns 400 for invalid URL strings", async () => {
		const req = new NextRequest(
			"http://localhost/api/latency?url=not-a-real-url",
		);
		const res = await GET(req);
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toBe("Invalid URL format.");
	});

	it("returns 400 for invalid protocols", async () => {
		const req = new NextRequest(
			"http://localhost/api/latency?url=file:///etc/passwd",
		);
		const res = await GET(req);
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toBe("Invalid protocol. Only HTTP/HTTPS allowed.");
	});

	it("returns 403 for SSRF block (not in allowlist)", async () => {
		const req = new NextRequest(
			"http://localhost/api/latency?url=https://169.254.169.254/latest/meta-data/",
		);
		const res = await GET(req);
		expect(res.status).toBe(403);
		const data = await res.json();
		expect(data.error).toBe("Host not in allowlist. Unauthorized request.");
	});

	it("returns latency data for a valid allowlisted url", async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			status: 200,
			ok: true,
		} as Response);

		const req = new NextRequest(
			"http://localhost/api/latency?url=https://www.vestcodes.co",
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.url).toBe("https://www.vestcodes.co/");
		expect(data.status).toBe(200);
		expect(data.ok).toBe(true);
		expect(data.region).toBe("iad1");
		expect(typeof data.latencyMs).toBe("number");
	});

	it("returns 500 if fetch fails", async () => {
		vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

		const req = new NextRequest(
			"http://localhost/api/latency?url=https://www.vestcodes.co",
		);
		const res = await GET(req);
		expect(res.status).toBe(500);
		const data = await res.json();
		expect(data.error).toBe("Network error");
	});

	it("falls back to local if VERCEL_REGION is unset", async () => {
		delete process.env.VERCEL_REGION;
		vi.mocked(global.fetch).mockResolvedValueOnce({
			status: 200,
			ok: true,
		} as Response);

		const req = new NextRequest(
			"http://localhost/api/latency?url=https://www.vestcodes.co",
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.region).toBe("local");
	});

	it("handles empty error messages on fetch fail", async () => {
		vi.mocked(global.fetch).mockRejectedValueOnce({});

		const req = new NextRequest(
			"http://localhost/api/latency?url=https://www.vestcodes.co",
		);
		const res = await GET(req);
		expect(res.status).toBe(500);
		const data = await res.json();
		expect(data.error).toBe("Failed to fetch");
	});

	it("handles missing VERCEL_REGION on error fallback", async () => {
		delete process.env.VERCEL_REGION;
		vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

		const req = new NextRequest(
			"http://localhost/api/latency?url=https://www.vestcodes.co",
		);
		const res = await GET(req);
		expect(res.status).toBe(500);
		const data = await res.json();
		expect(data.region).toBe("local");
	});
});
