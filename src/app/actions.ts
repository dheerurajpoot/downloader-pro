"use server";

import ytdl from "ytdl-core";
import { instagramGetUrl } from "instagram-url-direct";

export async function downloadContent(url: string) {
	try {
		// Validate URL
		if (!url) {
			return { success: false, message: "Please provide a URL" };
		}

		// Check URL type
		if (url.includes("youtube.com") || url.includes("youtu.be")) {
			return await handleYouTube(url);
		} else if (url.includes("instagram.com")) {
			return await handleInstagram(url);
		} else if (url.includes("facebook.com") || url.includes("fb.com")) {
			return await handleFacebook(url);
		} else {
			return {
				success: false,
				message:
					"Unsupported URL. Please try a YouTube, Instagram, or Facebook URL.",
			};
		}
	} catch (error) {
		console.error("Error downloading content:", error);
		return {
			success: false,
			message: "Failed to download content. Please try again.",
		};
	}
}

async function handleYouTube(url: string, quality?: string) {
	try {
		// Validate YouTube URL
		if (!ytdl.validateURL(url)) {
			return { success: false, message: "Invalid YouTube URL" };
		}

		// Get basic video info first
		const info = await ytdl.getBasicInfo(url);
		const title = info.videoDetails.title;
		const thumbnail = info.videoDetails.thumbnails.at(-1)?.url;

		// Get all formats
		const formats = info.formats;
		console.log("Total formats:", formats.length);

		// First try to get formats with both video and audio
		let bestFormats = formats.filter((format) => {
			// Check for video formats using multiple indicators
			const hasVideo =
				format.hasVideo ||
				format.qualityLabel ||
				format.quality?.includes("p") ||
				format.height ||
				format.width ||
				format.fps;

			// Check for audio
			const hasAudio =
				format.hasAudio || format.audioQuality || format.audioBitrate;

			return hasVideo && hasAudio;
		});
		console.log("Formats with video and audio:", bestFormats.length);

		// If no combined formats, try video-only formats
		if (bestFormats.length === 0) {
			bestFormats = formats.filter((format) => {
				return (
					format.hasVideo ||
					format.qualityLabel ||
					format.quality?.includes("p") ||
					format.height ||
					format.width ||
					format.fps
				);
			});
			console.log("Video-only formats:", bestFormats.length);
		}

		// If still no formats, try any format with quality indicators
		if (bestFormats.length === 0) {
			bestFormats = formats.filter(
				(format) =>
					format.quality ||
					format.qualityLabel ||
					format.height ||
					format.width
			);
			console.log("Formats with quality:", bestFormats.length);
		}

		// If still nothing, use all formats except audio-only
		if (bestFormats.length === 0) {
			bestFormats = formats.filter(
				(format) =>
					!format.audioQuality || format.height || format.width
			);
			console.log("Remaining formats:", bestFormats.length);
		}

		// Sort formats by quality
		const sortedFormats = bestFormats.sort((a, b) => {
			// Helper function to get numeric quality
			const getQualityNumber = (format: ytdl.videoFormat) => {
				// Try height first
				if (format.height) return format.height;

				// Try quality label
				if (format.qualityLabel) {
					const match = format.qualityLabel.match(/\d+/);
					if (match) return parseInt(match[0]);
				}

				// Try quality string
				if (format.quality) {
					const match = format.quality.match(/\d+/);
					if (match) return parseInt(match[0]);
				}

				return 0;
			};

			// Get quality numbers
			const qualityA = getQualityNumber(a);
			const qualityB = getQualityNumber(b);

			// Compare qualities
			if (qualityA !== qualityB) {
				return qualityB - qualityA;
			}

			// If qualities are equal, prefer formats with both audio and video
			const aHasAudio = a.hasAudio || a.audioQuality || a.audioBitrate;
			const bHasAudio = b.hasAudio || b.audioQuality || b.audioBitrate;

			if (aHasAudio !== bHasAudio) {
				return aHasAudio ? -1 : 1;
			}

			// If still equal, prefer formats with container info
			if (a.container && !b.container) return -1;
			if (!a.container && b.container) return 1;

			return 0;
		});

		if (sortedFormats.length === 0) {
			throw new Error("No formats found. Please try a different video.");
		}

		// Get the requested format or best available
		let format = quality
			? sortedFormats.find((f) => f.itag === parseInt(quality))
			: sortedFormats[0];

		// If requested quality not found, use best available
		if (!format) {
			format = sortedFormats[0];
		}

		console.log("Selected format:", {
			itag: format.itag,
			quality: format.qualityLabel || format.quality,
			container: format.container,
			hasAudio: format.hasAudio,
			hasVideo: format.hasVideo,
		});

		return {
			success: true,
			message: "YouTube video processed successfully",
			downloadUrl: `/api/proxy?url=${encodeURIComponent(
				url
			)}&type=youtube&quality=${format.itag}`,
			type: "Video",
			title,
			thumbnail,
			formats: sortedFormats.map((f) => ({
				itag: f.itag,
				quality:
					f.qualityLabel || f.quality || `${f.height}p` || "Unknown",
				container: f.container || "mp4",
				hasAudio: f.hasAudio,
			})),
		};
	} catch (error) {
		console.error("Error handling YouTube:", error);
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Failed to process YouTube video. Please try again.",
		};
	}
}

async function handleInstagram(url: string) {
	try {
		// Basic URL validation
		if (!url.includes("instagram.com")) {
			return { success: false, message: "Invalid Instagram URL" };
		}

		// Use instagram-url-direct to get media info
		const response = await instagramGetUrl(url);
		if (!response.url_list || response.url_list.length === 0) {
			throw new Error("No media URLs found");
		}
		// Get media type and info
		const mediaUrl = response.url_list[0];
		const isVideo = mediaUrl.includes(".mp4");
		const type = isVideo ? "video" : "image";

		// Get media info based on URL type
		let title = "Instagram Content";
		let mediaType = "post"; // Default to post
		let thumbnail = "/placeholder.svg?height=300&width=500";
		if (url.includes("/reel/")) {
			title = response.post_info.caption || "Instagram Reel";
			const rawThumbnail = response.media_details[0].thumbnail;
			thumbnail = rawThumbnail
				? `/api/image-proxy?url=${encodeURIComponent(rawThumbnail)}`
				: "/placeholder.svg?height=300&width=500";
			mediaType = "reel";
		} else if (url.includes("/p/")) {
			title = response.post_info.caption || "Instagram Post";
			const rawThumbnail = response.media_details[0].url;
			thumbnail = rawThumbnail
				? `/api/image-proxy?url=${encodeURIComponent(rawThumbnail)}`
				: "/placeholder.svg?height=300&width=500";
			mediaType = "post";
		} else if (!url.includes("/p/") && !url.includes("/reel/")) {
			const username = url.split("/")[3]?.split("?")[0] || "unknown";
			title = `Profile Photo: @${username}`;
			const rawThumbnail = response.media_details[0].url;
			thumbnail = rawThumbnail
				? `/api/image-proxy?url=${encodeURIComponent(rawThumbnail)}`
				: "/placeholder.svg?height=300&width=500";
			mediaType = "profile";
		}

		// Get all available media URLs
		const mediaUrls = response.url_list.map((url) => ({
			url,
			type: url.includes(".mp4") ? "video" : "image",
			quality: url.includes("750x750") ? "high" : "standard",
		}));
		return {
			success: true,
			message: `Instagram ${mediaType} processed successfully`,
			downloadUrl: `/api/proxy?url=${encodeURIComponent(
				url
			)}&type=${mediaType}&media_url=${encodeURIComponent(mediaUrl)}`,
			type: mediaType,
			title,
			thumbnail,
			mediaType: type,
			mediaUrls,
		};
	} catch (error) {
		console.error("Error handling Instagram:", error);
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Failed to process Instagram content. Please try again.",
		};
	}
}

async function handleFacebook(url: string) {
	try {
		// Basic URL validation
		if (!url.includes("facebook.com") && !url.includes("fb.com")) {
			return { success: false, message: "Invalid Facebook URL" };
		}

		// Extract video ID if possible
		let videoId = "";
		if (url.includes("videos/")) {
			videoId = url.split("videos/")[1]?.split("/")[0] || "";
		} else if (url.includes("watch?v=")) {
			videoId = url.split("watch?v=")[1]?.split("&")[0] || "";
		}

		// First get cookies by visiting main page
		const mainPageResponse = await fetch("https://www.facebook.com", {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
				"sec-ch-ua":
					'"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"macOS"',
			},
		});

		const cookies = mainPageResponse.headers.get("set-cookie");

		// Try to convert to direct video URL
		let videoPageUrl = url;
		if (url.includes("watch?v=") && videoId) {
			videoPageUrl = `https://www.facebook.com/video.php?v=${videoId}`;
		}

		// Fetch the video page with cookies
		const response = await fetch(videoPageUrl, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
				Cookie: cookies || "",
				Referer: "https://www.facebook.com/",
				"sec-ch-ua":
					'"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"macOS"',
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch Facebook page: ${response.statusText}`
			);
		}

		const html = await response.text();

		// Helper function to decode HTML entities
		const decodeHtmlEntities = (text: string) => {
			const entities: { [key: string]: string } = {
				"&amp;": "&",
				"&lt;": "<",
				"&gt;": ">",
				"&quot;": '"',
				"&#39;": "'",
				"&#x27;": "'",
				"&#x2F;": "/",
				"&#x5C;": "\\",
				"&#96;": "`",
				"&nbsp;": " ",
			};
			return text.replace(/&([^;]+);/g, (match, entity) => {
				if (match in entities) {
					return entities[match];
				} else if (entity.match(/^#x[\da-f]+$/i)) {
					return String.fromCharCode(parseInt(entity.substr(2), 16));
				} else if (entity.match(/^#\d+$/)) {
					return String.fromCharCode(parseInt(entity.substr(1), 10));
				}
				return match;
			});
		};

		// Extract title and thumbnail from meta tags
		let title = "Facebook Video";
		let thumbnail = "/placeholder.svg?height=300&width=500";

		// Try multiple ways to get title
		const titlePatterns = [
			/<meta property="og:title" content="([^"]+)"/i,
			/<title>([^<]+)<\/title>/i,
			/"name":"([^"]+)"/i,
		];

		for (const pattern of titlePatterns) {
			const match = html.match(pattern);
			if (match && match[1]) {
				title = decodeHtmlEntities(match[1].trim());
				break;
			}
		}

		// Try multiple ways to get thumbnail
		const thumbnailPatterns = [
			/<meta property="og:image" content="([^"]+)"/i,
			/"thumbnailImage":{"uri":"([^"]+)"/i,
			/"preview_image_url":"([^"]+)"/i,
		];

		for (const pattern of thumbnailPatterns) {
			const match = html.match(pattern);
			if (match && match[1]) {
				// Clean and decode the thumbnail URL
				thumbnail = decodeHtmlEntities(
					decodeURIComponent(match[1].replace(/\\/g, ""))
				);
				// If the URL is relative, make it absolute
				if (thumbnail.startsWith("/")) {
					thumbnail = `https://www.facebook.com${thumbnail}`;
				}
				break;
			}
		}

		return {
			success: true,
			message: "Facebook video processed successfully",
			downloadUrl: `/api/proxy?url=${encodeURIComponent(
				url
			)}&type=facebook${videoId ? `&video_id=${videoId}` : ""}`,
			type: "Video",
			title: title,
			thumbnail: thumbnail,
			isExternal: true,
			videoId,
		};
	} catch (error) {
		console.error("Error handling Facebook:", error);
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Failed to process Facebook content. Please try again.",
		};
	}
}
