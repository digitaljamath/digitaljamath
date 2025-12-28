import Link from "next/link";

export function SiteHeader() {
    return (
        <header className="border-b bg-white dark:bg-gray-950">
            <div className="container mx-auto px-4 lg:px-6 h-14 flex items-center">
                <Link className="flex items-center justify-center font-bold text-xl" href="/">
                    Project Mizan
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/about">
                        About
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/#features">
                        Features
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/about#team">
                        Team
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="https://github.com/azzaxp/Project-Mizan" target="_blank">
                        GitHub
                    </Link>
                </nav>
            </div>
        </header>
    );
}
