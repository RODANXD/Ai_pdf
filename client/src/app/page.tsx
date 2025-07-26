import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, FileText, MessageSquare, Search, Users, Zap } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Research AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Unlock the Power of Your Research Papers</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Upload PDFs, ask questions, get AI-powered summaries, and visualize knowledge graphs. Transform how you
            interact with academic research.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth">
              <Button size="lg" className="px-8">
                Start Analyzing
              </Button>
            </Link>
            {/* <Link href="/demo">
              <Button size="lg" variant="outline" className="px-8 bg-transparent">
                View Demo
              </Button>
            </Link> */}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>PDF Analysis</CardTitle>
                <CardDescription>Upload research papers and extract insights with advanced AI parsing</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Smart Q&A</CardTitle>
                <CardDescription>Ask questions about your papers and get contextual AI-powered answers</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Search className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>Vector Search</CardTitle>
                <CardDescription>
                  Find relevant information across all your documents with semantic search
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-yellow-600 mb-2" />
                <CardTitle>Voice Input</CardTitle>
                <CardDescription>Ask questions using voice input with Whisper AI transcription</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-10 w-10 text-red-600 mb-2" />
                <CardTitle>Knowledge Graphs</CardTitle>
                <CardDescription>Visualize relationships and entities from your research papers</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-indigo-600 mb-2" />
                <CardTitle>Collaboration</CardTitle>
                <CardDescription>Share insights and collaborate with team members in real-time</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Research?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of researchers already using AI to accelerate their work
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="px-8">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="h-6 w-6" />
            <span className="text-lg font-semibold">Research AI</span>
          </div>
          <p className="text-gray-400">© 2024 Research AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
