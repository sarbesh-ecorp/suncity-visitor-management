import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  X,
  Trash2,
  Shield,
  UserCheck,
  Users,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

interface Visitor {
  id: number;
  username: string;
  name: string;
  password: string;
  allowedScreens: string[];
  current_status: boolean;
}

const allScreens = [
  { name: "Users", icon: Users },
  { name: "Client Management", icon: UserCheck },
  { name: "Client Management (NEW)", icon: UserCheck },
  { name: "Channel Partner Management", icon: UserCheck },
];

export default function VisitorSystemUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Visitor[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    password: "",
    allowedScreens: [] as string[],
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/auth/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data: Visitor[] = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      alert("Error fetching users: " + err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async () => {
    if (!formData.username || !formData.name) {
      alert("Name and username are required!");
      return;
    }
    if (!formData.password) {
      alert("Password is required when creating a new user!");
      return;
    }

    try {
      const url =  "https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/auth/register";

      const method = "POST";

      const body = { ...formData };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Operation failed");
      }

      closeModal();
      fetchUsers();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setFormData({ username: "", name: "", password: "", allowedScreens: [] });
  };

  // const startEdit = (user: Visitor) => {
  //   setEditingUser(user);
  //   setFormData({
  //     username: user.username,
  //     name: user.name,
  //     password: "", // don't prefill password
  //     allowedScreens: user.allowedScreens,
  //   });
  //   setShowAddModal(true);
  // };

  const deleteUser = async (id: number) => {
    if (!confirm("Really delete this user? This cannot be undone.")) return;

    try {
      const res = await fetch(`https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/auth/users/delete/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setUsers(users.filter((u) => u.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleStatus = async (id: number) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    try {
      const res = await fetch(`https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/auth/users/status/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_status: !user.current_status }),
      });
      if (!res.ok) throw new Error("Status update failed");

      setUsers(
        users.map((u) =>
          u.id === id ? { ...u, current_status: !u.current_status } : u
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10 text-blue-400" />
              <h1 className="text-3xl font-semibold text-white">System Users</h1>
            </div>
          </div>

          <button
            onClick={() => {
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-600 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-950 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Username
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Permissions
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="px-6 py-5 font-medium text-slate-200">{user.username}</td>
                    <td className="px-6 py-5 text-slate-300">{user.name}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        {user.allowedScreens.length === 0 ? (
                          <span className="text-slate-500 text-sm italic">No access</span>
                        ) : (
                          user.allowedScreens.map((screen) => {
                            const Icon =
                              allScreens.find((s) => s.name === screen)?.icon || Shield;
                            return (
                              <span
                                key={screen}
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-blue-950 text-blue-300 border border-blue-900/50"
                              >
                                <Icon size={14} />
                                {screen}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => toggleStatus(user.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          user.current_status ? "bg-emerald-600" : "bg-slate-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            user.current_status ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">                        
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <div
              className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-slate-950 border-b border-slate-800 px-6 py-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Create New User
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg focus:border-blue-600 outline-none transition"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg focus:border-blue-600 outline-none transition"
                    placeholder="johndoe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg focus:border-blue-600 outline-none transition"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Permissions</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allScreens.map(({ name, icon: Icon }) => (
                      <label
                        key={name}
                        className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-600 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.allowedScreens.includes(name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                allowedScreens: [...formData.allowedScreens, name],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                allowedScreens: formData.allowedScreens.filter((s) => s !== name),
                              });
                            }
                          }}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <Icon size={18} className="text-slate-400" />
                        <span className="text-slate-200">{name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    onClick={closeModal}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 bg-blue-700 hover:bg-blue-600 rounded-lg font-medium transition"
                  >
                   Create User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setDeleteConfirm(null)}
          >
            <div
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <AlertCircle className="text-red-500" size={32} />
                <h3 className="text-xl font-semibold text-white">Delete User?</h3>
              </div>
              <p className="text-slate-300 mb-8">
                This will permanently remove the user account. This action cannot be undone.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteUser(deleteConfirm)}
                  className="px-6 py-2.5 bg-red-700 hover:bg-red-600 rounded-lg font-medium transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}