import { Shield } from "lucide-react";

// const Footer = ({ ip }: {ip: any}) => {
const Footer = () => {
  return (
    <footer className="w-full bg-black border-t border-slate-800">
      <div className="max-w-screen-2xl mx-auto px-6 py-5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">

          {/* Left: Status & Branding */}
          <div className="flex items-center gap-6 text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-medium text-slate-300">System Online</span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Shield className="w-4 h-4 text-suncity-brown" />
              <span className="text-slate-300">Secure Connection</span>
            </div>
          </div>

          {/* Center: Device Info */}
          {/* <div className="flex items-center gap-8 bg-black/30 backdrop-blur-md px-6 py-3 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-xs text-cyan-300 uppercase tracking-wider">Your IP</p>
                <p className="font-mono font-bold text-white text-lg">{ip}</p>
              </div>
            </div> */}

            {/* <div className="hidden md:flex items-center gap-3">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div>
                <p className="text-xs text-cyan-300 uppercase tracking-wider">Status</p>
                <p className="font-semibold text-emerald-300">Active Session</p>
              </div>
            </div> */}
          {/* </div> */}

          {/* Right: Company Credit */}
          <div className="text-slate-300 text-xs">
            © 2025 <span className="text-white font-semibold">Suncity Projects</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;