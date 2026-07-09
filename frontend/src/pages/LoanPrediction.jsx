import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Cpu, ArrowLeft, ShieldCheck, HelpCircle, ShieldAlert, BarChart3, RotateCcw } from 'lucide-react';

const LoanPrediction = () => {
  // Form input states
  const [outstandingAmount, setOutstandingAmount] = useState('15000');
  const [daysOverdue, setDaysOverdue] = useState('45');
  const [previousDefaults, setPreviousDefaults] = useState('0');
  const [bankruptcyHistory, setBankruptcyHistory] = useState('0');
  const [creditScore, setCreditScore] = useState('600');
  const [distanceFromBranch, setDistanceFromBranch] = useState('12');
  const [callResponse, setCallResponse] = useState('1');

  // Prediction states
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePredict = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const payload = {
        outstanding_amount: parseFloat(outstandingAmount),
        days_overdue: parseInt(daysOverdue),
        previous_defaults: parseInt(previousDefaults),
        bankruptcy_history: parseInt(bankruptcyHistory),
        credit_score: parseInt(creditScore),
        distance_from_branch: parseFloat(distanceFromBranch),
        call_response: parseInt(callResponse)
      };

      const response = await api.post('/loan-recovery/predict', payload);
      setPrediction(response.data);
    } catch (err) {
      console.error("Prediction API failed:", err);
      setError(err.response?.data?.detail || "Failed to query live machine learning model. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOutstandingAmount('15000');
    setDaysOverdue('45');
    setPreviousDefaults('0');
    setBankruptcyHistory('0');
    setCreditScore('600');
    setDistanceFromBranch('12');
    setCallResponse('1');
    setPrediction(null);
    setError('');
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High':
        return 'text-red-400 border-red-500/20 bg-red-500/10';
      case 'Medium':
        return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
      default:
        return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    }
  };

  const getStrategyColor = (strat) => {
    switch (strat) {
      case 'Field Visit':
        return 'bg-purple-600 text-white';
      case 'Priority Call':
        return 'bg-rose-600 text-white';
      case 'Regular Call':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-slate-650 text-white';
    }
  };

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header Panel */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex items-center justify-between border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <Link 
            to="/recovery"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-700/60 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Cpu className="w-6 h-6 text-indigo-400" />
              <span>Recommended Strategy Predictor</span>
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              ML simulator to compute optimal action strategies on hypothetical customer features.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Parameters Form */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Predictor Parameters</h2>
          </div>

          <form onSubmit={handlePredict} className="space-y-4">
            {/* Outstanding Amount */}
            <div className="space-y-1.5">
              <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Outstanding Amount (INR)</label>
              <input
                type="number"
                value={outstandingAmount}
                onChange={(e) => setOutstandingAmount(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
              />
            </div>

            {/* Days Overdue */}
            <div className="space-y-1.5">
              <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Days Overdue</label>
              <input
                type="number"
                value={daysOverdue}
                onChange={(e) => setDaysOverdue(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
              />
            </div>

            {/* Defaults & Bankruptcy row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Prior Defaults</label>
                <select
                  value={previousDefaults}
                  onChange={(e) => setPreviousDefaults(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-slate-250 cursor-pointer"
                >
                  <option value="0">0 Defaults</option>
                  <option value="1">1 Default</option>
                  <option value="2">2 Defaults</option>
                  <option value="3">3+ Defaults</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Bankruptcy History</label>
                <select
                  value={bankruptcyHistory}
                  onChange={(e) => setBankruptcyHistory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-slate-250 cursor-pointer"
                >
                  <option value="0">No Bankruptcy</option>
                  <option value="1">Has Bankruptcy</option>
                </select>
              </div>
            </div>

            {/* Credit Score */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[9px]">
                <label className="text-slate-400 font-bold uppercase tracking-wider">Credit Score</label>
                <span className="text-slate-500 font-semibold font-mono">(Range: 300 - 850)</span>
              </div>
              <input
                type="number"
                min="300"
                max="850"
                value={creditScore}
                onChange={(e) => setCreditScore(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
              />
            </div>

            {/* Distance from Branch */}
            <div className="space-y-1.5">
              <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Distance from Branch (KM)</label>
              <input
                type="number"
                step="0.1"
                value={distanceFromBranch}
                onChange={(e) => setDistanceFromBranch(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
              />
            </div>

            {/* Call Response */}
            <div className="space-y-1.5">
              <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Customer Contact Status</label>
              <select
                value={callResponse}
                onChange={(e) => setCallResponse(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-slate-255 cursor-pointer"
              >
                <option value="1">Answered & Cooperative</option>
                <option value="0">Refused / Switched Off / No Answer</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2 px-3 border border-slate-800 text-slate-400 hover:text-slate-250 hover:bg-slate-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-3 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <span>Evaluating...</span>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Run Telemetry</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Prediction Results Display */}
        <div className="lg:col-span-3 space-y-6">
          {error && (
            <div className="glass-panel p-5 rounded-2xl border border-red-500/10 bg-red-500/5 flex gap-3 text-xs text-red-400 leading-relaxed">
              <ShieldAlert className="w-5.5 h-5.5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-850 flex flex-col items-center justify-center min-h-[300px]">
              <HelpCircle className="w-10 h-10 text-indigo-400 mb-3 animate-spin" />
              <h3 className="text-slate-300 text-xs font-bold">Calculating Live Model Inference...</h3>
              <p className="text-slate-500 text-[10px] mt-1.5 max-w-xs leading-relaxed">
                Applying Random Forest decision nodes on the hypothetical input vectors.
              </p>
            </div>
          ) : prediction ? (
            <div className="space-y-6">
              {/* Primary result panel */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 bg-gradient-to-tr from-slate-900/60 via-slate-900/60 to-indigo-950/15">
                <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Evaluation Output</h2>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskColor(prediction.risk_level)}`}>
                    {prediction.risk_level} Risk Level
                  </span>
                </div>

                {(() => {
                  const sortedProbs = Object.keys(prediction.class_probabilities)
                    .map(cls => ({ name: cls, value: prediction.class_probabilities[cls] }))
                    .sort((a, b) => b.value - a.value);
                  const secondBest = sortedProbs.length > 1 ? sortedProbs[1].name : 'N/A';
                  const secondBestProb = sortedProbs.length > 1 ? (sortedProbs[1].value * 100).toFixed(1) : '0.0';
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      {/* Strategy Badge block */}
                      <div className="space-y-1.5">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Recommended Strategy</span>
                        <div className={`p-4 rounded-xl border border-slate-800 text-center font-extrabold text-xs uppercase tracking-wider ${getStrategyColor(prediction.recommended_strategy)} shadow-md`}>
                          {prediction.recommended_strategy}
                          <span className="block text-[9px] font-normal opacity-90 mt-1">{(prediction.prediction_confidence * 100).toFixed(1)}% Confidence</span>
                        </div>
                      </div>

                      {/* Second Best Strategy block */}
                      <div className="space-y-1.5">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Second Best Strategy</span>
                        <div className="p-4 bg-slate-950/40 border border-slate-850 text-slate-350 rounded-xl text-center font-bold text-xs uppercase tracking-wider">
                          {secondBest}
                          <span className="block text-[9px] text-slate-500 font-normal normal-case mt-1">{secondBestProb}% probability</span>
                        </div>
                      </div>

                      {/* Priority Score block */}
                      <div className="space-y-1.5">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Priority Score</span>
                        <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl text-center">
                          <span className="text-lg font-black text-indigo-400 font-mono">
                            {prediction.priority_score.toFixed(2)}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wide mt-1">Scale: 10 - 100</span>
                        </div>
                      </div>

                      {/* Estimated Recovery Cost block */}
                      <div className="space-y-1.5">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Estimated Cost</span>
                        <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl text-center">
                          <span className="text-lg font-black text-emerald-400 font-mono">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(prediction.estimated_recovery_cost)}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wide mt-1">Budget Allocation</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Recommended Action */}
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1">
                  <span className="block text-[9px] text-indigo-400 font-extrabold uppercase tracking-wider">Suggested Actionable Protocol</span>
                  <p className="text-slate-200 text-xs italic">
                    "{prediction.recommended_action}"
                  </p>
                </div>
              </div>

              {/* Probabilities distribution */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Classification Confidence</h2>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Confidence: <b>{(prediction.prediction_confidence * 100).toFixed(1)}%</b></span>
                </div>

                <div className="space-y-4">
                  {Object.keys(prediction.class_probabilities).map((cls) => {
                    const prob = prediction.class_probabilities[cls];
                    const pct = (prob * 100).toFixed(1);
                    const isPredicted = cls === prediction.recommended_strategy;
                    return (
                      <div key={cls} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-semibold ${isPredicted ? 'text-indigo-300 font-extrabold' : 'text-slate-400'}`}>
                            {cls} {isPredicted && "*(Predicted)"}
                          </span>
                          <span className="text-slate-350 font-mono font-bold">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-950 border border-slate-850 h-2.5 rounded-full overflow-hidden p-0.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isPredicted ? 'bg-gradient-to-r from-blue-500 to-indigo-650' : 'bg-slate-700'}`} 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-850 flex flex-col items-center justify-center min-h-[300px]">
              <HelpCircle className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
              <h3 className="text-slate-300 text-xs font-bold">Awaiting Model Parameters</h3>
              <p className="text-slate-500 text-[10px] mt-1.5 max-w-xs leading-relaxed">
                Provide parameters in the form panel and click "Run Telemetry" to request strategy advice from the AI model.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default LoanPrediction;
