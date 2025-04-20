import { type NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// Helper function to create a hash of the URL for file naming
function createUrlHash(url: string): string {
  return createHash("md5").update(url).digest("hex")
}

// Helper function to ensure the downloads directory exists
async function ensureDownloadsDir() {
  const downloadsDir = join(process.cwd(), "public", "downloads")

  if (!existsSync(downloadsDir)) {
    await mkdir(downloadsDir, { recursive: true })
  }

  return downloadsDir
}

// Helper function to extract Instagram media URL from page HTML
async function extractInstagramMediaUrl(url: string, type: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Instagram page: ${response.statusText}`)
    }

    const html = await response.text()

    // Look for JSON data in the page that contains media URLs
    const dataRegex = /<script type="text\/javascript">window\._sharedData = (.+?);<\/script>/
    const match = html.match(dataRegex)

    if (match && match[1]) {
      const jsonData = JSON.parse(match[1])

      // Navigate through the JSON structure to find media
      const mediaData = jsonData.entry_data?.PostPage?.[0]?.graphql?.shortcode_media

      if (mediaData) {
        if (type === "post" && mediaData.is_video === false) {
          // Return the highest resolution image URL
          return mediaData.display_url
        } else if ((type === "reel" || type === "post") && mediaData.is_video === true) {
          // Return video URL
          return mediaData.video_url
        }
      }

      // For profile pictures
      if (type === "profile") {
        const profileData = jsonData.entry_data?.ProfilePage?.[0]?.graphql?.user
        if (profileData) {
          return profileData.profile_pic_url_hd || profileData.profile_pic_url
        }
      }
    }

    // Alternative method for newer Instagram structure
    const dataRegex2 = /<script type="application\/ld\+json">(.+?)<\/script>/
    const match2 = html.match(dataRegex2)

    if (match2 && match2[1]) {
      try {
        const jsonData = JSON.parse(match2[1])

        if (jsonData.video) {
          return jsonData.video.contentUrl
        } else if (jsonData.image) {
          return Array.isArray(jsonData.image) ? jsonData.image[0].url : jsonData.image.url
        }
      } catch (e) {
        console.error("Error parsing JSON-LD data:", e)
      }
    }

    return null
  } catch (error) {
    console.error("Error extracting Instagram media URL:", error)
    return null
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
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Facebook page: ${response.statusText}`)
    }

    const html = await response.text()

    // Look for HD video URL in the page
    const hdSrcRegex = /hd_src:"([^"]+)"/
    const hdMatch = html.match(hdSrcRegex)

    if (hdMatch && hdMatch[1]) {
      return hdMatch[1]
    }

    // Look for SD video URL as fallback
    const sdSrcRegex = /sd_src:"([^"]+)"/
    const sdMatch = html.match(sdSrcRegex)

    if (sdMatch && sdMatch[1]) {
      return sdMatch[1]
    }

    return null
  } catch (error) {
    console.error("Error extracting Facebook video URL:", error)
    return null
  }
}

// Helper function to extract YouTube video info
async function extractYouTubeInfo(
  url: string,
): Promise<{ videoUrl: string | null; title: string | null; thumbnail: string | null }> {
  try {
    // Use a different approach to get YouTube video info without ytdl-core
    const videoId = extractYouTubeVideoId(url)

    if (!videoId) {
      return { videoUrl: null, title: null, thumbnail: null }
    }

    // Get video info from YouTube oEmbed API
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const oembedResponse = await fetch(oembedUrl)

    if (!oembedResponse.ok) {
      throw new Error(`Failed to fetch YouTube oEmbed data: ${oembedResponse.statusText}`)
    }

    const oembedData = await oembedResponse.json()
    const title = oembedData.title || null
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`

    // For the actual video URL, we'll use a YouTube download service
    // Note: In a production app, you might want to use a more reliable method
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

    return {
      videoUrl,
      title,
      thumbnail,
    }
  } catch (error) {
    console.error("Error extracting YouTube info:", error)
    return { videoUrl: null, title: null, thumbnail: null }
  }
}

// Helper function to extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[7].length === 11 ? match[7] : null
}

// Helper function to download file from URL
async function downloadFileFromUrl(url: string, filePath: string): Promise<boolean> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    await writeFile(filePath, Buffer.from(buffer))
    return true
  } catch (error) {
    console.error("Error downloading file:", error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get("url")
    const type = searchParams.get("type")

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Create a unique filename based on the URL and type
    const urlHash = createUrlHash(url)
    let fileName = ""
    let contentType = ""
    let downloadPath = ""
    let title = ""
    let thumbnail = ""

    const downloadsDir = await ensureDownloadsDir()

    switch (type) {
      case "youtube": {
        // Extract YouTube video info
        const { videoUrl, title: videoTitle, thumbnail: videoThumbnail } = await extractYouTubeInfo(url)

        if (!videoUrl) {
          return NextResponse.json({ error: "Could not extract YouTube video info" }, { status: 500 })
        }

        // For YouTube, we'll return the video info but not actually download it
        // Instead, we'll provide a direct link to the video
        const videoId = extractYouTubeVideoId(url)
        fileName = `youtube-${videoId || urlHash}.mp4`
        contentType = "video/mp4"
        downloadPath = `https://www.youtube.com/watch?v=${videoId}`
        title = videoTitle || "YouTube Video"
        thumbnail = videoThumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

        return NextResponse.json({
          success: true,
          downloadUrl: downloadPath,
          fileName,
          contentType,
          title,
          thumbnail,
          isExternal: true,
        })
      }

      case "reel": {
        fileName = `instagram-reel-${urlHash}.mp4`
        contentType = "video/mp4"
        const filePath = join(downloadsDir, fileName)

        // Check if file already exists to avoid re-downloading
        if (!existsSync(filePath)) {
          // Extract the actual media URL from Instagram
          const mediaUrl = await extractInstagramMediaUrl(url, "reel")

          if (!mediaUrl) {
            return NextResponse.json({ error: "Could not extract Instagram reel URL" }, { status: 500 })
          }

          // Download the file
          const success = await downloadFileFromUrl(mediaUrl, filePath)

          if (!success) {
            return NextResponse.json({ error: "Failed to download Instagram reel" }, { status: 500 })
          }
        }

        downloadPath = `/downloads/${fileName}`
        break
      }

      case "post": {
        // Determine if it's a video or image post
        const mediaUrl = await extractInstagramMediaUrl(url, "post")

        if (!mediaUrl) {
          return NextResponse.json({ error: "Could not extract Instagram post URL" }, { status: 500 })
        }

        // Check if it's a video or image based on URL
        const isVideo = mediaUrl.includes(".mp4") || mediaUrl.includes("/video/")

        if (isVideo) {
          fileName = `instagram-post-${urlHash}.mp4`
          contentType = "video/mp4"
        } else {
          fileName = `instagram-post-${urlHash}.jpg`
          contentType = "image/jpeg"
        }

        const filePath = join(downloadsDir, fileName)

        // Check if file already exists to avoid re-downloading
        if (!existsSync(filePath)) {
          // Download the file
          const success = await downloadFileFromUrl(mediaUrl, filePath)

          if (!success) {
            return NextResponse.json({ error: "Failed to download Instagram post" }, { status: 500 })
          }
        }

        downloadPath = `/downloads/${fileName}`
        break
      }

      case "profile": {
        fileName = `instagram-profile-${urlHash}.jpg`
        contentType = "image/jpeg"
        const filePath = join(downloadsDir, fileName)

        // Check if file already exists to avoid re-downloading
        if (!existsSync(filePath)) {
          // Extract the profile picture URL
          const mediaUrl = await extractInstagramMediaUrl(url, "profile")

          if (!mediaUrl) {
            return NextResponse.json({ error: "Could not extract Instagram profile picture URL" }, { status: 500 })
          }

          // Download the file
          const success = await downloadFileFromUrl(mediaUrl, filePath)

          if (!success) {
            return NextResponse.json({ error: "Failed to download Instagram profile picture" }, { status: 500 })
          }
        }

        downloadPath = `/downloads/${fileName}`
        break
      }

      case "facebook": {
        fileName = `facebook-video-${urlHash}.mp4`
        contentType = "video/mp4"
        const filePath = join(downloadsDir, fileName)

        // Check if file already exists to avoid re-downloading
        if (!existsSync(filePath)) {
          // Extract the video URL from Facebook
          const videoUrl = await extractFacebookVideoUrl(url)

          if (!videoUrl) {
            return NextResponse.json({ error: "Could not extract Facebook video URL" }, { status: 500 })
          }

          // Download the file
          const success = await downloadFileFromUrl(videoUrl, filePath)

          if (!success) {
            return NextResponse.json({ error: "Failed to download Facebook video" }, { status: 500 })
          }
        }

        downloadPath = `/downloads/${fileName}`
        break
      }

      default:
        return NextResponse.json({ error: "Unsupported content type" }, { status: 400 })
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
    })
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
