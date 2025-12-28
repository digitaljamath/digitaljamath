import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OriginStorySection, TeamSection, JoinMovementSection } from "@/components/LandingComponents";

export default function AboutPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">
                <div className="bg-blue-50 dark:bg-blue-900/10 py-12 text-center">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">About Us</h1>
                </div>
                <OriginStorySection />
                <TeamSection />
                <JoinMovementSection />
            </main>
            <SiteFooter />
        </div>
    );
}
