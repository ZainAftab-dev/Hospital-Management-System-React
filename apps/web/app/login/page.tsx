'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiUnreachableError, hospitalApi } from '@/lib/api';
import { useServerStatus } from '@/lib/use-server-status';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@zmhospital.com');
  const [password, setPassword] = useState('Admin@12345');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // The user pressed Login while the server was still waking up; sign in once it's ready.
  const [loginQueued, setLoginQueued] = useState(false);
  const server = useServerStatus();

  const doLogin = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await hospitalApi.login(email, password);
      // Token is stored in httpOnly cookie by the API — do not store it in localStorage
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', result.user.name);
      localStorage.setItem('userRole', result.user.role);
      router.push('/');
    } catch (err) {
      if (err instanceof ApiUnreachableError) {
        // The server went back to sleep or is restarting: wait for it, then retry.
        setLoginQueued(true);
        server.recheck();
      } else {
        setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, router, server.recheck]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    if (server.status !== 'ready') {
      setLoginQueued(true);
      if (server.status === 'offline') server.recheck();
      return;
    }
    void doLogin();
  };

  useEffect(() => {
    if (loginQueued && server.status === 'ready') {
      setLoginQueued(false);
      void doLogin();
    }
    if (server.status === 'offline') setLoginQueued(false);
  }, [loginQueued, server.status, doLogin]);

  const waiting = loginQueued && server.status !== 'ready' && server.status !== 'offline';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5b8ab8] to-[#3d5a7f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center border-2 border-white bg-white text-lg font-bold text-[#5b8ab8] rounded-lg">
            HMS
          </div>
          <h1 className="text-4xl font-bold text-white mt-4">HMS</h1>
          <p className="text-white/80 mt-2">Hospital Management System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Login</h2>

          {server.status === 'waking' && (
            <div role="status" aria-live="polite" className="mb-4 flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-sm">
              <Loader2 className="h-4 w-4 mt-0.5 shrink-0 animate-spin" aria-hidden="true" />
              <div>
                <p className="font-semibold">Waking up the demo server… {server.elapsed}s</p>
                <p className="mt-1 text-amber-800">
                  This free demo server goes to sleep when nobody has used it for a while. Starting it again
                  usually takes 30–60 seconds.{' '}
                  {loginQueued ? "You'll be signed in automatically as soon as it's ready." : 'You can press Login now and you\'ll be signed in as soon as it\'s ready.'}
                </p>
              </div>
            </div>
          )}

          {server.status === 'ready' && server.wasAsleep && !error && (
            <div role="status" aria-live="polite" className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-sm">
              The server is awake. {loginQueued || isLoading ? 'Signing you in…' : 'You can log in now.'}
            </div>
          )}

          {server.status === 'offline' && (
            <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <p className="font-semibold">The demo server isn&apos;t responding yet.</p>
              <p className="mt-1">It may still be starting up, or it may be down for maintenance. Please try again in a minute.</p>
              <button
                type="button"
                onClick={server.recheck}
                className="mt-2 font-semibold underline underline-offset-2 hover:text-red-900"
              >
                Try again
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@zmhospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#5b8ab8] text-white font-semibold py-2 rounded hover:bg-[#4a738f]"
              disabled={isLoading || waiting}
            >
              {isLoading ? 'Logging in...' : waiting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Waiting for server…
                </span>
              ) : 'Login'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center mb-3 font-semibold">Demo Credentials:</p>
            <div className="space-y-2 text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <p><strong>Email:</strong> admin@zmhospital.com</p>
              <p><strong>Password:</strong> Admin@12345</p>
              <p className="mt-3 text-gray-500">These credentials are pre-filled for demo purposes.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-8">
          © 2026 HMS — Hospital Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
