import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const VisitorRegistrationForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showOTPPopup, setShowOTPPopup] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [visitorId, setVisitorId] = useState<number | null>(null);
  const [ip, setIp] = useState("Fetching...");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const [formData, setFormData] = useState({
    referral: "",
    directSource: '',
    directSourceOthers: '',
    brokerName: "",
    brokerPhone: "",
    brokerId: "",
    name: "",
    email: "",
    phone: "",
    city: "",
    cityOther: "",
    pincode: "",
    projectConfig: "",
    projectDuration: '',
    notes: "",
  });

  const handleChange = (e: { target: { name: any; value: any; }; }) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((data) => setIp(data.ip || "Unknown"))
      .catch(() => setIp("Unable to fetch"));
  }, []);

  const validateStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (formData.referral === "broker") {
      if (!formData.brokerName) newErrors.brokerName = "Channel Partner name required";
      if (formData.brokerPhone.length !== 10) newErrors.brokerPhone = "Channel Partner phone required";
      if (formData.brokerId) newErrors.brokerId = "Channel Partner company name required";
    }

    // if (formData.referral === "direct") {
    //   if (!formData.directSource) newErrors.directSource = "Please select or enter a source";
    // }

    // if (formData.referral === "direct" && formData.directSource === "others") {
    //   if (!formData.directSourceOthers) newErrors.directSourceOthers = "Please enter a source";
    // }

    if (!formData.name) newErrors.name = "Name required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Enter valid 10-digit mobile number";
    }
    // if (!formData.city) newErrors.city = "City required";
    // if (formData.city === 'others' && !formData.cityOther) newErrors.cityOther = "City required";
    // if (formData.pincode.length !== 6) newErrors.pincode = "Pincode required";

    // if (!formData.projectConfig) newErrors.projectConfig = "Please select a configuration";

    // if (!formData.projectDuration) newErrors.projectDuration = "Please select a delivey time";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);

    try {
      let currentVisitorId = visitorId;

      if (!visitorId) {
        const res = await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/visitor/registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        currentVisitorId = data.visitorId;
        setVisitorId(currentVisitorId);

        await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/visitor/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId: currentVisitorId, ip }),
        });
      } else {
        await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/visitor/update-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId,
            phone: formData.phone,
          }),
        });
      }

      await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/visitor/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: currentVisitorId }),
      });

      setIsEditingPhone(false);
      setShowOTPPopup(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 4) {
      setOtpError("Please enter a valid 4-digit OTP");
      return;
    }

    try {
      setLoading(true);
      setOtpError("");
      const res = await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/visitor/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitorId: visitorId,
          otp: otp,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.message || "Invalid OTP");
        setOtp("")
        return;
      }

      setVisitorId(null);
      setFormData({
        referral: "",
        directSource: '',
        directSourceOthers: '',
        brokerName: "",
        brokerPhone: "",
        brokerId: "",
        name: "",
        email: "",
        phone: "",
        city: "",
        cityOther: "",
        pincode: "",
        projectConfig: "",
        projectDuration: '',
        notes: "",
      });

      setShowOTPPopup(false);
      await fetch("https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/visitor/final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: visitorId }),
      });
      navigate('/thank-you')
    } catch (err) {
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-[5px] p-8 md:p-12">
          <AnimatePresence mode="wait">
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-gray-800">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
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
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-4 py-3 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
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
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {errors.phone}
                    </p>
                  )}
                </div>                  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Your city
                  </label>

                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 shadow-sm focus:border-suncity-brown focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  >
                    <option value="">Select an option</option>
                    <option value="East Delhi">East Delhi</option>
                    <option value="West Delhi">West Delhi</option>
                    <option value="Soth Delhi">South Delhi</option>
                    <option value="North Delhi">North Delhi</option>
                    <option value="Gurugram">Gurugram</option>
                    <option value="Faridabad">Faridabad</option>
                    <option value="Noida">Noida</option>
                    <option value="Ghaziabad">Ghaziabad</option>
                    <option value="others">Others</option>
                  </select>

                  {errors.city && (
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {errors.city}
                    </p>
                  )}

                  {formData.city === "others" && (
                    <div className="mt-4">
                      <input
                        type="text"
                        name="cityOther"
                        placeholder="Please specify"
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 focus:border-suncity-brown focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      />
                    </div>
                  )}
                  {errors.cityOther && (
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {errors.cityOther}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  />
                  {errors.pincode && (
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {errors.pincode}
                    </p>
                  )}
                </div>                  
              </div>
              <h3 className="text-2xl font-bold text-gray-800">How did you hear about us?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {["direct", "broker"].map((opt) => (
                  <label
                    key={opt}
                    className={`border-2 rounded-xl p-6 text-center cursor-pointer transition-all ${
                      formData.referral === opt
                        ? "border-suncity-brown"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="referral"
                      value={opt}
                      checked={formData.referral === opt}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-lg font-medium capitalize">
                      {opt === "direct" ? "Direct" : opt === "broker" ? "Channel Partner" : ""}
                    </span>
                  </label>
                ))}
              </div>
              {errors.referral && (
                <p className="text-red-500 text-sm mt-2 font-medium">{errors.referral}</p>
              )}

              {formData.referral === "direct" && (
                <div className="mt-6 max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How did you hear about us?
                  </label>

                  <select
                    name="directSource"
                    value={formData.directSource}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 shadow-sm focus:border-suncity-brown focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  >
                    <option value="">Select an option</option>
                    <option value="Newspaper Ads">Newspaper Ads</option>
                    <option value="Digital">Digital</option>
                    <option value="Hoarding">Hoarding</option>
                    <option value="Reference">Reference</option>
                    <option value="others">Others</option>
                  </select>

                  {errors.directSource && (
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {errors.directSource}
                    </p>
                  )}

                  {formData.directSource === "others" && (
                    <div className="mt-4">
                      <input
                        type="text"
                        name="directSourceOthers"
                        placeholder="Please specify"
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 focus:border-suncity-brown focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      />
                    </div>
                  )}

                  {errors.directSourceOthers && (
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {errors.directSourceOthers}
                    </p>
                  )}
                </div>
              )}

              {formData.referral === "broker" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Channel Partner Name *</label>
                    <input
                      type="text"
                      name="brokerName"
                      placeholder="Channel Partner Name"
                      value={formData.brokerName}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 placeholder-gray-400 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-suncity-brown focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      required
                    />                        
                    {errors.brokerName && (
                      <p className="text-red-500 text-sm mt-2 font-medium">{errors.brokerName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Channel Partner Phone Number *</label>
                    <input
                      type="tel"
                      name="brokerPhone"
                      placeholder="Channel Partner Phone"
                      value={formData.brokerPhone}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 placeholder-gray-400 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-suncity-brown focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      required
                    />
                    {errors.brokerPhone && (
                      <p className="text-red-500 text-sm mt-2 font-medium">{errors.brokerPhone}</p>
                    )}
                  </div>                      
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Channel Partner Company *</label>
                    <input
                      type="text"
                      name="brokerId"
                      placeholder="Channel Partner Company"
                      value={formData.brokerId}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 placeholder-gray-400 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-suncity-brown focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-8">
                <div>
                  <p className="font-medium mb-4">
                    Configuration Interested In <span className="text-red-500"></span>
                  </p>
                  <div
                    className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${
                      errors.projectConfig ? "ring-2 ring-red-400 rounded-xl p-2" : ""
                    }`}
                  >
                    {["3 BHK", "4 BHK", "Both"].map((config) => (
                      <label
                        key={config}
                        className={`border-2 rounded-xl p-6 text-center cursor-pointer transition-all
                          ${
                            formData.projectConfig === config
                              ? "border-indigo-600 bg-indigo-50"
                              : errors.projectConfig
                              ? "border-red-400"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                      >
                        <input
                          type="radio"
                          name="projectConfig"
                          value={config}
                          checked={formData.projectConfig === config}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className="text-lg font-medium">{config}</span>
                      </label>
                    ))}
                  </div>
                  {errors.projectConfig && (
                    <p className="mt-3 text-sm font-medium text-red-600">
                      {errors.projectConfig}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-8">
                <div>
                  <p className="font-medium mb-4">
                    When you wants to book <span className="text-red-500"></span>
                  </p>
                  <div
                    className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${
                      errors.projectDuration ? "ring-2 ring-red-400 rounded-xl p-2" : ""
                    }`}
                  >
                    {["Immediate", "Within 2 Months", "Within 3 Months"].map((config) => (
                      <label
                        key={config}
                        className={`border-2 rounded-xl p-6 text-center cursor-pointer transition-all
                          ${
                            formData.projectDuration === config
                              ? "border-indigo-600 bg-indigo-50"
                              : errors.projectDuration
                              ? "border-red-400"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                      >
                        <input
                          type="radio"
                          name="projectDuration"
                          value={config}
                          checked={formData.projectDuration === config}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className="text-lg font-medium">{config}</span>
                      </label>
                    ))}
                  </div>
                  {errors.projectDuration && (
                    <p className="mt-3 text-sm font-medium text-red-600">
                      {errors.projectDuration}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Any Message for Us (Optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-4 py-3 ${
                      errors.notes ? "border-red-500" : "border-gray-300"
                    }`}
                  />                    
                </div>
              </div>

            </div>
          </AnimatePresence>

          <div className="mt-12 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex justify-end gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 bg-suncity-brown text-white font-medium rounded-lg hover:bg-black transition shadow-md"
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Submitting…
                  </span>
                ) : (
                  "Submit Registration"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* <AnimatePresence>
        {showOTPPopup && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          >
            <div className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-md w-full"
            >
              <div className="text-5xl mb-4"
              >
                🔐
              </div>

              <h2 className="text-2xl font-bold text-gray-800">Verify OTP</h2>
              <p className="mt-2 text-gray-600">
                Enter the 4-digit OTP sent to
              </p>

              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-semibold focus:border-suncity-brown focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setIsEditingPhone(true);
                }}
                className="mt-2 text-sm text-indigo-600 underline"
              >
                Edit phone number
              </button>
              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setOtpError("");
                }}
                className="mt-6 w-full text-center tracking-widest text-2xl font-semibold rounded-xl border border-gray-300 px-4 py-3 focus:border-suncity-brown focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                placeholder="____"
              />
              {otpError && (
                <p className="text-red-500 text-sm mt-3 font-medium">
                  {otpError}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                onClick={isEditingPhone ? handleSubmit : handleOtpSubmit}
                className="px-10 py-3 bg-suncity-brown text-white rounded-lg"
              >
                {loading
                  ? "Submitting..."
                  : isEditingPhone
                  ? "Update Phone & Resend OTP"
                  : "Submit Registration"}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence> */}
      <AnimatePresence>
        {showOTPPopup && (
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

export default VisitorRegistrationForm;