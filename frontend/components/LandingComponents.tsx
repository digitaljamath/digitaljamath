import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from "next/link";

export function OriginStorySection() {
    return (
        <section id="about" className="w-full py-12 md:py-24 bg-blue-50 dark:bg-blue-900/10">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-4">Restoring the Balance</h2>
                    <div className="max-w-3xl space-y-4 text-left md:text-center text-gray-600 dark:text-gray-300">
                        <p className="text-lg">
                            The word <span className="font-semibold text-blue-600 dark:text-blue-400">Mizan</span> appears in the Quran to describe the cosmic balance that holds the universe together. It is a command to establish weight with justice and not fall short in the balance.
                        </p>
                        <p className="text-lg">
                            For centuries, our Masjids were the centers of this social balance. But today, while the world races forward with AI and Cloud computing, our community institutions are stuck with paper registers and guesswork. The balance has tipped.
                        </p>
                        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Project Mizan is our effort to restore it.
                        </p>
                        <p className="text-lg">
                            We are digitizing the Ummah not to make it &quot;modern,&quot; but to make it effective. By building open-source, audit-ready, and AI-assisted tools, we are giving our community the infrastructure it needs to handle the heavy weight of public trust.
                        </p>
                        <p className="text-lg italic pt-4">
                            &quot;We are building Mizan because good intentions deserve great systems.&quot;
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function TeamSection() {
    return (
        <section id="team" className="w-full py-12 md:py-24 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">The Team</h2>
                <div className="flex flex-col items-center space-y-6 max-w-2xl mx-auto text-center">

                    <div className="relative">
                        <div className="absolute -inset-1 rounded-full bg-linear-to-r from-blue-600 to-purple-600 opacity-75 blur-sm"></div>
                        <Avatar className="h-32 w-32 relative border-4 border-white dark:border-gray-900">
                            <AvatarFallback className="text-2xl bg-gray-200 text-gray-700">AZ</AvatarFallback>
                        </Avatar>
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold">Mohammed Azzan Patni</h3>
                        <p className="text-blue-600 font-medium">Founder & Lead Volunteer</p>
                    </div>

                    <div className="space-y-4 text-gray-600 dark:text-gray-300">
                        <p>
                            <span className="font-semibold">Role:</span> Entrepreneur, Founder & Product Manager
                        </p>
                        <p>
                            <span className="font-semibold">The Vibe:</span> &quot;Building with AI, coding for impact.&quot;
                        </p>
                        <p>
                            Azzan is bootstrapping the Digital Ummah Foundation to bridge the gap between Silicon Valley tech and the local Jamath. He believes the Ummah doesn&apos;t just need more donations; it needs better systems.
                        </p>
                        <p className="text-sm text-gray-500">
                            Current Status: Volunteering part-time on this project and actively seeking Code Contributors who want to turn their GitHub commits into Sadaqah Jariyah.
                        </p>

                        <a
                            href="https://linkedin.com/in/azzaxp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Connect on LinkedIn →
                        </a>
                    </div>

                </div>
            </div>
        </section>
    );
}

export function JoinMovementSection() {
    return (
        <section className="w-full py-12 md:py-24 bg-black text-white">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-6">Your Code can be a Service</h2>
                <p className="mb-8 text-xl text-gray-300 max-w-2xl mx-auto">
                    Project Mizan is 100% Open Source. We are looking for:
                </p>

                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12 text-left">
                    <div className="p-4 border border-gray-800 rounded-lg bg-gray-900/50">
                        <h3 className="font-bold text-lg mb-2 text-green-400">Django Developers</h3>
                        <p className="text-gray-400">To build the compliance engine.</p>
                    </div>
                    <div className="p-4 border border-gray-800 rounded-lg bg-gray-900/50">
                        <h3 className="font-bold text-lg mb-2 text-purple-400">Next.js Wizards</h3>
                        <p className="text-gray-400">To craft accessible UIs for our elders.</p>
                    </div>
                    <div className="p-4 border border-gray-800 rounded-lg bg-gray-900/50">
                        <h3 className="font-bold text-lg mb-2 text-blue-400">AI Enthusiasts</h3>
                        <p className="text-gray-400">To help us train the &quot;Basira&quot; audit models.</p>
                    </div>
                </div>

                <div className="space-y-4 md:space-y-0 md:space-x-4">
                    <Button size="lg" className="bg-white text-black hover:bg-gray-200" asChild>
                        <Link href="https://github.com/azzaxp/Project-Mizan" target="_blank">
                            <Github className="mr-2 h-5 w-5" /> Contribute on GitHub
                        </Link>
                    </Button>
                    {/* <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                Join Our Discord
            </Button> */}
                </div>
                <p className="mt-8 text-gray-400 text-sm">
                    Whether you write code, design UIs, or just understand the problems of a local Masjid, there is a place for you here.
                </p>
            </div>
        </section>
    );
}

export function FAQSection() {
    return (
        <section className="w-full py-12 md:py-24">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="w-full space-y-4">
                    <AccordionItem value="item-1" className="border px-4 rounded-lg">
                        <AccordionTrigger className="text-lg font-medium">Is my data secure?</AccordionTrigger>
                        <AccordionContent className="text-base text-gray-600">
                            Yes. We use industry-standard encryption for all data. Since Project Mizan is self-hostable, you can also choose to keep all data on your own private servers for maximum privacy.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2" className="border px-4 rounded-lg">
                        <AccordionTrigger className="text-lg font-medium">How does the AI Audit work?</AccordionTrigger>
                        <AccordionContent className="text-base text-gray-600">
                            Our &quot;Basira&quot; AI engine analyzes transaction patterns in real-time. It flags anomalies like accidental mixing of Zakat funds with operational expenses, ensuring you stay compliant with Sharia and local laws (FCRA).
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3" className="border px-4 rounded-lg">
                        <AccordionTrigger className="text-lg font-medium">Is it really free?</AccordionTrigger>
                        <AccordionContent className="text-base text-gray-600">
                            Yes! The Community edition is 100% free and open source. You can download it from GitHub and host it yourself. We charge only for the Cloud Managed version where we handle the servers for you.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>
    );
}
