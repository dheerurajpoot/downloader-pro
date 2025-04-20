import Link from "next/link"
import { Download, Github, Twitter, Facebook, Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="py-8 green-gradient text-white">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-lg font-bold text-white">Social Media Downloader</span>
            </Link>
            <p className="mt-4 text-green-100">
              Download videos and images from your favorite social media platforms quickly and easily.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-green-100 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="#features" className="text-green-100 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-to-use" className="text-green-100 hover:text-white transition-colors">
                  How to Use
                </Link>
              </li>
              <li>
                <Link href="#faq" className="text-green-100 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-green-100 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-green-100 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-green-100 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-green-100 hover:text-white transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Connect With Us</h3>
            <div className="flex space-x-4">
              <Link href="#" className="text-green-100 hover:text-white transition-colors">
                <Twitter className="w-6 h-6" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-green-100 hover:text-white transition-colors">
                <Facebook className="w-6 h-6" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-green-100 hover:text-white transition-colors">
                <Instagram className="w-6 h-6" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-green-100 hover:text-white transition-colors">
                <Github className="w-6 h-6" />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
            <div className="mt-4">
              <Link
                href="/contact"
                className="inline-block px-4 py-2 mt-2 text-sm font-medium text-green-800 bg-white rounded-md hover:bg-green-100 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 text-center border-t border-green-600">
          <p className="text-green-100">
            &copy; {new Date().getFullYear()} Social Media Downloader. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
