import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ShieldCheck, ArrowRight } from 'lucide-react';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm shadow-subtle mb-3">
            AO
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Create Agency Workspace
          </h1>
          <p className="text-xs text-text-secondary">
            Set up your multi-tenant agency headquarters in seconds
          </p>
        </div>

        <Card className="border border-border shadow-card bg-white p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-danger-100 bg-danger-50 p-3 text-xs text-danger-700 font-medium">
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
              placeholder="e.g. Apex Digital Media"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              helperText="This creates your isolated tenant workspace"
              required
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="owner@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Launch Agency Workspace
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-text-secondary">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-600 hover:text-primary-700"
          >
            Sign in
          </Link>
        </p>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-success-600" />
          <span>PostgreSQL-Ready Multi-Tenancy & Isolated Database</span>
        </div>
      </div>
    </div>
  );
};
