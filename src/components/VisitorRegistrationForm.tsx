import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ChannelPartnerPopup from "./channelPartnerPopup";

type Partner = {
  id: string;
  name: string;
  phone: string;
  company: string;
};

const VisitorRegistrationForm = () => {
  const [loading, setLoading] = useState(false);
  const [visitorId, setPartnerId] = useState<number | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [partnerResults, setPartnerResults] = useState<Partner[]>([]);
  const [searchingPartner, setSearchingPartner] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [partners, setPartners] = useState<Partner[]>([]);
  const [ip, setIp] = useState("Fetching...");
  const [showPartnerPopup, setShowPartnerPopup] = useState(false);
  
  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((data) => setIp(data.ip || "Unknown"))
      .catch(() => setIp("Unable to fetch"));
  }, []);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await fetch(
          "https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/channel-partner"
        );
        const data = await res.json();
        setPartners(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch channel partners:", err);
        setPartners([]);
      }
    };

    fetchPartners();
  }, []);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    source: "",

    directSource: "",
    directSourceOther: "",

    channelPartnerId: "",
    channelPartnerName: "",
    channelPartnerPhone: "",
    channelPartnerCompany: "",

    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientLocation: "",
    cityOther: "",
    clientAadharLast4: "",
    configuration: "",
    projectDuration: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  useEffect(() => {
    if (formData.source !== "channel-partner") {
      setFormData((prev) => ({
        ...prev,
        channelPartnerId: "",
        channelPartnerName: "",
        channelPartnerPhone: "",
        channelPartnerCompany: "",
      }));
      setPartnerResults([]);
    }
  }, [formData.source]);

  const searchPartner = (query: string) => {
    if (query.length < 4) {
      setPartnerResults([]);
      return;
    }

    setSearchingPartner(true);

    const q = query.toLowerCase();

    const filtered = partners.filter((p) => {
      const phone = String(p.phone);
      const name = p.name?.toLowerCase() || "";

      return phone.includes(q) || name.includes(q);
    });

    setPartnerResults(filtered);
    setSearchingPartner(false);
  };

  const selectPartner = (partner: Partner) => {
    setFormData((prev) => ({
      ...prev,
      channelPartnerId: partner.id,
      channelPartnerName: partner.name,
      channelPartnerPhone: partner.phone,
      channelPartnerCompany: partner.company,
    }));
    setPartnerResults([]);
  };

  const validate = () => {
    const err: Record<string, string> = {};

    if (!formData.source) {
      err.source = "Please select how you heard about us";
    }

    if (formData.source === "channel-partner") {
      if (!formData.channelPartnerId) {
        err.channelPartner = "Please select a channel partner";
      }
    }

    if (formData.source === "direct") {
      if (!formData.directSource) {
        err.directSource = "Please select source of enquiry";
      }

      if (
        formData.directSource === "Others" &&
        !formData.directSourceOther.trim()
      ) {
        err.directSourceOther = "Please specify the source";
      }
    }

    if (formData.clientEmail && !/^\S+@\S+\.\S+$/.test(formData.clientEmail)) {
      err.clientEmail = "Enter a valid email";
    }

    if (!formData.clientName.trim()) {
      err.clientName = "Client name is required";
    }

    if (formData.source === "direct" && !/^[6-9]\d{9}$/.test(formData.clientPhone)) {
      err.clientPhone = "Enter a valid 10-digit phone number";
    }

    if (formData.source === "channel-partner" && !/^[0-9]\d{3}$/.test(formData.clientPhone)) {
      err.clientPhone = "Enter a valid last 4-digit phone number";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      let currentVisitorId = visitorId;

      if (!visitorId) {
        const res = await fetch(
          "https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/new-visitor/registration",
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
        setPartnerId(currentVisitorId);

        const submitRes = await fetch(
          "https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/new-visitor/submit",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitorId: currentVisitorId, ip }),
          }
        );

        if (!submitRes.ok) throw new Error("Submit failed");
      } else {
        const updateRes = await fetch(
          "https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/new-visitor/update-phone",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              visitorId,
              clientPhone: formData.clientPhone,
            }),
          }
        );

        if (!updateRes.ok) throw new Error("Phone update failed");
      }
      if (formData.source !== "channel-partner") {
        const otpRes = await fetch(
          "https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/new-visitor/send-otp",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitorId: currentVisitorId }),
          }
        );

        if (!otpRes.ok) throw new Error("OTP send failed");

        setIsEditingPhone(false);
        setShowOTP(true);
      } else {
        navigate("/thank-you");
      }
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
        "https://ka52928lr8.execute-api.eu-north-1.amazonaws.com/new-visitor/verify-otp",
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
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-10 space-y-10 border border-gray-100"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center">
          Visitor Registration
        </h1>
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-gray-700">
            How did you hear about us?
          </label>
          <div className="flex flex-wrap gap-4">
            {["channel-partner", "direct"].map((opt) => (
              <label
                key={opt}
                className={`flex-1 min-w-[140px] border-2 rounded-xl px-6 py-5 text-center cursor-pointer transition-all
                  ${
                    formData.source === opt
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
              >
                <input
                  type="radio"
                  name="source"
                  value={opt}
                  checked={formData.source === opt}
                  onChange={handleChange}
                  className="hidden"
                />                
                <div className="font-medium">
                  {opt === "channel-partner" ? "Through Channel Partner" : "Direct Enquiry"}
                </div>
              </label>
            ))}            
          </div>
          {errors.source && (
            <p className="text-red-600 text-sm mt-2">{errors.source}</p>
          )}
        </div>

        <AnimatePresence>
          {formData.source === "direct" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="space-y-6 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700">
                  Source of Enquiry
                </label>
                <select
                  name="directSource"
                  value={formData.directSource}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 border-gray-300"
                >
                  <option value="">Select source</option>
                  <option value="Newspaper">Newspaper</option>
                  <option value="Digital">Digital / Online</option>
                  <option value="Hoarding">Hoarding / Billboard</option>
                  <option value="Reference">Reference</option>
                  <option value="Others">Others</option>
                </select>
                {errors.directSource && (
                  <p className="text-red-600 text-sm">{errors.directSource}</p>
                )}
              </div>

              {formData.directSource === "Others" && (
                <>
                <input
                  name="directSourceOther"
                  placeholder="Please specify..."
                  value={formData.directSourceOther}
                  onChange={handleChange}
                  className={`w-full rounded-lg border px-4 py-3
                    ${errors.directSourceOther ? "border-red-500" : "border-gray-300"}
                  `}
                />
                {errors.directSourceOther && (
                  <p className="text-red-600 text-sm">{errors.directSourceOther}</p>
                )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {formData.source && (
          <div className="space-y-6 pt-4 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Client Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  name="clientName"
                  placeholder="Enter full name"
                  value={formData.clientName}
                  onChange={handleChange}
                  className={`w-full rounded-lg border px-4 py-3
                    ${errors.clientName ? "border-red-500" : "border-gray-300"}
                  `}
                />
                {errors.clientName && (
                  <p className="text-red-600 text-sm">{errors.clientName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="clientEmail"
                  placeholder="example@email.com"
                  value={formData.clientEmail}
                  onChange={handleChange}
                  className={`w-full rounded-lg border px-4 py-3 border-gray-300`}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Phone *</label>
                <input
                  type="tel"
                  name="clientPhone"
                  placeholder={formData.source === 'channel-partner' ? "Last 4 digit" : "10-digit mobile number"}
                  value={formData.clientPhone}
                  onChange={handleChange}
                  className={`w-full rounded-lg border px-4 py-3
                    ${errors.clientPhone ? "border-red-500" : "border-gray-300"}
                  `}
                />
                {errors.clientPhone && (
                  <p className="text-red-600 text-sm">{errors.clientPhone}</p>
                )}
              </div>
              <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Your city
                  </label>

                  <select
                    name="clientLocation"
                    value={formData.clientLocation}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 shadow-sm focus:border-suncity-brown focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  >
                    <option value="">Select an option</option>
                    <option value="East Delhi">East Delhi</option>
                    <option value="West Delhi">West Delhi</option>
                    <option value="South Delhi">South Delhi</option>
                    <option value="North Delhi">North Delhi</option>
                    <option value="Gurugram">Gurugram</option>
                    <option value="Faridabad">Faridabad</option>
                    <option value="Noida">Noida</option>
                    <option value="Ghaziabad">Ghaziabad</option>
                    <option value="others">Others</option>
                  </select>

                  {errors.clientLocation && (
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {errors.clientLocation}
                    </p>
                  )}

                  {formData.clientLocation === "others" && (
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
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Aadhaar Last 4 Digits (optional)
              </label>
              <input
                name="clientAadharLast4"
                maxLength={4}
                placeholder="XXXX"
                value={formData.clientAadharLast4}
                onChange={(e) => {
                  if (/^\d{0,4}$/.test(e.target.value)) handleChange(e);
                }}
                className="w-full md:w-1/3 rounded-lg border px-4 py-3 border-gray-300"
              />
            </div>

            <AnimatePresence>
              {formData.source === "channel-partner" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 pt-4 border-t border-gray-200 overflow-hidden"
                >
                  <h3 className="text-xl font-semibold text-gray-800">Channel Partner Details</h3>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Search Partner by Phone or Name <br/> (Enter atleast 4 characters)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 98765..."
                      onChange={(e) => searchPartner(e.target.value.trim())}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 border-gray-300 outline-none"
                    />
                    {errors.channelPartner && (
                      <p className="text-red-600 text-sm">{errors.channelPartner}</p>
                    )}
                  </div>

                  {searchingPartner && (
                    <p className="text-indigo-600 animate-pulse">Searching partners...</p>
                  )}

                  {partnerResults.length === 0 && formData.source === "channel-partner" && (
                    <div className="border border-dashed border-indigo-400 rounded-lg p-5 bg-indigo-50 text-center space-y-3">
                      <p className="text-sm text-indigo-700 font-medium">
                        No channel partner found
                      </p>

                      <button
                    type="button"
                    onClick={() => setShowPartnerPopup(true)}
                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                  >
                    + Add New Channel Partner
                  </button>

                    </div>
                  )}

                  {partnerResults.length > 0 && (
                    <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-gray-100 bg-gray-50">
                      {partnerResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => selectPartner(p)}
                          className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-sm text-gray-600">{p.phone}</div>
                          </div>
                          <div className="text-sm text-gray-500 italic">{p.company}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.channelPartnerId && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-5 space-y-4">
                      <p className="text-sm font-medium text-green-800">Selected Partner</p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Name</span>
                          <div className="font-medium">{formData.channelPartnerName}</div>
                        </div>

                        <div>
                          <span className="text-gray-600">Phone</span>
                          <div className="font-medium">{formData.channelPartnerPhone}</div>
                        </div>

                        <div>
                          <label className="text-gray-600 block mb-1">
                            Company (editable)
                          </label>
                          <input
                            type="text"
                            name="channelPartnerCompany"
                            value={formData.channelPartnerCompany}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            placeholder="Enter company name"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-8 pt-4 border-t border-gray-200">
              <div>
                <p className="font-medium mb-4">
                  Configuration Interested In <span className="text-red-500"></span>
                </p>
                <div
                  className={`grid grid-cols-1 md:grid-cols-3 gap-6`}
                >
                  {["3 BHK", "4 BHK", "Both"].map((config) => (
                    <label
                      key={config}
                      className={`border-2 rounded-xl p-6 text-center cursor-pointer transition-all
                        ${
                          formData.configuration === config
                            ? "border-indigo-600 bg-indigo-50"
                            : errors.configuration
                            ? "border-red-400"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                    >
                      <input
                        type="radio"
                        name="configuration"
                        value={config}
                        checked={formData.configuration === config}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-lg font-medium">{config}</span>
                    </label>
                  ))}
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
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
              <textarea
                name="notes"
                placeholder="Any remarks, preferences, follow-up details..."
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border px-4 py-3 border-gray-300"
              />
            </div>
          </div>
        )}

        <div className="mt-12 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex justify-center gap-4 sm:justify-end">
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
                  {formData.clientPhone || "+91 __________"}
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
                  value={formData.clientPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, clientPhone: e.target.value }))
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

      <ChannelPartnerPopup
        isOpen={showPartnerPopup}
        onClose={() => setShowPartnerPopup(false)}
        onSuccess={(partner: Partner) => {
          setPartners((prev) => [
            ...prev,
            {
              id: partner.id,
              name: partner.name,
              phone: partner.phone,
              company: partner.company,
            },
          ]);

          setFormData((prev) => ({
            ...prev,
            channelPartnerId: partner.id,
            channelPartnerName: partner.name,
            channelPartnerPhone: partner.phone,
            channelPartnerCompany: partner.company,
          }));

          setShowPartnerPopup(false);
        }}
      />
    </div>
  );
};

export default VisitorRegistrationForm;