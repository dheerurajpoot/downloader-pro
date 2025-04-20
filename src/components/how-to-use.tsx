import { Link, Clipboard, Download } from "lucide-react"

export default function HowToUse() {
  const steps = [
    {
      icon: <Link className="w-8 h-8 text-white" />,
      title: "Copy the URL",
      description: "Copy the URL of the video or image you want to download",
    },
    {
      icon: <Clipboard className="w-8 h-8 text-white" />,
      title: "Paste the URL",
      description: "Paste the URL into the input field above",
    },
    {
      icon: <Download className="w-8 h-8 text-white" />,
      title: "Download",
      description: "Click the download button and save your content",
    },
  ]

  return (
    <section className="py-12 green-pattern rounded-xl my-12" id="how-to-use">
      <div className="text-center">
        <h2 className="mb-4 text-3xl font-bold text-green-800">How to Use</h2>
        <p className="max-w-2xl mx-auto mb-12 text-green-700">
          Download your favorite content in just three simple steps
        </p>
      </div>

      <div className="flex flex-col items-center justify-center max-w-4xl mx-auto md:flex-row md:space-x-8">
        {steps.map((step, index) => (
          <div key={index} className="feature-card w-72 mb-6 md:mb-0 relative">
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-green-300"></div>
            )}
            <div className="feature-icon">{step.icon}</div>
            <h3 className="mb-2 text-xl font-semibold text-center text-green-800">
              Step {index + 1}: {step.title}
            </h3>
            <p className="text-center text-green-700">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
