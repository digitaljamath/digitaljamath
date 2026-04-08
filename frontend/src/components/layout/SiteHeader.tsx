import { Link, useLocation } from "react-router-dom";
import { getLandingPageUrl } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

import logo from "@/assets/logo.png";

export function SiteHeader() {
    const location = useLocation();
    const isFindWorkspace = location.pathname === "/auth/find-workspace" || location.pathname === "/find-masjid";
    const ctaText = isFindWorkspace ? "Go Back Home" : "Find My Masjid";
    const homeUrl = getLandingPageUrl();
    const ctaLink = isFindWorkspace ? homeUrl : "/auth/find-workspace";

    return (
        <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur-lg sticky top-0 z-50 transition-all duration-300">
            <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
                <a className="flex items-center justify-center font-extrabold text-2xl gap-3 text-slate-900 tracking-tight hover:opacity-90 transition-opacity" href={homeUrl}>
                    <img src={logo} alt="DigitalJamath Logo" className="h-10 w-10 drop-shadow-sm" />
                    <span>Digital<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">Jamath</span></span>
                </a>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex gap-8 items-center">
                    <a className="text-[15px] font-semibold text-slate-600 hover:text-blue-600 transition-colors relative group" href={`${homeUrl}about`}>
                        <span>About</span>
                        <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-blue-600 rounded-full transition-all duration-300 ease-out group-hover:w-full"></span>
                    </a>
                    <a className="text-[15px] font-semibold text-slate-600 hover:text-blue-600 transition-colors relative group" href={`${homeUrl}#features`}>
                        <span>Features</span>
                        <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-blue-600 rounded-full transition-all duration-300 ease-out group-hover:w-full"></span>
                    </a>
                    <a className="text-[15px] font-semibold text-slate-600 hover:text-blue-600 transition-colors relative group" href={`${homeUrl}#pricing`}>
                        <span>Pricing</span>
                        <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-blue-600 rounded-full transition-all duration-300 ease-out group-hover:w-full"></span>
                    </a>
                    <a className="text-[15px] font-semibold text-slate-600 hover:text-blue-600 transition-colors relative group" href="https://github.com/azzaxp/digitaljamath" target="_blank" rel="noreferrer">
                        <span>GitHub</span>
                        <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-blue-600 rounded-full transition-all duration-300 ease-out group-hover:w-full"></span>
                    </a>
                    
                    <div className="h-6 w-px bg-slate-200/80 mx-2"></div>
                    
                    {isFindWorkspace ? (
                        <a href={ctaLink}>
                            <Button className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 transition-all duration-200 rounded-full px-6 py-5 text-sm font-semibold">
                                {ctaText}
                            </Button>
                        </a>
                    ) : (
                        <Link to={ctaLink}>
                            <Button className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 transition-all duration-200 rounded-full px-6 py-5 text-sm font-semibold">
                                {ctaText}
                            </Button>
                        </Link>
                    )}
                </nav>

                {/* Mobile Navigation */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2 text-slate-600 hover:bg-slate-100/50 rounded-full">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white/95 backdrop-blur-xl border-l-slate-200">
                            <nav className="flex flex-col gap-2 mt-10 px-2">
                                <a
                                    className="px-4 py-4 text-lg font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors"
                                    href={`${homeUrl}about`}
                                >
                                    About
                                </a>
                                <a
                                    className="px-4 py-4 text-lg font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors"
                                    href={`${homeUrl}#features`}
                                >
                                    Features
                                </a>
                                <a
                                    className="px-4 py-4 text-lg font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors"
                                    href={`${homeUrl}#pricing`}
                                >
                                    Pricing
                                </a>
                                <a
                                    className="px-4 py-4 text-lg font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors"
                                    href="https://github.com/azzaxp/digitaljamath"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    GitHub
                                </a>

                                <div className="h-px bg-slate-200 my-6" />

                                {isFindWorkspace ? (
                                    <a href={ctaLink} className="px-2">
                                        <Button className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md rounded-2xl py-6 font-bold text-lg">
                                            {ctaText}
                                        </Button>
                                    </a>
                                ) : (
                                    <Link to={ctaLink} className="px-2">
                                        <Button className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md rounded-2xl py-6 font-bold text-lg">
                                            {ctaText}
                                        </Button>
                                    </Link>
                                )}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
