import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Shield, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm shadow-subtle mb-3">
            AO
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Sign in to Agency OS
          </h1>
          <p className="text-xs text-text-secondary">
            Centralized agency operations, campaigns, and client reporting
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-border shadow-card bg-white p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-danger-100 bg-danger-50 p-3 text-xs text-danger-700 font-medium">
                {error}
              </div>
            )}

            <Input
              label="Work Email"
              type="email"
              placeholder="name@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-text-primary">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset instructions will be sent to your email.');
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Acccount Switchers */}
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              Development Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillQuickDemo('owner@apexdigital.com')}
                className="rounded border border-border p-2 text-left hover:bg-surface-subtle transition-colors"
              >
                <div className="font-semibold text-text-primary">Agency Owner</div>
                <div className="text-[10px] text-text-secondary truncate">
                  owner@apexdigital.com
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('manager@apexdigital.com')}
                className="rounded border border-border p-2 text-left hover:bg-surface-subtle transition-colors"
              >
                <div className="font-semibold text-text-primary">Campaign Mgr</div>
                <div className="text-[10px] text-text-secondary truncate">
                  manager@apexdigital.com
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('designer@apexdigital.com')}
                className="rounded border border-border p-2 text-left hover:bg-surface-subtle transition-colors"
              >
                <div className="font-semibold text-text-primary">Designer</div>
                <div className="text-[10px] text-text-secondary truncate">
                  designer@apexdigital.com
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('client@himalayancoffee.com')}
                className="rounded border border-border p-2 text-left hover:bg-surface-subtle transition-colors"
              >
                <div className="font-semibold text-text-primary">Client Portal</div>
                <div className="text-[10px] text-text-secondary truncate">
                  client@himalayancoffee.com
                </div>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-text-secondary">
          Don't have an agency workspace yet?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary-600 hover:text-primary-700"
          >
            Create an Agency
          </Link>
        </p>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-text-muted">
          <Shield className="w-3.5 h-3.5" />
          <span>Tenant Isolated & RBAC Protected</span>
        </div>
      </div>
    </div>
  );
};
