import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function SiteHeader() {
    return (
        <header className="border-b bg-white dark:bg-gray-950 sticky top-0 z-50">
            <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
                <Link className="flex items-center justify-center font-bold text-xl gap-2" href="/">
                    <Image src="/logo.png" alt="DigitalJamath Logo" width={32} height={32} className="h-8 w-8" />
                    DigitalJamath
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex gap-6 items-center">
                    <Link className="text-sm font-medium hover:text-blue-600 transition-colors" href="/about">
                        About
                    </Link>
                    <Link className="text-sm font-medium hover:text-blue-600 transition-colors" href="/#features">
                        Features
                    </Link>
                    <Link className="text-sm font-medium hover:text-blue-600 transition-colors" href="https://github.com/azzaxp/digitaljamath" target="_blank">
                        GitHub
                    </Link>
                    <div className="h-4 w-px bg-gray-300 mx-2"></div>
                    <Link href="/auth/find-workspace">
                        <Button size="sm" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                            Find My Masjid
                        </Button>
                    </Link>
                </nav>

                {/* Mobile Navigation */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <nav className="flex flex-col gap-1 mt-8 px-2">
                                <Link
                                    className="px-4 py-3.5 text-base font-medium text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                                    href="/about"
                                >
                                    About
                                </Link>
                                <Link
                                    className="px-4 py-3.5 text-base font-medium text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                                    href="/#features"
                                >
                                    Features
                                </Link>
                                <Link
                                    className="px-4 py-3.5 text-base font-medium text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                                    href="https://github.com/azzaxp/digitaljamath"
                                    target="_blank"
                                >
                                    GitHub
                                </Link>

                                <div className="h-px bg-border my-4" />

                                <Link href="/auth/find-workspace" className="px-4">
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3">
                                        Find My Masjid
                                    </Button>
                                </Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
