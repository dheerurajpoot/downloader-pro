import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Disclaimer - Social Media Downloader",
  description: "Disclaimer for Social Media Downloader",
}

export default function Disclaimer() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center mb-6 text-green-600 hover:text-green-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="p-8 bg-white rounded-xl shadow-md">
          <h1 className="mb-6 text-3xl font-bold text-green-800">Disclaimer</h1>

          <div className="prose prose-green max-w-none">
            <p className="text-gray-700">Last updated: April 20, 2023</p>

            <h2>1. Content Responsibility</h2>
            <p>
              Social Media Downloader is a tool that allows users to download content from various social media
              platforms. We do not host, create, upload, or distribute any of the content that users download through
              our service. We are merely providing a technical service to facilitate the downloading of publicly
              available content.
            </p>

            <h2>2. Copyright and Fair Use</h2>
            <p>
              Our service is intended for users to download content for personal, non-commercial use only, in accordance
              with fair use principles. We strongly encourage users to respect copyright laws and the terms of service
              of the platforms from which they are downloading content.
            </p>

            <h2>3. No Liability</h2>
            <p>
              Social Media Downloader is not responsible for how users utilize the downloaded content. Users are solely
              responsible for ensuring that their use of downloaded content complies with all applicable laws and
              regulations. We do not endorse or encourage copyright infringement or any other illegal activities.
            </p>

            <h2>4. Service Availability</h2>
            <p>
              We strive to provide a reliable service, but we cannot guarantee that our service will be available at all
              times or that it will work with all content from all platforms. Social media platforms frequently update
              their systems, which may affect the functionality of our service.
            </p>

            <h2>5. Third-Party Content</h2>
            <p>
              We have no control over, and assume no responsibility for, the content, privacy policies, or practices of
              any third-party websites or services. You further acknowledge and agree that we shall not be responsible
              or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in
              connection with the use of or reliance on any such content, goods, or services available on or through any
              such websites or services.
            </p>

            <h2>6. Contact Us</h2>
            <p>If you have any questions about this disclaimer, please contact us through our contact page.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
