import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function PrivacyPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 container mx-auto px-4 md:px-6 py-12 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8">Privacy Declaration</h1>
                <div className="prose dark:prose-invert">
                    <p>Last updated: December 2025</p>

                    <h3>1. Data Ownership</h3>
                    <p>Project Mizan is designed as a self-hosted or tenant-isolated system. <strong>You own your data.</strong> The Digital Ummah Foundation does not sell, trade, or access your community's sensitive data without explicit permission (e.g., for support).</p>

                    <h3>2. Information We Collect</h3>
                    <p>If you use our Cloud Managed service, we collect:</p>
                    <ul>
                        <li>Admin contact details (Name, Email) for billing and support.</li>
                        <li>Usage logs for system performance and security auditing.</li>
                    </ul>


                    <h3>3. Sensitive Community Data</h3>
                    <p>Data regarding Zakat eligibility, household income, and financial transactions is encrypted at rest. We strictly adhere to privacy standards to protect the dignity of Zakat recipients.</p>

                    <h3>4. Cookie Policy</h3>
                    <p>We use essential cookies to maintain your login session. No third-party tracking cookies are used.</p>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
