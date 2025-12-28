import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Construction } from "lucide-react";

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-gray-500 mt-1">Manage staff access and permissions</p>
            </div>

            <Card className="border-0 bg-white/60 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCog className="h-6 w-6 text-indigo-500" />
                        Under Construction
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Construction className="h-20 w-20 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Coming Soon</h3>
                        <p className="text-gray-500 max-w-md">
                            User management will enable role-based access control, allowing you to
                            invite staff members and assign specific permissions.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
