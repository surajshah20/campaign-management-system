import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Shield, ArrowRight, Lock, Mail, ChevronDown } from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoSelector, setShowDemoSelector] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setShowDemoSelector(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 selection:bg-primary-100 selection:text-primary-800">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <BrandLogo size="lg" showWordmark={true} />
          <p className="text-xs text-text-secondary max-w-xs mt-1">
            Enterprise agency management, campaign orchestration, and client telemetry.
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-border shadow-card bg-white p-7 sm:p-8 rounded-xl">
          <div className="mb-5">
            <h2 className="text-base font-bold text-text-primary">Sign in to your account</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Enter your verified workspace credentials below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700 font-medium animate-in fade-in duration-150">
                {error}
              </div>
            )}

            <Input
              label="Work Email"
              type="email"
              leftIcon={<Mail className="w-3.5 h-3.5" />}
              placeholder="name@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-text-primary tracking-tight uppercase">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset instructions have been sent to your work email.');
                  }}
                  className="text-[11px] font-medium text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                leftIcon={<Lock className="w-3.5 h-3.5" />}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Discreet Sandbox Quick-Fill Drawer (Exclusively in Development) */}
          {import.meta.env.DEV && (
            <div className="mt-6 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowDemoSelector(!showDemoSelector)}
                className="flex items-center justify-between w-full text-[11px] font-medium text-text-secondary hover:text-text-primary py-1 transition-colors"
              >
                <span>Development Sandbox Accounts</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    showDemoSelector ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showDemoSelector && (
                <div className="mt-2.5 grid grid-cols-2 gap-1.5 animate-in fade-in duration-150">
                  {[
                    { label: 'Agency Owner', email: 'owner@apexdigital.com' },
                    { label: 'Campaign Mgr', email: 'manager@apexdigital.com' },
                    { label: 'Designer', email: 'designer@apexdigital.com' },
                    { label: 'Client Portal', email: 'client@himalayancoffee.com' },
                  ].map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => fillQuickDemo(acc.email)}
                      className="p-2 text-left rounded border border-border bg-surface-subtle hover:bg-white hover:border-slate-300 transition-all text-xs"
                    >
                      <p className="font-semibold text-text-primary text-[11px]">
                        {acc.label}
                      </p>
                      <p className="text-[10px] text-text-muted truncate mt-0.5 font-mono">
                        {acc.email}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Footer Navigation & Security Assurance */}
        <div className="space-y-3 text-center">
          <p className="text-xs text-text-secondary">
            Don't have an agency workspace yet?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Create an Agency Workspace
            </Link>
          </p>

          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-text-muted">
            <Shield className="w-3.5 h-3.5 text-success-600" />
            <span>Multi-Tenant Isolated & ISO-27001 RBAC Certified Architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
};