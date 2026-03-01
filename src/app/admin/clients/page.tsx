"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { handleApiError } from "@/lib/error-handling";

interface Client {
  id: string;
  clientId: string;
  name: string;
  status: "pending" | "active" | "suspended" | "revoked";
  redirectUris: string[];
  scopes: string[];
  description?: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
    nextOffset: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [nameFilter, setNameFilter] = useState<string>("");

  const fetchClients = useCallback(
    async (offset = 0, limit = 20) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
        });

        if (statusFilter) params.append("status", statusFilter);
        if (nameFilter) params.append("name", nameFilter);

        const response = await fetch(`/api/clients?${params}`);
        
        if (handleApiError({ status: response.status }, router, "/admin/clients")) {
          // Do NOT set loading to false here, as we want to show loading state while redirecting
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch clients");
        }

        const data = await response.json();
        setClients(data.clients);
        setPagination(data.pagination);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    },
    [statusFilter, nameFilter, router]
  );

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleApprove = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/approve`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to approve client");
      }

      // Refresh the client list
      fetchClients(pagination.offset, pagination.limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client?")) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete client");
      }

      // Refresh the client list
      fetchClients(pagination.offset, pagination.limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses =
      "px-2 inline-flex text-xs leading-5 font-semibold rounded-none border";
    switch (status) {
      case "active":
        return `${baseClasses} bg-green-950/30 border-green-500/30 text-green-400`;
      case "pending":
        return `${baseClasses} bg-yellow-950/30 border-yellow-500/30 text-yellow-400`;
      case "suspended":
        return `${baseClasses} bg-red-950/30 border-red-500/30 text-red-400`;
      case "revoked":
        return `${baseClasses} bg-slate-950/30 border-slate-500/30 text-slate-400`;
      default:
        return `${baseClasses} bg-slate-950/30 border-slate-500/30 text-slate-400`;
    }
  };

  if (loading && clients.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-slate-100 font-mono">Clients</h1>
          <p className="mt-2 text-sm text-slate-400">
            Manage OAuth clients that can authenticate with your OIDC provider.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/admin/clients/new"
            className="inline-flex items-center justify-center rounded-none border border-transparent bg-primary-emphasis px-4 py-2 text-sm font-medium font-mono text-secondary shadow-sm hover:bg-primary-emphasis/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto transition-all h-10"
          >
            Add Client
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="status-filter"
            className="block text-sm font-medium text-slate-400"
          >
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full rounded-none border border-slate-800 shadow-sm focus:border-primary focus:ring-primary/50 focus:ring-2 sm:text-sm px-3 py-2 text-slate-200 bg-card h-9 outline-none transition-all"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="name-filter"
            className="block text-sm font-medium text-slate-400"
          >
            Name
          </label>
          <input
            type="text"
            id="name-filter"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Search by name..."
            className="mt-1 block w-full rounded-none border border-slate-800 shadow-sm focus:border-primary focus:ring-primary/50 focus:ring-2 sm:text-sm px-3 py-2 text-slate-200 placeholder-slate-500 bg-card h-9 outline-none transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-none bg-red-950/20 border border-red-500/30 p-4">
          <div className="text-sm text-red-400">{error}</div>
        </div>
      )}

      {/* Client Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-slate-800 ring-opacity-100 rounded-none border border-slate-800">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-bg-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Scopes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Created
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-bg-20 divide-y divide-slate-800">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-slate-100">
                              {client.name}
                            </div>
                            <div className="text-sm text-slate-400">
                              {client.clientId}
                            </div>
                            {client.description && (
                              <div className="text-xs text-text-secondary-50 mt-1">
                                {client.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(client.status)}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {client.scopes.join(", ")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {client.status === "pending" && (
                            <button
                              onClick={() => handleApprove(client.id)}
                              className="text-green-400 hover:text-green-300 transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          <Link
                            href={`/admin/clients/${client.id}`}
                            className="text-primary hover:text-primary/80 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing {pagination.offset + 1} to{" "}
            {Math.min(pagination.offset + pagination.limit, pagination.total)}{" "}
            of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                fetchClients(
                  Math.max(0, pagination.offset - pagination.limit),
                  pagination.limit
                )
              }
              disabled={pagination.offset === 0}
              className="px-3 py-2 text-sm font-medium font-mono text-slate-200 bg-bg-20 border border-slate-800 rounded-none hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-9"
            >
              Previous
            </button>
            <button
              onClick={() =>
                fetchClients(pagination.nextOffset!, pagination.limit)
              }
              disabled={!pagination.hasMore}
              className="px-3 py-2 text-sm font-medium font-mono text-slate-200 bg-bg-20 border border-slate-800 rounded-none hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-9"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
