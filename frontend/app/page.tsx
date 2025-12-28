"use client";

import { useEffect, useState } from "react";
import { MainLanding } from "@/components/MainLanding";
import { TenantLanding } from "@/components/TenantLanding";

export default function Home() {
  const [isTenant, setIsTenant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;

    // Skip tenant detection for IP addresses
    const isIPAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isIPAddress) {
      setIsTenant(false);
      setIsLoading(false);
      return;
    }

    // Check for localhost subdomain (e.g., demo.localhost)
    const isLocalhostSubdomain = hostname.endsWith(".localhost") && hostname !== "localhost";

    // Check for production subdomain (e.g., demo.digitaljamath.com)
    // Must have more than 2 parts and not start with 'www'
    const parts = hostname.split('.');
    const isProductionSubdomain = parts.length > 2 && !hostname.startsWith('www');

    if (isLocalhostSubdomain || isProductionSubdomain) {
      setIsTenant(true);
    }

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return isTenant ? <TenantLanding /> : <MainLanding />;
}
