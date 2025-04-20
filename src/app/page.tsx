import type { Metadata } from "next"
import DownloaderForm from "@/components/downloader-form"
import Features from "@/components/features"
import HowToUse from "@/components/how-to-use"
import FAQ from "@/components/faq"
import { ArrowDown } from "lucide-react"

export const metadata: Metadata = {
  title: "Social Media Downloader - Download videos and images from social media",
  description: "Download videos and images from YouTube, Instagram, Facebook and more",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <section className="py-12 text-center relative">
          <div className="absolute inset-0 green-pattern -z-10 opacity-30"></div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-green-800 sm:text-5xl md:text-6xl">
            Social Media{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-green-700">
              Downloader
            </span>
          </h1>
          <p className="max-w-2xl mx-auto mb-8 text-lg text-green-700">
            Download videos and images from YouTube, Instagram, Facebook and more in just a few clicks
          </p>

          <DownloaderForm />

          <div className="mt-16 animate-bounce">
            <ArrowDown className="w-6 h-6 mx-auto text-green-600" />
          </div>
        </section>

        <Features />
        <HowToUse />
        <FAQ />
      </div>
    </main>
  )
}
