import { type NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync, createWriteStream, statSync } from "fs";
import ytdl from "ytdl-core";

// Helper function to create a hash of the URL for file naming
function createUrlHash(url: string): string {
	return createHash("md5").update(url).digest("hex");
}

// Helper function to ensure the downloads directory exists
async function ensureDownloadsDir() {
	const downloadsDir = join(process.cwd(), "public", "downloads");

	if (!existsSync(downloadsDir)) {
		await mkdir(downloadsDir, { recursive: true });
	}

	return downloadsDir;
}

// Helper function to extract Instagram media URL from page HTML
async function extractInstagramMediaUrl(
	url: string,
	type: string
): Promise<string | null> {
	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch Instagram page: ${response.statusText}`
			);
		}

		const html = await response.text();

		// Look for JSON data in the page that contains media URLs
		const dataRegex =
			/<script type="text\/javascript">window\._sharedData = (.+?);<\/script>/;
		const match = html.match(dataRegex);

		if (match && match[1]) {
			const jsonData = JSON.parse(match[1]);

			// Navigate through the JSON structure to find media
			const mediaData =
				jsonData.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;

			if (mediaData) {
				if (type === "post" && mediaData.is_video === false) {
					// Return the highest resolution image URL
					return mediaData.display_url;
				} else if (
					(type === "reel" || type === "post") &&
					mediaData.is_video === true
				) {
					// Return video URL
					return mediaData.video_url;
				}
			}

			// For profile pictures
			if (type === "profile") {
				const profileData =
					jsonData.entry_data?.ProfilePage?.[0]?.graphql?.user;
				if (profileData) {
					return (
						profileData.profile_pic_url_hd ||
						profileData.profile_pic_url
					);
				}
			}
		}
		return null;
	} catch (error) {
		console.error("Error extracting Instagram media URL:", error);
		return null;
	}
}

// Helper function to download file from URL
async function downloadFileFromUrl(
	url: string,
	filePath: string
): Promise<boolean> {
	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to download file: ${response.statusText}`);
		}

		const buffer = await response.arrayBuffer();
		await writeFile(filePath, Buffer.from(buffer));
		return true;
	} catch (error) {
		console.error("Error downloading file:", error);
		return false;
	}
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
		let downloadPath: string = "";
		let title: string | null = null;
		let thumbnail: string | null = null;

		// Ensure downloads directory exists
		const downloadsDir = await ensureDownloadsDir();

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
					const filePath = join(downloadsDir, fileName);

					// Check if file already exists
					if (!existsSync(filePath)) {
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
						thumbnail = info.videoDetails.thumbnails[0].url;

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

						console.log(
							"Starting download with format:",
							selectedFormat.qualityLabel
						);

						// Download using the selected format
						const stream = ytdl.downloadFromInfo(info, {
							format: selectedFormat,
						});

						// Set up write stream
						const writeStream = createWriteStream(filePath);
						let downloadError: Error | null = null;

						// Wait for download to complete
						await new Promise((resolve, reject) => {
							// Set up data event to track progress
							let downloaded = 0;
							stream.on("data", (chunk) => {
								downloaded += chunk.length;
								console.log(
									`Downloaded: ${(
										downloaded /
										1024 /
										1024
									).toFixed(2)} MB`
								);
							});

							// Handle stream errors
							stream.on("error", (err: Error) => {
								console.error("Stream error:", err);
								downloadError = err;
								writeStream.destroy(err);
								reject(err);
							});

							// Handle write errors
							writeStream.on("error", (err: Error) => {
								console.error("Write error:", err);
								downloadError = err;
								stream.destroy(err);
								reject(err);
							});

							// Handle completion
							writeStream.on("finish", () => {
								if (downloadError) {
									console.error(
										"Download failed:",
										downloadError
									);
									reject(downloadError);
								} else {
									console.log(
										"Download completed successfully"
									);
									resolve(true);
								}
							});

							// Start the download
							stream.pipe(writeStream);
						});

						// Verify the download
						const stats = statSync(filePath);
						if (stats.size === 0) {
							throw new Error("Download failed - file is empty");
						}
						console.log(
							`Download completed. File size: ${(
								stats.size /
								1024 /
								1024
							).toFixed(2)} MB`
						);
					}

					downloadPath = `/downloads/${fileName}`;
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
				const filePath = join(downloadsDir, fileName);

				try {
					const response = await fetch(mediaUrl);
					if (!response.ok)
						throw new Error(
							`HTTP error! status: ${response.status}`
						);
					const buffer = await response.arrayBuffer();
					await writeFile(filePath, Buffer.from(buffer));
					downloadPath = `/downloads/${fileName}`;
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

				const filePath = join(downloadsDir, fileName);

				// Check if file already exists to avoid re-downloading
				if (!existsSync(filePath)) {
					// Download the file
					const success = await downloadFileFromUrl(
						mediaUrl,
						filePath
					);

					if (!success) {
						return NextResponse.json(
							{ error: "Failed to download Instagram post" },
							{ status: 500 }
						);
					}
				}

				downloadPath = `/downloads/${fileName}`;
				break;
			}

			case "profile": {
				fileName = `instagram-profile-${urlHash}.jpg`;
				contentType = "image/jpeg";
				const filePath = join(downloadsDir, fileName);

				// Check if file already exists to avoid re-downloading
				if (!existsSync(filePath)) {
					// Extract the profile picture URL
					const mediaUrl = await extractInstagramMediaUrl(
						url,
						"profile"
					);

					if (!mediaUrl) {
						return NextResponse.json(
							{
								error: "Could not extract Instagram profile picture URL",
							},
							{ status: 500 }
						);
					}

					// Download the file
					const success = await downloadFileFromUrl(
						mediaUrl,
						filePath
					);

					if (!success) {
						return NextResponse.json(
							{
								error: "Failed to download Instagram profile picture",
							},
							{ status: 500 }
						);
					}
				}

				downloadPath = `/downloads/${fileName}`;
				break;
			}

			case "facebook": {
				try {
					// First get the cookies by visiting the main page
					const mainPageResponse = await fetch("https://www.facebook.com", {
						headers: {
							"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
							"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
							"Accept-Language": "en-US,en;q=0.5",
							"sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
							"sec-ch-ua-mobile": "?0",
							"sec-ch-ua-platform": '"macOS"',
							"sec-fetch-dest": "document",
							"sec-fetch-mode": "navigate",
							"sec-fetch-site": "none",
							"sec-fetch-user": "?1",
							"upgrade-insecure-requests": "1"
						}
					});

					// Get cookies from the response
					const cookies = mainPageResponse.headers.get('set-cookie');

					// Try to convert the URL to a direct video URL if it's a watch URL
					let videoPageUrl = url;
					if (url.includes('watch?v=')) {
						const videoId = url.split('watch?v=')[1]?.split('&')[0];
						if (videoId) {
							videoPageUrl = `https://www.facebook.com/video.php?v=${videoId}`;
						}
					}

					// Now fetch the video page with cookies
					const response = await fetch(videoPageUrl, {
						headers: {
							"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
							"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
							"Accept-Language": "en-US,en;q=0.5",
							"Cookie": cookies || '',
							"sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
							"sec-ch-ua-mobile": "?0",
							"sec-ch-ua-platform": '"macOS"',
							"sec-fetch-dest": "document",
							"sec-fetch-mode": "navigate",
							"sec-fetch-site": "none",
							"sec-fetch-user": "?1",
							"upgrade-insecure-requests": "1",
							"Referer": "https://www.facebook.com/"
						},
					});

					if (!response.ok) {
						throw new Error(`Failed to fetch Facebook page: ${response.statusText}`);
					}

					const html = await response.text();
					let videoUrl = null;

					// Try to find video data in the page
					const dataMatches = [
						// Modern Facebook video patterns
						{
							pattern: /"playable_url_quality_hd":"([^"]+)"/,
							handler: (match: RegExpMatchArray) => match[1].replace(/\\/g, "")
						},
						{
							pattern: /"playable_url":"([^"]+)"/,
							handler: (match: RegExpMatchArray) => match[1].replace(/\\/g, "")
						},
						{
							pattern: /"browser_native_hd_url":"([^"]+)"/,
							handler: (match: RegExpMatchArray) => match[1].replace(/\\/g, "")
						},
						{
							pattern: /"browser_native_sd_url":"([^"]+)"/,
							handler: (match: RegExpMatchArray) => match[1].replace(/\\/g, "")
						},
						// Video data from GraphQL
						{
							pattern: /"video":{[^}]*"url":"([^"]+)"/,
							handler: (match: RegExpMatchArray) => match[1].replace(/\\/g, "")
						},
						// Legacy patterns
						{
							pattern: /"hd_src":"([^"]+)"/,
							handler: (match: RegExpMatchArray) => match[1].replace(/\\/g, "")
						},
						{
							pattern: /"sd_src":"([^"]+)"/,
							handler: (match: RegExpMatchArray) => match[1].replace(/\\/g, "")
						},
						// Embedded video URL
						{
							pattern: /"contentUrl":"([^"]+)"/,
							handler: (match: RegExpMatchArray) => match[1].replace(/\\/g, "")
						}
					];

					// Try each pattern until we find a valid URL
					for (const { pattern, handler } of dataMatches) {
						const match = html.match(pattern);
						if (match) {
							videoUrl = handler(match);
							if (videoUrl) break;
						}
					}

					// If still no URL found, try the GraphQL approach
					if (!videoUrl) {
						// Split the HTML into smaller chunks to handle large files
						const chunks = html.split('\n');
						for (const chunk of chunks) {
							if (chunk.includes('"video"') && chunk.includes('"playable_url"')) {
								const graphqlMatch = chunk.match(/"video":{"id":"([^"]+)".*?"playable_url":"([^"]+)"/i);
								if (graphqlMatch && graphqlMatch[2]) {
									videoUrl = graphqlMatch[2].replace(/\\/g, "");
									break;
								}
							}
						}
					}

					// If still no URL, try to find it in any script tag
					if (!videoUrl) {
						const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
						for (const script of scriptTags) {
							if (script.includes('"playable_url"')) {
								const urlMatch = script.match(/"playable_url":"([^"]+)"/i);
								if (urlMatch && urlMatch[1]) {
									videoUrl = urlMatch[1].replace(/\\/g, "");
									break;
								}
							}
						}
					}

					if (videoUrl) {
						// Create a filename for the video
						const urlHash = createUrlHash(url);
						fileName = `facebook-${urlHash}.mp4`;
						contentType = "video/mp4";
						const filePath = join(downloadsDir, fileName);

						// Download the video if it doesn't exist
						if (!existsSync(filePath)) {
							const success = await downloadFileFromUrl(videoUrl, filePath);
							if (!success) {
								throw new Error("Failed to download Facebook video");
							}
						}

						downloadPath = `/downloads/${fileName}`;
					} else {
						throw new Error(
							"Could not access the Facebook video. This could be because:\n" +
							"1. The video is private\n" +
							"2. The video requires login\n" +
							"3. The video has age restrictions\n" +
							"4. The video URL is invalid or has expired\n\n" +
							"Please make sure:\n" +
							"- The video is public\n" +
							"- You're using a direct link to the video post\n" +
							"- The video hasn't been deleted"
						);
					}
				} catch (error) {
					console.error("Facebook video error:", error);
					return NextResponse.json(
						{ error: error instanceof Error ? error.message : "Failed to download Facebook video. The video might be private or restricted." },
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

		// Return the download URL
		return NextResponse.json({
			success: true,
			downloadUrl: downloadPath,
			fileName,
			contentType,
			title,
			thumbnail,
			isExternal: false,
		});
	} catch (error) {
		console.error("Proxy error:", error);
		return NextResponse.json(
			{ error: "Failed to process request" },
			{ status: 500 }
		);
	}
}
