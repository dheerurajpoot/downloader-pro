import { SITE_URL } from "@/lib/constant";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: "/private/",
		},
		sitemap: `${SITE_URL}/sitemap.xml`,
	};
}