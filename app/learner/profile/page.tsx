"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { apiFetch } from "@/lib/api";
import { logout } from "@/store/authSlice";

interface ProfileData {
  id: string;
  userId: string;
  batchId: string;
  batch: {
    id: string;
    batchTitle: string;
    startDate: string;
    endDate: string;
  } | null;
}

interface ProgressStats {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  overallProgress: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const authUser = useSelector((state: any) => state.auth.user);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await apiFetch("/learner/profile");
      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);

        // Fetch progress stats
        const progressRes = await apiFetch(`/modules/progress?courseId=${profileRes.data.batch?.courseId}`);
        if (progressRes.success && progressRes.data) {
          const completed = progressRes.data.filter((p: any) => p.status === "COMPLETED").length;
          const inProgress = progressRes.data.filter(
            (p: any) => p.status === "IN_PROGRESS" || p.status === "CONTENT_COMPLETED"
          ).length;
          const total = progressRes.data.length;

          setStats({
            totalModules: total,
            completedModules: completed,
            inProgressModules: inProgress,
            overallProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
          });
        }
      } else {
        setError("Failed to load profile.");
      }
    } catch (err) {
      setError("An error occurred while loading your profile.");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("lms_auth_token");
    router.push("/login");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    setPasswordLoading(true);

    const res = await apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    if (res.success) {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess(false);
      }, 2000);
    } else {
      setPasswordError(res.message || "Failed to change password");
    }

    setPasswordLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">View your account information and learning progress.</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center mb-6">
            <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchProfileData}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!error && (
          <>
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 mb-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-3xl font-bold text-white">{getInitials(authUser?.fullName || "")}</span>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{authUser?.fullName}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{authUser?.email}</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Active Learner
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Information */}
            {profile?.batch && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Current Batch</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Batch Name</span>
                    <span className="text-slate-900 dark:text-white font-medium">{profile.batch.batchTitle}</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Start Date</span>
                    <span className="text-slate-900 dark:text-white font-medium">{formatDate(profile.batch.startDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">End Date</span>
                    <span className="text-slate-900 dark:text-white font-medium">{formatDate(profile.batch.endDate)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Learning Progress Stats */}
            {stats && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Learning Progress</h3>

                {/* Progress Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Overall</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.overallProgress}%</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Completed</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completedModules}</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">In Progress</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.inProgressModules}</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalModules}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span>Overall Progress</span>
                    <span>{stats.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${stats.overallProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Account Information */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Account Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">User ID</span>
                  <span className="text-slate-900 dark:text-white font-mono text-sm">{authUser?.id?.substring(0, 8)}...</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Email</span>
                  <span className="text-slate-900 dark:text-white">{authUser?.email}</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Role</span>
                  <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 dark:bg-blue-500/15 dark:border-blue-500/30 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                    {authUser?.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Account Status</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => router.push("/learner/modules")}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                My Modules
              </button>
              <button
                onClick={() => router.push("/learner/results")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
                My Results
              </button>
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Change Password</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(!showChangePassword);
                    setPasswordError(null);
                    setPasswordSuccess(false);
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  {showChangePassword ? "Cancel" : "Change"}
                </button>
              </div>

              {passwordSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 rounded-lg p-4 text-emerald-700 dark:text-emerald-300 text-sm">
                  ✓ Password changed successfully!
                </div>
              ) : showChangePassword ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
                      {passwordError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                  >
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Keep your account secure by changing your password regularly.
                </p>
              )}
            </div>

            {/* Logout Button */}
            <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/20 rounded-2xl p-6">
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Want to sign out?</p>
              <button
                onClick={handleLogout}
                className="w-full bg-red-50 hover:bg-red-100 border border-red-300 text-red-600 dark:bg-red-600/20 dark:hover:bg-red-600/30 dark:border-red-600/50 dark:text-red-400 font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
