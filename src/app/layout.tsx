import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_AUTHOR, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constant";

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
	metadataBase: new URL(SITE_URL),
	title: {
		template: `%s | ${SITE_NAME}`,
		default: `${SITE_NAME} - Download Videos from Multiple Platforms`
	},
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	keywords: ['video downloader', 'youtube downloader', 'online video download', 'free video downloader', 'social media video download'],
	authors: [{ name: SITE_AUTHOR }],
	canonical: SITE_URL,
	robotsContent: 'index, follow',
	openGraph: {
		type: 'website',
		locale: 'en_US',
		url: SITE_URL,
		site_name: SITE_NAME,
		title: `${SITE_NAME} - Download Videos from Multiple Platforms`,
		description: SITE_DESCRIPTION,
	},
	twitter: {
		card: 'summary_large_image',
		title: `${SITE_NAME} - Download Videos from Multiple Platforms`,
		description: SITE_DESCRIPTION,
		images: ['/og-image.jpg'],
		creator: SITE_AUTHOR
	},
};
