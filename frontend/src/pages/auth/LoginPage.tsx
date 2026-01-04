import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { getApiBaseUrl } from '@/lib/config'

export function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [tenantName, setTenantName] = useState<string | null>(null)
    const [tenantError, setTenantError] = useState<string | null>(null)
    const [checkingTenant, setCheckingTenant] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const checkTenant = async () => {
            const hostname = window.location.hostname
            const subdomain = hostname.split('.')[0]

            // If no subdomain (just localhost or digitaljamath.com), redirect to main site
            if (hostname === 'localhost' || hostname === 'digitaljamath.com' || subdomain === 'localhost' || subdomain === 'www') {
                setTenantError('Please access your masjid via its subdomain (e.g., demo.digitaljamath.com)')
                setCheckingTenant(false)
                return
            }

            try {
                const apiBase = getApiBaseUrl()
                const res = await fetch(`${apiBase}/api/tenant-info/`)

                if (!res.ok) {
                    setTenantError('Masjid not found. Please check the URL or contact support.')
                    setCheckingTenant(false)
                    return
                }

                const data = await res.json()

                if (data.is_public) {
                    setTenantError('This is not a valid masjid subdomain.')
                    setCheckingTenant(false)
                    return
                }

                setTenantName(data.name || subdomain)
                setCheckingTenant(false)
            } catch (err) {
                setTenantError('Unable to verify masjid. Please try again.')
                setCheckingTenant(false)
            }
        }

        checkTenant()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password }),
            })

            if (!response.ok) {
                throw new Error('Invalid credentials')
            }

            const data = await response.json()
            localStorage.setItem('access_token', data.access)
            localStorage.setItem('refresh_token', data.refresh)
            navigate('/dashboard')
        } catch (err) {
            setError('Invalid email or password')
        } finally {
            setLoading(false)
        }
    }

    // Loading state
    if (checkingTenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Verifying masjid...</p>
                </div>
            </div>
        )
    }

    // Error state - tenant not found
    if (tenantError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-lg border">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Masjid Not Found</h1>
                    <p className="text-gray-500 mb-6">{tenantError}</p>
                    <a
                        href="/find-masjid"
                        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Find Your Masjid
                    </a>
                </div>
            </div>
        )
    }

    // Normal login form
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-8 w-8" />
                        <span className="font-bold text-xl text-gray-900">{tenantName}</span>
                    </a>
                    <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
                        ← Back to Home
                    </a>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg border">
                    <div className="text-center">
                        <img src="/logo.png" alt="Logo" className="h-12 w-12 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900">{tenantName}</h1>
                        <p className="text-gray-500 mt-2">Staff Login</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@masjid.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-gray-500 pt-4 border-t space-y-2">
                        <p>Member? <a href="/portal/login" className="text-blue-600 hover:underline">Login via OTP</a></p>
                        {window.location.hostname.startsWith('demo.') && (
                            <p className="text-xs text-amber-600 font-medium bg-amber-50 py-2 rounded-md border border-amber-100 italic">
                                Demo environment resets every 24 hours.
                            </p>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t py-4">
                <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                    <p>Powered by <a href="https://digitaljamath.com" className="text-blue-600 hover:underline">DigitalJamath</a></p>
                </div>
            </footer>
        </div>
    )
}
