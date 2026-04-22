import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Status | Vestcodes",
	description: "Real-time control plane and health monitoring for Vestcodes digital infrastructure.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="antialiased w-full text-off-white selection:bg-saffron-tint/30">
				<div className="w-full flex justify-center sticky top-0 z-50 pt-6 px-4">
					<nav className="glass-panel w-full max-w-4xl px-6 py-4 flex justify-between items-center">
						<a
							href="/"
							className="font-medium text-[1.1rem] tracking-tight flex items-center gap-3 transition-opacity hover:opacity-80"
						>
							<div className="w-4 h-4 rounded-[4px] bg-[#FF9933] opacity-80" />
							Vestcodes Control
						</a>
						<div className="mono-accent text-muted-text">v2.0.0 (Global)</div>
					</nav>
				</div>
				<main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pt-10 pb-20">
					{children}
				</main>
			</body>
		</html>
	);
}
