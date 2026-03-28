import { SITE_URL } from "@/lib/constant";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {

	return [
		{
			url: `${SITE_URL}`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 1,
		},
		{
			url: `${SITE_URL}/privacy`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${SITE_URL}/contact`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${SITE_URL}/terms`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${SITE_URL}/disclaimer`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${SITE_URL}/about`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
	];
}