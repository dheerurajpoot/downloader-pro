import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
	title: "Contact Us - Social Media Downloader",
	description: "Contact Social Media Downloader team",
};

export default function Contact() {
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
						Contact Us
					</h1>
					<p className='text-green-700 max-w-2xl mx-auto'>
						Have questions or feedback? We&apos;d love to hear from
						you. Fill out the form below or use our contact
						information.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
					<Card className='border-green-200 shadow-md overflow-hidden'>
						<div className='p-1 green-gradient'></div>
						<CardContent className='p-6'>
							<h2 className='text-2xl font-semibold text-green-800 mb-6'>
								Send Us a Message
							</h2>

							<form className='space-y-4'>
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<label
											htmlFor='name'
											className='text-sm font-medium text-green-700'>
											Your Name
										</label>
										<Input
											id='name'
											placeholder='John Doe'
											className='border-green-200 focus:border-green-500 focus:ring-green-500'
										/>
									</div>
									<div className='space-y-2'>
										<label
											htmlFor='email'
											className='text-sm font-medium text-green-700'>
											Your Email
										</label>
										<Input
											id='email'
											type='email'
											placeholder='john@example.com'
											className='border-green-200 focus:border-green-500 focus:ring-green-500'
										/>
									</div>
								</div>

								<div className='space-y-2'>
									<label
										htmlFor='subject'
										className='text-sm font-medium text-green-700'>
										Subject
									</label>
									<Input
										id='subject'
										placeholder='How can we help you?'
										className='border-green-200 focus:border-green-500 focus:ring-green-500'
									/>
								</div>

								<div className='space-y-2'>
									<label
										htmlFor='message'
										className='text-sm font-medium text-green-700'>
										Message
									</label>
									<Textarea
										id='message'
										placeholder='Your message here...'
										rows={5}
										className='border-green-200 focus:border-green-500 focus:ring-green-500'
									/>
								</div>

								<Button className='w-full green-gradient hover:opacity-90 transition-opacity'>
									Send Message
								</Button>
							</form>
						</CardContent>
					</Card>

					<div className='space-y-6'>
						<Card className='border-green-200 shadow-md overflow-hidden'>
							<div className='p-1 green-gradient'></div>
							<CardContent className='p-6'>
								<h2 className='text-2xl font-semibold text-green-800 mb-6'>
									Contact Information
								</h2>

								<div className='space-y-4'>
									<div className='flex items-start'>
										<div className='flex-shrink-0 mt-1'>
											<Mail className='w-5 h-5 text-green-600' />
										</div>
										<div className='ml-3'>
											<h3 className='text-sm font-medium text-green-800'>
												Email
											</h3>
											<p className='text-green-700'>
												support@socialmediadownloader.com
											</p>
										</div>
									</div>

									<div className='flex items-start'>
										<div className='flex-shrink-0 mt-1'>
											<Phone className='w-5 h-5 text-green-600' />
										</div>
										<div className='ml-3'>
											<h3 className='text-sm font-medium text-green-800'>
												Phone
											</h3>
											<p className='text-green-700'>
												+1 (555) 123-4567
											</p>
										</div>
									</div>

									<div className='flex items-start'>
										<div className='flex-shrink-0 mt-1'>
											<MapPin className='w-5 h-5 text-green-600' />
										</div>
										<div className='ml-3'>
											<h3 className='text-sm font-medium text-green-800'>
												Address
											</h3>
											<p className='text-green-700'>
												123 Download Street
												<br />
												San Francisco, CA 94107
												<br />
												United States
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className='border-green-200 shadow-md overflow-hidden'>
							<div className='p-1 green-gradient'></div>
							<CardContent className='p-6'>
								<h2 className='text-2xl font-semibold text-green-800 mb-4'>
									Frequently Asked Questions
								</h2>
								<p className='text-green-700 mb-4'>
									Before contacting us, you might find your
									answer in our FAQ section.
								</p>
								<Link
									href='/#faq'
									className='inline-block px-4 py-2 text-sm font-medium text-white rounded-md green-gradient hover:opacity-90 transition-opacity'>
									View FAQ
								</Link>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</main>
	);
}
