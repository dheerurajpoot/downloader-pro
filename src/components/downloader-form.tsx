"use client";

import type React from "react";

import { useState } from "react";
import { downloadContent } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2, LinkIcon, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function DownloaderForm() {
	const [url, setUrl] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<{
		success: boolean;
		message: string;
		downloadUrl?: string;
		type?: string;
		title?: string;
		thumbnail?: string;
		isExternal?: boolean;
	} | null>(null);
	const [downloadStarted, setDownloadStarted] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!url) {
			toast.error("Please enter a URL");
			return;
		}

		setIsLoading(true);
		setResult(null);
		setDownloadStarted(false);

		try {
			const response = await downloadContent(url);
			setResult(response);

			if (response.success) {
				toast.success("Content ready for download!");
			} else {
				toast.error(response.message);
			}
		} catch (error) {
			toast.error("An error occurred. Please try again.");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	}

	const handleDownload = async () => {
		if (!result?.downloadUrl) return;

		try {
			setDownloadStarted(true);
			const response = await fetch(result.downloadUrl);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// Get the filename from the Content-Disposition header
			const contentDisposition = response.headers.get(
				"content-disposition"
			);
			let filename = "download";
			if (contentDisposition) {
				const matches = /filename="([^"]+)"/.exec(contentDisposition);
				if (matches && matches[1]) {
					filename = matches[1];
				}
			}

			// Create a blob from the stream
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);

			// Create a temporary link and click it
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			// Clean up the blob URL
			window.URL.revokeObjectURL(url);
			toast.success("Download completed!");
		} catch (error) {
			console.error("Download error:", error);
			toast.error("Failed to download. Please try again.");
		} finally {
			setDownloadStarted(false);
		}
		// 	return;
		// }

		setDownloadStarted(true);

		try {
			// Trigger the download by making a request to the proxy endpoint
			const response = await fetch(result.downloadUrl);

			if (!response.ok) {
				throw new Error(`Download failed: ${response.statusText}`);
			}

			const data = await response.json();

			if (data.success && data.downloadUrl) {
				// Create a temporary anchor element to trigger the download
				const a = document.createElement("a");
				a.href = data.downloadUrl;
				a.download = data.fileName || "download";
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);

				toast.success("Download started!");
			} else {
				throw new Error(data.error || "Download failed");
			}
		} catch (error) {
			console.error("Download error:", error);
		} finally {
			setDownloadStarted(false);
		}
	};

	return (
		<div className='w-full max-w-3xl mx-auto'>
			<Card className='border-green-200 shadow-lg overflow-hidden'>
				<div className='p-1 green-gradient'></div>
				<CardContent className='pt-6 p-6'>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='flex flex-col gap-3 sm:flex-row'>
							<div className='relative flex-1'>
								<div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
									<LinkIcon className='w-5 h-5 text-green-500' />
								</div>
								<Input
									type='text'
									placeholder='Paste URL from YouTube, Instagram, Facebook...'
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									className='pl-10 border-green-200 focus:border-green-500 focus:ring-green-500 bg-green-50'
								/>
							</div>
							<Button
								type='submit'
								disabled={isLoading || !url}
								className='green-gradient hover:opacity-90 transition-opacity'>
								{isLoading ? (
									<>
										<Loader2 className='w-4 h-4 mr-2 animate-spin' />
										Processing...
									</>
								) : (
									<>
										<Download className='w-4 h-4 mr-2' />
										Download
									</>
								)}
							</Button>
						</div>
					</form>

					{result && (
						<div className='mt-6 overflow-hidden bg-white rounded-lg border border-green-100 green-glow'>
							<div className='p-4 space-y-4'>
								{result.success ? (
									<>
										{result.thumbnail && (
											<div className='flex justify-center'>
												<img
													src={
														result.thumbnail ||
														"/placeholder.svg?height=300&width=500"
													}
													alt={
														result.title ||
														"Thumbnail"
													}
													className='object-cover rounded-lg max-h-[600px] border border-green-100'
												/>
											</div>
										)}

										<h3 className='text-lg font-medium text-green-800'>
											{result.title ||
												"Your content is ready!"}
										</h3>

										<div className='flex flex-col gap-2 sm:flex-row'>
											<Button
												onClick={handleDownload}
												disabled={downloadStarted}
												className='w-full green-gradient hover:opacity-90 transition-opacity flex items-center justify-center'>
												{downloadStarted ? (
													<>
														<Loader2 className='w-4 h-4 mr-2 animate-spin' />
														Starting Download...
													</>
												) : (
													<>
														<Download className='w-4 h-4 mr-2' />
														Download{" "}
														{result.type ||
															"Content"}
													</>
												)}
											</Button>
										</div>

										{result.isExternal && (
											<div className='p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800'>
												<p>
													<strong>Note:</strong> For
													YouTube videos, we&apos;ll
													open the video in a new tab.
													You can use browser
													extensions or online
													services to download the
													video.
												</p>
											</div>
										)}
									</>
								) : (
									<div className='flex items-center p-4 text-red-800 bg-red-50 rounded-lg'>
										<AlertCircle className='w-5 h-5 mr-2 text-red-600' />
										<p>
											{result.message ||
												"An error occurred. Please try again."}
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					<div className='mt-4 text-sm text-green-700 text-center'>
						<p>
							By using our service, you agree to our{" "}
							<a
								href='/terms'
								className='text-green-600 hover:underline'>
								Terms of Service
							</a>{" "}
							and{" "}
							<a
								href='/privacy'
								className='text-green-600 hover:underline'>
								Privacy Policy
							</a>
							.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
