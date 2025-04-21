import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, Shield, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
	title: "About Us - Social Media Downloader",
	description: "Learn more about Social Media Downloader",
};

export default function About() {
	return (
		<main className='min-h-screen bg-gradient-to-b from-green-50 to-white'>
			<div className='container px-4 py-8 mx-auto max-w-6xl'>
				<Link
					href='/'
					className='inline-flex items-center mb-6 text-green-600 hover:text-green-700'>
					<ArrowLeft className='w-4 h-4 mr-2' />
					Back to Home
				</Link>

				<div className='text-center mb-12'>
					<h1 className='text-4xl font-bold text-green-800 mb-4'>
						About Us
					</h1>
					<p className='text-green-700 max-w-2xl mx-auto'>
						Learn more about Social Media Downloader and our mission
						to make content downloading simple and accessible.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-12'>
					<div>
						<h2 className='text-2xl font-semibold text-green-800 mb-4'>
							Our Story
						</h2>
						<p className='text-green-700 mb-4'>
							Social Media Downloader was founded in 2023 with a
							simple mission: to make it easy for everyone to
							download and save their favorite content from social
							media platforms.
						</p>
						<p className='text-green-700 mb-4'>
							We recognized that many people wanted to save
							videos, photos, and other content from platforms
							like YouTube, Instagram, and Facebook, but were
							frustrated by complicated processes or unreliable
							tools.
						</p>
						<p className='text-green-700'>
							Our team of developers and designers came together
							to create a solution that is not only powerful and
							reliable but also simple and intuitive to use.
							Today, Social Media Downloader serves thousands of
							users worldwide, helping them save and enjoy their
							favorite content offline.
						</p>
					</div>

					<div className='green-pattern rounded-xl p-8 flex items-center justify-center'>
						<div className='w-24 h-24 rounded-full green-gradient flex items-center justify-center'>
							<Download className='w-12 h-12 text-white' />
						</div>
					</div>
				</div>

				<div className='mb-12'>
					<h2 className='text-2xl font-semibold text-green-800 mb-6 text-center'>
						Our Values
					</h2>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						<Card className='border-green-200 shadow-md overflow-hidden'>
							<div className='p-1 green-gradient'></div>
							<CardContent className='p-6 text-center'>
								<div className='w-16 h-16 rounded-full green-gradient flex items-center justify-center mx-auto mb-4'>
									<Zap className='w-8 h-8 text-white' />
								</div>
								<h3 className='text-xl font-semibold text-green-800 mb-2'>
									Simplicity
								</h3>
								<p className='text-green-700'>
									We believe that technology should be
									accessible to everyone. That&apos;s why
									we&apos;ve designed our tool to be as simple
									and intuitive as possible, requiring no
									technical knowledge to use.
								</p>
							</CardContent>
						</Card>

						<Card className='border-green-200 shadow-md overflow-hidden'>
							<div className='p-1 green-gradient'></div>
							<CardContent className='p-6 text-center'>
								<div className='w-16 h-16 rounded-full green-gradient flex items-center justify-center mx-auto mb-4'>
									<Shield className='w-8 h-8 text-white' />
								</div>
								<h3 className='text-xl font-semibold text-green-800 mb-2'>
									Reliability
								</h3>
								<p className='text-green-700'>
									We understand that you rely on our tool to
									save content that matters to you.
									That&apos;s why we&apos;re committed to
									providing a reliable service that works
									consistently across different platforms.
								</p>
							</CardContent>
						</Card>

						<Card className='border-green-200 shadow-md overflow-hidden'>
							<div className='p-1 green-gradient'></div>
							<CardContent className='p-6 text-center'>
								<div className='w-16 h-16 rounded-full green-gradient flex items-center justify-center mx-auto mb-4'>
									<Download className='w-8 h-8 text-white' />
								</div>
								<h3 className='text-xl font-semibold text-green-800 mb-2'>
									Accessibility
								</h3>
								<p className='text-green-700'>
									We believe that everyone should have access
									to the content they love. Our tool is
									designed to be accessible to users of all
									abilities and backgrounds, with a focus on
									inclusive design.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>

				<div className='mb-12'>
					<h2 className='text-2xl font-semibold text-green-800 mb-6 text-center'>
						Meet Our Team
					</h2>

					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
						{[
							{
								name: "John Doe",
								role: "Founder & CEO",
								image: "/placeholder.svg?height=200&width=200",
							},
							{
								name: "Jane Smith",
								role: "Lead Developer",
								image: "/placeholder.svg?height=200&width=200",
							},
							{
								name: "Michael Johnson",
								role: "UI/UX Designer",
								image: "/placeholder.svg?height=200&width=200",
							},
							{
								name: "Sarah Williams",
								role: "Marketing Manager",
								image: "/placeholder.svg?height=200&width=200",
							},
						].map((member, index) => (
							<Card
								key={index}
								className='border-green-200 shadow-md overflow-hidden'>
								<div className='p-1 green-gradient'></div>
								<CardContent className='p-6 text-center'>
									<img
										src={member.image || "/placeholder.svg"}
										alt={member.name}
										className='w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-green-500'
									/>
									<h3 className='text-lg font-semibold text-green-800'>
										{member.name}
									</h3>
									<p className='text-green-700'>
										{member.role}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				<div className='text-center'>
					<h2 className='text-2xl font-semibold text-green-800 mb-4'>
						Get in Touch
					</h2>
					<p className='text-green-700 max-w-2xl mx-auto mb-6'>
						Have questions or feedback? We&apos;d love to hear from
						you. Contact our team and we&apos;ll get back to you as
						soon as possible.
					</p>
					<Link
						href='/contact'
						className='inline-block px-6 py-3 text-white rounded-md green-gradient hover:opacity-90 transition-opacity'>
						Contact Us
					</Link>
				</div>
			</div>
		</main>
	);
}
