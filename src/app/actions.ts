"use server";

import ytdl from "@distube/ytdl-core";
import { instagramGetUrl } from "instagram-url-direct";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Supported platform patterns
const PLATFORM_PATTERNS = {
	youtube: /(?:youtube\.com|youtu\.be)/i,
	instagram: /instagram\.com/i,
	facebook: /(?:facebook\.com|fb\.com|fb\.watch)/i,
};

// Error messages
const ERROR_MESSAGES = {
	INVALID_URL: "Please provide a valid URL",
	UNSUPPORTED_PLATFORM: "Unsupported URL. Please try a YouTube, Instagram, or Facebook URL.",
	YOUTUBE_INVALID: "Invalid YouTube URL",
	YOUTUBE_FAILED: "Failed to process YouTube video. The video might be private, age-restricted, or unavailable.",
	INSTAGRAM_INVALID: "Invalid Instagram URL",
	INSTAGRAM_PRIVATE: "The Instagram content appears to be private, deleted, or unavailable.",
	FACEBOOK_INVALID: "Invalid Facebook URL",
	FACEBOOK_FAILED: "Failed to process Facebook content. The video might be private or restricted.",
	GENERIC_ERROR: "Failed to download content. Please try again.",
};

export async function downloadContent(url: string) {
	try {
		if (!url?.trim()) {
			return { success: false, message: ERROR_MESSAGES.INVALID_URL };
		}

		const cleanUrl = url.trim();

		if (PLATFORM_PATTERNS.youtube.test(cleanUrl)) {
			return await handleYouTube(cleanUrl);
		}
		if (PLATFORM_PATTERNS.instagram.test(cleanUrl)) {
			return await handleInstagram(cleanUrl);
		}
		if (PLATFORM_PATTERNS.facebook.test(cleanUrl)) {
			return await handleFacebook(cleanUrl);
		}

		return { success: false, message: ERROR_MESSAGES.UNSUPPORTED_PLATFORM };
	} catch (error) {
		console.error("Error downloading content:", error);
		return { success: false, message: ERROR_MESSAGES.GENERIC_ERROR };
	}
}

async function handleYouTube(url: string) {
	try {
		if (!ytdl.validateURL(url)) {
			return { success: false, message: ERROR_MESSAGES.YOUTUBE_INVALID };
		}

		// Use getInfo instead of getBasicInfo to get all formats
		const info = await ytdl.getInfo(url);
		const title = info.videoDetails.title;
		const thumbnail = info.videoDetails.thumbnails.at(-1)?.url;

		// Get all formats
		const formats = info.formats;

		// First try formats with both video and audio
		let videoFormats = formats.filter((f) => f.hasVideo && f.hasAudio);

		// If no combined formats, try any video format
		if (videoFormats.length === 0) {
			videoFormats = formats.filter((f) => f.hasVideo);
		}

		// If still no formats, try all formats
		if (videoFormats.length === 0) {
			videoFormats = formats;
		}

		if (videoFormats.length === 0) {
			return { success: false, message: "No downloadable formats found for this video. It might be age-restricted or private." };
		}

		// Sort by quality (height) descending
		videoFormats.sort((a, b) => (b.height || 0) - (a.height || 0));
		const bestFormat = videoFormats[0];

		return {
			success: true,
			message: "YouTube video ready for download",
			downloadUrl: `/api/proxy?url=${encodeURIComponent(url)}&type=youtube&quality=${bestFormat.itag}`,
			type: "Video",
			mediaType: "video",
			title,
			thumbnail,
			mediaUrls: videoFormats.slice(0, 5).map((f) => ({
				url: f.url,
				type: "video",
				quality: f.qualityLabel || `${f.height}p` || "Unknown",
			})),
		};
	} catch (error) {
		console.error("Error handling YouTube:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : ERROR_MESSAGES.YOUTUBE_FAILED,
		};
	}
}

async function handleInstagram(url: string) {
	try {
		const cleanUrl = url.split("?")[0].replace(/\/$/, "");

		if (!cleanUrl.includes("instagram.com")) {
			return { success: false, message: ERROR_MESSAGES.INSTAGRAM_INVALID };
		}

		let response;
		try {
			response = await instagramGetUrl(cleanUrl);
		} catch (libError) {
			// Try fallback extraction for reels
			if (cleanUrl.includes("/reel/") || cleanUrl.includes("/reels/")) {
				const fallback = await extractInstagramMedia(cleanUrl);
				if (fallback) return fallback;
			}
			throw libError;
		}

		if (!response?.url_list?.length) {
			return { success: false, message: ERROR_MESSAGES.INSTAGRAM_PRIVATE };
		}

		const urlList = response.url_list;
		// Support both /reel/ and /reels/ URL patterns
		const isReel = cleanUrl.includes("/reel/") || cleanUrl.includes("/reels/");
		const isPost = cleanUrl.includes("/p/");

		// Prefer video URLs for reels
		let mediaUrl = urlList[0];
		if (isReel) {
			const videoUrl = urlList.find((u: string) => u.includes(".mp4"));
			if (videoUrl) mediaUrl = videoUrl;
		}

		const isVideo = mediaUrl.includes(".mp4");
		const mediaType = isVideo ? "video" : "image";

		let title = "Instagram Content";
		let contentType: "Reel" | "Post" | "Profile" = "Post";
		let thumbnail = "/placeholder.svg?height=300&width=500";

		if (isReel) {
			title = response.post_info?.caption || "Instagram Reel";
			contentType = "Reel";
			const rawThumb = response.media_details?.[0]?.thumbnail;
			if (rawThumb) thumbnail = `/api/image-proxy?url=${encodeURIComponent(rawThumb)}`;
		} else if (isPost) {
			title = response.post_info?.caption || "Instagram Post";
			contentType = "Post";
			const rawThumb = response.media_details?.[0]?.url;
			if (rawThumb) thumbnail = `/api/image-proxy?url=${encodeURIComponent(rawThumb)}`;
		} else {
			const username = cleanUrl.split("/")[3] || "unknown";
			title = `Profile Photo: @${username}`;
			contentType = "Profile";
			const rawThumb = response.media_details?.[0]?.url;
			if (rawThumb) thumbnail = `/api/image-proxy?url=${encodeURIComponent(rawThumb)}`;
		}

		const typeForProxy = isReel ? "reel" : isPost ? "post" : "profile";

		return {
			success: true,
			message: `${contentType} ready for download`,
			downloadUrl: `/api/proxy?url=${encodeURIComponent(cleanUrl)}&type=${typeForProxy}&media_url=${encodeURIComponent(mediaUrl)}`,
			type: contentType,
			mediaType,
			title,
			thumbnail,
			mediaUrls: urlList.map((u: string) => ({
				url: u,
				type: u.includes(".mp4") ? "video" : "image",
				quality: u.includes("1080") ? "high" : "standard",
			})),
		};
	} catch (error) {
		console.error("Error handling Instagram:", error);
		return {
			success: false,
			message: error instanceof Error && error.message.includes("private")
				? ERROR_MESSAGES.INSTAGRAM_PRIVATE
				: "Failed to process Instagram content. Please try again.",
		};
	}
}

// Fallback extraction for Instagram reels
async function extractInstagramMedia(url: string) {
	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
				"Referer": "https://www.instagram.com/",
			},
		});

		if (!response.ok) return null;

		const html = await response.text();

		const patterns = [
			/<meta property="og:video" content="([^"]+)"/i,
			/<meta property="og:video:url" content="([^"]+)"/i,
			/"video_url":"([^"]+)"/i,
		];

		for (const pattern of patterns) {
			const match = html.match(pattern);
			if (match?.[1]?.includes("http")) {
				const videoUrl = match[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
				const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
				const thumbMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);

				return {
					success: true,
					message: "Instagram reel ready for download",
					downloadUrl: `/api/proxy?url=${encodeURIComponent(url)}&type=reel&media_url=${encodeURIComponent(videoUrl)}`,
					type: "Reel",
					mediaType: "video",
					title: titleMatch?.[1] || "Instagram Reel",
					thumbnail: thumbMatch?.[1] ? `/api/image-proxy?url=${encodeURIComponent(thumbMatch[1])}` : "/placeholder.svg",
					mediaUrls: [{ url: videoUrl, type: "video", quality: "high" }],
				};
			}
		}
		return null;
	} catch (error) {
		console.error("Fallback extraction failed:", error);
		return null;
	}
}

async function handleFacebook(url: string) {
	try {
		if (!PLATFORM_PATTERNS.facebook.test(url)) {
			return { success: false, message: ERROR_MESSAGES.FACEBOOK_INVALID };
		}

		const cleanUrl = url.trim();

		// Check if it's a reel
		const isReel = cleanUrl.includes("/reel/") || 
			cleanUrl.includes("/reels/") || 
			cleanUrl.includes("fb.watch");

		// Use Puppeteer to extract video URL from Facebook
		// Check if running locally or on Vercel
		const isLocal = process.env.NODE_ENV === 'development';
		
		// Use puppeteer locally (has bundled Chromium), puppeteer-core on Vercel
		let puppeteer = puppeteerCore;
		if (isLocal) {
			// Dynamically import puppeteer only in development
			try {
				puppeteer = await import('puppeteer').then(m => m.default);
			} catch {
				// Fallback to puppeteer-core if puppeteer not available
			}
		}
		
		const browser = await puppeteer.launch({
			args: isLocal 
				? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
				: chromium.args,
			executablePath: isLocal 
				? undefined // Use bundled Chromium locally
				: await chromium.executablePath(),
			headless: true,
		});

		try {
			const page = await browser.newPage();
			
			// Set user agent to look like a real browser
			await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
			
			// Navigate to the Facebook video page
			await page.goto(cleanUrl, { waitUntil: 'networkidle2', timeout: 30000 });
			
			// Wait a bit for the page to fully load
			await new Promise(resolve => setTimeout(resolve, 3000));
			
			// Extract video URL and title from the page
			const videoData = await page.evaluate(() => {
				// Try to find video element
				const videoElement = document.querySelector('video');
				const videoUrl = videoElement?.src || videoElement?.querySelector('source')?.src || '';
				
				// Try to get title from meta tags
				const titleMeta = document.querySelector('meta[property="og:title"]');
				const title = titleMeta?.getAttribute('content') || document.title || 'Facebook Video';
				
				// Try to get thumbnail
				const thumbMeta = document.querySelector('meta[property="og:image"]');
				const thumbnail = thumbMeta?.getAttribute('content') || '';
				
				return { videoUrl, title, thumbnail };
			});
			
			if (!videoData.videoUrl) {
				// Try alternative: look for video URL in page content
				const pageContent = await page.content();
				
				// Look for video URLs in the page source
				const videoPatterns = [
					/"playable_url_quality_hd":"([^"]+)"/,
					/"playable_url":"([^"]+)"/,
					/"browser_native_hd_url":"([^"]+)"/,
					/"browser_native_sd_url":"([^"]+)"/,
					/"hd_src":"([^"]+)"/,
					/"sd_src":"([^"]+)"/,
					/"video_url":"([^"]+)"/,
				];
				
				let extractedUrl = '';
				for (const pattern of videoPatterns) {
					const match = pageContent.match(pattern);
					if (match && match[1]) {
						extractedUrl = match[1].replace(/\\/g, '').replace(/&amp;/g, '&');
						break;
					}
				}
				
				if (extractedUrl) {
					videoData.videoUrl = extractedUrl;
				}
			}
			
			if (!videoData.videoUrl) {
				return { success: false, message: "Could not find video URL. The video might be private or require login." };
			}
			
			return {
				success: true,
				message: `${isReel ? "Reel" : "Video"} ready for download`,
				downloadUrl: `/api/proxy?url=${encodeURIComponent(cleanUrl)}&type=facebook&media_url=${encodeURIComponent(videoData.videoUrl)}`,
				type: isReel ? "Reel" : "Video",
				mediaType: "video",
				title: videoData.title || (isReel ? "Facebook Reel" : "Facebook Video"),
				thumbnail: videoData.thumbnail || "/placeholder.svg?height=300&width=500",
				mediaUrls: [{ url: videoData.videoUrl, type: "video", quality: "high" }],
			};
		} finally {
			await browser.close();
		}
	} catch (error) {
		console.error("Error handling Facebook:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : ERROR_MESSAGES.FACEBOOK_FAILED,
		};
	}
}
