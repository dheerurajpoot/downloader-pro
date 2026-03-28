import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, AlertTriangle, FileSignature, ShieldAlert, Ban, Activity, Globe, AlertCircle } from "lucide-react"
import { SITE_NAME } from "@/lib/constant"

export const metadata: Metadata = {
  title: `Disclaimer - ${SITE_NAME}`,
  description: `Disclaimer for ${SITE_NAME}`,
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

export default function Disclaimer() {
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
              <AlertTriangle className="w-7 h-7 text-green-700" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Disclaimer</h1>
          </div>
          <p className="text-base text-gray-500 mt-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Last updated: March 28, 2026
          </p>
        </div>
      </div>

      <div className="container px-4 py-12 mx-auto max-w-4xl">
        <div className="space-y-6">
          <Section icon={FileSignature} title="1. Content Responsibility">
            <p>
              <strong>{SITE_NAME}</strong> is a tool that allows users to download content from various social media
              platforms. We do not host, create, upload, or distribute any of the content that users download through
              our service. We are merely providing a technical service to facilitate the downloading of publicly
              available content.
            </p>
          </Section>

          <Section icon={ShieldAlert} title="2. Copyright and Fair Use">
            <p>
              Our service is intended for users to download content for personal, non-commercial use only, in accordance
              with fair use principles. We strongly encourage users to respect copyright laws and the terms of service
              of the platforms from which they are downloading content.
            </p>
          </Section>

          <Section icon={Ban} title="3. No Liability">
            <p>
              {SITE_NAME} is not responsible for how users utilize the downloaded content. Users are solely
              responsible for ensuring that their use of downloaded content complies with all applicable laws and
              regulations. We do not endorse or encourage copyright infringement or any other illegal activities.
            </p>
          </Section>

          <Section icon={Activity} title="4. Service Availability">
            <p>
              We strive to provide a reliable service, but we cannot guarantee that our service will be available at all
              times or that it will work with all content from all platforms. Social media platforms frequently update
              their systems, which may affect the functionality of our service.
            </p>
          </Section>

          <Section icon={Globe} title="5. Third-Party Content">
            <p>
              We have no control over, and assume no responsibility for, the content, privacy policies, or practices of
              any third-party websites or services. You further acknowledge and agree that we shall not be responsible
              or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in
              connection with the use of or reliance on any such content, goods, or services available on or through any
              such websites or services.
            </p>
          </Section>

          <div className="mt-12 p-8 bg-green-50 rounded-2xl border border-green-100 text-center">
            <h2 className="text-xl font-bold text-green-900 mb-2">Have Questions?</h2>
            <p className="text-green-700 mb-6">If you have any questions about this disclaimer, please contact us through our contact page.</p>
            <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
