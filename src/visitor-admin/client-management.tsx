import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Eye,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  DownloadCloud,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Visitor {
  id: number;
  referral: "direct" | "broker";
  brokerName?: string;
  brokerPhone?: string;
  brokerId?: string;
  directSource?: string;
  directSourceOthers?: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  cityOther?: string;
  pincode: string;
  projectConfig?: string;
  projectDuration?: string;
  notes?: string;
  ip?: string;
  otpVerified?: boolean;
  submittedAt?: string;
}

export default function VisitorUsersList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Visitor[]>([]);
  const [selectedUser, setSelectedUser] = useState<Visitor | null>(null);
  const [search, setSearch] = useState("");
  const [exportModal, setExportModal] = useState(false);
  const [exportDate, setExportDate] = useState("");
  const [exportType, setExportType] = useState<"today" | "date">("today");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const USERS_PER_PAGE = 12;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/visitor");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load visitors:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) =>
      [u.name, u.email, u.phone, u.referral, u.brokerName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [search, users]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginated = filteredUsers.slice(
    (page - 1) * USERS_PER_PAGE,
    page * USERS_PER_PAGE
  );

  const handleExport = () => {
    let exportList = users;

    if (exportType === "today") {
      const today = new Date().toISOString().split("T")[0];
      exportList = users.filter((u) => (u.submittedAt || "").startsWith(today));
    } else if (exportDate) {
      exportList = users.filter((u) =>
        (u.submittedAt || "").startsWith(exportDate)
      );
    }

    if (exportList.length === 0) {
      alert("No visitors found for the selected criteria.");
      return;
    }

    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Referral",
      "Direct Source",
      "Direct Source Others",
      "Broker Name",
      "Broker Phone",
      "Broker Company",
      "City",
      "City Other",
      "Pincode",
      "Project Config",
      "Project Duration",
      "OTP Verified",
      "IP",
      "Submitted At",
    ];

    const rows = exportList.map((v) =>
      [
        v.id,
        v.name,
        v.email,
        v.phone,
        v.referral,
        v.directSource || "",
        v.directSourceOthers || "",
        v.brokerName || "",
        v.brokerPhone || "",
        v.brokerId || "",
        v.city,
        v.cityOther || "",
        v.pincode,
        v.projectConfig || "",
        v.projectDuration || "",
        v.otpVerified ? "Yes" : "No",
        v.ip || "",
        v.submittedAt || "",
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = ["data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n")].join("");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `visitors-${exportType === "today" ? "today" : exportDate || "custom"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-semibold text-white">Registered Visitors</h1>
              <p className="text-slate-400 mt-1">View and manage visitor submissions</p>
            </div>
          </div>

          <button
            onClick={() => setExportModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-medium transition-colors"
          >
            <DownloadCloud size={18} />
            Export CSV
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 outline-none transition"
          />
        </div>

        {/* Table / Loading / Empty */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-900/70 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-30">🔍</div>
            <h3 className="text-xl font-medium text-slate-300">No matching records</h3>
            <p className="text-slate-500 mt-2">
              {search ? "Try a different search term" : "No visitors registered yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-950 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">S.No</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hidden md:table-cell">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Referral</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {paginated.map((user, idx) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="px-6 py-5 text-sm font-mono text-slate-500">
                          {(page - 1) * USERS_PER_PAGE + idx + 1}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-white">{user.name}</div>
                              <div className="text-sm text-slate-500 md:hidden truncate max-w-[180px]">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-300 hidden md:table-cell">
                          {user.email}
                        </td>
                        <td className="px-6 py-5 text-slate-300">
                          {user.phone}
                        </td>
                        <td className="px-6 py-5 hidden sm:table-cell">
                          <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-blue-950 text-blue-300 border border-blue-900/50">
                            {user.referral}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-slate-400">
                  Page <span className="text-white font-medium">{page}</span> of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">{selectedUser.name}</h2>
                <p className="text-sm text-slate-400 mt-0.5">ID: {selectedUser.id}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Left column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <InfoRow icon={Mail} label="Email" value={selectedUser.email} />
                      <InfoRow icon={Phone} label="Phone" value={selectedUser.phone} />
                      <InfoRow
                        icon={MapPin}
                        label="City"
                        value={selectedUser.city === "others" ? selectedUser.cityOther || "—" : selectedUser.city}
                      />
                      <InfoRow icon={MapPin} label="Pincode" value={selectedUser.pincode} />
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">Referral & Project</h3>
                    <div className="space-y-4 text-sm">
                      <DetailRow label="Referral Type" value={selectedUser.referral} />
                      <DetailRow label="Direct Source" value={selectedUser.directSource || "—"} />
                      <DetailRow label="Source Details" value={selectedUser.directSourceOthers || "—"} />
                      <DetailRow label="Broker Name" value={selectedUser.brokerName || "—"} />
                      <DetailRow label="Broker Phone" value={selectedUser.brokerPhone || "—"} />
                      <DetailRow label="Broker Company/ID" value={selectedUser.brokerId || "—"} />
                      <DetailRow label="Project Config" value={selectedUser.projectConfig || "—"} />
                      <DetailRow label="Booking Timeline" value={selectedUser.projectDuration || "—"} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Declaration / Verification Section */}
              <div className="mt-10 pt-8 border-t border-slate-800">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">Verification & Metadata</h3>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    {selectedUser.otpVerified ? (
                      <CheckCircle className="text-green-500" size={28} />
                    ) : (
                      <AlertCircle className="text-red-500" size={28} />
                    )}
                    <div>
                      <div className="font-medium text-lg">
                        OTP {selectedUser.otpVerified ? "Verified" : "Not Verified"}
                      </div>
                      <div className="text-sm text-slate-400 mt-0.5">
                        Submitted: {selectedUser.submittedAt || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-slate-400">Remarks / Notes</p>
                      <p className="mt-1 whitespace-pre-wrap">{selectedUser.notes || "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">IP Address</p>
                      <p className="mt-1 font-mono">{selectedUser.ip || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setExportModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <DownloadCloud size={20} />
              Export Visitors
            </h3>

            <div className="space-y-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={exportType === "today"}
                  onChange={() => setExportType("today")}
                  className="w-4 h-4 accent-blue-600"
                />
                <span>Today's submissions only</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={exportType === "date"}
                  onChange={() => setExportType("date")}
                  className="w-4 h-4 accent-blue-600"
                />
                <span>Specific date</span>
              </label>

              {exportType === "date" && (
                <input
                  type="date"
                  value={exportDate}
                  onChange={(e) => setExportDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-blue-600 outline-none"
                />
              )}
            </div>

            <div className="flex gap-4 mt-8 justify-end">
              <button
                onClick={() => setExportModal(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-600 rounded-lg font-medium transition"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={18} className="text-slate-400 mt-0.5" />
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
        <div className="font-medium text-slate-200 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-slate-800 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}