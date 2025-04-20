import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms of Service - Social Media Downloader",
  description: "Terms of Service for Social Media Downloader",
}

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center mb-6 text-green-600 hover:text-green-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="p-8 bg-white rounded-xl shadow-md">
          <h1 className="mb-6 text-3xl font-bold text-green-800">Terms of Service</h1>

          <div className="prose prose-green max-w-none">
            <p className="text-gray-700">Last updated: April 20, 2023</p>

            <h2>1. Introduction</h2>
            <p>
              Welcome to Social Media Downloader. These Terms of Service govern your use of our website and services. By
              accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the
              terms, you may not access the service.
            </p>

            <h2>2. Use of Service</h2>
            <p>
              Our service allows you to download content from various social media platforms. You are responsible for
              ensuring that your use of our service complies with all applicable laws and the terms of service of the
              platforms from which you are downloading content.
            </p>

            <h2>3. Intellectual Property</h2>
            <p>
              Our service is designed to help you download content for personal use only. We do not claim ownership of
              the content you download. However, you must respect the intellectual property rights of others.
              Downloading content for commercial use without proper authorization may violate copyright laws.
            </p>

            <h2>4. Limitations</h2>
            <p>
              In no event shall Social Media Downloader be liable for any damages (including, without limitation,
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability
              to use the materials on our website, even if we or an authorized representative has been notified orally
              or in writing of the possibility of such damage.
            </p>

            <h2>5. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What
              constitutes a material change will be determined at our sole discretion. By continuing to access or use
              our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>

            <h2>6. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us through our contact page.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
