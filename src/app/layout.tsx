import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Vestcodes Status",
	description:
		"Real-time uptime and latency monitoring for Vestcodes client projects.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="antialiased bg-jet-black w-full min-h-screen text-off-white">
				<div className="border-b border-steel-gray/50 bg-jet-black/80 backdrop-blur-md p-4 sticky top-0 z-50">
					<div className="max-w-6xl mx-auto flex justify-between items-center">
						<a
							href="/"
							className="font-display font-bold text-xl tracking-tight flex items-center gap-2"
						>
							<span className="w-3 h-3 bg-sun-yellow rounded-full animate-pulse shadow-[0_0_10px_var(--color-sun-yellow)]"></span>
							VESTCODES.STATUS
						</a>
						<div className="mono-accent text-off-white/60">SYSTEMS_NOMINAL</div>
					</div>
				</div>
				<main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pt-12">
					{children}
				</main>
			</body>
		</html>
	);
}
