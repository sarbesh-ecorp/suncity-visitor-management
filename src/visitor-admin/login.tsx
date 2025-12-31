import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";

export default function VisitorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("permissions", JSON.stringify(data.permissions));
      localStorage.setItem("name", data.name);

      navigate("/visitor-admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 md:p-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
              <Lock className="w-8 h-8 text-indigo-600" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
                Sign in to Admin
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Enter your credentials to access the dashboard
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="block w-full pl-11 pr-4 py-3.5 rounded-lg border border-slate-300 
                           text-slate-900 placeholder:text-slate-400 
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 
                           outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="block w-full pl-11 pr-4 py-3.5 rounded-lg border border-slate-300 
                           text-slate-900 placeholder:text-slate-400 
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 
                           outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoading}
              className={`
                w-full flex items-center justify-center gap-2.5 px-10 py-3 bg-suncity-brown text-white font-medium rounded-lg hover:bg-black transition shadow-md
              `}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>                  
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Admin Panel
        </p>
      </div>
    </div>
  );
}