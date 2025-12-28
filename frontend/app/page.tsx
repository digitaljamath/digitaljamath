import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Check, Shield, Users, Wallet, ArrowRight,
  HomeIcon, FileText, Bell, ClipboardCheck, Heart,

  BarChart3, Settings, Smartphone, Lock, Globe,
  CreditCard, UserCheck, MessageSquare, Calendar
} from "lucide-react";
import { FAQSection } from "@/components/LandingComponents";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const features = [
  {
    icon: Users,
    title: "Jamath Census (Digital Register)",
    description: "Complete household and member database with socio-economic profiling, family relationships, skills tracking, and special needs documentation.",
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  {
    icon: Wallet,
    title: "Baitul Maal (Finance)",
    description: "Strict fund silos for Zakat, Sadaqah, and operational funds. Never mix sacred funds with utility bills. Full audit trail.",
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    icon: Heart,
    title: "Welfare (Khidmat)",
    description: "Identify eligible families for Zakat distribution, medical aid, education support, and emergency assistance using data-driven scoring.",
    color: "text-red-600",
    bgColor: "bg-red-100"
  },
  {
    icon: ClipboardCheck,
    title: "Surveys (Tahqeeq)",
    description: "Build custom surveys to collect community feedback, conduct needs assessments, and verify welfare eligibility.",
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    icon: CreditCard,
    title: "Membership Subscriptions",
    description: "Auto-generate membership IDs, track annual fees, send payment reminders, and generate digital receipts.",
    color: "text-amber-600",
    bgColor: "bg-amber-100"
  },
  {
    icon: Bell,
    title: "Announcements",
    description: "Broadcast important notices to all members via SMS, WhatsApp, or in-app notifications. Ramadan timings, Eid prayers, community events.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100"
  },
  {
    icon: Smartphone,
    title: "Member Portal",
    description: "OTP-based mobile login for members to view their digital ID card, payment history, receipts, and submit service requests.",
    color: "text-cyan-600",
    bgColor: "bg-cyan-100"
  },
  {
    icon: FileText,
    title: "Service Requests",
    description: "Members can request certificates (Nikah, Birth, Death), character references, or any administrative documents online.",
    color: "text-pink-600",
    bgColor: "bg-pink-100"
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Visual dashboards showing member demographics, financial summaries, welfare distribution, and collection trends.",
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  },
  {
    icon: Shield,
    title: "AI Audit Guard (Basira)",
    description: "Real-time transaction monitoring to detect anomalies, ensure compliance, and prevent fund misuse. FCRA-ready.",
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    icon: UserCheck,
    title: "Staff Management (Zimmedar)",
    description: "Role-based access control for committee members, treasurers, and volunteers. Full audit log of all actions.",
    color: "text-teal-600",
    bgColor: "bg-teal-100"
  },
  {
    icon: Globe,
    title: "Multi-Tenant Architecture",
    description: "Each masjid gets its own fully isolated database for complete data seclusion. Cloud-hosted or self-host on your own servers—you own your data.",

    color: "text-violet-600",
    bgColor: "bg-violet-100"
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mb-4">
                  The Digital Ummah Foundation
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  The Open Source ERP for <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Modern Masjids</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Manage Fund Silos (Zakat/Sadaqah), Member Census, and Welfare Grants with strict audit compliance.
                  Powered by AI to ensure trust.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Link href="/auth/register">Get Started Free</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="https://github.com/azzaxp/Project-Mizan" target="_blank">
                    View on GitHub
                  </Link>
                </Button>
              </div>

              {/* Demo Access Card */}
              <div className="mt-8 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg max-w-md">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Try the Live Demo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Username: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">demo</code> |
                      Password: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">demo123</code>
                    </p>
                  </div>
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                    <Link href="http://demo.localhost:3000/auth/login">
                      Access Demo →
                    </Link>
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="w-full py-12 border-b bg-white dark:bg-gray-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-600">12+</div>
                <div className="text-sm text-gray-500 mt-1">Core Modules</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-green-600">100%</div>
                <div className="text-sm text-gray-500 mt-1">Open Source</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-purple-600">Multi</div>
                <div className="text-sm text-gray-500 mt-1">Language Ready</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-amber-600">₹0</div>
                <div className="text-sm text-gray-500 mt-1">Self-Host Free</div>
              </div>
            </div>
          </div>
        </section>

        {/* All Features Section */}
        <section id="features" className="w-full py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                Everything Your Masjid Needs
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-lg">
                A comprehensive platform designed specifically for Islamic community management, built with Shariah compliance in mind.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {features.map((feature, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white">
                  <CardHeader>
                    <div className={`${feature.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Core Features Highlight */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-6">
                  Built for Trust & Transparency
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Strict Fund Isolation</h3>
                      <p className="text-blue-100 text-sm">Zakat, Sadaqah, and operational funds are completely separated. Invalid transactions are automatically blocked.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Complete Audit Trail</h3>
                      <p className="text-blue-100 text-sm">Every transaction, every edit, every action is logged. Perfect for annual audits and regulatory compliance.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Role-Based Access</h3>
                      <p className="text-blue-100 text-sm">Treasurers only see finances. Survey teams only see surveys. Members only see their own data.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">100%</div>
                  <div className="text-xl mb-4">Shariah Compliant</div>
                  <p className="text-blue-100 text-sm">
                    Designed in consultation with Islamic scholars to ensure all financial operations follow Fiqh guidelines for Zakat, Sadaqah, and Waqf management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Simple Pricing</h2>
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12 max-w-5xl mx-auto">
              {/* Free Tier */}
              <Card>
                <CardHeader>
                  <CardTitle>Community</CardTitle>
                  <CardDescription>For small Masjids running manually.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-4">Free</div>
                  <ul className="space-y-2">
                    <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Self-Hosted</li>
                    <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Unlimited Members</li>
                    <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> All Core Features</li>
                    <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Community Support</li>
                  </ul>
                  <Button className="w-full mt-6" variant="outline" asChild>
                    <Link href="https://github.com/azzaxp/Project-Mizan" target="_blank">Host Yourself</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* SaaS Tier */}
              <Card className="border-blue-600 border-2 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                  Most Popular
                </div>
                <CardHeader>
                  <CardTitle>Cloud Managed</CardTitle>
                  <CardDescription>We handle the servers and security.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-4">₹999<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  <ul className="space-y-2">
                    <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Daily Backups</li>
                    <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> AI Audit Included</li>
                    <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> SMS Notifications</li>
                    <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Priority Support</li>
                  </ul>
                  <Button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600">Start 14-Day Trial</Button>
                </CardContent>
              </Card>

              {/* Enterprise */}
              <Card>
                <CardHeader>
                  <CardTitle>Federation</CardTitle>
                  <CardDescription>For State Waqf Boards regulating multiple Masjids.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-4">Custom</div>
                  <ul className="space-y-2">
                    <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Multi-Tenant Dashboard</li>
                    <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Custom Compliance Rules</li>
                    <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> On-Premise Deployment</li>
                    <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Dedicated Account Manager</li>
                  </ul>
                  <Button className="w-full mt-6" variant="outline">Contact Sales</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection />

        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
              Ready to Modernize Your Masjid?
            </h2>
            <p className="mx-auto max-w-[600px] text-blue-100 mb-8">
              Join the growing community of masjids using Project Mizan for transparent, efficient community management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
                <Link href="/auth/register">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-blue-600 transition-colors" asChild>
                <Link href="/about">Learn More</Link>
              </Button>

            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
