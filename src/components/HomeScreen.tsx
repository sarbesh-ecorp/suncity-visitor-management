import { Plus, FileText, Users, Building2, ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const HomeScreen = () => {
  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState(1);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/visitor/number");
        const res1 = await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/visitor/number");
        // if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const data1= await res1.json();
        setPage(data.total);
        setChannel(data1.total);
      } catch (err) {
        console.error("Failed to load count:", err);
      }
    };
    load();
  }, []);

  const handleContinue = () => {
    if (type === "partner") {
      navigate("/channel-partner-registration");
    }
    if (type === "client") {
      navigate("/visitor-registration");
    }
    setOpen(false);
  };

  return (
    <>
      {/* MAIN SCREEN */}
      <div
        className="homebanner relative overflow-hidden flex items-center justify-center"
        style={{ background: "url(/visitor-management/bg.webp) center/cover no-repeat" }}
      >
        <div className="relative z-10 max-w-6xl w-full text-center space-y-16">
          <div className="space-y-6 animate-fade-up">
            <div className="project-logo mx-auto w-100">
              <img src="/visitor-management/logo-monarch.svg" alt="" />
            </div>
          </div>

          {/* BUTTON */}
          <div className="flex justify-center">
            <button
              onClick={() => setOpen(true)}
              className="group relative lg:px-12 lg:py-8 px-6 py-4 bg-suncity-brown text-white font-bold lg:text-xl rounded-2xl shadow-2xl hover:shadow-black/50 transform hover:scale-105 transition-all duration-500 overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 translate-x-[-100%] group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />
              <div className="flex items-center gap-4">
                <Plus className="lg:w-10 lg:h-10 group-hover:rotate-90 transition duration-700" strokeWidth={3} />
                <span className="tracking-wider">START NEW REGISTRATION</span>
                <ArrowRight className="lg:w-8 lg:h-8 group-hover:translate-x-4 transition duration-300" />
              </div>
            </button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {[
              { icon: FileText, label: "People Visited", value: 1565 + page+'+' },
              { icon: Users, label: "Total Channel Partner Registered", value: 1500 + channel+'+'},
              { icon: Building2, label: "EOI Submitted", value: 1512 + page+'+' },
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-3xl p-8 hover:bg-[#e5dcd6] transition-all duration-500 hover:-translate-y-4"
              >
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-suncity-brown" />
                <p className="text-5xl font-black mt-4">{stat.value}</p>
                <p className="text-suncity-brown text-lg mt-2 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 relative animate-fade-up">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              <X />
            </button>

            <h2 className="text-2xl font-bold text-center mb-6">
              Select Registration Type
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:border-suncity-brown">
                <input
                  type="radio"
                  name="type"
                  value="partner"
                  onChange={() => setType("partner")}
                  className="w-5 h-5 accent-suncity-brown"
                />
                <span className="text-lg font-medium">Channel Partner</span>
              </label>

              <label className="flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:border-suncity-brown">
                <input
                  type="radio"
                  name="type"
                  value="client"
                  onChange={() => setType("client")}
                  className="w-5 h-5 accent-suncity-brown"
                />
                <span className="text-lg font-medium">Client</span>
              </label>
            </div>

            <button
              disabled={!type}
              onClick={handleContinue}
              className="mt-8 w-full bg-suncity-brown text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HomeScreen;
