import { useEffect, useState } from "react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Trash2, Calendar, Plus, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fetchWithAuth } from "@/lib/api";

interface Announcement {
    id: number;
    title: string;
    content: string;
    published_at: string;
    expires_at: string | null;
    created_by_name?: string;
    status: 'DRAFT' | 'PUBLISHED';
}

export function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        published_at: "",
        expires_at: ""
    });





    const fetchAnnouncements = async (statusFilter?: string) => {
        setLoading(true);
        try {
            let url = '/api/jamath/announcements/';
            if (statusFilter && statusFilter !== 'ALL' && statusFilter !== 'SCHEDULED') {
                url += `?status=${statusFilter}`;
            }

            const res = await fetchWithAuth(url);
            if (res.ok) {
                let data: Announcement[] = await res.json();

                if (statusFilter === 'SCHEDULED') {
                    const now = new Date();
                    data = data.filter(a => a.status === 'PUBLISHED' && new Date(a.published_at) > now);
                } else if (statusFilter === 'PUBLISHED') {
                    const now = new Date();
                    data = data.filter(a =>
                        a.status === 'PUBLISHED' &&
                        new Date(a.published_at) <= now &&
                        (!a.expires_at || new Date(a.expires_at) > now)
                    );
                }

                setAnnouncements(data);
            }
        } catch (error) {
            console.error("Failed to fetch announcements", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleCreate = async (status: 'DRAFT' | 'PUBLISHED' = 'PUBLISHED') => {
        if (!formData.title || !formData.content) {
            showMessage('error', 'Title and Content are required.');
            return;
        }

        try {
            const payload: any = {
                title: formData.title,
                content: formData.content,
                status: status,
                expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
            };

            if (formData.published_at) {
                payload.published_at = new Date(formData.published_at).toISOString();
            }

            const res = await fetchWithAuth('/api/jamath/announcements/', {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                showMessage('success', status === 'DRAFT' ? 'Draft saved.' : 'Announcement published.');
                setIsCreateOpen(false);
                setFormData({ title: "", content: "", published_at: "", expires_at: "" });
                fetchAnnouncements();
            } else {
                showMessage('error', 'Failed to save announcement.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this announcement?")) return;

        try {
            const res = await fetchWithAuth(`/api/jamath/announcements/${id}/`, {
                method: "DELETE",
            });

            if (res.ok) {
                showMessage('success', 'Announcement removed.');
                fetchAnnouncements();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Toast Message */}
            {message && (
                <div className={`fixed top-4 right-4 z-100 px-4 py-3 rounded-lg shadow-lg ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
                    <p className="text-muted-foreground">Manage public announcements for the Jamath.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>New Announcement</DialogTitle>
                            <DialogDescription>
                                Share news, updates, or events with all members.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., General Body Meeting"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Content <span className="text-red-500">*</span></Label>
                                <Textarea
                                    id="content"
                                    placeholder="Enter detailed information..."
                                    className="h-32"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="publish_at">Publish Date (Optional)</Label>
                                    <Input
                                        id="publish_at"
                                        type="datetime-local"
                                        value={formData.published_at}
                                        onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Leave empty to publish now.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expiry">Diffuses On (Optional)</Label>
                                    <Input
                                        id="expiry"
                                        type="datetime-local"
                                        value={formData.expires_at}
                                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Detailed view hidden after this.</p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button variant="secondary" onClick={() => handleCreate('DRAFT')}>Save as Draft</Button>
                            <Button
                                onClick={() => handleCreate('PUBLISHED')}
                                disabled={!formData.title || !formData.content}
                            >
                                {formData.published_at ? 'Schedule' : 'Publish'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="ALL" onValueChange={(val) => fetchAnnouncements(val)} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="ALL">All</TabsTrigger>
                    <TabsTrigger value="PUBLISHED">Published</TabsTrigger>
                    <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
                    <TabsTrigger value="DRAFT">Drafts</TabsTrigger>
                </TabsList>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <p>Loading...</p>
                    ) : announcements.length === 0 ? (
                        <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                            <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No Announcements Found</h3>
                            <p className="text-muted-foreground">Try adjusting the filter or create a new one.</p>
                        </div>
                    ) : (
                        announcements.map((item) => (
                            <Card key={item.id} className="flex flex-col relative">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-semibold line-clamp-2">
                                            {item.title}
                                        </CardTitle>
                                        <div className="flex gap-1">
                                            {item.status === 'DRAFT' && <Badge variant="secondary">Draft</Badge>}
                                            {item.status === 'PUBLISHED' && new Date(item.published_at) > new Date() && <Badge variant="outline">Scheduled</Badge>}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 -mt-2 -mr-2"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardDescription className="flex items-center text-xs flex-wrap gap-1">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {format(new Date(item.published_at), "MMM d, yyyy h:mm a")}
                                        {item.created_by_name && (
                                            <span className="ml-2 pl-2 border-l border-gray-300">
                                                By {item.created_by_name}
                                            </span>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">
                                        {item.content}
                                    </p>
                                </CardContent>
                                <CardFooter className="pt-2 pb-4 text-xs border-t bg-muted/20 flex justify-between items-center">
                                    {item.expires_at ? (
                                        <span className="text-muted-foreground">Diffuses on: {format(new Date(item.expires_at), "MMM d, yyyy h:mm a")}</span>
                                    ) : <span />}

                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            </Tabs>
        </div>
    );
}
