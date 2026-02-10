"use client";

import type React from "react";
import { useState } from "react";
import { downloadContent } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2, LinkIcon, AlertCircle, Video, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

interface DownloadResult {
	success: boolean;
	message: string;
	downloadUrl?: string;
	type?: string;
	mediaType?: string;
	title?: string;
	thumbnail?: string;
	mediaUrls?: { url: string; type: string; quality: string }[];
	isExternal?: boolean;
}

export default function DownloaderForm() {
	const [url, setUrl] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [result, setResult] = useState<DownloadResult | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!url.trim()) {
			toast.error("Please enter a URL");
			return;
		}

		setIsLoading(true);
		setResult(null);

		try {
			const response = await downloadContent(url.trim());
			setResult(response);

			if (response.success) {
				toast.success("Content ready for download!");
			} else {
				toast.error(response.message);
			}
		} catch {
			toast.error("An error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDownload = async () => {
		if (!result?.downloadUrl) return;

		setIsDownloading(true);

		try {
			// Check if this is an external direct URL (Facebook)
			if (result.isExternal) {
				// For external URLs, open in new tab or use direct download
				const link = document.createElement("a");
				link.href = result.downloadUrl;
				link.target = "_blank";
				link.download = `${result.title?.replace(/[^a-z0-9]/gi, "-") || "download"}.mp4`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				toast.success("Download started!");
				setIsDownloading(false);
				return;
			}

			// For proxied URLs (YouTube, Instagram)
			const response = await fetch(result.downloadUrl);

			if (!response.ok) {
				const contentType = response.headers.get("content-type");
				if (contentType?.includes("application/json")) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Download failed");
				}
				throw new Error(`Download failed: ${response.statusText}`);
			}

			// Get filename from header or use default
			const contentDisposition = response.headers.get("content-disposition");
			let filename = result.title || "download";

			if (contentDisposition) {
				const matches = /filename="([^"]+)"/.exec(contentDisposition);
				if (matches?.[1]) {
					filename = decodeURIComponent(matches[1]);
				}
			} else {
				const contentType = response.headers.get("content-type");
				const extension = contentType?.includes("video") ? ".mp4" : ".jpg";
				filename = filename.replace(/[^a-z0-9]/gi, "-") + extension;
			}

			// Download blob
			const blob = await response.blob();
			const blobUrl = window.URL.createObjectURL(blob);

			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			window.URL.revokeObjectURL(blobUrl);
			toast.success("Download completed!");
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to download";
			toast.error(message);
		} finally {
			setIsDownloading(false);
		}
	};

	const getPreviewUrl = () => {
		if (!result?.mediaUrls?.length) return null;
		return result.mediaUrls[0].url;
	};

	const isVideo = result?.mediaType === "video";
	const previewUrl = getPreviewUrl();

	return (
		<div className="w-full max-w-3xl mx-auto">
			<Card className="border-green-200 shadow-lg overflow-hidden">
				<div className="h-1 bg-gradient-to-r from-green-400 to-green-600" />
				<CardContent className="pt-6 p-6">
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="flex flex-col gap-3 sm:flex-row">
							<div className="relative flex-1">
								<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
									<LinkIcon className="w-5 h-5 text-green-500" />
								</div>
								<Input
									type="url"
									placeholder="Paste YouTube, Instagram, or Facebook URL..."
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500 bg-green-50/50"
								/>
							</div>
							<Button
								type="submit"
								disabled={isLoading || !url.trim()}
								className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
							>
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Processing...
									</>
								) : (
									<>
										<Download className="w-4 h-4 mr-2" />
										Download
									</>
								)}
							</Button>
						</div>
					</form>

					{result && (
						<div className="mt-6 overflow-hidden rounded-lg border border-green-100 shadow-sm">
							{result.success ? (
								<div className="p-4 space-y-4">
									{/* Preview */}
									<div className="flex justify-center bg-gray-50 rounded-lg overflow-hidden">
										{isVideo && previewUrl ? (
											<video
												controls
												preload="metadata"
												className="max-h-[400px] w-full object-contain"
												src={previewUrl}
											/>
										) : result.thumbnail ? (
											<img
												src={result.thumbnail}
												alt={result.title || "Preview"}
												className="max-h-[400px] w-full object-contain"
											/>
										) : (
											<div className="h-48 flex items-center justify-center text-gray-400">
												{isVideo ? (
													<Video className="w-16 h-16" />
												) : (
													<ImageIcon className="w-16 h-16" />
												)}
											</div>
										)}
									</div>

									{/* Title */}
									<div className="text-center">
										<h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
											{result.title || `${result.type} ready for download`}
										</h3>
										<p className="text-sm text-gray-500 mt-1">
											{result.type} • {isVideo ? "Video" : "Image"}
										</p>
									</div>

									{/* Download Button */}
									<Button
										onClick={handleDownload}
										disabled={isDownloading}
										className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
									>
										{isDownloading ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Downloading...
											</>
										) : (
											<>
												<Download className="w-4 h-4 mr-2" />
												Download {result.type}
											</>
										)}
									</Button>
								</div>
							) : (
								<div className="flex items-center p-4 text-red-800 bg-red-50">
									<AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
									<p className="text-sm">{result.message}</p>
								</div>
							)}
						</div>
					)}

					<div className="mt-4 text-xs text-gray-500 text-center">
						By using this service, you agree to our{" "}
						<a href="/terms" className="text-green-600 hover:underline">
							Terms
						</a>{" "}
						and{" "}
						<a href="/privacy" className="text-green-600 hover:underline">
							Privacy Policy
						</a>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
