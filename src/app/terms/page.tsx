import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Book, Scale, ShieldAlert, FileText, Settings, Key, AlertCircle } from "lucide-react"
import { SITE_NAME } from "@/lib/constant"

export const metadata: Metadata = {
  title: `Terms of Service - ${SITE_NAME}`,
  description: `Terms of Service for ${SITE_NAME}`,
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8 bg-white rounded-2xl shadow-sm border border-gray-100/50 transition-all hover:shadow-md">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 text-green-600">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
        <div className="prose prose-green prose-sm sm:prose-base text-gray-600 max-w-none">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="bg-white border-b border-gray-200/60">
        <div className="container px-4 py-12 mx-auto max-w-4xl sm:py-16">
          <Link href="/" className="inline-flex items-center mb-8 text-sm font-medium text-gray-500 transition-colors hover:text-green-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 border border-green-100 shadow-inner">
              <FileText className="w-7 h-7 text-green-700" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Terms of Service</h1>
          </div>
          <p className="text-base text-gray-500 mt-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Last updated: March 28, 2026
          </p>
        </div>
      </div>

      <div className="container px-4 py-12 mx-auto max-w-4xl">
        <div className="space-y-6">
          <Section icon={Book} title="1. Introduction">
            <p>
              Welcome to <strong>{SITE_NAME}</strong>. These Terms of Service govern your use of our website and services. By
              accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the
              terms, you may not access the service.
            </p>
          </Section>

          <Section icon={Settings} title="2. Use of Service">
            <p>
              Our service allows you to download content from various social media platforms. You are responsible for
              ensuring that your use of our service complies with all applicable laws and the terms of service of the
              platforms from which you are downloading content.
            </p>
            <ul className="mt-2 space-y-1">
              <li>You must not use the website in any way that causes, or may cause, damage to the website.</li>
              <li>You are solely responsible for all content you download.</li>
            </ul>
          </Section>

          <Section icon={Scale} title="3. Intellectual Property">
            <p>
              Our service is designed to help you download content for personal use only. We do not claim ownership of
              the content you download. However, you must respect the intellectual property rights of others.
            </p>
            <p className="mt-2 text-red-600/90 font-medium">
               Downloading content for commercial use without proper authorization may violate copyright laws.
            </p>
          </Section>

          <Section icon={ShieldAlert} title="4. Limitations">
            <p>
              In no event shall {SITE_NAME} be liable for any damages (including, without limitation,
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability
              to use the materials on our website, even if we or an authorized representative has been notified orally
              or in writing of the possibility of such damage.
            </p>
          </Section>

          <Section icon={Key} title="5. Changes to Terms">
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What
              constitutes a material change will be determined at our sole discretion. By continuing to access or use
              our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </Section>

          <div className="mt-12 p-8 bg-green-50 rounded-2xl border border-green-100 text-center">
            <h2 className="text-xl font-bold text-green-900 mb-2">Have Questions?</h2>
            <p className="text-green-700 mb-6">If you have any questions about these Terms, feel free to reach out to us.</p>
            <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
