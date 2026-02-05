

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";

type Permissions = Record<string, string>; // e.g., { 'finance': 'admin', 'welfare': 'read' }

interface UserProfile {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_superuser: boolean;
}

interface RbacContextType {
    permissions: Permissions;
    isLoading: boolean;
    hasPermission: (module: string, minLevel?: 'read' | 'write' | 'admin') => boolean;
    refreshPermissions: () => Promise<void>;
    isStaff: boolean;
    user: UserProfile | null;
}

const RbacContext = createContext<RbacContextType | undefined>(undefined);

export function RbacProvider({ children }: { children: React.ReactNode }) {
    const [permissions, setPermissions] = useState<Permissions>({});
    const [isStaff, setIsStaff] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<UserProfile | null>(null);

    const refreshPermissions = async () => {
        try {
            // Step 1: Get My Profile to get ID.
            const profileRes = await fetchWithAuth('/api/user/profile/');
            if (!profileRes.ok) throw new Error("Not logged in");
            const profile = await profileRes.json();
            setUser(profile);

            // Superuser Override: Admins see everything
            if (profile.is_superuser) {
                // Grant all permissions
                setPermissions({
                    'finance': 'admin',
                    'welfare': 'admin',
                    'settings': 'admin',
                    'jamath': 'admin',
                    'households': 'admin',
                    'surveys': 'admin',
                    'announcements': 'admin',
                    'reports': 'admin',
                    'users': 'admin'
                });
                setIsStaff(true);
                return;
            }

            // Step 2: Get Staff Entry for this user
            // Use the dedicated 'me' endpoint to avoid permission issues
            const staffRes = await fetchWithAuth('/api/jamath/staff-members/me/');

            if (staffRes.ok) {
                const myStaffEntry = await staffRes.json();
                console.log("RBAC: Loaded staff entry:", myStaffEntry);

                setIsStaff(true);
                // Permissions are now included in the 'me' response
                if (myStaffEntry.permissions) {
                    console.log("RBAC: Using permissions from response:", myStaffEntry.permissions);
                    setPermissions(myStaffEntry.permissions);
                } else if (myStaffEntry.role) {
                    // Fallback: Fetch role if permissions not in response (backward compatibility)
                    const roleRes = await fetchWithAuth(`/api/jamath/staff-roles/${myStaffEntry.role}/`);
                    if (roleRes.ok) {
                        const roleData = await roleRes.json();
                        setPermissions(roleData.permissions || {});
                    }
                }
            } else if (staffRes.status === 403) {
                // Not a staff member or access revoked
                console.warn("RBAC: Access to staff profile denied (403), logging out");
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "/auth/signin";
            }
        } catch (err) {
            console.warn("RBAC: Failed to load permissions", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshPermissions();
    }, []);

    const hasPermission = (module: string, minLevel: 'read' | 'write' | 'admin' = 'read') => {
        // Since we blindly trust 'permissions' state which we just populated for superuser,
        // we can just stick to the check below.

        const userLevel = permissions[module];
        if (!userLevel || userLevel === 'none') return false;

        if (minLevel === 'read') return true;
        if (minLevel === 'write') return ['write', 'admin'].includes(userLevel);
        if (minLevel === 'admin') return userLevel === 'admin';

        return false;
    };

    return (
        <RbacContext.Provider value={{ permissions, isLoading, hasPermission, refreshPermissions, isStaff, user }}>
            {children}
        </RbacContext.Provider>
    );
}

export function useRbac() {
    const context = useContext(RbacContext);
    if (context === undefined) {
        throw new Error("useRbac must be used within a RbacProvider");
    }
    return context;
}
