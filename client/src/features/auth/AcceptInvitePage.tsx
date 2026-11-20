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
} from 'lucide-react';

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm shadow-subtle mb-2">
            AO
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Join Agency Workspace
          </h1>
          <p className="text-xs text-text-secondary">
            Set up your credentials to collaborate on campaigns, tasks, and media.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-border bg-white p-6 shadow-subtle">
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
              <div className="rounded-md border border-primary-100 bg-primary-50/60 p-3.5 space-y-1 text-xs">
                <div className="flex items-center space-x-2 text-primary-800 font-semibold">
                  <Building2 className="w-4 h-4 text-primary-600" />
                  <span>{details.agency.name}</span>
                </div>
                <p className="text-[11px] text-primary-700">
                  You are joining as{' '}
                  <span className="font-bold underline">
                    {details.role.replace('_', ' ')}
                  </span>
                  .
                </p>
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Your Account Email
                </label>
                <input
                  type="email"
                  readOnly
                  value={details.email}
                  className="w-full rounded-md border border-border bg-slate-50 px-3 py-2 text-xs text-text-secondary font-mono cursor-not-allowed"
                />
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Suraj"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Shah"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Create Private Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-xs"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Join Agency Workspace
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-text-muted">
          Already have an active login?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
