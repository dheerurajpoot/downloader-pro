"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Download, Menu, X } from "lucide-react"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "py-2 bg-white shadow-md" : "py-4 bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between px-4 mx-auto max-w-7xl">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full green-gradient flex items-center justify-center">
            <Download className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-green-800">Social Media Downloader</span>
        </Link>

        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-green-800">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        <nav
          className={`${
            isMenuOpen
              ? "absolute top-full left-0 right-0 flex flex-col items-center space-y-4 py-4 bg-white shadow-md md:relative md:top-auto md:flex-row md:space-y-0 md:space-x-6 md:py-0 md:shadow-none"
              : "hidden md:flex md:space-x-6"
          }`}
        >
          <Link href="/" className="text-green-700 hover:text-green-500 font-medium">
            Home
          </Link>
          <Link href="#features" className="text-green-700 hover:text-green-500 font-medium">
            Features
          </Link>
          <Link href="#how-to-use" className="text-green-700 hover:text-green-500 font-medium">
            How to Use
          </Link>
          <Link href="#faq" className="text-green-700 hover:text-green-500 font-medium">
            FAQ
          </Link>
          <Link href="/about" className="text-green-700 hover:text-green-500 font-medium">
            About
          </Link>
          <Link href="/contact" className="text-green-700 hover:text-green-500 font-medium">
            Contact
          </Link>
        </nav>

        <Button className="hidden md:inline-flex green-gradient hover:opacity-90 transition-opacity">
          Get Started
        </Button>
      </div>
    </header>
  )
}
