const STORAGE_KEY = "visitor_registration";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  { id: 1, title: "Referral Source" },
  { id: 2, title: "Personal Details" },
  { id: 3, title: "Project Interest" },
  { id: 4, title: "Project Delivery" },
  { id: 5, title: "Photo & Document" },
  { id: 6, title: "Declaration" },
];

const VisitorRegistrationForm = () => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showOTPPopup, setShowOTPPopup] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [usingCamera, setUsingCamera] = useState(false);
  const [ip, setIp] = useState("Fetching...");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [visitorId, setVisitorId] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStream = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    referral: "direct",
    directSource: '',
    directSourceOthers: '',
    brokerName: "",
    brokerPhone: "",
    brokerId: "",
    name: "",
    email: "",
    phone: "",
    aadharLast4: "",
    city: "",
    cityOther: "",
    pincode: "",
    occupation: "",
    budget: "",
    projectConfig: "",
    projectDuration: '',
    notes: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.visitorId) setVisitorId(parsed.visitorId);
        if (parsed.step) setStep(parsed.step);
        if (parsed.formData) setFormData(parsed.formData);
      } catch (e) {
        console.error("Failed to restore visitor state");
      }
    }
  }, []);

  useEffect(() => {
    if (!visitorId) return;

    const payload = {
      visitorId,
      step,
      formData,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [visitorId, step, formData]);


  // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  //   setFormData({ ...formData, [e.target.name]: e.target.value });

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

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    cameraStream.current = stream;
    setUsingCamera(true);
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  const stopCamera = () => {
    cameraStream.current?.getTracks().forEach((t) => t.stop());
    setUsingCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "visitor-photo.jpg", { type: "image/jpeg" });
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(blob));
      stopCamera();
    });
  };

  const handleGalleryPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const validateStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1 && formData.referral === "broker") {
      if (!formData.brokerName) newErrors.brokerName = "Channel Partner name required";
      if (formData.brokerPhone.length !== 10) newErrors.brokerPhone = "Channel Partner phone required";
      if (formData.brokerId) newErrors.brokerId = "Channel Partner company name required";
    }

    if (step === 1 && formData.referral === "direct") {
      if (!formData.directSource) newErrors.directSource = "Please select or enter a source";
    }

    if (step === 1 && formData.referral === "direct" && formData.directSource === "others") {
      if (!formData.directSourceOthers) newErrors.directSourceOthers = "Please enter a source";
    }

    if (step === 2) {
      if (!formData.name) newErrors.name = "Name required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email address";
      }
      if (!/^[6-9]\d{9}$/.test(formData.phone)) {
        newErrors.phone = "Enter valid 10-digit mobile number";
      }
      if (!/^\d{4}$/.test(formData.aadharLast4)) {
        newErrors.aadharLast4 = "Enter exactly 4 digits";
      }
      // if (!formData.address) newErrors.address = "Address required";
      if (!formData.city) newErrors.city = "City required";
      if (formData.city === 'others' && !formData.cityOther) newErrors.cityOther = "City required";
      if (formData.pincode.length !== 6) newErrors.pincode = "Pincode required";
    }

    if (step === 3 && !formData.projectConfig) {
      newErrors.projectConfig = "Please select a configuration";
    }

    if (step === 4 && !formData.projectDuration) {
      newErrors.projectDuration = "Please select a delivey time";
    }

    if (step === 5 && !photo) {
      newErrors.photo = "Visitor photo is required";
    }

    if (step === 6 && !declarationAccepted) {
      newErrors.declaration = "You must accept the declaration";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);

    try {
      if (step === 1) {
        const step1Payload = {
          referral: formData.referral,
          brokerName: formData.referral === "broker" ? formData.brokerName : null,
          brokerPhone: formData.referral === "broker" ? formData.brokerPhone : null,
          brokerId: formData.referral === "broker" ? formData.brokerId : null,
          directSource: formData.referral === "direct" ? formData.directSource : null,
          directSourceOthers:
            formData.referral === "direct" && formData.directSource === "others"
              ? formData.directSourceOthers
              : null,
        };

        const res = await fetch("https://sar.ecis.in/api/suncity/visitor/step1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(step1Payload),
        });

        if (!res.ok) throw new Error("Step 1 failed");

        const data = await res.json();
        setVisitorId(data.visitorId);
        setStep(2);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            visitorId: data.visitorId,
            step: 2,
            formData,
          })
        );

        return;
      }

      if (step === 2 && visitorId) {
        const step2Payload = {
          visitorId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          aadharLast4: formData.aadharLast4,
          city: formData.city,
          cityOther: formData.city === "others" ? formData.cityOther : null,
          pincode: formData.pincode,
          occupation: formData.occupation || null,
          budget: formData.budget || null,
        };

        const res = await fetch("https://sar.ecis.in/api/suncity/visitor/step2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(step2Payload),
        });

        if (!res.ok) throw new Error("Step 2 failed");

        setStep(3);
        return;
      }

      if (step === 3 && visitorId) {
        const step3Payload = {
          visitorId,
          projectConfig: formData.projectConfig,
        };

        const res = await fetch("https://sar.ecis.in/api/suncity/visitor/step3", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(step3Payload),
        });

        if (!res.ok) throw new Error("Step 3 failed");

        setStep(4);
        return;
      }

      if (step === 4 && visitorId) {
        const step4Payload = {
          visitorId,
          projectDuration: formData.projectDuration,
        };

        const res = await fetch("https://sar.ecis.in/api/suncity/visitor/step4", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(step4Payload),
        });

        if (!res.ok) throw new Error("Step 4 failed");

        setStep(5);
        return;
      }

      if (step === 5 && visitorId) {
        const form = new FormData();
        form.append("visitorId", String(visitorId));
        if (photo) form.append("photo", photo);

        const res = await fetch("https://sar.ecis.in/api/suncity/visitor/documents", {
          method: "POST",
          body: form,
        });

        if (!res.ok) throw new Error("Photo upload failed");

        setStep(6);
        return;
      }

      if (step === 6 && visitorId) {
        await fetch("https://sar.ecis.in/api/suncity/visitor/declaration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId,
            declarationAccepted: true,
            notes: formData.notes || null,
          }),
        });

        await fetch("https://sar.ecis.in/api/suncity/visitor/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId, ip }),
        });

        await fetch("https://sar.ecis.in/api/suncity/visitor/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId }),
        });

        setShowOTPPopup(true);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
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
      const res = await fetch("https://sar.ecis.in/api/suncity/visitor/verify-otp", {
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
        return;
      }

      localStorage.removeItem(STORAGE_KEY);

      setVisitorId(null);
      setStep(1);
      setFormData({
        referral: "direct",
        directSource: "",
        directSourceOthers: "",
        brokerName: "",
        brokerPhone: "",
        brokerId: "",
        name: "",
        email: "",
        phone: "",
        aadharLast4: "",
        city: "",
        cityOther: "",
        pincode: "",
        occupation: "",
        budget: "",
        projectConfig: "",
        projectDuration: "",
        notes: "",
      });

      setShowOTPPopup(false);
      setShowPopup(true);
    } catch (err) {
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setShowPopup(false);
    }
  };

  // const nextStep = () => {
  //   if (!validateStep()) return;
  //   if (step < 5) {
  //     setDirection(1);
  //     setStep(step + 1);
  //   }
  // };

  const prevStep = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="relative flex flex-col items-center">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white ${
                      step >= s.id ? "bg-suncity-brown" : "bg-gray-300"
                    }`}
                    animate={{ scale: step === s.id ? 1.1 : 1 }}
                  >
                    {step > s.id ? "✓" : s.id}
                  </motion.div>
                  <p className="mt-2 text-sm font-medium text-gray-700">{s.title}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-4 bg-gray-300">
                    <motion.div
                      className="h-full bg-suncity-brown"
                      initial={{ width: "0%" }}
                      animate={{ width: step > s.id ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-[5px] p-8 md:p-12">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="space-y-8"
            >
              {step === 1 && (
                <>
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
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-6 max-w-md"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How did you hear about us? *
                      </label>

                      <select
                        name="directSource"
                        value={formData.directSource}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 shadow-sm focus:border-suncity-brown focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      >
                        <option value="">Select an option</option>
                        <option value="google">Google Search</option>
                        <option value="social">Social Media</option>
                        <option value="friend">Friend / Family</option>
                        <option value="site">Walk-in / Site Visit</option>
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
                    </motion.div>
                  )}

                  {formData.referral === "broker" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
                    </motion.div>
                  )}
                </>
              )}

              {step === 2 && (
                <>
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
                      Aadhar Last 4 Digits *
                    </label>
                    <input
                      type="text"
                      name="aadharLast4"
                      maxLength={4}
                      value={formData.aadharLast4}
                      onChange={handleChange}
                      className={`w-full rounded-lg border px-4 py-3 ${
                        errors.aadharLast4 ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.aadharLast4 && (
                      <p className="text-red-500 text-sm mt-2 font-medium">
                        {errors.aadharLast4}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Occupation
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Range
                    </label>
                    <input
                      type="text"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>
                  {/* <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full rounded-lg border px-4 py-3 ${
                        errors.address ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-2 font-medium">
                        {errors.address}
                      </p>
                    )}
                  </div> */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Your city *
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
                      Pincode *
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
                </>
              )}

              {step === 3 && (
                <>
                  <h3 className="text-2xl font-bold text-gray-800">Project Preferences</h3>
                  <div className="space-y-8">
                    <div>
                      <p className="font-medium mb-4">
                        Configuration Interested In <span className="text-red-500">*</span>
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
                </>
              )}

              {step === 4 && (
                <>
                  <h3 className="text-2xl font-bold text-gray-800">Want to book</h3>
                  <div className="space-y-8">
                    <div>
                      <p className="font-medium mb-4">
                        When you wants to book <span className="text-red-500">*</span>
                      </p>
                      <div
                        className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${
                          errors.projectDuration ? "ring-2 ring-red-400 rounded-xl p-2" : ""
                        }`}
                      >
                        {["Immediate", "With In 2 Months", "With In 3 Months"].map((config) => (
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
                </>
              )}

              {step === 5 && (
                <>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Photo & ID Document
                  </h3>

                  <div className="space-y-10">
                    <div
                      className={`rounded-xl border p-6 shadow-sm transition ${
                        errors.photo ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                      }`}
                    >
                      <p className="mb-4 text-lg font-semibold text-gray-800">
                        Visitor Photo <span className="text-red-500">*</span>
                      </p>

                      {!photoPreview ? (
                        <div className="flex flex-col items-center gap-6 md:flex-row">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="inline-flex items-center justify-center rounded-lg border-2 border-indigo-600 bg-indigo-600 px-8 py-3 font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
                          >
                            📷 Take Photo
                          </button>

                          <span className="text-gray-400 font-medium">OR</span>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-8 py-3 font-semibold text-gray-700 shadow-sm hover:border-gray-400 hover:bg-gray-50 active:scale-95 transition"
                          >
                            🖼️ Upload from Gallery
                          </button>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleGalleryPhoto}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <img
                            src={photoPreview}
                            alt="Visitor Preview"
                            className="h-48 w-48 rounded-xl object-cover border border-gray-300 shadow-md"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setPhoto(null);
                              setPhotoPreview(null);
                            }}
                            className="text-sm font-semibold text-red-600 hover:underline"
                          >
                            Retake / Change Photo
                          </button>
                        </div>
                      )}
                      {errors.photo && (
                        <p className="mt-4 text-center text-sm font-medium text-red-600">
                          {errors.photo}
                        </p>
                      )}
                      {usingCamera && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                          <div className="w-full max-w-lg rounded-xl bg-black p-4 shadow-2xl">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full rounded-lg border border-gray-700"
                            />

                            <div className="mt-6 flex justify-center gap-6">
                              <button
                                type="button"
                                onClick={capturePhoto}
                                className="inline-flex items-center justify-center rounded-lg border-2 border-indigo-600 bg-indigo-600 px-10 py-3 text-lg font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
                              >
                                Capture
                              </button>

                              <button
                                type="button"
                                onClick={stopCamera}
                                className="inline-flex items-center justify-center rounded-lg border-2 border-gray-400 bg-white px-10 py-3 text-lg font-semibold text-gray-700 shadow-sm hover:bg-gray-100 active:scale-95 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {step === 6 && (
                <div className="max-w-2xl mx-auto text-center space-y-8">
                  <h3 className="text-2xl font-bold text-gray-800">Final Declaration</h3>

                  <p className="text-gray-600 leading-relaxed">
                    I hereby declare that all the information provided above is true and
                    correct to the best of my knowledge.
                  </p>

                  <div
                    className={`flex flex-col items-center gap-4 ${
                      errors.declaration ? "rounded-xl border-2 border-red-400 p-6 bg-red-50" : ""
                    }`}
                  >
                    <label className="flex items-center justify-center gap-4 text-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={declarationAccepted}
                        onChange={(e) => {
                          setDeclarationAccepted(e.target.checked);
                          setErrors((prev) => ({ ...prev, declaration: "" }));
                        }}
                        className="w-6 h-6"
                      />
                      <span>I accept the declaration</span>
                    </label>
                    {errors.declaration && (
                      <p className="text-sm font-medium text-red-600">
                        {errors.declaration}
                      </p>
                    )}
                  </div>
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
              )}

            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
            {step > 2 ? (
              <button
                type="button"
                onClick={prevStep}
                className={`px-8 py-3 rounded-lg font-medium transition ${
                  step === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Previous
              </button>
            ) : (
              <div />
            )}

            <div className="flex justify-end gap-4">
              {step < 6 && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-10 py-3 bg-suncity-brown text-white font-medium rounded-lg hover:bg-black transition shadow-md"
                >
                  Next →
                </button>
              )}

              {step === 6 && (
                <button
                  type="submit"
                  disabled={
                    !declarationAccepted || !photo || loading
                  }
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
              )}
            </div>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {showOTPPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-md w-full"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-5xl mb-4"
              >
                🔐
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-800">Verify OTP</h2>
              <p className="mt-2 text-gray-600">Enter the 4-digit OTP sent to your phone</p>
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
                onClick={handleOtpSubmit}
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-suncity-brown text-white py-3 font-semibold transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-12 text-center shadow-2xl max-w-md"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl mb-6"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-800">Registration Successful!</h2>
              <p className="mt-4 text-gray-600">Thank you for registering. We'll get in touch soon.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisitorRegistrationForm;