import { Plus, FileText, Users, Building2, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const HomeScreen = ({ goToForm }: {goToForm: any}) => {
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/visitor/number");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPage(data.total);
      } catch (err) {
        console.error("Failed to load count:", err);
      }
    };
    load();
  }, []);

  return (
    <div className="homebanner relative overflow-hidden flex items-center justify-center" style={{background: 'url(/visitor-management/bg.webp) center/cover no-repeat'}}>
      <div className="relative z-10 max-w-6xl w-full text-center space-y-16">
        <div className="space-y-6 animate-fade-up">
          <div className="project-logo mx-auto w-100"><img src="/visitor-management/logo-monarch.svg" alt="" /></div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={goToForm}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[
            { icon: FileText, label: "People Visited", value: 1565 + page, color: "from-brown to-brown-600" },
            { icon: Users, label: "Total Channel Partner Registered", value: "1500+", color: "from-brown to-brown-600" },
            { icon: Building2, label: "EOI Submitted", value: 1512 + page, color: "from-brown to-brown-600" },
          ].map((stat, i) => (
            <div
              key={i}
              className="group relative bg-white backdrop-blur-2xl border border-white/10 rounded-3xl p-8 hover:bg-[#e5dcd6] hover:border-black/10 transition-all duration-500 hover:-translate-y-4"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
              />
              
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl text-white bg-gradient-to-br ${stat.color} p-3 shadow-xl`}>
                <stat.icon className="w-full h-full" strokeWidth={2.5} />
              </div>

              <p className="text-5xl font-black mt-4">{stat.value}</p>
              <p className="text-suncity-brown text-lg mt-2 font-medium">{stat.label}</p>

              <div className="mt-4 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-suncity-brown/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
        <div className="mt-20">
          <div className="h-px bg-gradient-to-r from-transparent via-suncity-brown to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
