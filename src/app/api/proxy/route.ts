import { type NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

// Generate safe filename for downloads
function generateFilename(title: string, extension: string): string {
	const safeTitle = title
		.replace(/[^a-z0-9]/gi, "-")
		.replace(/-+/g, "-")
		.toLowerCase()
		.slice(0, 40);
	return `attachment; filename="${safeTitle}-${Date.now()}${extension}"`;
}

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const url = searchParams.get("url");
		const type = searchParams.get("type");
		const quality = searchParams.get("quality");
		const mediaUrl = searchParams.get("media_url");
		const videoId = searchParams.get("video_id");

		if (!url || !type) {
			return NextResponse.json(
				{ error: "Missing URL or type" },
				{ status: 400 }
			);
		}

		switch (type) {
			case "youtube": {
				try {
					if (!ytdl.validateURL(url)) {
						throw new Error("Invalid YouTube URL");
					}

					const info = await ytdl.getInfo(url);
					const title = info.videoDetails.title;

					// Get formats with video and audio
					let formats = ytdl.filterFormats(info.formats, "videoandaudio");
					if (formats.length === 0) {
						formats = info.formats.filter((f) => f.hasVideo);
					}

					if (formats.length === 0) {
						throw new Error("No suitable format found");
					}

					// Sort by quality
					formats.sort((a, b) => (b.height || 0) - (a.height || 0));

					// Find requested quality or use best
					let selectedFormat = quality
						? formats.find((f) => f.itag === parseInt(quality))
						: formats[0];

					if (!selectedFormat) {
						selectedFormat = formats[0];
					}

					const videoStream = ytdl.downloadFromInfo(info, {
						format: selectedFormat,
					});

					return new NextResponse(
						videoStream as unknown as ReadableStream,
						{
							headers: {
								"Content-Type": "video/mp4",
								"Content-Disposition": generateFilename(title, ".mp4"),
								"Cache-Control": "no-cache",
							},
						}
					);
				} catch (error) {
					console.error("YouTube download error:", error);
					return NextResponse.json(
						{
							error:
								error instanceof Error
									? error.message
									: "Failed to download YouTube video",
						},
						{ status: 500 }
					);
				}
			}

			case "reel":
			case "post":
			case "profile": {
				const finalMediaUrl = mediaUrl;

				if (!finalMediaUrl) {
					return NextResponse.json(
						{ error: "Missing media URL" },
						{ status: 400 }
					);
				}

				const isVideo = finalMediaUrl.includes(".mp4");
				const contentType = isVideo ? "video/mp4" : "image/jpeg";
				const extension = isVideo ? ".mp4" : ".jpg";

				try {
					const response = await fetch(finalMediaUrl, {
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
							Referer: "https://www.instagram.com/",
						},
					});

					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					return new NextResponse(response.body as ReadableStream, {
						headers: {
							"Content-Type": contentType,
							"Content-Disposition": generateFilename(
								`instagram-${type}`,
								extension
							),
						},
					});
				} catch (error) {
					console.error(`Instagram ${type} download error:`, error);
					return NextResponse.json(
						{ error: `Failed to download Instagram ${type}` },
						{ status: 500 }
					);
				}
			}

			case "facebook": {
				try {
					// Facebook aggressively blocks server-side requests
					// Try with enhanced headers and cookies
					const cookieResponse = await fetch("https://www.facebook.com", {
						headers: {
							"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
							"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
							"Accept-Language": "en-US,en;q=0.5",
						},
					});

					const cookies = cookieResponse.headers.get("set-cookie") || "";

					// Fetch the video page with cookies
					const response = await fetch(url, {
						headers: {
							"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
							"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
							"Accept-Language": "en-US,en;q=0.5",
							"Accept-Encoding": "gzip, deflate, br",
							"Cookie": cookies,
							"Referer": "https://www.facebook.com/",
							"Sec-Fetch-Dest": "document",
							"Sec-Fetch-Mode": "navigate",
							"Sec-Fetch-Site": "same-origin",
							"Upgrade-Insecure-Requests": "1",
						},
						redirect: "follow",
					});

					if (!response.ok) {
						console.error(`Facebook fetch failed: ${response.status} ${response.statusText}`);
						throw new Error(`Failed to fetch Facebook page: ${response.statusText}`);
					}

					const html = await response.text();

					// Check if we got a login page or block page
					if (html.includes("login.php") || html.includes("You must log in")) {
						throw new Error("Facebook requires login to access this content");
					}

					let videoUrl: string | null = null;

					// Patterns to find video URL - ordered by quality preference
					const patterns = [
						/"playable_url_quality_hd":"([^"]+)"/i,
						/"browser_native_hd_url":"([^"]+)"/i,
						/"hd_src":"([^"]+)"/i,
						/"playable_url":"([^"]+)"/i,
						/"browser_native_sd_url":"([^"]+)"/i,
						/"sd_src":"([^"]+)"/i,
						/"video_url":"([^"]+)"/i,
						/<meta\s+property="og:video"\s+content="([^"]+)"/i,
						/<meta\s+property="og:video:url"\s+content="([^"]+)"/i,
					];

					for (const pattern of patterns) {
						const matches = html.match(pattern);
						if (matches?.[1]) {
							const potentialUrl = matches[1]
								.replace(/\\/g, "")
								.replace(/&amp;/g, "&");
							try {
								new URL(potentialUrl);
								videoUrl = potentialUrl;
								break;
							} catch {
								// Invalid URL, continue
							}
						}
					}

					if (!videoUrl) {
						throw new Error(
							"Could not find video URL. The video might be private, restricted, or Facebook may be blocking automated access."
						);
					}

					// Fetch video content with proper headers
					const videoResponse = await fetch(videoUrl, {
						headers: {
							"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
							"Accept": "video/mp4,video/webm,video/*;q=0.9,*/*;q=0.8",
							"Accept-Language": "en-US,en;q=0.5",
							"Referer": "https://www.facebook.com/",
							"Origin": "https://www.facebook.com",
						},
					});

					if (!videoResponse.ok) {
						throw new Error("Failed to fetch video content");
					}

					// Extract title
					let title = "Facebook Video";
					const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
					if (titleMatch?.[1]) {
						title = titleMatch[1].replace(/&amp;/g, "&").trim();
					}

					const isReel = url.includes("/reel/") || url.includes("/reels/") || url.includes("fb.watch");

					return new NextResponse(
						videoResponse.body as ReadableStream,
						{
							headers: {
								"Content-Type": "video/mp4",
								"Content-Disposition": generateFilename(isReel ? "Facebook Reel" : title, ".mp4"),
								"Cache-Control": "no-store, no-cache",
							},
						}
					);
				} catch (error) {
					console.error("Facebook video error:", error);
					return NextResponse.json(
						{
							error:
								error instanceof Error
									? error.message
									: "Failed to download Facebook video",
						},
						{ status: 500 }
					);
				}
			}

			default:
				return NextResponse.json(
					{ error: "Unsupported content type" },
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error("Proxy error:", error);
		return NextResponse.json(
			{ error: "Failed to process request" },
			{ status: 500 }
		);
	}
}
