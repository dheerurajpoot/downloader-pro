import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, Database, Lock, Clock, UserCheck, Mail, AlertCircle } from "lucide-react"
import { SITE_NAME } from "@/lib/constant"

export const metadata: Metadata = {
  title: `Privacy Policy - ${SITE_NAME}`,
  description: `Privacy Policy for ${SITE_NAME}`,
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

export default function PrivacyPolicy() {
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
              <ShieldCheck className="w-7 h-7 text-green-700" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Privacy Policy</h1>
          </div>
          <p className="text-base text-gray-500 mt-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Last updated: March 28, 2026
          </p>
        </div>
      </div>

      <div className="container px-4 py-12 mx-auto max-w-4xl">
        <div className="space-y-6">
          <Section icon={UserCheck} title="1. Introduction">
            <p>
              Welcome to <strong>{SITE_NAME}</strong>. We respect your privacy and are committed to protecting your personal
              data. This privacy policy will inform you about how we look after your personal data when you visit our
              website and tell you about your privacy rights and how the law protects you.
            </p>
          </Section>

          <Section icon={Database} title="2. The Data We Collect About You">
            <p>
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped
              together as follows:
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-green-500 mr-2"></span>
                <span><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-green-500 mr-2"></span>
                <span><strong>Contact Data</strong> includes email address and telephone numbers.</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-green-500 mr-2"></span>
                <span><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-green-500 mr-2"></span>
                <span><strong>Usage Data</strong> includes information about how you use our website, products and services.</span>
              </li>
            </ul>
          </Section>

          <Section icon={Mail} title="3. How We Use Your Personal Data">
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal
              data in the following circumstances:
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-green-500 mr-2"></span>
                <span>Where we need to perform the contract we are about to enter into or have entered into with you.</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-green-500 mr-2"></span>
                <span>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-green-500 mr-2"></span>
                <span>Where we need to comply with a legal obligation.</span>
              </li>
            </ul>
          </Section>

          <Section icon={Lock} title="4. Data Security">
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally
              lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your
              personal data to those employees, agents, contractors and other third parties who have a business need to
              know.
            </p>
          </Section>

          <Section icon={Clock} title="5. Data Retention">
            <p>
              We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we
              collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting or
              reporting requirements.
            </p>
          </Section>

          <Section icon={ShieldCheck} title="6. Your Legal Rights">
            <p>
              Under certain circumstances, you have rights under data protection laws in relation to your personal data,
              including the right to request access, correction, erasure, restriction, transfer, to object to
              processing, to portability of data and (where the lawful ground of processing is consent) to withdraw
              consent.
            </p>
          </Section>

          <div className="mt-12 p-8 bg-green-50 rounded-2xl border border-green-100 text-center">
            <h2 className="text-xl font-bold text-green-900 mb-2">Have Questions?</h2>
            <p className="text-green-700 mb-6">If you have any questions about this privacy policy, feel free to contact us.</p>
            <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
