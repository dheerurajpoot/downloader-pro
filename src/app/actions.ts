"use server"

import { createHash } from "crypto"

// Helper function to create a hash of the URL for file naming
function createUrlHash(url: string): string {
  return createHash("md5").update(url).digest("hex")
}

// Helper function to extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[7].length === 11 ? match[7] : null
}

// Helper function to validate YouTube URL
function validateYouTubeUrl(url: string): boolean {
  const videoId = extractYouTubeVideoId(url)
  return videoId !== null
}

export async function downloadContent(url: string) {
  try {
    // Validate URL
    if (!url) {
      return { success: false, message: "Please provide a URL" }
    }

    // Check URL type
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return await handleYouTube(url)
    } else if (url.includes("instagram.com")) {
      return await handleInstagram(url)
    } else if (url.includes("facebook.com") || url.includes("fb.com")) {
      return await handleFacebook(url)
    } else {
      return { success: false, message: "Unsupported URL. Please try a YouTube, Instagram, or Facebook URL." }
    }
  } catch (error) {
    console.error("Error downloading content:", error)
    return { success: false, message: "Failed to download content. Please try again." }
  }
}

async function handleYouTube(url: string) {
  try {
    // Validate YouTube URL
    if (!validateYouTubeUrl(url)) {
      return { success: false, message: "Invalid YouTube URL" }
    }

    const videoId = extractYouTubeVideoId(url)

    // Get basic video info without using ytdl-core
    const title = `YouTube Video (ID: ${videoId})`
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

    return {
      success: true,
      message: "YouTube video processed successfully",
      downloadUrl: `/api/proxy?url=${encodeURIComponent(url)}&type=youtube`,
      type: "Video",
      title,
      thumbnail,
    }
  } catch (error) {
    console.error("Error handling YouTube:", error)
    return { success: false, message: "Failed to process YouTube video. Please try again." }
  }
}

async function handleInstagram(url: string) {
  try {
    // Check if it's a reel, post, or profile
    if (url.includes("/reel/")) {
      // Handle Instagram reel
      return {
        success: true,
        message: "Instagram reel processed successfully",
        downloadUrl: `/api/proxy?url=${encodeURIComponent(url)}&type=reel`,
        type: "Reel",
        title: "Instagram Reel",
        // We can't easily get the thumbnail without processing the page
        thumbnail: "/placeholder.svg?height=300&width=500",
      }
    } else if (url.includes("/p/")) {
      // Handle Instagram post (photo/video)
      return {
        success: true,
        message: "Instagram post processed successfully",
        downloadUrl: `/api/proxy?url=${encodeURIComponent(url)}&type=post`,
        type: "Post",
        title: "Instagram Post",
        // We can't easily get the thumbnail without processing the page
        thumbnail: "/placeholder.svg?height=300&width=500",
      }
    } else {
      // Assume it's a profile
      const username = url.split("instagram.com/")[1]?.split("/")[0] || "user"
      return {
        success: true,
        message: "Instagram profile photo processed successfully",
        downloadUrl: `/api/proxy?url=${encodeURIComponent(url)}&type=profile`,
        type: "Profile Photo",
        title: `Profile Photo: @${username}`,
        // We can't easily get the thumbnail without processing the page
        thumbnail: "/placeholder.svg?height=300&width=500",
      }
    }
  } catch (error) {
    console.error("Error handling Instagram:", error)
    return { success: false, message: "Failed to process Instagram content. Please try again." }
  }
}

async function handleFacebook(url: string) {
  try {
    return {
      success: true,
      message: "Facebook video processed successfully",
      downloadUrl: `/api/proxy?url=${encodeURIComponent(url)}&type=facebook`,
      type: "Video",
      title: "Facebook Video",
      // We can't easily get the thumbnail without processing the page
      thumbnail: "/placeholder.svg?height=300&width=500",
    }
  } catch (error) {
    console.error("Error handling Facebook:", error)
    return { success: false, message: "Failed to process Facebook content. Please try again." }
  }
}
