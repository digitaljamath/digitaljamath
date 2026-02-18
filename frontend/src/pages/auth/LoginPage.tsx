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

    // Forgot Password State
    const [showForgot, setShowForgot] = useState(false)
    const [forgotStep, setForgotStep] = useState(1)
    const [forgotEmail, setForgotEmail] = useState('')
    const [forgotOtp, setForgotOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [resetToken, setResetToken] = useState('')

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

    // --- Forgot Password Handlers ---
    const handleForgotEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await fetch('/api/auth/password-reset-otp/request/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail }),
            })
            // Always move to next step for security privacy
            setForgotStep(2)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleForgotOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/auth/password-reset-otp/verify/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
            })
            const data = await res.json()
            if (res.ok) {
                setResetToken(data.reset_token)
                setForgotStep(3)
            } else {
                alert(data.error || 'Invalid OTP')
            }
        } catch (err) {
            alert('Verification failed')
        } finally {
            setLoading(false)
        }
    }

    const handleNewPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/auth/password-reset-otp/confirm/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
            })

            if (res.ok) {
                alert('Password reset successful! Please login.')
                setShowForgot(false)
                setForgotStep(1)
                setForgotEmail('')
                setForgotOtp('')
                setNewPassword('')
            } else {
                alert('Failed to reset password.')
            }
        } catch (err) {
            alert('Error resetting password')
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
                            <Label htmlFor="email">Email or Username</Label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="admin@masjid.com or staff_1_name"
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

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setShowForgot(true)}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Forgot Password?
                        </button>
                    </div>

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

            {/* Forgot Password Modal */}
            {showForgot && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                        <button
                            onClick={() => { setShowForgot(false); setForgotStep(1); setForgotEmail(''); }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
                            <p className="text-sm text-gray-500">
                                {forgotStep === 1 && "Enter your email to receive a verification code."}
                                {forgotStep === 2 && "Enter the 6-digit code sent to your email."}
                                {forgotStep === 3 && "Enter your new password."}
                            </p>
                        </div>

                        {/* Step 1: Email */}
                        {forgotStep === 1 && (
                            <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input
                                        type="email"
                                        required
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        placeholder="admin@masjid.com"
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Send Code"}
                                </Button>
                            </form>
                        )}

                        {/* Step 2: OTP */}
                        {forgotStep === 2 && (
                            <form onSubmit={handleForgotOtpSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Verification Code</Label>
                                    <Input
                                        type="text"
                                        required
                                        value={forgotOtp}
                                        onChange={(e) => setForgotOtp(e.target.value)}
                                        placeholder="123456"
                                        maxLength={6}
                                        className="text-center text-2xl tracking-widest"
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Verify Code"}
                                </Button>
                                <p className="text-center text-sm text-gray-500">
                                    Didn't receive it? <button type="button" onClick={() => setForgotStep(1)} className="text-blue-600 hover:underline">Resend</button>
                                </p>
                            </form>
                        )}

                        {/* Step 3: New Password */}
                        {forgotStep === 3 && (
                            <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={8}
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Reset Password"}
                                </Button>
                            </form>
                        )}

                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-white border-t py-4">
                <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                    <p>Powered by <a href="https://digitaljamath.com" className="text-blue-600 hover:underline">DigitalJamath</a></p>
                </div>
            </footer>
        </div>
    )
}
