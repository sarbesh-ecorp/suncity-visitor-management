import { useState, useMemo, useEffect } from "react";
import { Eye, Search, X, Phone, Building2, User, Image, Cpu, CheckCircle, Calendar, DownloadCloud, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChannelPartner {
  id: number;
  name: string;
  phone: string;
  company: string;
  notes?: string;
  createdAt?: string;
  ip?: string;
  otpVerified?: boolean;
  submittedAt?: string; 
}

export default function ChannelPartnersAdmin() {
  const [partners, setPartners] = useState<ChannelPartner[]>([]);

  const [selectedPartner, setSelectedPartner] = useState<ChannelPartner | null>(null);
  const [search, setSearch] = useState("");
  const [exportModal, setExportModal] = useState(false);
  const [exportDate, setExportDate] = useState("");
  const [exportType, setExportType] = useState<"today" | "date" | "all">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editPartner, setEditPartner] = useState<ChannelPartner | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const PER_PAGE = 10;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          "https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/channel-partner"
        );
        const data = await res.json();
        setPartners(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load partners", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return partners;
    const q = search.toLowerCase();
    return partners.filter((p) =>
      [p.name, p.phone, p.company]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [search, partners]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExport = () => {
    let exportList = partners;

    if (exportType === "today") {
      const today = new Date().toISOString().split("T")[0];
      exportList = partners.filter((u) => (u.submittedAt || "").startsWith(today));
    } else if (exportDate) {
      exportList = partners.filter((u) =>
        (u.submittedAt || "").startsWith(exportDate)
      );
    } else if (exportType === "all") {
      exportList = partners.sort((a, b) => a.id - b.id);
    }

    if (exportList.length === 0) {
      alert("No visitors found for the selected criteria.");
      return;
    }

    const headers = [
      "ID",
      "Name",
      "Phone",
      "Company" ,     
      "Notes",
      "OTP Verified",
      "IP",
      "Submitted At",
    ];

    const rows = exportList.map((v) =>
      [
        v.id,
        v.name,
        v.phone,
        v.company,
        v.notes || "",
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

  const handleUpdate = async () => {
    if (!editPartner) return;

    setSaving(true);
    try {
      const res = await fetch(
        `https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/channel-partner/${editPartner.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editPartner),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      setPartners((prev) =>
        prev.map((p) => (p.id === editPartner.id ? editPartner : p))
      );

      setEditPartner(null);
    } catch (err) {
      alert("Failed to update partner");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
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
              <h1 className="text-3xl font-semibold text-white">Channel Partners ({partners.length})</h1>
              <p className="text-slate-400 mt-1"> View all registered channel partners</p>
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
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, phone, company..."
            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-blue-600 outline-none"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-900 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            No channel partners found
          </div>
        ) : (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-950 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs text-slate-400">S.No</th>
                    <th className="px-6 py-4 text-left text-xs text-slate-400">Name</th>
                    <th className="px-6 py-4 text-left text-xs text-slate-400">Phone</th>
                    <th className="px-6 py-4 text-left text-xs text-slate-400">Company</th>
                    <th className="px-6 py-4 text-right text-xs text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {paginated.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-800/60">
                      <td className="px-6 py-4 text-slate-500">
                        {(page - 1) * PER_PAGE + idx + 1}
                      </td>
                      <td className="px-6 py-4 font-medium">{p.name}</td>
                      <td className="px-6 py-4 text-slate-300">{p.phone}</td>
                      <td className="px-6 py-4 text-slate-300">{p.company}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedPartner(p)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm"
                          >
                            <Eye size={16} />
                            View
                          </button>

                          <button
                            onClick={() => setEditPartner(p)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 border border-blue-700 rounded-lg text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-800 rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-slate-800 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedPartner && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPartner(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
              <h2 className="text-2xl font-semibold">
                {selectedPartner.name}
              </h2>
              <button onClick={() => setSelectedPartner(null)}>
                <X />
              </button>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Info icon={User} label="Name" value={selectedPartner.name} />
                <Info icon={Phone} label="Phone" value={selectedPartner.phone} />
                <Info icon={Building2} label="Company" value={selectedPartner.company} />
                <Info icon={Image} label="Remarks" value={selectedPartner.notes || "—"} />
                <Info icon={Cpu} label="IP Address" value={selectedPartner.ip || "—"} />
                <Info
                  icon={CheckCircle}
                  label="OTP Verified"
                  value={selectedPartner.otpVerified ? "Yes" : "No"}
                />
                <Info
                  icon={Calendar}
                  label="Submitted At"
                  value={
                    selectedPartner.submittedAt
                      ? new Date(selectedPartner.submittedAt).toLocaleString()
                      : "—"
                  }
                />
                <Info
                  icon={Calendar}
                  label="Registered At"
                  value={
                    selectedPartner.createdAt
                      ? new Date(selectedPartner.createdAt).toLocaleDateString()
                      : "—"
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
                  checked={exportType === "all"}
                  onChange={() => setExportType("all")}
                  className="w-4 h-4 accent-blue-600"
                />
                <span>All Submissions</span>
              </label>
              
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

      {editPartner && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setEditPartner(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
              <h2 className="text-xl font-semibold">Edit Channel Partner</h2>
              <button onClick={() => setEditPartner(null)}>
                <X />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Input
                label="Name"
                value={editPartner.name}
                onChange={(v) => setEditPartner({ ...editPartner, name: v })}
              />
              <Input
                label="Phone"
                value={editPartner.phone}
                onChange={(v) => setEditPartner({ ...editPartner, phone: v })}
              />
              <Input
                label="Company"
                value={editPartner.company}
                onChange={(v) => setEditPartner({ ...editPartner, company: v })}
              />
              <Input
                label="Notes"
                value={editPartner.notes || ""}
                onChange={(v) => setEditPartner({ ...editPartner, notes: v })}
              />
            </div>

            <div className="flex justify-end gap-4 px-6 py-5 border-t border-slate-800">
              <button
                onClick={() => setEditPartner(null)}
                className="px-5 py-2 bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={handleUpdate}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon size={18} className="text-slate-400 mt-1" />
      <div>
        <div className="text-xs text-slate-500 uppercase">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-slate-400 uppercase">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg focus:border-blue-600 outline-none"
      />
    </div>
  );
}

