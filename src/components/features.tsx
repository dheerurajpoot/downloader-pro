import { Instagram, Youtube, Facebook, ImageIcon, User, Video } from "lucide-react"

export default function Features() {
  const features = [
    {
      icon: <Youtube className="w-8 h-8 text-white" />,
      title: "YouTube Videos",
      description: "Download any YouTube video in high quality",
    },
    {
      icon: <Video className="w-8 h-8 text-white" />,
      title: "YouTube Shorts",
      description: "Save YouTube Shorts to your device easily",
    },
    {
      icon: <Instagram className="w-8 h-8 text-white" />,
      title: "Instagram Reels",
      description: "Download Instagram Reels in just a few clicks",
    },
    {
      icon: <ImageIcon className="w-8 h-8 text-white" />,
      title: "Instagram Photos",
      description: "Save Instagram photos to your gallery",
    },
    {
      icon: <Facebook className="w-8 h-8 text-white" />,
      title: "Facebook Videos",
      description: "Download videos from Facebook with ease",
    },
    {
      icon: <User className="w-8 h-8 text-white" />,
      title: "Profile Photos",
      description: "Save Instagram profile pictures in full resolution",
    },
  ]

  return (
    <section className="py-12" id="features">
      <div className="text-center">
        <h2 className="mb-4 text-3xl font-bold text-green-800">Features</h2>
        <p className="max-w-2xl mx-auto mb-12 text-green-700">Our tool supports multiple platforms and content types</p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="mb-2 text-xl font-semibold text-center text-green-800">{feature.title}</h3>
            <p className="text-center text-green-700">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
