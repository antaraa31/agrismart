import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ShieldAlert, ShieldCheck } from 'lucide-react';

const DecisionCard = ({ decision }) => {
  const [expanded, setExpanded] = useState(false);

  // Map Risk Level to Colors and Icons
  const riskStyles = {
    HIGH: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />
    },
    MEDIUM: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      badge: 'bg-amber-100 text-amber-800',
      icon: <ShieldAlert className="w-5 h-5 text-amber-600" />
    },
    LOW: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      badge: 'bg-emerald-100 text-emerald-800',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />
    }
  };

  const style = riskStyles[decision.riskLevel?.toUpperCase()] || riskStyles.LOW;

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-5 md:p-6 shadow-sm transition-all duration-300 hover:shadow-md`}>
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 bg-white p-2 rounded-full shadow-sm">
            {style.icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider ${style.badge}`}>
                {decision.priority} PRIORITY
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                {decision.confidence} CONFIDENCE
              </span>
            </div>
            <h3 className={`text-xl font-bold ${style.text} leading-tight`}>
              {decision.pest}
            </h3>
          </div>
        </div>

        {/* Expand Toggle */}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm font-medium text-slate-600 bg-white/60 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors self-start"
        >
          {expanded ? 'Hide Details' : 'View Reasoning'}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Reasoning */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white/60 p-4 rounded-lg border border-slate-200/50">
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            <span className="font-bold text-slate-900">AI Reasoning:</span> {decision.reasoning}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-slate-200/50">
        <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Required Interventions</h4>
        <ul className="space-y-3">
          {decision.actions?.map((action, index) => (
            <li key={index} className="flex items-start gap-3 group">
              <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.text} opacity-70 group-hover:opacity-100 transition-opacity`} />
              <span className="text-slate-700 font-medium leading-relaxed">{action}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};

export default DecisionCard;
