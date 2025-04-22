import { type NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import ytdl from "ytdl-core";

// Function to create a hash of a URL
function createUrlHash(url: string): string {
	return createHash("md5").update(url).digest("hex");
}

// Helper function to extract Instagram media URL from page HTML
async function extractInstagramMediaUrl(
	url: string,
	type: "post" | "reel" | "profile"
): Promise<string | null> {
	try {
		const response = await fetch(url);
		if (!response.ok) return null;

		const html = await response.text();

		// Extract the media URL based on type
		const patterns = {
			post: /<meta property="og:image" content="([^"]+)"/i,
			reel: /<meta property="og:video" content="([^"]+)"/i,
			profile: /<meta property="og:image" content="([^"]+)"/i,
		};

		const match = html.match(patterns[type]);
		return match ? match[1] : null;
	} catch (error) {
		console.error("Error extracting Instagram media URL:", error);
		return null;
	}
}

// Function to generate a content disposition filename
function generateContentDisposition(title: string, extension: string): string {
	// Remove invalid characters and trim
	const safeTitle = title
		.replace(/[^a-z0-9]/gi, "-")
		.replace(/-+/g, "-")
		.toLowerCase()
		.slice(0, 50);

	const filename = `${safeTitle}-${Date.now()}${extension}`;
	return `attachment; filename="${filename}"`;
}

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const url = searchParams.get("url");
		const type = searchParams.get("type");
		const quality = searchParams.get("quality"); // For YouTube quality selection
		const mediaUrl = searchParams.get("media_url"); // For Instagram direct media URL

		if (!url || !type) {
			return NextResponse.json(
				{ error: "Missing URL or type" },
				{ status: 400 }
			);
		}

		// Create a hash of the URL for file naming
		const urlHash = createUrlHash(url);
		let fileName: string = "";
		let contentType: string = "";
		let title: string | null = null;

		switch (type) {
			case "youtube": {
				try {
					console.log("Processing YouTube URL:", url);

					// Validate YouTube URL
					if (!ytdl.validateURL(url)) {
						throw new Error("Invalid YouTube URL");
					}

					// Set up file path first
					fileName = `youtube-${urlHash}.mp4`;
					contentType = "video/mp4";

					// Get video info with retries
					console.log("Getting video info...");
					let info;
					try {
						info = await ytdl.getInfo(url);
					} catch (error) {
						console.error("Error getting video info:", error);
						throw new Error("Could not get video information");
					}

					console.log("Video info retrieved successfully");
					title = info.videoDetails.title;

					// Get available formats and select the appropriate one
					console.log("Getting available formats...");
					const formats = ytdl.filterFormats(
						info.formats,
						"videoandaudio"
					);
					let selectedFormat = formats.find(
						(f) => f.itag === parseInt(quality || "18")
					);

					if (!selectedFormat) {
						// Fallback to best available format
						formats.sort(
							(a, b) => (b.height || 0) - (a.height || 0)
						);
						selectedFormat = formats[0];
					}

					if (!selectedFormat) {
						throw new Error("No suitable format found");
					}

					// Create a readable stream
					const videoStream = ytdl.downloadFromInfo(info, {
						format: selectedFormat,
					});

					// Stream the video to the client
					return new NextResponse(
						videoStream as unknown as ReadableStream,
						{
							headers: {
								"Content-Type": "video/mp4",
								"Content-Disposition":
									generateContentDisposition(title, ".mp4"),
							},
						}
					);
				} catch (error) {
					const err = error as Error;
					console.error("YouTube download error:", err);
					return NextResponse.json(
						{
							error:
								err.message ||
								"Failed to download YouTube video",
						},
						{ status: 500 }
					);
				}
				break;
			}

			case "reel":
			case "post":
			case "profile": {
				if (!mediaUrl) {
					return NextResponse.json(
						{ error: "Missing media URL" },
						{ status: 400 }
					);
				}

				const isVideo = mediaUrl.includes(".mp4");
				fileName = `instagram-${type}-${urlHash}.${
					isVideo ? "mp4" : "jpg"
				}`;
				contentType = isVideo ? "video/mp4" : "image/jpeg";

				try {
					const response = await fetch(mediaUrl);
					if (!response.ok)
						throw new Error(
							`HTTP error! status: ${response.status}`
						);

					// Stream directly to the client
					return new NextResponse(response.body as ReadableStream, {
						headers: {
							"Content-Type": contentType,
							"Content-Disposition": generateContentDisposition(
								fileName,
								`.${isVideo ? "mp4" : "jpg"}`
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
				break;
			}

			case "post": {
				// Determine if it's a video or image post
				const mediaUrl = await extractInstagramMediaUrl(url, "post");

				if (!mediaUrl) {
					return NextResponse.json(
						{ error: "Could not extract Instagram post URL" },
						{ status: 500 }
					);
				}

				// Check if it's a video or image based on URL
				const isVideo =
					mediaUrl.includes(".mp4") || mediaUrl.includes("/video/");

				if (isVideo) {
					fileName = `instagram-post-${urlHash}.mp4`;
					contentType = "video/mp4";
				} else {
					fileName = `instagram-post-${urlHash}.jpg`;
					contentType = "image/jpeg";
				}

				try {
					const response = await fetch(mediaUrl);
					if (!response.ok)
						throw new Error(
							`HTTP error! status: ${response.status}`
						);

					// Stream directly to the client
					return new NextResponse(response.body as ReadableStream, {
						headers: {
							"Content-Type": contentType,
							"Content-Disposition": generateContentDisposition(
								fileName,
								`.${isVideo ? "mp4" : "jpg"}`
							),
						},
					});
				} catch (error) {
					console.error("Instagram post download error:", error);
					return NextResponse.json(
						{ error: "Failed to download Instagram post" },
						{ status: 500 }
					);
				}
				break;
			}

			case "profile": {
				fileName = `instagram-profile-${urlHash}.jpg`;
				contentType = "image/jpeg";

				// Extract the profile picture URL
				const mediaUrl = await extractInstagramMediaUrl(url, "profile");

				if (!mediaUrl) {
					return NextResponse.json(
						{
							error: "Could not extract Instagram profile picture URL",
						},
						{ status: 500 }
					);
				}

				try {
					const response = await fetch(mediaUrl);
					if (!response.ok)
						throw new Error(
							`HTTP error! status: ${response.status}`
						);

					// Stream directly to the client
					return new NextResponse(response.body as ReadableStream, {
						headers: {
							"Content-Type": contentType,
							"Content-Disposition": generateContentDisposition(
								fileName,
								".jpg"
							),
						},
					});
				} catch (error) {
					console.error(
						"Instagram profile picture download error:",
						error
					);
					return NextResponse.json(
						{
							error: "Failed to download Instagram profile picture",
						},
						{ status: 500 }
					);
				}
				break;
			}

			case "facebook": {
				try {
					// Extract video ID from different URL formats
					let videoId = "";
					if (url.includes("watch?v=")) {
						videoId = url.split("watch?v=")[1]?.split("&")[0] || "";
					} else if (url.includes("videos/")) {
						videoId = url.split("videos/")[1]?.split("/")[0] || "";
					} else if (url.includes("video.php?v=")) {
						videoId =
							url.split("video.php?v=")[1]?.split("&")[0] || "";
					}

					if (!videoId) {
						throw new Error("Could not extract video ID from URL");
					}

					// Construct the video URL
					const videoPageUrl = `https://www.facebook.com/video.php?v=${videoId}`;

					// Fetch the video page with minimal headers
					const response = await fetch(videoPageUrl, {
						method: "GET",
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
							Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
							"Accept-Language": "en-US,en;q=0.5",
						},
					});

					if (!response.ok) {
						throw new Error(
							`Failed to fetch Facebook page: ${response.statusText}`
						);
					}

					const html = await response.text();
					let videoUrl = null;

					// // Try to find video data in the page
					// const dataMatches = [
					// 	// Modern Facebook video patterns
					// 	{
					// 		pattern: /"playable_url_quality_hd":"([^"]+)"/,
					// 		handler: (match: RegExpMatchArray) =>
					// 			match[1].replace(/\\/g, ""),
					// 	},
					// 	{
					// 		pattern: /"playable_url":"([^"]+)"/,
					// 		handler: (match: RegExpMatchArray) =>
					// 			match[1].replace(/\\/g, ""),
					// 	},
					// 	{
					// 		pattern: /"browser_native_hd_url":"([^"]+)"/,
					// 		handler: (match: RegExpMatchArray) =>
					// 			match[1].replace(/\\/g, ""),
					// 	},
					// 	{
					// 		pattern: /"browser_native_sd_url":"([^"]+)"/,
					// 		handler: (match: RegExpMatchArray) =>
					// 			match[1].replace(/\\/g, ""),
					// 	},
					// 	// Video data from GraphQL
					// 	{
					// 		pattern: /"video":{[^}]*"url":"([^"]+)"/,
					// 		handler: (match: RegExpMatchArray) =>
					// 			match[1].replace(/\\/g, ""),
					// 	},
					// 	// Legacy patterns
					// 	{
					// 		pattern: /"hd_src":"([^"]+)"/,
					// 		handler: (match: RegExpMatchArray) =>
					// 			match[1].replace(/\\/g, ""),
					// 	},
					// 	{
					// 		pattern: /"sd_src":"([^"]+)"/,
					// 		handler: (match: RegExpMatchArray) =>
					// 			match[1].replace(/\\/g, ""),
					// 	},
					// 	// Embedded video URL
					// 	{
					// 		pattern: /"contentUrl":"([^"]+)"/,
					// 		handler: (match: RegExpMatchArray) =>
					// 			match[1].replace(/\\/g, ""),
					// 	},
					// ];

					// Try to find the video URL in the HTML
					const videoUrlMatch =
						html.match(/"playable_url":"([^"]+)"/i) ||
						html.match(/"browser_native_hd_url":"([^"]+)"/i) ||
						html.match(/"browser_native_sd_url":"([^"]+)"/i) ||
						html.match(/"hd_src":"([^"]+)"/i) ||
						html.match(/"sd_src":"([^"]+)"/i);

					if (videoUrlMatch && videoUrlMatch[1]) {
						videoUrl = videoUrlMatch[1].replace(/\\/g, "");
					}

					if (!videoUrl) {
						throw new Error(
							"Video URL not found. The video might be private, requires login, or has been deleted."
						);
					}

					// Try to fetch the video content with appropriate headers
					const videoResponse = await fetch(videoUrl, {
						method: "GET",
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
							Accept: "video/mp4,video/*;q=0.9,*/*;q=0.8",
							"Accept-Language": "en-US,en;q=0.5",
						},
					});

					if (!videoResponse.ok) {
						throw new Error(
							`Failed to fetch video content: ${videoResponse.statusText}`
						);
					}

					// Create a filename for the video
					const urlHash = createUrlHash(url);
					fileName = `facebook-${urlHash}.mp4`;
					contentType = "video/mp4";

					// Stream the video to the client with caching headers
					return new NextResponse(
						videoResponse.body as ReadableStream,
						{
							headers: {
								"Content-Type": contentType,
								"Content-Disposition":
									generateContentDisposition(
										fileName,
										".mp4"
									),
								"Cache-Control":
									"no-store, no-cache, must-revalidate, proxy-revalidate",
								Pragma: "no-cache",
								Expires: "0",
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
									: "Failed to download Facebook video. The video might be private or restricted.",
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

		// This part should never be reached now as we're streaming directly
		return new NextResponse("No handler found", { status: 400 });
	} catch (error) {
		console.error("Proxy error:", error);
		return NextResponse.json(
			{ error: "Failed to process request" },
			{ status: 500 }
		);
	}
}
