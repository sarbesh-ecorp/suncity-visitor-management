import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Users, UserCheck } from "lucide-react";

export default function VisitorDashboard() {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [name, setName] = useState("Admin");

  useEffect(() => {
    const storedPermissions = localStorage.getItem("permissions");
    const storedName = localStorage.getItem("name");

    if (storedPermissions) {
      setPermissions(JSON.parse(storedPermissions));
    }
    if (storedName) {
      setName(storedName);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("permissions");
    localStorage.removeItem("name");
    navigate("/visitor-admin/login");
  };

  const allMenuItems = [
    {
      title: "Client Management",
      icon: Users,
      path: "/visitor-admin/client-management",
      desc: "View and manage all clients",
    },
    {
      title: "Users",
      icon: UserCheck,
      path: "/visitor-admin/users",
      desc: "Administer system users",
    },
  ];

  const menuItems = allMenuItems.filter((item) =>
    permissions.includes(item.title)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome back, {name}
            </p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">
          Quick Access
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={() => navigate(item.path)}
              className="cursor-pointer bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-indigo-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {item.title}
              </h3>
              <p className="text-gray-500 text-sm">
                {item.desc}
              </p>

              <div className="mt-4 text-indigo-600 text-sm font-medium">
                Open →
              </div>
            </div>
          ))}
        </div>
      </main>      
    </div>
  );
}