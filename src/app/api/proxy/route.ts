import { type NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import ytdl from "ytdl-core";
import instagramGetUrl from "instagram-url-direct";

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

		// Alternative method for newer Instagram structure
		const dataRegex2 =
			/<script type="application\/ld\+json">(.+?)<\/script>/;
		const match2 = html.match(dataRegex2);

		if (match2 && match2[1]) {
			try {
				const jsonData = JSON.parse(match2[1]);

				if (jsonData.video) {
					return jsonData.video.contentUrl;
				} else if (jsonData.image) {
					return Array.isArray(jsonData.image)
						? jsonData.image[0].url
						: jsonData.image.url;
				}
			} catch (e) {
				console.error("Error parsing JSON-LD data:", e);
			}
		}

		return null;
	} catch (error) {
		console.error("Error extracting Instagram media URL:", error);
		return null;
	}
}

// Helper function to extract Facebook video URL
async function extractFacebookVideoUrl(url: string): Promise<string | null> {
	try {
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

		// Look for HD video URL in the page
		const hdSrcRegex = /hd_src:"([^"]+)"/;
		const hdMatch = html.match(hdSrcRegex);

		if (hdMatch && hdMatch[1]) {
			return hdMatch[1];
		}

		// Look for SD video URL as fallback
		const sdSrcRegex = /sd_src:"([^"]+)"/;
		const sdMatch = html.match(sdSrcRegex);

		if (sdMatch && sdMatch[1]) {
			return sdMatch[1];
		}

		return null;
	} catch (error) {
		console.error("Error extracting Facebook video URL:", error);
		return null;
	}
}

// Helper function to extract YouTube video info
async function extractYouTubeInfo(
	url: string
): Promise<{
	videoUrl: string | null;
	title: string | null;
	thumbnail: string | null;
}> {
	try {
		// Use a different approach to get YouTube video info without ytdl-core
		const videoId = extractYouTubeVideoId(url);

		if (!videoId) {
			return { videoUrl: null, title: null, thumbnail: null };
		}

		// Get video info from YouTube oEmbed API
		const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
		const oembedResponse = await fetch(oembedUrl);

		if (!oembedResponse.ok) {
			throw new Error(
				`Failed to fetch YouTube oEmbed data: ${oembedResponse.statusText}`
			);
		}

		const oembedData = await oembedResponse.json();
		const title = oembedData.title || null;
		const thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

		// For the actual video URL, we'll use a YouTube download service
		// Note: In a production app, you might want to use a more reliable method
		const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

		return {
			videoUrl,
			title,
			thumbnail,
		};
	} catch (error) {
		console.error("Error extracting YouTube info:", error);
		return { videoUrl: null, title: null, thumbnail: null };
	}
}

// Helper function to extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
	const regExp =
		/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
	const match = url.match(regExp);
	return match && match[7].length === 11 ? match[7] : null;
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
					console.log('Processing YouTube URL:', url);
					
					// Validate YouTube URL
					if (!ytdl.validateURL(url)) {
						throw new Error('Invalid YouTube URL');
					}

					// Get basic video info first
					console.log('Getting video info...');
					const info = await ytdl.getBasicInfo(url);
					console.log('Video info retrieved successfully');

					title = info.videoDetails.title;
					thumbnail = info.videoDetails.thumbnails[0].url;

					// Get all available formats
					console.log('Getting available formats...');
					let formats = info.formats.filter(format => {
						// Check for video formats using multiple indicators
						return format.hasVideo || 
							format.qualityLabel || 
							format.quality?.includes('p') || 
							format.height || 
							format.width || 
							format.fps;
					});
					console.log(`Found ${formats.length} formats with video`);

					// Get the requested format or best available
					let format;
					if (quality) {
						format = formats.find(f => f.itag === parseInt(quality));
						console.log(`Requested quality ${quality}, format found:`, format ? 'yes' : 'no');
					}

					if (!format) {
						// Sort formats by quality
						const getQualityNumber = (format: any) => {
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

						formats = formats.sort((a, b) => {
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

						// Get the best format
						format = formats[0];
						console.log('Selected format:', {
							itag: format.itag,
							quality: format.qualityLabel,
							container: format.container,
							hasAudio: format.hasAudio
						});
					}

					if (!format) {
						throw new Error('No suitable format found');
					}

					fileName = `youtube-${urlHash}.${format.container || 'mp4'}`;
					contentType = format.mimeType || 'video/mp4';
					const filePath = join(downloadsDir, fileName);
					console.log('Saving to:', filePath);

					// Download using ytdl with specific format
					const stream = ytdl(url, {
						format,
						quality: format.itag,
						dlChunkSize: 0, // Set to 0 for better stability
					});

					// Save to file
					await new Promise((resolve, reject) => {
						const writeStream = require('fs').createWriteStream(filePath);
						stream.pipe(writeStream);

						let downloaded = 0;
						stream.on('data', (chunk) => {
							downloaded += chunk.length;
							console.log(`Downloaded: ${(downloaded / 1024 / 1024).toFixed(2)}MB`);
						});

						stream.on('error', (error: Error) => {
							console.error('Stream error:', error.message);
							reject(error);
						});

						writeStream.on('finish', () => {
							console.log('Download completed successfully');
							resolve(true);
						});

						writeStream.on('error', (error: Error) => {
							console.error('Write error:', error.message);
							reject(error);
						});
					});

					downloadPath = `/downloads/${fileName}`;
					console.log('Download path set:', downloadPath);
				} catch (error) {
					console.error('YouTube download error:', error instanceof Error ? error.message : error);
					return NextResponse.json(
						{ error: `Failed to process YouTube video: ${error instanceof Error ? error.message : 'Unknown error'}` },
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
							'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
						}
					});

					if (!response.ok) {
						throw new Error(`Failed to fetch Facebook page: ${response.statusText}`);
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
						const playerUrl = playerMatch[1].replace(/\\/g, '');
						return NextResponse.redirect(playerUrl);
					}

					// If all else fails, redirect to original URL
					return NextResponse.redirect(url);
				} catch (error) {
					console.error('Facebook video error:', error);
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
