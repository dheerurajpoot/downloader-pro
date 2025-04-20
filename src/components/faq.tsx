import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FAQ() {
  const faqs = [
    {
      question: "Is this service free to use?",
      answer:
        "Yes, our service is completely free to use. You can download as many videos and images as you want without any cost.",
    },
    {
      question: "Is it legal to download videos from YouTube and other platforms?",
      answer:
        "Downloading videos for personal use is generally acceptable. However, redistributing copyrighted content without permission is illegal. Please respect copyright laws and the terms of service of the platforms.",
    },
    {
      question: "What is the maximum file size I can download?",
      answer:
        "There is no specific limit on file size, but larger files may take longer to process and download. For very large videos, you might experience longer waiting times.",
    },
    {
      question: "Which platforms are supported?",
      answer:
        "Currently, we support YouTube (videos and shorts), Instagram (reels, photos, and profile pictures), and Facebook videos. We're constantly working to add more platforms.",
    },
    {
      question: "What video quality can I download?",
      answer:
        "We aim to provide the highest quality available. For YouTube, you can typically download videos in HD quality (up to 1080p).",
    },
  ]

  return (
    <section className="py-12">
      <div className="text-center">
        <h2 className="mb-4 text-3xl font-bold text-green-800">Frequently Asked Questions</h2>
        <p className="max-w-2xl mx-auto mb-12 text-green-700">Find answers to common questions about our service</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-green-800 hover:text-green-600">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-green-700">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
