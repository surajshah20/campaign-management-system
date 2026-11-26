import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Building2,
  AlertCircle,
  ArrowRight,
  Shield,
  Lock,
} from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface InvitationDetails {
  email: string;
  role: string;
  agency: {
    id: string;
    name: string;
    logoUrl?: string;
    currency?: string;
  };
}

export const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const token = searchParams.get('token');

  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('No invitation token provided. Please use the link sent by your agency admin.');
      setIsLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest<InvitationDetails>(`/api/v1/auth/invitation/${token}`);
        setDetails(data);
        setErrorMsg(null);
      } catch (err: any) {
        setErrorMsg(err.message || 'Invitation is invalid or has expired.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/auth/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({
          token,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password,
        }),
      });

      // Synchronize auth state
      await refreshProfile();
      navigate('/', { replace: true });
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 selection:bg-primary-100 selection:text-primary-800">
      <div className="w-full max-w-[440px] space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <BrandLogo size="lg" showWordmark={true} />
          <p className="text-xs text-text-secondary max-w-xs mt-1">
            Accept team invitation and join your organization's workspace.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-white p-7 shadow-card">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : errorMsg || !details ? (
            <div className="text-center py-4 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-semibold text-text-primary">
                Invitation Invalid or Expired
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                {errorMsg || 'This invitation link has expired or has already been used.'}
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button size="sm" variant="outline">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Agency Invite Badge */}
              <div className="rounded-lg border border-primary-100 bg-primary-50/60 p-3.5 space-y-1 text-xs">
                <div className="flex items-center space-x-2 text-primary-800 font-semibold">
                  <Building2 className="w-4 h-4 text-primary-600" />
                  <span>{details.agency.name}</span>
                </div>
                <p className="text-[11px] text-primary-700">
                  You have been invited as{' '}
                  <span className="font-bold underline">
                    {details.role.replace('_', ' ')}
                  </span>
                  .
                </p>
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-[11px] font-semibold text-text-primary uppercase tracking-tight mb-1">
                  Invited Email Address
                </label>
                <input
                  type="email"
                  readOnly
                  value={details.email}
                  className="flex h-9 w-full rounded-md border border-border bg-[#F2F4F7] px-3 py-1.5 text-xs text-text-secondary font-mono cursor-not-allowed"
                />
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  placeholder="e.g. Suraj"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoFocus
                />
                <Input
                  label="Last Name"
                  placeholder="e.g. Shah"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              {/* Password fields */}
              <Input
                label="Create Password"
                type="password"
                leftIcon={<Lock className="w-3.5 h-3.5" />}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="Must be at least 8 characters"
              />

              <Input
                label="Confirm Password"
                type="password"
                leftIcon={<Lock className="w-3.5 h-3.5" />}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                size="md"
                className="w-full mt-2"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Accept Invitation & Enter
              </Button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-text-muted">
          <Shield className="w-3.5 h-3.5 text-success-600" />
          <span>Encrypted Session & Multi-Tenant Access Control</span>
        </div>
      </div>
    </div>
  );
};