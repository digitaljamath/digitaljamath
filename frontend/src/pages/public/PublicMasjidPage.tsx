import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getApiBaseUrl } from "@/lib/config";
import { 
    Megaphone, Calendar, ChevronLeft, ChevronRight, 
    Users, Banknote, FolderOpen, HeartHandshake, ArrowLeft, Loader2, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface Announcement {
    id: number;
    title: string;
    content: string;
    published_at: string;
    image?: string | null;
    is_fundraiser: boolean;
    fundraising_target?: number;
    created_by_name: string;
}

export function PublicMasjidPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [masjidName, setMasjidName] = useState<string>("Loading...");
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Donation Modal State
    const [showDonateModal, setShowDonateModal] = useState(false);
    const [donationAmount, setDonationAmount] = useState("");
    const [donorName, setDonorName] = useState("");
    const [donationType, setDonationType] = useState("General");
    const [isDonating, setIsDonating] = useState(false);
    const [donationError, setDonationError] = useState("");
    const [donationSuccessMsg, setDonationSuccessMsg] = useState("");
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchMasjidData = async () => {
            try {
                const apiBase = getApiBaseUrl();
                
                // Get Name
                const masjidsRes = await fetch(`${apiBase}/api/public/masjids/`);
                if (masjidsRes.ok) {
                    const masjids = await masjidsRes.json();
                    const current = masjids.find((m: any) => m.id === parseInt(id || '0'));
                    if (current) setMasjidName(current.name);
                    else setMasjidName("Unknown Masjid");
                }
                
                // Get Announcements
                const annRes = await fetch(`${apiBase}/api/public/masjids/${id}/announcements/`);
                if (annRes.ok) {
                    const annData = await annRes.json();
                    setAnnouncements(annData);
                }
            } catch (err) {
                console.error("Failed to load public data", err);
            } finally {
                setIsLoading(false);
            }
        };
        
        if (id) fetchMasjidData();
    }, [id]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 350;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const handleDonationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        
        setDonationError("");
        setIsDonating(true);

        try {
            const apiBase = getApiBaseUrl();
            const res = await fetch(`${apiBase}/api/public/masjids/${id}/donate/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: donationAmount,
                    donor_name: donorName || "Guest User",
                    donation_type: donationType
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                setDonationSuccessMsg(`Jazakallah Khair! Your donation was successful. (Receipt: ${data.voucher_number || 'Generated'})`);
            } else {
                setDonationError(data.error || "Failed to process donation.");
            }
        } catch (err) {
            setDonationError("Network error. Please try again.");
        } finally {
            setIsDonating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/find-masjid')} className="mr-2 text-gray-500 hover:text-gray-900">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-xl font-bold text-indigo-700 tracking-tight">{masjidName}</h1>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
                        <a href="#announcements" className="text-indigo-600 border-b-2 border-indigo-600 pb-1">Announcements</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Organizations</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Prayer Times</a>
                        <button onClick={() => setShowDonateModal(true)} className="hover:text-indigo-600 transition-colors">Donate</button>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Button className="hidden sm:inline-flex rounded-full bg-slate-900 hover:bg-slate-800 text-white px-6">
                            Member Portal
                        </Button>
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                            {masjidName.charAt(0)}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-6 py-12">
                {/* Hero Section */}
                <div className="max-w-3xl mb-12">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider mb-6">
                         <Megaphone className="h-3 w-3" /> Community Updates
                     </div>
                     <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                        Stay connected with the <br className="hidden md:block"/> heartbeat of our <span className="text-indigo-600">Jamath</span>.
                     </h2>
                </div>

                {/* Announcements Carousel section */}
                <div id="announcements" className="mb-20">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Latest Announcements</h3>
                        <Button variant="ghost" className="text-indigo-600 font-semibold hover:bg-indigo-50 hover:text-indigo-700 hidden sm:flex">
                            View All Announcements &rarr;
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-gray-100">
                            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100">
                            <Megaphone className="h-10 w-10 text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No public announcements at this time.</p>
                        </div>
                    ) : (
                        <div className="relative group">
                            <div 
                                ref={scrollContainerRef}
                                className="flex gap-6 overflow-x-auto pb-8 pt-4 px-4 -mx-4 scrollbar-hide snap-x scroll-smooth"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {announcements.map((ann) => (
                                    <Card key={ann.id} className="min-w-[320px] max-w-[320px] sm:min-w-[380px] sm:max-w-[380px] border-0 shadow-xl shadow-slate-200/40 rounded-3xl snap-center shrink-0 flex flex-col hover:-translate-y-1 transition-transform duration-300 overflow-hidden">
                                        {ann.image && (
                                            <div className="h-48 w-full bg-slate-100 relative">
                                                <img src={ann.image} alt={ann.title} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <CardHeader className="pt-6 pb-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider shrink-0">
                                                    {format(new Date(ann.published_at), 'MMM dd, yyyy')}
                                                </Badge>
                                                {ann.is_fundraiser && (
                                                    <Badge className="bg-emerald-50 text-emerald-700 border-none hover:bg-emerald-100 shrink-0">
                                                        Fundraiser
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-xl font-bold leading-tight line-clamp-2 text-slate-900">
                                                {ann.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-1 flex flex-col">
                                            <p className="text-slate-600 text-sm line-clamp-3 mb-6">
                                                {ann.content}
                                            </p>
                                            
                                            <div className="mt-auto pt-4 flex gap-2 w-full">
                                                {ann.is_fundraiser && (
                                                    <Button 
                                                        onClick={() => {
                                                            setDonationType(ann.title);
                                                            setShowDonateModal(true);
                                                        }}
                                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
                                                    >
                                                        Donate Now
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            
                            {/* Carousel Controls */}
                            {announcements.length > 2 && (
                                <div className="flex justify-center gap-3 mt-4">
                                    <button 
                                        onClick={() => scroll('left')}
                                        className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-colors shadow-sm"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button 
                                        onClick={() => scroll('right')}
                                        className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div className="bg-slate-100/80 rounded-3xl p-8 flex flex-col">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-indigo-600">
                              <Users className="h-6 w-6" />
                          </div>
                          <h4 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-2">1,240+</h4>
                          <p className="text-slate-600 font-medium">Active Jamath Members</p>
                     </div>
                     <div className="bg-indigo-600 rounded-3xl p-8 flex flex-col relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-10">
                              <Banknote className="w-48 h-48" />
                          </div>
                          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 text-white backdrop-blur-md">
                              <Banknote className="h-6 w-6" />
                          </div>
                          <h4 className="text-5xl font-extrabold text-white tracking-tight mb-2 relative z-10">$85.4k</h4>
                          <p className="text-indigo-100 font-medium relative z-10">Community Zakat Raised YTD</p>
                     </div>
                     <div className="bg-slate-100/80 rounded-3xl p-8 flex flex-col sm:col-span-2 lg:col-span-1 border border-slate-200/50 outline-dashed outline-2 outline-offset-4 outline-slate-200">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-emerald-600">
                              <FolderOpen className="h-6 w-6" />
                          </div>
                          <h4 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-2">12</h4>
                          <p className="text-slate-600 font-medium">Ongoing Community Projects</p>
                     </div>
                </div>
            </main>

            {/* Donation Modal overlay */}
            {showDonateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        {donationSuccessMsg ? (
                            <div className="p-8 text-center bg-white space-y-6">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Jazakallah Khair!</h3>
                                    <p className="text-gray-600 leading-relaxed">{donationSuccessMsg}</p>
                                </div>
                                <Button 
                                    onClick={() => { setShowDonateModal(false); setDonationSuccessMsg(""); }}
                                    variant="outline"
                                    className="w-full h-12 rounded-xl mt-4"
                                >
                                    Close Window
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 flex items-center justify-between border-b border-gray-100 bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center">
                                            <HeartHandshake className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Guest Donation</h2>
                                            <p className="text-xs text-slate-500 font-medium">Supporting {masjidName}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowDonateModal(false)} className="text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-200 transition-colors">
                                        ✕
                                    </button>
                                </div>
                                <form onSubmit={handleDonationSubmit} className="p-6 space-y-5">
                                    {donationError && (
                                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                            {donationError}
                                        </div>
                                    )}
                                    
                                    <div className="space-y-2">
                                        <Label>Donation Intent / Campaign</Label>
                                        <Input 
                                            value={donationType}
                                            onChange={(e) => setDonationType(e.target.value)}
                                            className="bg-gray-50 font-medium h-12 px-4 rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Amount (₹)</Label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-lg">₹</span>
                                            <Input 
                                                type="number" 
                                                min="1"
                                                required
                                                placeholder="1000"
                                                className="pl-9 py-6 text-xl font-bold bg-white border-2 border-indigo-100 focus:border-indigo-500 transition-colors rounded-xl shadow-inner"
                                                value={donationAmount}
                                                onChange={(e) => setDonationAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Your Name (Optional)</Label>
                                        <Input 
                                            type="text" 
                                            placeholder="Ahmad"
                                            className="h-12 bg-gray-50 focus:bg-white transition-colors rounded-xl"
                                            value={donorName}
                                            onChange={(e) => setDonorName(e.target.value)}
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <Button 
                                            type="submit" 
                                            disabled={isDonating || !donationAmount}
                                            className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
                                        >
                                            {isDonating ? <Loader2 className="animate-spin h-6 w-6" /> : `Complete Donation`}
                                        </Button>
                                    </div>
                                    <p className="text-[11px] text-center text-gray-400 font-medium tracking-wide">
                                        SECURE TRANSACTION • RECEIPTS ISSUED INSTANTLY
                                    </p>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
