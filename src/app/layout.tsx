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
	title: {
		template: '%s | Video Downloader Pro',
		default: 'Video Downloader Pro - Download Videos from Multiple Platforms'
	},
	description: 'Free online video downloader supporting multiple platforms. Download videos from YouTube, Facebook, Instagram, and more in high quality.',
	generator: 'Next.js',
	applicationName: 'Video Downloader Pro',
	keywords: ['video downloader', 'youtube downloader', 'online video download', 'free video downloader', 'social media video download'],
	authors: [{ name: 'Video Downloader Pro Team' }],
	canonical: 'https://your-domain.com',
	robotsContent: 'index, follow',
	openGraph: {
		type: 'website',
		locale: 'en_US',
		url: 'https://your-domain.com',
		site_name: 'Video Downloader Pro',
		title: 'Video Downloader Pro - Download Videos from Multiple Platforms',
		description: 'Free online video downloader supporting multiple platforms. Download videos from YouTube, Facebook, Instagram, and more in high quality.',
		images: [{
			url: '/og-image.jpg',
			width: 1200,
			height: 630,
			alt: 'Video Downloader Pro'
		}]
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Video Downloader Pro - Download Videos from Multiple Platforms',
		description: 'Free online video downloader supporting multiple platforms. Download videos from YouTube, Facebook, Instagram, and more in high quality.',
		images: ['/og-image.jpg'],
		creator: '@videodownloaderpro'
	},
	verification: {
		google: 'your-google-verification-code',
		yandex: 'your-yandex-verification-code'
	}
};
