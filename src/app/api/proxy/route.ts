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
					// For Facebook, we'll try to get the video URL first
					const response = await fetch(url, {
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
						},
					});

					if (!response.ok) {
						throw new Error(
							`Failed to fetch Facebook page: ${response.statusText}`
						);
					}

					const html = await response.text();

					// Try to find HD video URL
					const hdMatch = html.match(/hd_src:"([^"]+)"/i);
					if (hdMatch && hdMatch[1]) {
						return NextResponse.redirect(hdMatch[1]);
					}

					// Try to find SD video URL
					const sdMatch = html.match(/sd_src:"([^"]+)"/i);
					if (sdMatch && sdMatch[1]) {
						return NextResponse.redirect(sdMatch[1]);
					}

					// If no direct video URL found, try to find the video player URL
					const playerMatch = html.match(/"playable_url":"([^"]+)"/i);
					if (playerMatch && playerMatch[1]) {
						const playerUrl = playerMatch[1].replace(/\\/g, "");
						return NextResponse.redirect(playerUrl);
					}

					// If all else fails, redirect to original URL
					return NextResponse.redirect(url);
				} catch (error) {
					console.error("Facebook video error:", error);
					// If anything fails, redirect to original URL
					return NextResponse.redirect(url);
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
