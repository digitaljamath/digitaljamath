import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function TermsPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 container mx-auto px-4 md:px-6 py-12 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
                <div className="prose dark:prose-invert">
                    <p>Last updated: December 2025</p>
                    <h3>1. Acceptance of Terms</h3>
                    <p>By accessing and using Project Mizan, you accept and agree to be bound by the terms and provision of this agreement.</p>

                    <h3>2. Description of Service</h3>
                    <p>Project Mizan provides an open-source ERP system for Masjid management. The software is provided "as is", without warranty of any kind.</p>

                    <h3>3. Usage Policy</h3>
                    <p>You agree to use this software only for lawful purposes. You represent that any financial data entered (Zakat, Donations) is accurate to the best of your knowledge.</p>

                    <h3>4. Open Source License</h3>
                    <p>This project is licensed under the MIT License. You are free to modify and distribute it under the terms of the license.</p>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
