import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-slate-800 rounded-none p-8 bg-bg-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-4 font-mono">
            Admin Dashboard
          </h2>
          <p className="text-slate-400 mb-8">
            Manage your ConsentKeys OIDC provider
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link
              href="/admin/clients"
              className="bg-bg-20 p-6 rounded-none shadow border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="text-center">
                <div className="text-3xl mb-4">🔑</div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  Client Management
                </h3>
                <p className="text-slate-400">
                  Register, approve, and manage OAuth clients
                </p>
              </div>
            </Link>

            <div className="bg-bg-20 p-6 rounded-none shadow border border-slate-800 opacity-50">
              <div className="text-center">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  Analytics
                </h3>
                <p className="text-slate-400">
                  View usage statistics and audit logs
                </p>
                <p className="text-xs text-text-secondary-50 mt-2">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
