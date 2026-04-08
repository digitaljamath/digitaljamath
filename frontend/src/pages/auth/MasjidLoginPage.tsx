import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { getApiBaseUrl, getLandingPageUrl } from '@/lib/config'
import logo from '@/assets/logo.png'

export function MasjidLoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Forgot Password State
    const [showForgot, setShowForgot] = useState(false)
    const [forgotStep, setForgotStep] = useState(1)
    const [forgotEmail, setForgotEmail] = useState('')
    const [forgotOtp, setForgotOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [resetToken, setResetToken] = useState('')

    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const apiBase = getApiBaseUrl()
            const response = await fetch(`${apiBase}/api/token/`, {
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
            const apiBase = getApiBaseUrl()
            await fetch(`${apiBase}/api/auth/password-reset-otp/request/`, {
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
            const apiBase = getApiBaseUrl()
            const res = await fetch(`${apiBase}/api/auth/password-reset-otp/verify/`, {
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
            const apiBase = getApiBaseUrl()
            const res = await fetch(`${apiBase}/api/auth/password-reset-otp/confirm/`, {
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

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <a href={getLandingPageUrl()} className="flex items-center gap-2">
                        <img src={logo} alt="Logo" className="h-8 w-8 drop-shadow-sm" />
                        <span className="font-bold text-xl text-gray-900">DigitalJamath</span>
                    </a>
                    <a href={getLandingPageUrl()} className="text-sm text-gray-500 hover:text-gray-700">
                        ← Back
                    </a>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg border">
                    <div className="text-center">
                        <img src={logo} alt="Logo" className="h-12 w-12 mx-auto mb-4 drop-shadow-sm" />
                        <h1 className="text-2xl font-bold text-gray-900">Masjid Admin Login</h1>
                        <p className="text-gray-500 mt-2">Manage your DigitalJamath workspace</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Admin Email or Username</Label>
                            <Input
                                id="email"
                                type="text"
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

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Log In as Masjid'}
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
                        <p>Don't have a workspace? <a href="/register" className="text-blue-600 hover:underline">Register Masjid</a></p>
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
                    <p>Powered by <a href={getLandingPageUrl()} className="text-blue-600 hover:underline">DigitalJamath</a></p>
                </div>
            </footer>
        </div>
    )
}
