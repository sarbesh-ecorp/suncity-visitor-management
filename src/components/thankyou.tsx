import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ThankYou = () => {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const countdown = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const redirect = setTimeout(() => {
      navigate("/visitor-management");
    }, 5000);

    return () => {
      clearInterval(countdown);
      clearTimeout(redirect);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white shadow-2xl rounded-2xl p-10 max-w-lg w-full text-center transition-all duration-300 hover:scale-105">
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
          Thank You!
        </h1>

        <p className="text-xl text-gray-700 mb-6">
          Your registration has been successfully received.
        </p>

        <p className="text-lg text-gray-600 mb-8">
          We've captured your details and our team will reach out to you shortly.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg py-4 px-6 inline-block">
          <p className="text-base text-blue-800">
            Redirecting you to the home page in{" "}
            <span className="font-bold text-2xl text-blue-600">{seconds}</span>{" "}
            seconds...
          </p>
        </div>
        <div className="mt-10">
          <button
            onClick={() => navigate("/visitor-management")}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline transition-colors"
          >
            Or click here to return immediately
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;