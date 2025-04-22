import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const url = request.nextUrl.searchParams.get("url");
		if (!url) {
			return new NextResponse("Missing URL parameter", { status: 400 });
		}

		const imageResponse = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				"Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
				"Referer": "https://www.instagram.com/",
			},
		});

		if (!imageResponse.ok) {
			return new NextResponse("Failed to fetch image", { status: imageResponse.status });
		}

		const contentType = imageResponse.headers.get("content-type");
		const imageBuffer = await imageResponse.arrayBuffer();

		return new NextResponse(imageBuffer, {
			headers: {
				"Content-Type": contentType || "image/jpeg",
				"Cache-Control": "public, max-age=31536000",
			},
		});
	} catch (error) {
		console.error("Image proxy error:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
