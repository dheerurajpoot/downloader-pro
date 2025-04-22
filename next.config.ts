import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_APP_URL:
			process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "i.instagram.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "**.fbcdn.net",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "scontent.cdninstagram.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "scontent-*.fna.fbcdn.net",
				port: "",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
