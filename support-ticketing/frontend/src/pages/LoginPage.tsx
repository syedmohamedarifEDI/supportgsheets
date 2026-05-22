import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Lock, Mail, Eye, EyeOff, Loader } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-navy-950">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-navy-400"
              style={{ width: `${(i + 1) * 150}px`, height: `${(i + 1) * 150}px`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          ))}
        </div>
        <div className="relative z-10">
          {/* Logo — white text, accent-colored icon to match site theme */}
          <img
            src="https://easydatagroup.com/img/edi-logo.svg"
            alt="Easy Data Integration"
            className="h-14 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}         />
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Internal Support<br />
            <span className="text-navy-300">Ticketing System</span>
          </h2>
          <p className="text-navy-400 text-lg leading-relaxed">
            Track incidents, manage projects, and resolve issues efficiently — all in one place.
          </p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-navy-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src="https://easydatagroup.com/img/edi-logo.svg"
              alt="Easy Data Integration"
              className="h-12 w-auto"
              style={{ filter: 'brightness(0) saturate(100%) invert(55%) sepia(80%) saturate(500%) hue-rotate(355deg) brightness(105%)' }}
            />
          </div>

          <div className="bg-navy-900 rounded-2xl p-8 border border-navy-800 shadow-2xl fade-in">
            <h1 className="text-2xl font-bold text-white mb-1">Sign in</h1>
            <p className="text-navy-400 text-sm mb-8">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="username@domain.com"
                    className="w-full pl-10 pr-4 py-3 bg-navy-800 border border-navy-700 rounded-xl text-white placeholder-navy-500 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-navy-800 border border-navy-700 rounded-xl text-white placeholder-navy-500 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-500 hover:text-navy-300 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2">
                {loading ? <><Loader size={16} className="spinner" /> Signing in...</> : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}