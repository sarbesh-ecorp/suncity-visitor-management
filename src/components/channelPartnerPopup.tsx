import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { id: string; name: string; phone: string; company: string }) => void;
}

type Step = "form" | "otp" | "success";

export default function ChannelPartnerPopup({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [visitorId, setVisitorId] = useState<number | null>(null);
  const [ip, setIp] = useState("Fetching...");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    company: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ────────────────────────────────────────────────
  //  Side effects
  // ────────────────────────────────────────────────

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(r => r.json())
      .then(d => setIp(d.ip || "Unknown"))
      .catch(() => setIp("—"));
  }, []);

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  const resetForm = () => {
    setStep("form");
    setOtp("");
    setOtpError("");
    setIsEditingPhone(false);
    setVisitorId(null);
    setErrors({});
    setFormData({ name: "", phone: "", company: "", notes: "" });
    setCanResend(false);
    setResendCountdown(0);
  };

  // ────────────────────────────────────────────────
  //  OTP auto-focus & paste handling
  // ────────────────────────────────────────────────

  useEffect(() => {
    if (step === "otp" && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  const handleOtpChange = (index: number, value: string) => {
    const numeric = value.replace(/\D/g, "").slice(-1);
    if (!numeric && value === "") {
      // backspace already handled in onKeyDown
      return;
    }

    const newOtp = otp.split("");
    newOtp[index] = numeric;
    const nextOtp = newOtp.join("");
    setOtp(nextOtp);

    if (numeric && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasteData.length > 0) {
      const digits = pasteData.slice(0, 4 - index).split("");
      const newOtp = otp.split("");
      digits.forEach((d, i) => {
        if (index + i < 4) newOtp[index + i] = d;
      });
      setOtp(newOtp.join(""));

      const nextFocus = Math.min(index + digits.length, 3);
      otpRefs.current[nextFocus]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = otp.split("");
        newOtp[index] = "";
        setOtp(newOtp.join(""));
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  // ────────────────────────────────────────────────
  //  Resend OTP timer
  // ────────────────────────────────────────────────

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  const startResendTimer = () => {
    setCanResend(false);
    setResendCountdown(60);
  };

  // ────────────────────────────────────────────────
  //  Form logic (same as before, just cleaner)
  // ────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const err: Record<string, string> = {};
    if (!formData.name.trim()) err.name = "Name is required";
    if (!/^[6-9]\d{9}$/.test(formData.phone)) err.phone = "Enter valid 10-digit number";
    if (!formData.company.trim()) err.company = "Company name is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const sendOtp = async (id: number) => {
    try {
      await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/channel-partner/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: id }),
      });
      startResendTimer();
    } catch {
      // silent fail or show toast in real app
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      let id = visitorId;

      if (!id) {
        const regRes = await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/channel-partner/registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const regData = await regRes.json();
        id = regData.visitorId;
        setVisitorId(id);

        await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/channel-partner/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId: id, ip }),
        });
      } else if (isEditingPhone) {
        await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/channel-partner/update-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId: id, phone: formData.phone }),
        });
      }

      await sendOtp(id!);
      setStep("otp");
      setIsEditingPhone(false);
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4 || !visitorId) {
      setOtpError("Please enter 4-digit OTP");
      return;
    }

    setLoading(true);
    setOtpError("");

    try {
      const res = await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/channel-partner/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, otp }),
      });

      if (!res.ok) throw new Error();

      onSuccess({
        id: visitorId.toString(),
        name: formData.name,
        phone: formData.phone,
        company: formData.company,
      });

      setStep("success");
    } catch {
      setOtpError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  //  Render
  // ────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 20 }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-2 border-b">
              <button
                onClick={onClose}
                className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>

              {step !== "form" && (
                <button
                  onClick={() => setStep("form")}
                  className="flex items-center text-gray-600 hover:text-gray-900 mb-1"
                >
                  <ArrowLeft className="w-5 h-5 mr-1.5" />
                  Back
                </button>
              )}

              <h2 className="text-2xl font-bold text-gray-900">
                {step === "form" && "Become a Channel Partner"}
                {step === "otp" && "Verify Your Number"}
                {step === "success" && "Welcome Aboard!"}
              </h2>

              {step === "form" && (
                <p className="mt-2 text-gray-600 text-sm">
                  Join our network and grow your business with us.
                </p>
              )}
            </div>

            <div className="p-6">
              {/* FORM */}
              {step === "form" && (
                <form className="space-y-5">
                  {[
                    { name: "name", label: "Full Name", placeholder: "John Doe" },
                    { name: "phone", label: "Phone Number", placeholder: "98XXXXXXXX" },
                    { name: "company", label: "Company Name", placeholder: "Your Company Pvt Ltd" },
                  ].map(field => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {field.label}
                      </label>
                      <input
                        name={field.name}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all ${
                          errors[field.name] ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors[field.name] && (
                        <p className="mt-1.5 text-sm text-red-600">{errors[field.name]}</p>
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Notes (optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-3.5 bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-xl disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {loading ? "Please wait..." : "Continue →"}
                  </button>
                </form>
              )}

              {/* OTP */}
              {step === "otp" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-gray-600">
                      Enter the 4-digit code sent to
                    </p>
                    <p className="font-medium text-lg mt-1">
                      +91 {formData.phone}
                    </p>

                    {isEditingPhone ? (
                      <div className="mt-4">
                        <input
                          className="w-full max-w-xs mx-auto text-center text-lg border rounded-lg py-2.5 focus:ring-2 focus:ring-amber-500"
                          value={formData.phone}
                          onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                          placeholder="Enter new number"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingPhone(true)}
                        className="mt-2 text-sm text-amber-700 hover:text-amber-800 underline"
                      >
                        Change number
                      </button>
                    )}
                  </div>

                  <div className="flex justify-center gap-3 sm:gap-4">
                    {[0, 1, 2, 3].map(i => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[i] || ""}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onPaste={e => handleOtpPaste(e, i)}
                        onKeyDown={e => handleOtpKeyDown(e, i)}
                        className="w-14 h-14 text-2xl text-center border rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                      />
                    ))}
                  </div>

                  {otpError && <p className="text-center text-red-600 text-sm">{otpError}</p>}

                  <div className="text-center text-sm">
                    {canResend ? (
                      <button
                        onClick={() => visitorId && sendOtp(visitorId)}
                        className="text-amber-700 hover:text-amber-800 font-medium"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      <p className="text-gray-500">
                        Resend in {resendCountdown}s
                      </p>
                    )}
                  </div>

                  <button
                    onClick={isEditingPhone ? handleSubmit : handleVerifyOtp}
                    disabled={loading || otp.length !== 4}
                    className="w-full py-3.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {loading ? "Verifying..." : isEditingPhone ? "Update & Resend OTP" : "Verify & Continue"}
                  </button>
                </div>
              )}

              {/* SUCCESS */}
              {step === "success" && (
                <div className="text-center py-12 space-y-6">
                  <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Registration Successful!</h3>
                    <p className="mt-3 text-gray-600">
                      Your channel partner account has been verified.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}