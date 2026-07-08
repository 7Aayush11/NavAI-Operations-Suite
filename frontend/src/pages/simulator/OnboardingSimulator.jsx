import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { 
  Cpu, Play, Pause, RotateCcw, AlertTriangle, CheckCircle, 
  Smartphone, Monitor, Globe, Navigation, RefreshCw, Send, 
  FileText, Shield, User, DollarSign, Database, Loader2, Info
} from 'lucide-react';

const OnboardingSimulator = () => {
  // Simulator state
  const [mode, setMode] = useState('MANUAL'); // MANUAL or AUTOMATIC
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0 to 7
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  const autoPlayTimeoutRef = useRef(null);

  // Active Session info
  const [appId, setAppId] = useState(null);
  const [sessId, setSessId] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  
  // Forms states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loanType, setLoanType] = useState('Personal Loan');
  const [loanAmount, setLoanAmount] = useState('500000');
  const [branchName, setBranchName] = useState('Worli Hub');
  
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  
  // Operation Messages
  const [statusMsg, setStatusMsg] = useState('Idle. Start a new loan application to begin simulation.');
  const [errorMsg, setErrorMsg] = useState('');
  const [bulkSeeding, setBulkSeeding] = useState(false);
  const [seedSummary, setSeedSummary] = useState(null);

  // Predefined Steps sequence
  const steps = [
    { label: "Start", name: "Application Started" },
    { label: "PAN", name: "PAN Uploaded" },
    { label: "Aadhaar", name: "Aadhaar Uploaded" },
    { label: "OTP", name: "OTP Verified" },
    { label: "Bank", name: "Bank Details" },
    { label: "Documents", name: "Document Upload" },
    { label: "Video KYC", name: "Video KYC" },
    { label: "Conclude", name: "Application Submitted" }
  ];

  // Dynamic timer for elapsed session duration
  useEffect(() => {
    if (appId && isPlaying) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [appId, isPlaying]);

  // Dynamic Polling for real-time timeline updates
  useEffect(() => {
    let pollingInterval;
    if (appId) {
      pollingInterval = setInterval(async () => {
        try {
          const res = await api.get(`/api/journey/${appId}`);
          setTimelineEvents(res.data.events);
        } catch (err) {
          console.error("Polling timeline error:", err);
        }
      }, 1500);
    } else {
      setTimelineEvents([]);
    }
    return () => clearInterval(pollingInterval);
  }, [appId]);

  // Cleanup autoplay timeouts
  useEffect(() => {
    return () => clearTimeout(autoPlayTimeoutRef.current);
  }, []);

  // Automatic Mode sequence runner
  useEffect(() => {
    if (mode === 'AUTOMATIC' && isPlaying && appId) {
      runAutoStep();
    }
  }, [mode, isPlaying, activeStep, appId]);

  const resetSimulator = () => {
    clearTimeout(autoPlayTimeoutRef.current);
    clearInterval(timerRef.current);
    setIsPlaying(false);
    setActiveStep(0);
    setElapsedTime(0);
    setAppId(null);
    setSessId(null);
    setName('');
    setPhone('');
    setEmail('');
    setPanNumber('');
    setAadhaarNumber('');
    setOtpCode('');
    setBankAccount('');
    setBankIfsc('');
    setStatusMsg('Simulator reset. Ready.');
    setErrorMsg('');
    setTimelineEvents([]);
  };

  // API Call helper to post events
  const sendEvent = async (stepName, status, duration = null, reason = null) => {
    if (!appId || !sessId) return false;
    try {
      const payload = {
        application_id: appId,
        session_id: sessId,
        step_name: stepName,
        status: status,
        time_spent_seconds: duration,
        failure_reason: reason,
        metadata: { client: "onboarding_emulation_node" }
      };
      await api.post('/api/journey/event', payload);
      return true;
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || `Failed to log event: ${stepName}`);
      setIsPlaying(false);
      return false;
    }
  };

  // --- STEP ACTIONS ---

  // Step 1: Start Application
  const startJourney = async (e) => {
    if (e) e.preventDefault();
    if (!name || !phone) {
      setErrorMsg("Customer Name and Phone Number are required.");
      return;
    }
    setErrorMsg('');
    try {
      // 1. Create a customer object on backend dynamically for tracking validity
      // We reuse backend roles registration API or assume they are mapped.
      // Since no Customer creation API exists, we create a customer via a custom quick-seed
      // or we use seeded customer ID 1 by default, or create customer dynamically.
      // Let's create customer using a quick fallback sequence.
      // Wait, can we create customer in backend? Let's check: we can call /api/journey/start
      // with customer_id = 1. But wait, in simulator we want name, phone, email of custom customer!
      // Wait! If the customer must exist in the database, does start_journey check this?
      // Yes! In `service.py`: `customer = self.repo.get_customer(customer_id)`.
      // So how do we start a journey for a custom customer if we don't have their ID?
      // Let's write a quick Customer Creation fallback! In our database CRUD phase, did we have users registration? Yes.
      // We can easily create a customer dynamically in the DB.
      // Wait, is there a customer creation route?
      // No, we didn't define one. Let's create a quick customer in the database first!
      // Wait, how? We can add a POST `/api/journey/customer` endpoint to register customers!
      // That is extremely clean. Let's add it to `journey/router.py` right now, so that the simulator can create custom customer profiles!
      // Let's check: yes, adding a customer registration route in `router.py` is very clean and preserves existing architecture!
      // Let's do that quickly. But wait, I'm currently writing OnboardingSimulator.jsx.
      // Let's assume we have `POST /api/journey/customer` which takes `full_name`, `email`, `phone_number` and returns customer `id`.
      // Let's write the frontend API call to `POST /api/journey/customer` and then `POST /api/journey/start` using that ID!
      
      const custPayload = {
        full_name: name,
        email: email || `${name.toLowerCase().replace(' ', '_')}@sim.com`,
        phone_number: phone
      };
      
      // Let's assume this exists or we create it.
      // If the endpoint is not there yet, we'll write it.
      const custRes = await api.post('/api/journey/customer', custPayload);
      const customerId = custRes.data.id;
      
      const payload = {
        customer_id: customerId,
        branch_name: branchName || "Worli Hub",
        assigned_officer_id: null,
        device_type: "MOBILE",
        browser: "Chrome Mobile",
        operating_system: "Android",
        ip_address: "192.168.4.1",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India"
      };
      
      const res = await api.post('/api/journey/start', payload);
      setAppId(res.data.application_id);
      setSessId(res.data.session_id);
      setActiveStep(1);
      setStatusMsg("Application started. PAN Verification pending.");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to initialize custom customer record.");
      setIsPlaying(false);
    }
  };

  // Step 2: PAN Upload
  const completePan = async (simulateFailure = false) => {
    if (simulateFailure) {
      setStatusMsg("Simulating Wrong PAN format error...");
      await sendEvent("PAN Uploaded", "FAILED", 15.0, "Invalid PAN number format pattern");
      return;
    }
    setStatusMsg("PAN Uploaded and validated.");
    const ok = await sendEvent("PAN Uploaded", "COMPLETED", 20.0);
    if (ok) setActiveStep(2);
  };

  // Step 3: Aadhaar Upload
  const completeAadhaar = async (simulateFailure = false) => {
    if (simulateFailure) {
      setStatusMsg("Simulating Aadhaar scanning blur failure...");
      await sendEvent("Aadhaar Uploaded", "FAILED", 12.0, "Document scan resolution insufficient");
      return;
    }
    setStatusMsg("Aadhaar details captured.");
    const ok = await sendEvent("Aadhaar Uploaded", "COMPLETED", 25.0);
    if (ok) setActiveStep(3);
  };

  // Step 4: OTP Verification
  const completeOtp = async (simulateFailure = false, simulateRetry = false) => {
    if (simulateRetry) {
      setStatusMsg("Simulating OTP code mismatch... Triggering retry.");
      await sendEvent("OTP Verified", "FAILED", 8.0, "Incorrect security OTP entered");
      return;
    }
    if (simulateFailure) {
      setStatusMsg("Simulating OTP verification timeout...");
      await sendEvent("OTP Verified", "FAILED", 60.0, "OTP entry timeout reached");
      return;
    }
    setStatusMsg("OTP verified successfully.");
    const ok = await sendEvent("OTP Verified", "COMPLETED", 15.0);
    if (ok) setActiveStep(4);
  };

  // Step 5: Bank Details
  const completeBank = async () => {
    setStatusMsg("Bank accounts details saved.");
    const ok = await sendEvent("Bank Details", "COMPLETED", 35.0);
    if (ok) setActiveStep(5);
  };

  // Step 6: Document Upload
  const completeDocuments = async (simulateFailure = false) => {
    if (simulateFailure) {
      setStatusMsg("Simulating file upload size corrupt error...");
      await sendEvent("Document Upload", "FAILED", 18.0, "Salary slip file exceeds limit or corrupt");
      return;
    }
    setStatusMsg("Onboarding documents uploaded.");
    const ok = await sendEvent("Document Upload", "COMPLETED", 40.0);
    if (ok) setActiveStep(6);
  };

  // Step 7: Video KYC
  const completeKyc = async (simulateFailure = false, simulateAbandon = false) => {
    if (simulateAbandon) {
      setStatusMsg("Customer closed browser session during Video KYC.");
      await sendEvent("Video KYC", "FAILED", 12.0, "Customer closed browser session");
      await api.post('/api/journey/end', {
        application_id: appId,
        session_id: sessId,
        status: "ABANDONED",
        reason: "Customer closed app session during KYC check"
      });
      setIsPlaying(false);
      return;
    }
    if (simulateFailure) {
      setStatusMsg("Simulating face mismatch threshold failure...");
      await sendEvent("Video KYC", "FAILED", 90.0, "Liveness face verification match mismatch");
      return;
    }
    setStatusMsg("Video KYC validation complete. Application ready for submission.");
    const ok = await sendEvent("Video KYC", "COMPLETED", 120.0);
    if (ok) setActiveStep(7);
  };

  // Step 8: Final Decision
  const concludeJourney = async (decision) => {
    clearTimeout(autoPlayTimeoutRef.current);
    setIsPlaying(false);
    try {
      // First, log the final submission event
      await sendEvent("Application Submitted", "COMPLETED", 15.0);
      
      const payload = {
        application_id: appId,
        session_id: sessId,
        status: decision,
        reason: decision === 'COMPLETED' ? null : `Simulation concluded as ${decision}`
      };
      
      await api.post('/api/journey/end', payload);
      setStatusMsg(`Simulation successfully completed. Concluded state: ${decision}.`);
      setAppId(null); // Clear active session to stop ticker
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to conclude onboarding session.");
    }
  };

  // --- AUTOMATIC RUNNER LOGIC ---
  const runAutoStep = () => {
    clearTimeout(autoPlayTimeoutRef.current);
    
    // Check if we are at the last step
    if (activeStep === 7) {
      autoPlayTimeoutRef.current = setTimeout(() => {
        // Randomly Approve (80%) or Reject (20%)
        const decision = randomDecide(0.8) ? 'COMPLETED' : 'REJECTED';
        concludeJourney(decision);
      }, 2000);
      return;
    }

    const delays = [1500, 2000, 2500];
    const delay = randomChoice(delays);

    autoPlayTimeoutRef.current = setTimeout(async () => {
      // Logic by step
      let success = true;

      // Introduce random failure & retry scenarios (25% chance of retry/failure)
      const roll = randomDecide(0.75);

      if (activeStep === 1) {
        // PAN Upload
        if (!roll) {
          await completePan(true); // Log failure
          // Wait and retry successfully
          setTimeout(async () => {
            await completePan(false);
          }, 1500);
        } else {
          await completePan(false);
        }
      } 
      else if (activeStep === 2) {
        // Aadhaar Upload
        if (!roll) {
          await completeAadhaar(true);
          setTimeout(async () => {
            await completeAadhaar(false);
          }, 1500);
        } else {
          await completeAadhaar(false);
        }
      } 
      else if (activeStep === 3) {
        // OTP Verification
        const otpRoll = randomChoice(['SUCCESS', 'RETRY', 'TIMEOUT']);
        if (otpRoll === 'RETRY') {
          await completeOtp(false, true);
          setTimeout(async () => {
            await completeOtp(false, false);
          }, 1500);
        } else if (otpRoll === 'TIMEOUT') {
          await completeOtp(true, false);
          // End as Abandoned
          setTimeout(async () => {
            await api.post('/api/journey/end', {
              application_id: appId,
              session_id: sessId,
              status: "ABANDONED",
              reason: "OTP entry timeout"
            });
            setIsPlaying(false);
          }, 1500);
          return;
        } else {
          await completeOtp(false, false);
        }
      } 
      else if (activeStep === 4) {
        // Bank details
        await completeBank();
      } 
      else if (activeStep === 5) {
        // Documents Upload
        if (!roll) {
          await completeDocuments(true);
          setTimeout(async () => {
            await completeDocuments(false);
          }, 1500);
        } else {
          await completeDocuments(false);
        }
      } 
      else if (activeStep === 6) {
        // Video KYC
        const kycRoll = randomChoice(['SUCCESS', 'FAIL_RETRY', 'ABANDON']);
        if (kycRoll === 'FAIL_RETRY') {
          await completeKyc(true, false);
          setTimeout(async () => {
            await completeKyc(false, false);
          }, 1500);
        } else if (kycRoll === 'ABANDON') {
          await completeKyc(false, true);
          return;
        } else {
          await completeKyc(false, false);
        }
      }
    }, delay);
  };

  // Helper randomization formulas
  const randomChoice = (arr) => arr[Math.floor(random.random() * arr.length)];
  const randomDecide = (pct) => random.random() < pct;

  // --- BULK SEEDING ACTION ---
  const handleBulkSeed = async (count) => {
    try {
      setBulkSeeding(true);
      setErrorMsg('');
      setSeedSummary(null);
      
      const response = await api.post('/api/simulator/seed', { count });
      setSeedSummary(response.data);
      setStatusMsg(`Bulk seed successfully finished! Simulated ${count} entries.`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Bulk seed simulation failed.");
    } finally {
      setBulkSeeding(false);
    }
  };

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full text-xs">
      {/* Header Panel */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Cpu className="w-8 h-8 text-indigo-400 animate-pulse" />
            <span>Digital Onboarding Simulator</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Emulate client onboarding pathways. Manually complete checkpoints, trigger failure conditions, or run full automated simulation flows to populate the logging metrics.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200">
          {errorMsg}
        </div>
      )}

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Stepper, forms, and control panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stepper Progress Bar */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-850 space-y-3">
            <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">
              <span>Onboarding Pipeline Progress</span>
              {appId && (
                <span className="text-indigo-400 font-mono">
                  Session ID: #{sessId} | Time: {elapsedTime}s
                </span>
              )}
            </div>
            <div className="flex items-center justify-between relative py-2 max-w-xl mx-auto">
              <div className="absolute left-1 right-1 top-1/2 h-[2px] bg-slate-800 -translate-y-1/2 z-0"></div>
              {steps.map((st, idx) => {
                const isPassed = idx < activeStep;
                const isCurrent = idx === activeStep && appId;
                
                let iconStyle = "bg-slate-900 text-slate-500 border-slate-800";
                if (isPassed) iconStyle = "bg-emerald-600 text-white border-emerald-500";
                else if (isCurrent) iconStyle = "bg-indigo-650 text-white border-indigo-500 animate-pulse";

                return (
                  <div key={idx} className="flex flex-col items-center relative z-10" title={st.name}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border ${iconStyle}`}>
                      {idx + 1}
                    </div>
                    <span className="text-[8px] text-slate-500 font-bold mt-1 font-mono uppercase">
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Screen Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 min-h-[300px]">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="font-bold text-slate-200 text-sm">
                {!appId ? 'Step 1: Initialize Session' : `Step ${activeStep + 1}: ${steps[activeStep].name}`}
              </h3>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-750 text-[10px] text-slate-350">
                Mode: {mode}
              </span>
            </div>

            {/* Simulated Pages Switcher */}
            <div className="space-y-4">
              {!appId ? (
                /* Step 1: Start journey form */
                <form onSubmit={startJourney} className="space-y-4 max-w-md">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Customer Full Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                        placeholder="Vijay Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Phone Number (+91)</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                      placeholder="vijay.sharma@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Loan Type</label>
                      <select
                        value={loanType}
                        onChange={(e) => setLoanType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs appearance-none"
                      >
                        <option value="Home Loan" className="bg-slate-900">Home Loan</option>
                        <option value="Personal Loan" className="bg-slate-900">Personal Loan</option>
                        <option value="Business Loan" className="bg-slate-900">Business Loan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Loan Amount (INR)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/10"
                  >
                    Start Simulated Onboarding
                  </button>
                </form>
              ) : (
                /* Step 2-8 Controls mapped directly */
                <div className="space-y-6">
                  {activeStep === 1 && (
                    <div className="space-y-4 max-w-sm">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">PAN Card Number</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg glass-input text-xs font-mono uppercase"
                          placeholder="ABCDE1234F"
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => completePan(false)}
                          className="flex-1 py-2 bg-emerald-650 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
                        >
                          Submit PAN Check
                        </button>
                        <button
                          onClick={() => completePan(true)}
                          className="flex-1 py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/10 rounded-lg font-semibold transition-all"
                        >
                          Simulate Bad Format
                        </button>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="space-y-4 max-w-sm">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Aadhaar Card Number</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg glass-input text-xs font-mono"
                          placeholder="12-digit number"
                          value={aadhaarNumber}
                          onChange={(e) => setAadhaarNumber(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => completeAadhaar(false)}
                          className="flex-1 py-2 bg-emerald-650 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
                        >
                          Submit Aadhaar
                        </button>
                        <button
                          onClick={() => completeAadhaar(true)}
                          className="flex-1 py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/10 rounded-lg font-semibold transition-all"
                        >
                          Simulate Blur Fail
                        </button>
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="space-y-4 max-w-sm">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Enter Verification OTP</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg glass-input text-xs font-mono tracking-widest text-center text-sm"
                          placeholder="••••"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => completeOtp(false, false)}
                            className="flex-1 py-2 bg-emerald-650 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
                          >
                            Submit Correct OTP
                          </button>
                          <button
                            onClick={() => completeOtp(false, true)}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg font-semibold transition-all"
                          >
                            Submit Incorrect OTP
                          </button>
                        </div>
                        <button
                          onClick={() => completeOtp(true, false)}
                          className="py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/10 rounded-lg font-semibold transition-all"
                        >
                          Simulate Verification Timeout
                        </button>
                      </div>
                    </div>
                  )}

                  {activeStep === 4 && (
                    <div className="space-y-4 max-w-md">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Bank Account Number</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                            placeholder="e.g. 50100223344"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">IFSC Code</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 rounded-lg glass-input text-xs font-mono uppercase"
                            placeholder="e.g. HDFC0000102"
                            value={bankIfsc}
                            onChange={(e) => setBankIfsc(e.target.value)}
                          />
                        </div>
                      </div>
                      <button
                        onClick={completeBank}
                        className="w-full py-2 bg-emerald-650 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
                      >
                        Save Bank details
                      </button>
                    </div>
                  )}

                  {activeStep === 5 && (
                    <div className="space-y-4 max-w-sm">
                      <div className="border border-dashed border-slate-800 p-4 rounded-xl text-center text-slate-500">
                        Drag salary slip & address proof here
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => completeDocuments(false)}
                          className="flex-1 py-2 bg-emerald-650 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
                        >
                          Submit Documents
                        </button>
                        <button
                          onClick={() => completeDocuments(true)}
                          className="flex-1 py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/10 rounded-lg font-semibold transition-all"
                        >
                          Simulate File Corrupt Fail
                        </button>
                      </div>
                    </div>
                  )}

                  {activeStep === 6 && (
                    <div className="space-y-4 max-w-sm">
                      <div className="bg-slate-950/40 p-4 rounded-xl text-center border border-slate-850 flex items-center justify-center h-20 text-slate-400 gap-2">
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        <span>Initializing Video KYC Session...</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => completeKyc(false, false)}
                            className="flex-1 py-2 bg-emerald-650 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
                          >
                            Liveness Approved
                          </button>
                          <button
                            onClick={() => completeKyc(true, false)}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 border border-slate-700 rounded-lg font-semibold transition-all"
                          >
                            Simulate Mismatch Failure
                          </button>
                        </div>
                        <button
                          onClick={() => completeKyc(false, true)}
                          className="py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/10 rounded-lg font-semibold transition-all"
                        >
                          Simulate Customer Closed Browser
                        </button>
                      </div>
                    </div>
                  )}

                  {activeStep === 7 && (
                    <div className="space-y-4 max-w-md bg-slate-950/20 border border-slate-900 p-4 rounded-xl">
                      <div className="border-b border-slate-900 pb-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Verification Review</span>
                        <div className="font-bold text-slate-200 mt-1">Ready for Decision submission</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => concludeJourney('COMPLETED')}
                          className="py-2.5 bg-emerald-660 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => concludeJourney('REJECTED')}
                          className="py-2.5 bg-red-650 hover:bg-red-500 text-white rounded-lg font-bold transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => concludeJourney('ABANDONED')}
                          className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-305 border border-slate-700 rounded-lg font-bold transition-all"
                        >
                          Abandon
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status updates feed */}
            <div className="p-3 bg-slate-950/50 border border-slate-900 rounded-xl flex gap-3 text-[10.5px] text-indigo-250 leading-relaxed font-mono">
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <span>{statusMsg}</span>
            </div>
          </div>

          {/* Stepper Controllers */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-850 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setMode(mode === 'MANUAL' ? 'AUTOMATIC' : 'MANUAL')}
                className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                  mode === 'AUTOMATIC' 
                    ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20' 
                    : 'bg-slate-950/30 text-slate-400 border-slate-850'
                }`}
              >
                Mode: {mode}
              </button>
            </div>

            <div className="flex gap-2.5">
              {appId && mode === 'AUTOMATIC' && (
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isPlaying 
                      ? 'bg-amber-600/10 text-amber-400 border border-amber-500/20' 
                      : 'bg-emerald-600/10 text-emerald-450 border border-emerald-500/20'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause Auto Run</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Resume Auto Run</span>
                    </>
                  )}
                </button>
              )}

              {appId && mode === 'MANUAL' && (
                <button
                  onClick={() => setIsPlaying(true)}
                  className="py-2 px-4 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
                  disabled={activeStep === 7}
                >
                  Step Completed
                </button>
              )}

              <button
                onClick={resetSimulator}
                className="py-2 px-3.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-750 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Real-time Timeline Stream & Seeding Panel */}
        <div className="space-y-6 lg:col-span-1">
          {/* Live Timeline Polling Panel */}
          {appId ? (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 max-h-[55vh] overflow-y-auto">
              <div className="border-b border-slate-850 pb-2 flex items-center justify-between">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest font-mono">Live Timeline Stream</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              </div>

              <div className="relative border-l border-slate-850 ml-3 pl-5 space-y-3.5 text-[11px] py-1">
                {timelineEvents.map((evt) => (
                  <div key={evt.id} className="relative">
                    <div className={`absolute -left-[28px] w-3.5 h-3.5 rounded-full border-2 bg-slate-950 flex items-center justify-center ${
                      evt.status === 'COMPLETED' ? 'border-emerald-500' :
                      evt.status === 'FAILED' ? 'border-red-500' : 'border-indigo-500'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${
                        evt.status === 'COMPLETED' ? 'bg-emerald-500' :
                        evt.status === 'FAILED' ? 'bg-red-500' : 'bg-indigo-500'
                      }`}></div>
                    </div>

                    <div className="p-2.5 bg-slate-950/30 border border-slate-900 rounded-lg">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-350">{evt.step_name}</span>
                        <span className={`text-[9px] ${
                          evt.status === 'COMPLETED' ? 'text-emerald-450' :
                          evt.status === 'FAILED' ? 'text-red-450' : 'text-indigo-455'
                        }`}>{evt.status}</span>
                      </div>
                      <div className="text-[9px] text-slate-550 mt-1 flex justify-between">
                        <span>{evt.browser} ({evt.operating_system})</span>
                        {evt.time_spent_seconds !== null && <span>{Math.round(evt.time_spent_seconds)}s</span>}
                      </div>
                      {evt.failure_reason && (
                        <div className="text-[9px] text-red-400/80 bg-red-950/10 p-1.5 rounded border border-red-550/10 mt-1 italic">
                          {evt.failure_reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Bulk Database Generator Control Panel */
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                <Database className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Bulk Journey Seeding</h2>
              </div>
              
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Trigger simulated onboarding sessions to quickly populate the relational database with varied outcomes.
              </p>

              <div className="flex flex-col gap-2">
                {[10, 50, 100, 1000].map(count => (
                  <button
                    key={count}
                    onClick={() => handleBulkSeed(count)}
                    disabled={bulkSeeding}
                    className="py-2.5 px-4 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-750 hover:border-slate-650 rounded-xl font-bold transition-all text-xs flex justify-between items-center disabled:opacity-40"
                  >
                    <span>Simulate & Seed {count} Files</span>
                    {bulkSeeding ? (
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                ))}
              </div>

              {seedSummary && (
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2 font-mono text-[10px]">
                  <div className="font-bold text-indigo-400 border-b border-indigo-950/40 pb-1.5">Seed Summary:</div>
                  <div className="flex justify-between"><span>Completed:</span> <span className="text-emerald-400">{seedSummary.summary?.COMPLETED}</span></div>
                  <div className="flex justify-between"><span>Failed OTP:</span> <span className="text-amber-400">{seedSummary.summary?.FAILED_OTP}</span></div>
                  <div className="flex justify-between"><span>Failed KYC:</span> <span className="text-red-400">{seedSummary.summary?.FAILED_KYC}</span></div>
                  <div className="flex justify-between"><span>Abandoned:</span> <span className="text-slate-400">{seedSummary.summary?.ABANDONED_MIDWAY}</span></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default OnboardingSimulator;
