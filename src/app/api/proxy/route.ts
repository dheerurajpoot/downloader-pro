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

					// Fetch the video page with enhanced headers for Vercel deployment
					const response = await fetch(videoPageUrl, {
						method: "GET",
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
							Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
							"Accept-Language": "en-US,en;q=0.9",
							"Accept-Encoding": "gzip, deflate, br",
							"Cache-Control": "no-cache",
							"Sec-Ch-Ua":
								'"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
							"Sec-Ch-Ua-Mobile": "?0",
							"Sec-Ch-Ua-Platform": '"macOS"',
							"Sec-Fetch-Dest": "document",
							"Sec-Fetch-Mode": "navigate",
							"Sec-Fetch-Site": "none",
							"Sec-Fetch-User": "?1",
							"Upgrade-Insecure-Requests": "1",
						},
					});

					if (!response.ok) {
						throw new Error(
							`Failed to fetch Facebook page: ${response.statusText}`
						);
					}

					const html = await response.text();
					let videoUrl = null;

					// Try to find the video URL using multiple methods
					const patterns = [
						// GraphQL response patterns
						/"playable_url_quality_hd":"([^"]+)"/i,
						/"playable_url":"([^"]+)"/i,
						/"browser_native_hd_url":"([^"]+)"/i,
						/"browser_native_sd_url":"([^"]+)"/i,
						/"hd_src":"([^"]+)"/i,
						/"sd_src":"([^"]+)"/i,
						/"video_url":"([^"]+)"/i,
						/"contentUrl":"([^"]+)"/i,
						// HTML5 video patterns
						/<meta\s+property="og:video"\s+content="([^"]+)"/i,
						/<meta\s+property="og:video:url"\s+content="([^"]+)"/i,
						/<video[^>]+src="([^"]+)"[^>]*>/i,
						/<video[^>]+data-src="([^"]+)"[^>]*>/i,
					];

					// Try each pattern
					let videoUrlMatch = null;
					for (const pattern of patterns) {
						const matches = html.match(pattern);
						if (matches && matches[1]) {
							const potentialUrl = matches[1]
								.replace(/\\/g, "")
								.replace(/&amp;/g, "&");
							// Validate if it's a proper URL
							try {
								new URL(potentialUrl);
								videoUrlMatch = matches;
								break;
							} catch (e) {
								console.log(
									"Invalid URL found:",
									potentialUrl,
									e
								);
							}
						}
					}

					if (videoUrlMatch && videoUrlMatch[1]) {
						videoUrl = videoUrlMatch[1].replace(/\\/g, "");
					}

					if (!videoUrl) {
						// Try to find any video data in the page
						const videoData = html.match(
							/"videoData":\[([^\]]+)\]/i
						);
						if (videoData && videoData[1]) {
							try {
								const parsedData = JSON.parse(
									`[${videoData[1]}]`
								);
								if (parsedData[0]?.video_url) {
									videoUrl = parsedData[0].video_url;
									console.log(
										"Found video URL from videoData:",
										videoUrl
									);
								}
							} catch (e) {
								console.log("Failed to parse videoData:", e);
							}
						}

						if (!videoUrl) {
							throw new Error(
								"Could not find the video URL. This might be because:\n" +
									"1. The video is private\n" +
									"2. The video requires login\n" +
									"3. The video has age restrictions\n" +
									"4. The video URL format has changed\n\n" +
									"Please ensure the video is public and try again."
							);
						}
					}

					// Fetch video content with enhanced headers
					const videoResponse = await fetch(videoUrl, {
						method: "GET",
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
							Accept: "video/webm,video/mp4,video/*;q=0.9,application/x-mpegURL,*/*;q=0.8",
							"Accept-Language": "en-US,en;q=0.9",
							"Accept-Encoding": "gzip, deflate, br",
							Range: "bytes=0-",
							Referer: "https://www.facebook.com/",
							Origin: "https://www.facebook.com",
							"Sec-Fetch-Dest": "video",
							"Sec-Fetch-Mode": "cors",
							"Sec-Fetch-Site": "cross-site",
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
