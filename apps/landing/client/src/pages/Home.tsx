import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Shield, Zap, Database, Code2, GitBranch, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Something went wrong. Please try again.");
        return;
      }

      toast.success("You're on the waitlist! We'll be in touch soon.");
      setEmail("");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Context Guardian</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#problem" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              The Problem
            </a>
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}>
              Join Waitlist
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Diagonal Cut */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        
        {/* Diagonal cut overlay */}
        <div 
          className="absolute inset-0 bg-card/50 backdrop-blur-sm" 
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)',
          }}
        />

        <div className="container relative z-10 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
                <Zap className="w-4 h-4" />
                <span>Solving the AI Code Crisis</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Stop Building
                <span className="block text-primary mt-2">Tomorrow's Legacy Code</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                AI coding tools are fast. But they're creating unmaintainable, insecure codebases. 
                Context Guardian gives your AI the context it needs to build production-ready code from day one.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8" onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}>
                  Join the Waitlist
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => document.getElementById('problem')?.scrollIntoView({ behavior: 'smooth' })}>
                  Learn More
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-primary">1-click</div>
                  <div className="text-sm text-muted-foreground">Setup</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">7+</div>
                  <div className="text-sm text-muted-foreground">Libraries supported</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">100%</div>
                  <div className="text-sm text-muted-foreground">Version-aware</div>
                </div>
              </div>
            </div>

            {/* Right: Visual Element */}
            <div className="relative">
              <div className="relative bg-card border border-border rounded-2xl p-6 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="text-muted-foreground">$ guardian init</div>
                    <div className="text-primary">✓ Analyzing dependencies...</div>
                    <div className="text-primary">✓ Detecting patterns...</div>
                    <div className="text-primary">✓ Generating playbook...</div>
                    <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="text-foreground font-semibold mb-2">📋 .guardian.md created</div>
                      <div className="text-muted-foreground text-xs space-y-1">
                        <div>• 47 best practices loaded</div>
                        <div>• 3 critical security advisories</div>
                        <div>• React 18.2.0 patterns detected</div>
                        <div>• Zustand state management found</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section id="problem" className="py-24 bg-card/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span>The AI Velocity Trap</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">
              Fast Code Isn't Always Good Code
            </h2>
            <p className="text-lg text-muted-foreground">
              AI coding assistants like GitHub Copilot and ChatGPT are incredible for speed. 
              But without proper context, they're building technical debt faster than you can ship features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-card border-destructive/20 hover:border-destructive/40 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Context Window Limits</h3>
              <p className="text-muted-foreground">
                AI can't see your entire codebase. It generates code based on incomplete information, 
                leading to inconsistent patterns and architectural drift.
              </p>
            </Card>

            <Card className="p-6 bg-card border-destructive/20 hover:border-destructive/40 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Security Blind Spots</h3>
              <p className="text-muted-foreground">
                AI doesn't know about the latest CVEs or version-specific vulnerabilities. 
                You're shipping code with known security issues.
              </p>
            </Card>

            <Card className="p-6 bg-card border-destructive/20 hover:border-destructive/40 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Best Practices</h3>
              <p className="text-muted-foreground">
                AI generates "working" code, not maintainable code. No adherence to library-specific 
                patterns, no consideration for your project's architecture.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              The Solution: Living, Version-Aware Context
            </h2>
            <p className="text-lg text-muted-foreground">
              Context Guardian automatically generates a living playbook for your project, 
              giving your AI assistant the context it needs to build production-ready code.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 bg-card border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Automated Context Generation</h3>
              <p className="text-muted-foreground mb-4">
                One command analyzes your dependencies, detects your patterns, and generates a comprehensive 
                <code className="px-2 py-1 bg-muted rounded text-sm mx-1">.guardian.md</code> 
                file that your AI reads before every generation.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Detects package manager and extracts all dependencies</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Analyzes codebase for existing patterns and conventions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Generates LLM-agnostic context file (works with any AI tool)</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 bg-card border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Version-Aware Best Practices</h3>
              <p className="text-muted-foreground mb-4">
                Our curated database knows the exact best practices, security advisories, and anti-patterns 
                for your specific library versions—not generic advice.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">React 18.2.0? Get React 18.2.0-specific guidance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Automatic CVE detection and mitigation strategies</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Breaking changes and migration paths highlighted</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 bg-card border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Automatic Updates</h3>
              <p className="text-muted-foreground mb-4">
                Your playbook stays fresh. When you update dependencies, Context Guardian regenerates 
                your context file automatically—no manual maintenance required.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">VS Code extension watches for dependency changes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">CLI syncs in &lt;2 seconds with caching</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Offline mode with bundled fallback database</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 bg-card border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Works With Any AI Tool</h3>
              <p className="text-muted-foreground mb-4">
                Context Guardian generates a standard Markdown file that works with Cursor, Copilot, 
                Cline, Aider, or any AI coding assistant—no vendor lock-in.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Compatible with Cursor's .cursorrules format</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Works with ChatGPT, Claude, and any LLM</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Cross-platform: Mac, Linux, Windows</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="py-24 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <Card className="p-12 bg-card/80 backdrop-blur-sm border-primary/20 shadow-2xl">
              <div className="text-center space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold">
                  Join the Waitlist
                </h2>
                <p className="text-lg text-muted-foreground">
                  Be among the first to experience AI coding with proper guardrails. 
                  We're launching soon with support for the top 100 npm packages.
                </p>

                <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 h-12 text-lg bg-background"
                    required
                  />
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 text-lg px-8 h-12"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Joining..." : "Join Waitlist"}
                  </Button>
                </form>

                <p className="text-sm text-muted-foreground">
                  No spam. Just updates on our launch and early access invites.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold">Context Guardian</span>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; 2026 Context Guardian. Building the future of sustainable AI-assisted development.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
