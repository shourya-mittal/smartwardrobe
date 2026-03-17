import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  CloudIcon,
  SparklesIcon,
  ShirtIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "lucide-react"

const features = [
  {
    icon: ShirtIcon,
    title: "Digital Wardrobe",
    description:
      "Upload photos of your clothes and organize them by type, color, and season.",
  },
  {
    icon: CloudIcon,
    title: "Weather Integration",
    description:
      "Real-time weather data ensures your outfit suggestions are always appropriate.",
  },
  {
    icon: SparklesIcon,
    title: "AI Styling",
    description:
      "Advanced AI analyzes your wardrobe and suggests perfect outfit combinations.",
  },
  {
    icon: CalendarIcon,
    title: "Occasion-Based",
    description:
      "From casual to formal, get suggestions tailored to any occasion.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg
                className="h-4 w-4 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <span className="font-serif font-semibold text-lg">SmartWardrobe</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-balance">
              Your AI-Powered Wardrobe Assistant
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Never wonder what to wear again. SmartWardrobe uses artificial
              intelligence to suggest perfect outfits based on your clothes,
              the weather, and the occasion.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Start Free
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign in to your account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold">
              Everything you need to dress smart
            </h2>
            <p className="mt-3 text-muted-foreground">
              Powerful features that make outfit planning effortless
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold">How it works</h2>
            <p className="mt-3 text-muted-foreground">
              Three simple steps to your perfect outfit
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Upload Your Clothes",
                description:
                  "Take photos of your wardrobe and upload them. Tag each item with type, color, and season.",
              },
              {
                step: "2",
                title: "Set Your Occasion",
                description:
                  "Tell us where you're going - work, a date, the gym, or just running errands.",
              },
              {
                step: "3",
                title: "Get AI Suggestions",
                description:
                  "Our AI considers the weather and your preferences to suggest the perfect outfit.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl font-bold mb-4">
            Ready to revolutionize your wardrobe?
          </h2>
          <p className="mb-8 opacity-90 max-w-xl mx-auto">
            Join SmartWardrobe today and let AI help you look your best every
            day, no matter the weather or occasion.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              Get Started for Free
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <svg
                className="h-3 w-3 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <span className="font-serif text-sm">SmartWardrobe</span>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-powered outfit planning for the modern wardrobe
          </p>
        </div>
      </footer>
    </div>
  )
}
