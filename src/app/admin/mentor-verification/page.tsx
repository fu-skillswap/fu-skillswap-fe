// =====================================================================
// src/app/admin/mentor-verification/page.tsx — Admin Verification Queue
// =====================================================================
"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as adminMentorVerificationApi from "@/lib/api/adminMentorVerificationApi";

interface AdminQueueItem {
  requestId: string;
  mentorFullName: string;
  mentorEmail: string;
  status: string;
  revisionCount: number;
  submittedAt: string | null;
  updatedAt: string | null;
}

export default function AdminMentorVerificationQueuePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [queue, setQueue] = useState<AdminQueueItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    status: "PENDING_REVIEW",
    page: 0,
    size: 20,
    sortBy: "submittedAt",
    direction: "DESC",
  });

  useEffect(() => {
    const guard = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        const roles: string[] = data.data.roles || [];
        setIsAdmin(roles.includes("ADMIN"));
      } catch {
        setIsAdmin(false);
      }
    };

    guard();
  }, []);

  useEffect(() => {
    if (isAdmin !== true) {
      setLoading(false);
      return;
    }

    const loadQueue = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await adminMentorVerificationApi.getVerificationQueue({
          status: filters.status,
          page: filters.page,
          size: filters.size,
          sortBy: filters.sortBy,
          direction: filters.direction,
        });

        setQueue(result.content);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
      } catch (err) {
        setError("Failed to load verification queue.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadQueue();
  }, [isAdmin, filters]);

  useEffect(() => {
    if (isAdmin === false) {
      navigate("/dashboard");
    }
  }, [isAdmin, navigate]);

  const handleRowClick = (requestId: string) => {
    navigate(`/admin/mentor-verification/${requestId}`);
  };

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" ? (typeof value === "number" ? value : prev.page) : 0,
    }));
  };

  if (loading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-brand-text-muted font-semibold">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight">
          Mentor Verification Queue
        </h1>
        <p className="text-brand-text-muted text-body font-medium mt-1">
          Review and process pending mentor verification requests.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-field font-semibold">
          {error}
        </div>
      )}

      <div className="meetmind-card rounded-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-body text-left border-collapse">
            <thead>
              <tr className="bg-brand-bg border-b border-brand-border text-brand-text-muted font-bold text-meta uppercase tracking-wider">
                <th className="py-4 px-6">Mentor Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-center">Revision Count</th>
                <th className="py-4 px-6">Submitted At</th>
                <th className="py-4 px-6">Updated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-brand-text-muted font-semibold">
                    No verification requests found.
                  </td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr
                    key={item.requestId}
                    onClick={() => handleRowClick(item.requestId)}
                    className="hover:bg-brand-bg/20 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 font-bold text-brand-text">
                      {item.mentorFullName}
                    </td>
                    <td className="py-4 px-6 font-semibold text-brand-text-muted">
                      {item.mentorEmail}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-block text-meta font-bold py-0.5 px-2 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-brand-text-muted">
                      {item.revisionCount}
                    </td>
                    <td className="py-4 px-6 text-brand-text-muted">
                      {formatDateTime(item.submittedAt)}
                    </td>
                    <td className="py-4 px-6 text-brand-text-muted">
                      {formatDateTime(item.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-brand-border">
          <div className="text-sm text-brand-text-muted font-semibold">
            Showing {queue.length} of {totalElements} requests (page {filters.page + 1} of {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={filters.page === 0}
              onClick={() => handleFilterChange("page", filters.page - 1)}
              className="px-3 py-1.5 rounded-field border border-brand-border text-sm font-bold text-brand-text hover:bg-brand-bg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={filters.page + 1 >= totalPages}
              onClick={() => handleFilterChange("page", filters.page + 1)}
              className="px-3 py-1.5 rounded-field border border-brand-border text-sm font-bold text-brand-text hover:bg-brand-bg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
