import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, Building2, Megaphone, Calendar, X, HeartHandshake, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { getSubdomainLink } from "@/utils/domainHelpers";
import { getApiBaseUrl, getLandingPageUrl } from "@/lib/config";
import logo from "@/assets/logo.png";
import { format } from "date-fns";

interface PublicAnnouncement {
    id: number;
    mosque_id: number;
    mosque_name: string;
    title: string;
    content: string;
    published_at: string;
    image?: string;
    is_fundraiser?: boolean;
    fundraising_target?: string | number;
    amount_raised?: string | number;
    is_fully_funded?: boolean;
}

export function TenantHomePage() {
    const [globalAnnouncements, setGlobalAnnouncements] = useState<PublicAnnouncement[]>([]);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<PublicAnnouncement | null>(null);
    const [modalStep, setModalStep] = useState<'ANNOUNCEMENT' | 'DONATE' | 'SUCCESS'>('ANNOUNCEMENT');
    
    // Donation Form State
    const [donationType, setDonationType] = useState('General');
    const [donationAmount, setDonationAmount] = useState('');
    const [donorName, setDonorName] = useState('');
    const [isDonating, setIsDonating] = useState(false);
    const [donationError, setDonationError] = useState('');
    const [donationSuccessMsg, setDonationSuccessMsg] = useState('');
    
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${getApiBaseUrl()}/api/public/announcements/`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setGlobalAnnouncements(data);
            })
            .catch(err => console.error(err));
    }, []);

    // Common Header Component
    const Header = () => (
        <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <a href={getLandingPageUrl()} className="flex items-center justify-center font-extrabold text-2xl gap-3 text-slate-900 tracking-tight hover:opacity-90 transition-opacity">
                    <img src={logo} alt="DigitalJamath Logo" className="h-10 w-10 drop-shadow-sm" />
                    <span>Digital<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">Jamath</span></span>
                </a>
                
                <a href={getLandingPageUrl()}>
                    <Button className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-full px-6 font-semibold py-5 text-sm">
                        Go Back Home
                    </Button>
                </a>
            </div>
        </header>
    );

    // Common Footer Component
    const Footer = () => (
        <footer className="border-t bg-white/80 py-4 mt-auto">
            <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                <p>Powered by <a href={getSubdomainLink()} className="text-blue-600 hover:underline">DigitalJamath</a></p>
            </div>
        </footer>
    );

    const openAnnouncement = (ann: PublicAnnouncement) => {
        setSelectedAnnouncement(ann);
        setModalStep('ANNOUNCEMENT');
        // Reset donation states
        setDonationAmount('');
        setDonorName('');
        setDonationType('General');
        setDonationError('');
    };

    const handleDonateClick = () => {
        setModalStep('DONATE');
    };

    const handleDonationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAnnouncement) return;

        setIsDonating(true);
        setDonationError("");

        try {
            const res = await fetch(`${getApiBaseUrl()}/api/public/masjids/${selectedAnnouncement.mosque_id}/donate/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    donation_type: donationType,
                    amount: donationAmount,
                    donor_name: donorName || "Guest User",
                    announcement_id: selectedAnnouncement.id
                })
            });

            if (res.ok) {
                setModalStep('SUCCESS');
                setDonationSuccessMsg(`Jazakallah! The internal Mizan ledger of ${selectedAnnouncement.mosque_name} has been credited directly with your contribution.`);
                
                // Instantly update the progress locally
                if (selectedAnnouncement.fundraising_target) {
                    const newTotal = (Number(selectedAnnouncement.amount_raised) || 0) + Number(donationAmount);
                    const isNowFullyFunded = newTotal >= Number(selectedAnnouncement.fundraising_target);
                    
                    const updatedAnn = {
                        ...selectedAnnouncement,
                        amount_raised: newTotal,
                        is_fully_funded: isNowFullyFunded
                    };
                    setSelectedAnnouncement(updatedAnn);
                    setGlobalAnnouncements(prev => prev.map(a => a.id === updatedAnn.id ? updatedAnn : a));
                }
            } else {
                const data = await res.json();
                setDonationError(data.error || "Failed to process donation. Please try again.");
            }
        } catch (err) {
            setDonationError("Network error occurred processing donation.");
        } finally {
            setIsDonating(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 relative">
            <Header />

            {/* Modal Overlay for Announcements / Donation */}
            {selectedAnnouncement && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        
                        {/* --- ANNOUNCEMENT VIEW --- */}
                        {modalStep === 'ANNOUNCEMENT' && (
                            <>
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                        <Megaphone className="h-4 w-4 text-indigo-500 shrink-0" />
                                        <span className="truncate">{selectedAnnouncement.mosque_name}</span>
                                    </div>
                                    <button onClick={() => setSelectedAnnouncement(null)} className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full p-2 transition-colors shrink-0">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                
                                <div className="overflow-y-auto p-6 space-y-4">
                                    <h2 className="text-2xl font-bold text-slate-900 leading-snug">{selectedAnnouncement.title}</h2>
                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(selectedAnnouncement.published_at), 'MMMM dd, yyyy h:mm a')}
                                    </p>
                                    
                                    {selectedAnnouncement.image && (
                                        <img 
                                            src={selectedAnnouncement.image} 
                                            alt="Announcement" 
                                            className="w-full h-auto rounded-xl border border-slate-100 object-cover max-h-[300px]"
                                        />
                                    )}
                                    {selectedAnnouncement.is_fundraiser && selectedAnnouncement.fundraising_target && (
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">
                                            <div className="flex justify-between items-end mb-2">
                                                <div>
                                                    <span className="text-2xl font-bold text-slate-800">₹{(Number(selectedAnnouncement.amount_raised) || 0).toLocaleString()}</span>
                                                    <span className="text-sm text-slate-500 ml-1">raised of ₹{Number(selectedAnnouncement.fundraising_target).toLocaleString()} goal</span>
                                                </div>
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                                    {Math.min(((Number(selectedAnnouncement.amount_raised) || 0) / Number(selectedAnnouncement.fundraising_target)) * 100, 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                                                    style={{ width: `${Math.min(((Number(selectedAnnouncement.amount_raised) || 0) / Number(selectedAnnouncement.fundraising_target)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="prose prose-sm text-slate-700 whitespace-pre-wrap">
                                        {selectedAnnouncement.content}
                                    </div>
                                </div>

                                {selectedAnnouncement.is_fundraiser && selectedAnnouncement.mosque_id > 0 && (
                                    <div className="p-4 border-t border-gray-100 bg-emerald-50/50">
                                        {selectedAnnouncement.is_fully_funded ? (
                                            <Button 
                                                disabled
                                                className="w-full bg-slate-200 text-slate-500 hover:bg-slate-200 shadow-none h-12 text-lg cursor-not-allowed"
                                            >
                                                🎉 Fully Funded & Closed
                                            </Button>
                                        ) : (
                                            <Button 
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md h-12 text-lg"
                                                onClick={handleDonateClick}
                                            >
                                                <HeartHandshake className="mr-2 w-5 h-5" />
                                                Support this Fundraiser
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* --- DONATION FLOW --- */}
                        {modalStep === 'DONATE' && (
                            <>
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                                    <button onClick={() => setModalStep('ANNOUNCEMENT')} className="text-gray-400 hover:text-gray-900 p-1 hover:bg-white rounded-full transition-colors">
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <div className="text-center truncate px-2">
                                        <h2 className="text-md font-bold text-gray-900 truncate">Guest Donation</h2>
                                        <p className="text-xs text-gray-500 truncate">{selectedAnnouncement.mosque_name}</p>
                                    </div>
                                    <button onClick={() => setSelectedAnnouncement(null)} className="text-gray-400 hover:text-gray-700 p-1 hover:bg-white rounded-full transition-colors">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <form onSubmit={handleDonationSubmit} className="p-6 space-y-5 bg-white overflow-y-auto">
                                    {donationError && (
                                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                            {donationError}
                                        </div>
                                    )}
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Donation Intent</label>
                                        <select 
                                            className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white transition-colors"
                                            value={donationType}
                                            onChange={(e) => setDonationType(e.target.value)}
                                        >
                                            <option value="General">General / Lillah</option>
                                            <option value="Zakat">Zakat (Restricted)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-semibold text-gray-700">Amount (₹)</label>
                                            {selectedAnnouncement.fundraising_target && (
                                                <span className="text-xs text-slate-500">
                                                    Max: ₹{(Number(selectedAnnouncement.fundraising_target) - Number(selectedAnnouncement.amount_raised || 0)).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">₹</span>
                                            <Input 
                                                type="number" 
                                                min="1"
                                                max={selectedAnnouncement.fundraising_target ? Number(selectedAnnouncement.fundraising_target) - Number(selectedAnnouncement.amount_raised || 0) : undefined}
                                                required
                                                placeholder="1000"
                                                className="pl-8 py-6 text-lg bg-gray-50 focus:bg-white transition-colors rounded-xl"
                                                value={donationAmount}
                                                onChange={(e) => setDonationAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Your Name (Optional)</label>
                                        <Input 
                                            type="text" 
                                            placeholder="Guest User"
                                            className="py-5 bg-gray-50 focus:bg-white transition-colors rounded-xl"
                                            value={donorName}
                                            onChange={(e) => setDonorName(e.target.value)}
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <Button 
                                            type="submit" 
                                            disabled={isDonating || !donationAmount}
                                            className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                                        >
                                            {isDonating ? <Loader2 className="animate-spin h-5 w-5" /> : `Donate ₹${donationAmount || '0'}`}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-center text-gray-400 mt-4">
                                        Your donation is securely processed and instantly recorded in the transparent Mizan ledger of this Tenant.
                                    </p>
                                </form>
                            </>
                        )}

                        {/* --- SUCCESS FLOW --- */}
                        {modalStep === 'SUCCESS' && (
                            <div className="p-8 text-center bg-white space-y-6">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Jazakallah Khair!</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {donationSuccessMsg}
                                    </p>
                                </div>
                                <Button 
                                    className="w-full h-12 mt-6" 
                                    variant="outline"
                                    onClick={() => setSelectedAnnouncement(null)}
                                >
                                    Close Window
                                </Button>
                            </div>
                        )}
                        
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center">
                <div className="max-w-3xl text-center mb-16 animate-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 font-outfit">
                        The Operating System for <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-500 to-teal-600">
                            Modern Masjids
                        </span>
                    </h1>
                    <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto">
                        Manage memberships, track finances, handle welfare requests, and communicate with your community all from one unified platform.
                    </p>
                </div>

                <div className="w-full max-w-5xl mx-auto mb-16 animate-in fade-in duration-700">
                    <div className="flex items-center gap-2 mb-4 text-indigo-700 font-semibold px-2">
                        <Megaphone className="h-5 w-5" />
                        <h3>Latest Community Updates</h3>
                    </div>
                    {globalAnnouncements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {globalAnnouncements.slice(0, 3).map((ann) => (
                                <div 
                                    key={ann.id} 
                                    onClick={() => openAnnouncement(ann)}
                                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all group h-full flex flex-col cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-sm">
                                            {ann.mosque_name}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(ann.published_at), 'MMM dd')}
                                        </div>
                                    </div>
                                    {ann.is_fully_funded && (
                                        <div className="mb-2 w-max text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-1 rounded-sm flex items-center gap-1">
                                            🎉 Fully Funded
                                        </div>
                                    )}
                                    <h4 className="font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {ann.title}
                                    </h4>
                                    <p className="text-sm text-slate-500 line-clamp-2 mt-auto">
                                        {ann.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-500">
                            No public community announcements posted yet. Start sharing updates to see them here!
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-700 delay-100">
                    {/* Register Card */}
                    <Card className="hover:shadow-xl transition-all hover:-translate-y-2 border-slate-200/60 bg-white group">
                        <CardHeader className="text-center pb-4">
                            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Building2 className="h-8 w-8 text-emerald-600" />
                            </div>
                            <CardTitle className="text-xl">Register Mosque</CardTitle>
                            <CardDescription className="text-sm px-2">
                                Start managing your Masjid digitally today. Create your workspace in minutes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-md shadow-md">
                                <Link to="/register">Create Workspace</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Admin Login Card */}
                    <Card className="hover:shadow-xl transition-all hover:-translate-y-2 border-slate-200/60 bg-white group">
                        <CardHeader className="text-center pb-4">
                            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                            <CardTitle className="text-xl">Masjid Login</CardTitle>
                            <CardDescription className="text-sm px-2">
                                For committee members and administrators to access the dashboard.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-md shadow-md">
                                <Link to="/auth/signin">Admin Portal</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Member Portal Card */}
                    <Card className="hover:shadow-xl transition-all hover:-translate-y-2 border-slate-200/60 bg-white group">
                        <CardHeader className="text-center pb-4">
                            <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Phone className="h-8 w-8 text-indigo-600" />
                            </div>
                            <CardTitle className="text-xl">Member Portal</CardTitle>
                            <CardDescription className="text-sm px-2">
                                For community members to view receipts, make requests and read announcements.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-12 text-md hover:border-indigo-300">
                                <Link to="/portal/login">Member Login</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-20 max-w-2xl text-center pb-8 animate-in fade-in duration-1000 delay-300 border-t pt-8">
                    <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-4">Demo Access Available</p>
                    <div className="bg-slate-100 p-4 rounded-xl inline-flex flex-col sm:flex-row gap-6 text-sm border shadow-sm">
                        <div className="text-left">
                            <span className="font-semibold text-slate-800 block mb-1">Admin Demo</span>
                            <span className="text-slate-600 font-mono">demo@digitaljamath.com / password123</span>
                        </div>
                        <div className="hidden sm:block w-px bg-slate-300"></div>
                        <div className="text-left">
                            <span className="font-semibold text-slate-800 block mb-1">Member Portal Demo</span>
                            <span className="text-slate-600 font-mono">+919876543210 / OTP: 123456</span>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
