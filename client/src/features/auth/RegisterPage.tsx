import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ShieldCheck, ArrowRight, Building2, Mail, Lock } from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register({
        firstName,
        lastName,
        agencyName,
        email,
        password,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create agency account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 selection:bg-primary-100 selection:text-primary-800">
      <div className="w-full max-w-[460px] space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <BrandLogo size="lg" showWordmark={true} />
          <p className="text-xs text-text-secondary max-w-xs mt-1">
            Set up your organization's digital agency headquarters in seconds.
          </p>
        </div>

        {/* Register Card */}
        <Card className="border border-border shadow-card bg-white p-7 sm:p-8 rounded-xl">
          <div className="mb-5">
            <h2 className="text-base font-bold text-text-primary">Create Agency Workspace</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              You will automatically be provisioned as the Agency Owner.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700 font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="Aarav"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                placeholder="Sharma"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Agency Organization Name"
              leftIcon={<Building2 className="w-3.5 h-3.5" />}
              placeholder="e.g. Apex Digital Agency"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              required
            />

            <Input
              label="Work Email"
              type="email"
              leftIcon={<Mail className="w-3.5 h-3.5" />}
              placeholder="owner@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Secure Master Password"
              type="password"
              leftIcon={<Lock className="w-3.5 h-3.5" />}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              helperText="Minimum 8 characters with numbers and symbols."
            />

            <Button
              type="submit"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Initialize Workspace
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <div className="space-y-3 text-center">
          <p className="text-xs text-text-secondary">
            Already have an agency account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Sign In
            </Link>
          </p>

          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-success-600" />
            <span>Automatic Growth Plan Sandbox Provisioned</span>
          </div>
        </div>
      </div>
    </div>
  );
};