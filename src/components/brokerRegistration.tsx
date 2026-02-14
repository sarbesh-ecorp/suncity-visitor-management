import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ChannelPartnerRegistration = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [visitorId, setVisitorId] = useState<number | null>(null);
  const [ip, setIp] = useState("Fetching...");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    company: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((data) => setIp(data.ip || "Unknown"))
      .catch(() => setIp("Unable to fetch"));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep = () => {
    const err: Record<string, string> = {};

    if (!formData.name) err.name = "Name required";
    if (!/^[6-9]\d{9}$/.test(formData.phone))
      err.phone = "Valid phone required";
    if (!formData.company) err.company = "Company required";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);

    try {
      let currentVisitorId = visitorId;

      if (!visitorId) {
        const res = await fetch(
          "https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/channel-partner/registration",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );

        if (!res.ok) throw new Error("Registration failed");

        const data = await res.json();
        if (!data.visitorId) throw new Error("Visitor ID missing");

        currentVisitorId = data.visitorId;
        setVisitorId(currentVisitorId);

        const submitRes = await fetch(
          "https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/channel-partner/submit",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitorId: currentVisitorId, ip }),
          }
        );

        if (!submitRes.ok) throw new Error("Submit failed");
      } else {
        const updateRes = await fetch(
          "https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/channel-partner/update-phone",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              visitorId,
              phone: formData.phone,
            }),
          }
        );

        if (!updateRes.ok) throw new Error("Phone update failed");
      }

      const otpRes = await fetch(
        "https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/channel-partner/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId: currentVisitorId }),
        }
      );

      if (!otpRes.ok) throw new Error("OTP send failed");

      setIsEditingPhone(false);
      setShowOTP(true);
    } catch (err) {
      console.error(err);
      alert("Form submission failed. Please try again.");
      setShowOTP(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 4 || !visitorId) {
      setOtpError("Enter valid OTP");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        "https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/channel-partner/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId, otp }),
        }
      );

      if (!res.ok) throw new Error();
      navigate("/thank-you");
    } catch {
      setOtpError("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-10 shadow-xl">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Channel Partner Registration
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Channel Partner Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-3 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-2">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Channel Partner Phone Number*</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-3 ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-2">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Company Name *
            </label>
            <input
              name="company"
              value={formData.company}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-3 ${
                errors.company ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.company && (
              <p className="text-red-500 text-sm mt-2">{errors.company}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-3 border-gray-300"
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-suncity-brown text-white py-4 rounded-xl font-semibold"
          >
            {loading ? "Submitting..." : "Submit & Verify"}
          </button>
        </form>
      </div>

      {/* OTP MODAL */}
      <AnimatePresence>
        {showOTP && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-3xl p-10 shadow-2xl max-w-md w-full text-center"
            >
              <div className="mb-6 animate-pulse">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-100">
                  <span className="text-5xl">🔐</span>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Verify Your Phone
              </h2>

              <p className="text-gray-600 mb-8">
                We've sent a 4-digit OTP to
              </p>
              <div className="mb-6">
                <p className="text-xl font-semibold text-gray-800">
                  {formData.phone || "+91 __________"}
                </p>
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(true)}
                  className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium underline transition-colors"
                >
                  Edit phone number
                </button>
              </div>
              {isEditingPhone && (
                <motion.input
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="mb-4 w-full rounded-xl border border-gray-300 px-5 py-4 text-center text-lg font-medium focus:border-suncity-brown focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all"
                  placeholder="Enter phone number"
                  autoFocus
                />
              )}
              <div className="flex justify-center gap-3 mb-8">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[index] || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      const newOtp = otp.split("");

                      newOtp[index] = value;
                      setOtp(newOtp.join(""));
                      setOtpError("");

                      if (value && index < 3) {
                        document.getElementById(`otp-input-${index + 1}`)?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace") {
                        const newOtp = otp.split("");

                        if (otp[index]) {
                          // Clear current digit
                          newOtp[index] = "";
                          setOtp(newOtp.join(""));
                        } else if (index > 0) {
                          // Move focus back and clear previous digit
                          document.getElementById(`otp-input-${index - 1}`)?.focus();
                          newOtp[index - 1] = "";
                          setOtp(newOtp.join(""));
                        }
                      }
                    }}
                    className="w-16 h-16 text-3xl font-bold text-center rounded-xl border-2 border-gray-300 focus:border-suncity-brown focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all"
                  />
                ))}
              </div>

              {otpError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-600 text-sm font-medium mb-6"
                >
                  {otpError}
                </motion.p>
              )}

              <button
                type="button"
                disabled={loading}
                onClick={isEditingPhone ? handleSubmit : handleOtpSubmit}
                className="w-full py-4 bg-suncity-brown hover:bg-suncity-brown/90 text-white font-semibold text-lg rounded-xl shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Processing..."
                  : isEditingPhone
                  ? "Update Phone & Resend OTP"
                  : "Verify & Complete Registration"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChannelPartnerRegistration;
