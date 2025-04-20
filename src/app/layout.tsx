import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body className={inter.className} suppressHydrationWarning>
				<ThemeProvider attribute='class' defaultTheme='light'>
					<Header />
					{children}
					<Footer />
					<Toaster position='bottom-right' />
				</ThemeProvider>
			</body>
		</html>
	);
}

export const metadata = {
	generator: "v0.dev",
};
