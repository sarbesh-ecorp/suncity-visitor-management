import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

const TopBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = format(currentTime, "EEEE, MMMM d, yyyy");
  const formattedTime = format(currentTime, "h:mm:ss a");

  return (
    <div className="w-full border-b border-slate-700">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-8">

          {/* Logo & Company Name */}
          <div>
            <img src="https://www.suncityprojects.com/images/logo.svg" alt="Company Logo" className="h-15 w-auto" />
          </div>
          {/* <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-60 animate-pulse"></div>
              <div className="relative bg-cyan-500 p-3 rounded-xl shadow-2xl">
                <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-slate-900" />
              </div>
            </div>


            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
                SUNCITY PROJECTS
              </h1>
              <p className="text-xs sm:text-sm text-cyan-300 tracking-wider font-medium">
                BUILDING THE FUTURE
              </p>
            </div>
          </div> */}

          {/* Date & Time - Stacked on Mobile, Side-by-side on Larger Screens */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm w-full sm:w-auto">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-300 w-full sm:w-auto justify-center">
              <Calendar className="h-5 w-5 text-suncity-brown flex-shrink-0" />
              <div className="text-center sm:text-left min-w-0">
                <p className="text-suncity-brown text-xs uppercase tracking-wider">Date</p>
                <p className="font-bold text-sm sm:text-base truncate">
                  {formattedDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-300 w-full sm:w-auto justify-center">
              <Clock className="h-5 w-5 text-suncity-brown animate-spin-slow flex-shrink-0" />
              <div className="text-center sm:text-left">
                <p className="text-suncity-brown text-xs uppercase tracking-wider">Time</p>
                <p className="font-bold tabular-nums text-sm sm:text-base">
                  {formattedTime}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;