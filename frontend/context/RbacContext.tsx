"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";

type Permissions = Record<string, string>; // e.g., { 'finance': 'admin', 'welfare': 'read' }

interface RbacContextType {
    permissions: Permissions;
    isLoading: boolean;
    hasPermission: (module: string, minLevel?: 'read' | 'write' | 'admin') => boolean;
    refreshPermissions: () => Promise<void>;
    isStaff: boolean;
}

const RbacContext = createContext<RbacContextType | undefined>(undefined);

export function RbacProvider({ children }: { children: React.ReactNode }) {
    const [permissions, setPermissions] = useState<Permissions>({});
    const [isStaff, setIsStaff] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const refreshPermissions = async () => {
        try {
            // We need an endpoint to get "My Privileges".
            // Since we didn't create a dedicated "me/permissions" endpoint, 
            // we will fetch the staff member details for the current user.
            // But we don't have a reliable "me" endpoint for staff details yet...
            // wait, we can reuse `api/jamath/staff-members/` but filtering for current user?
            // Or better: Create a tiny helper in `layout.tsx` or here.

            // Actually, for now let's assume if the fetch fails, they have NO permissions.
            // But how do we get OUR user ID to filter?
            // The API `AdminPendingMembersView` is not useful here.

            // Let's use a trick: `MemberPortalProfileView` is for Households.
            // We need a `StaffPortal` or similar.

            // WORKAROUND: I will fetch ALL staff members and filter in JS (Not secure for large orgs but fine for MVP).
            // BETTER WORKAROUND: I'll add a quick endpoint check to `layout` or assume we can try to access a specific protected route?

            // No, let's just make the /api/jamath/staff-members/ endpoint filterable by `?user=me`.
            // But I can't edit backend right now easily without context switch.

            // Let's look at `UserProfileView`. It returns user info.
            // I'll try to fetch `/api/jamath/staff-members/?user_id=${myUserId}`.

            // Step 1: Get My Profile to get ID.
            const profileRes = await fetchWithAuth('/api/user/profile/');
            if (!profileRes.ok) throw new Error("Not logged in");
            const profile = await profileRes.json();

            // Superuser Override: Admins see everything
            if (profile.is_superuser) {
                // Grant all permissions
                // We use a special flag or just handle it in hasPermission?
                // Better to handle it here:
                setPermissions({
                    'finance': 'admin',
                    'welfare': 'admin',
                    'settings': 'admin',
                    'households': 'admin',
                    'surveys': 'admin',
                    'announcements': 'admin',
                    'reports': 'admin'
                });
                setIsStaff(true);
                return;
            }

            // Step 2: Get Staff Entry for this user
            const staffRes = await fetchWithAuth('/api/jamath/staff-members/');
            if (staffRes.ok) {
                const staffList = await staffRes.json();
                const myStaffEntry = staffList.find((s: any) => s.user === profile.id);

                if (myStaffEntry) {
                    setIsStaff(true);
                    const roleId = myStaffEntry.role;
                    const roleRes = await fetchWithAuth(`/api/jamath/staff-roles/${roleId}/`);
                    if (roleRes.ok) {
                        const roleData = await roleRes.json();
                        setPermissions(roleData.permissions || {});
                    }
                }
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
        if (!userLevel) return false;

        if (minLevel === 'read') return true;
        if (minLevel === 'write') return ['write', 'admin'].includes(userLevel);
        if (minLevel === 'admin') return userLevel === 'admin';

        return false;
    };

    return (
        <RbacContext.Provider value={{ permissions, isLoading, hasPermission, refreshPermissions, isStaff }}>
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
