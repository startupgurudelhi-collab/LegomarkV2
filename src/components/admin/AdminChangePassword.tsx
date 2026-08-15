import React, { useState, useMemo } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  LogOut,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface AdminChangePasswordProps {
  onPasswordChanged: () => void;
  onLogout: () => void;
}

export const AdminChangePassword: React.FC<AdminChangePasswordProps> = ({
  onPasswordChanged,
  onLogout,
}) => {
  const { user, changePassword } = useAdminAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Real-time password criteria validation
  const criteria = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
      matches: newPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

  const allCriteriaMet =
    criteria.minLength &&
    criteria.hasUpper &&
    criteria.hasLower &&
    criteria.hasNumber &&
    criteria.hasSpecial &&
    criteria.matches;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (!criteria.matches) {
      setErrorMessage('The new password and confirmation password do not match.');
      return;
    }

    if (!allCriteriaMet) {
      setErrorMessage('Please ensure your new password satisfies all security requirements.');
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword({
        currentPassword: currentPassword.trim() ? currentPassword.trim() : undefined,
        newPassword,
        confirmPassword,
      });

      setSuccessMessage('Password successfully updated! Redirecting to Admin Management Portal...');
      setTimeout(() => {
        onPasswordChanged();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-orange-500 selection:text-white">
      {/* Background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-600/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-600/20 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-600 text-white font-black text-xl shadow-lg shadow-orange-600/30 mb-3">
            L
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            LEGOMARK INDIA
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>First Login: Password Change Required</span>
          </div>
          <p className="mt-3 text-xs text-slate-400 max-w-sm mx-auto">
            Welcome, <span className="text-slate-200 font-medium">{user?.fullName || user?.email}</span>.
            For maximum security, you must replace your temporary initial password with a permanent, secure password before accessing administrative features.
          </p>
        </div>

        {/* Change Password Card */}
        <div className="mt-8 bg-slate-900/95 backdrop-blur-md py-8 px-6 sm:px-10 border border-slate-800 rounded-2xl shadow-2xl">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Current Temporary Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Current Temporary Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter the generated temporary password"
                  disabled={isSubmitting}
                  className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                New Permanent Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create strong permanent password"
                  disabled={isSubmitting}
                  className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Confirm New Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  disabled={isSubmitting}
                  className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Policy Criteria Box */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
              <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                Password Requirements
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div
                  className={`flex items-center gap-1.5 ${
                    criteria.minLength ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {criteria.minLength ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>8+ characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    criteria.hasUpper ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {criteria.hasUpper ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Uppercase letter (A-Z)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    criteria.hasLower ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {criteria.hasLower ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Lowercase letter (a-z)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    criteria.hasNumber ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {criteria.hasNumber ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Number (0-9)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    criteria.hasSpecial ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {criteria.hasSpecial ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Special char (!@#$%&*)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    criteria.matches ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {criteria.matches ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Passwords match</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !allCriteriaMet}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Updating Password & Security Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Set Permanent Password & Continue</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sign Out Option */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Signed in as {user?.email}</span>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
