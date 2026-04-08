import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Megaphone, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { getApiBaseUrl } from "@/lib/config";
import { fetchWithAuth } from "@/lib/api";

interface Announcement {
    id: number;
    title: string;
    content: string;
    published_at: string;
    expires_at?: string;
    image?: string | null;
    is_fundraiser?: boolean;
    fundraising_target?: string | null;
}

export function PortalAnnouncementsPage() {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetchWithAuth(`/api/portal/announcements/`, {}, 'portal');

            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
            } else if (res.status === 401) {
                navigate('/portal/login');
            }
        } catch (err) {
            console.error("Failed to fetch announcements", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header / App Bar */}
            <header className="bg-white border-b sticky top-0 z-50 h-[56px] flex items-center shadow-sm">
                <div className="w-full max-w-[420px] mx-auto px-4 flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild className="active:scale-95 transition-transform">
                        <Link to="/portal/dashboard">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="font-bold text-lg tracking-tight text-gray-900">Announcements</h1>
                </div>
            </header>

            <main className="w-full max-w-[420px] mx-auto px-4 py-6 flex-1">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-12">
                        <Megaphone className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600">No Announcements</h3>
                        <p className="text-sm text-gray-400 mt-1">
                            Check back later for updates from your Jamath.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((announcement) => (
                            <Card key={announcement.id} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow overflow-hidden">
                                {announcement.image && (
                                    <div className="w-full h-48 bg-gray-100 relative">
                                        <img 
                                            src={announcement.image.startsWith('http') ? announcement.image : `${getApiBaseUrl()}${announcement.image}`} 
                                            alt={announcement.title} 
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                )}
                                <CardHeader className={announcement.image ? "pt-4" : ""}>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1 pr-2">
                                            <CardTitle className="text-base font-bold">{announcement.title}</CardTitle>
                                            {announcement.is_fundraiser && (
                                                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                                    Fundraiser Campaign
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium shrink-0">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(announcement.published_at), 'dd MMM yyyy')}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap mb-4">
                                        {announcement.content}
                                    </p>
                                    
                                    {announcement.is_fundraiser && (
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm mt-2">
                                            Donate Now
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
