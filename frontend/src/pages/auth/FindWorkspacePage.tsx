import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Building, HeartHandshake, UserCircle, CheckCircle2, ArrowLeft, Megaphone } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getApiBaseUrl } from "@/lib/config";

interface Mosque {
    id: number;
    name: string;
}

export function FindWorkspacePage() {
    const navigate = useNavigate();
    const [mosques, setMosques] = useState<Mosque[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal State
    const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);
    const [modalMode, setModalMode] = useState<'OPTIONS' | 'DONATE' | 'SUCCESS'>('OPTIONS');

    // Donation Form State
    const [donationAmount, setDonationAmount] = useState("");
    const [donorName, setDonorName] = useState("");
    const [donationType, setDonationType] = useState("General");
    const [isDonating, setIsDonating] = useState(false);
    const [donationError, setDonationError] = useState("");
    const [donationSuccessMsg, setDonationSuccessMsg] = useState("");

    useEffect(() => {
        const fetchMosques = async () => {
            try {
                const apiBase = getApiBaseUrl();
                const res = await fetch(`${apiBase}/api/public/masjids/`);
                if (res.ok) {
                    const data = await res.json();
                    setMosques(data);
                } else {
                    setError("Failed to load Masjids.");
                }
            } catch (err) {
                console.error("Failed to load Masjids", err);
                setError("Network error. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchMosques();
    }, []);

    const filteredMosques = mosques.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleMosqueClick = (mosque: Mosque) => {
        setSelectedMosque(mosque);
        setModalMode('OPTIONS');
        // Reset donation form
        setDonationAmount("");
        setDonorName("");
        setDonationType("General");
        setDonationError("");
    };

    const closeModal = () => {
        setSelectedMosque(null);
    };

    const handleDonationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMosque) return;
        
        setDonationError("");
        setIsDonating(true);

        try {
            const apiBase = getApiBaseUrl();
            const res = await fetch(`${apiBase}/api/public/masjids/${selectedMosque.id}/donate/`, {
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
                setModalMode('SUCCESS');
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
        <div className="flex flex-col min-h-screen bg-gray-50">
            <SiteHeader />
            <main className="flex-1 container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Masjid</span>
                        </h1>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                            Connect with your local Jamath. Access member services or make a quick guest donation to support community initiatives.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-xl mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-lg transition-shadow shadow-sm hover:shadow-md"
                            placeholder="Type to search for a Masjid..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Mosque List Grid */}
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-600 p-8 bg-red-50 rounded-xl">
                            <p>{error}</p>
                        </div>
                    ) : filteredMosques.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                            <Building className="mx-auto h-12 w-12 text-gray-300" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No Masjids Found</h3>
                            <p className="mt-1 text-gray-500">We couldn't find any Masjid matching your search.</p>
                            <Link to="/register" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
                                Register a new Masjid →
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredMosques.map((mosque) => (
                                <button
                                    key={mosque.id}
                                    onClick={() => handleMosqueClick(mosque)}
                                    className="group flex items-center p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-300 hover:ring-1 hover:ring-blue-300 transition-all duration-300 text-left"
                                >
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-blue-600 mr-4 group-hover:scale-110 transition-transform">
                                        <Building className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                                            {mosque.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1 flex items-center">
                                            Click to view services →
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <SiteFooter />

            {/* Global Modal Overlay */}
            {selectedMosque && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        {modalMode === 'OPTIONS' && (
                            <>
                                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{selectedMosque.name}</h2>
                                        <p className="text-sm text-gray-500">Select an option to continue</p>
                                    </div>
                                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                                        ✕
                                    </button>
                                </div>
                                <div className="p-6 space-y-4 bg-gray-50">
                                    <Button 
                                        className="w-full h-16 text-lg justify-start px-6 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 shadow-sm transition-all"
                                        variant="outline"
                                        onClick={() => navigate(`/masjid/${selectedMosque.id}`)}
                                    >
                                        <Megaphone className="mr-4 h-6 w-6 text-indigo-600" />
                                        <div className="text-left">
                                            <div className="font-semibold">Visit Public Interface</div>
                                            <div className="text-xs text-indigo-600/80 font-normal">View announcements & updates</div>
                                        </div>
                                    </Button>
                                    
                                    <Button 
                                        className="w-full h-16 text-lg justify-start px-6 bg-white hover:bg-blue-50 text-gray-900 border border-gray-200 hover:border-blue-300 shadow-sm transition-all"
                                        variant="outline"
                                        onClick={() => navigate('/portal/login')}
                                    >
                                        <UserCircle className="mr-4 h-6 w-6 text-blue-600" />
                                        <div className="text-left">
                                            <div className="font-semibold">Member Portal Login</div>
                                            <div className="text-xs text-gray-500 font-normal">Access household services & receipts</div>
                                        </div>
                                    </Button>
                                    
                                    <Button 
                                        className="w-full h-16 text-lg justify-start px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all border-0"
                                        onClick={() => setModalMode('DONATE')}
                                    >
                                        <HeartHandshake className="mr-4 h-6 w-6 text-emerald-100" />
                                        <div className="text-left">
                                            <div className="font-semibold">Guest Donation</div>
                                            <div className="text-xs text-emerald-100 font-normal">Contribute directly without an account</div>
                                        </div>
                                    </Button>
                                </div>
                            </>
                        )}

                        {modalMode === 'DONATE' && (
                            <>
                                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                    <button onClick={() => setModalMode('OPTIONS')} className="text-gray-400 hover:text-gray-900 p-1 hover:bg-gray-100 rounded-full transition-colors">
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Guest Donation</h2>
                                        <p className="text-sm text-gray-500">For {selectedMosque.name}</p>
                                    </div>
                                    <button onClick={closeModal} className="ml-auto text-gray-400 hover:text-gray-600 p-1">
                                        ✕
                                    </button>
                                </div>
                                <form onSubmit={handleDonationSubmit} className="p-6 space-y-5 bg-white">
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
                                        <label className="text-sm font-semibold text-gray-700">Amount (₹)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">₹</span>
                                            <Input 
                                                type="number" 
                                                min="1"
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
                                        Your donation is securely processed and instantly recorded in the Masjid's transparent ledger.
                                    </p>
                                </form>
                            </>
                        )}

                        {modalMode === 'SUCCESS' && (
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
                                    onClick={closeModal}
                                    variant="outline"
                                    className="w-full h-12 rounded-xl mt-4"
                                >
                                    Close Window
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
