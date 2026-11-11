import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, ExternalLink, X, AlertTriangle, RefreshCw, Key } from 'lucide-react';
import { DEFAULT_FIREBASE_CONFIG } from '../firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  status: 'connected' | 'connecting' | 'error';
  errorMessage?: string;
  userId?: string | null;
  onRetry: () => void;
  activeProjectId: string;
}

export const FIRESTORE_RULES_TEXT = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Winterball Kasse Pro: Zugriff für anonyme/angemeldete Kassen-Clients
    match /artifacts/winter-kasse-pro/public/data/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Alternativ für unbeschränkten Zugriff während des Events:
    // match /artifacts/winter-kasse-pro/public/data/{document=**} {
    //   allow read, write: if true;
    // }
  }
}`;

export const FirebaseStatusModal: React.FC<Props> = ({
  isOpen,
  onClose,
  status,
  errorMessage,
  userId,
  onRetry,
  activeProjectId,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : status === 'connecting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Firebase Verbindung & Regeln</h2>
              <p className="text-xs text-slate-400">Projekt: <span className="font-mono text-indigo-400 font-bold">{activeProjectId}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm text-slate-300">
          {/* Status Banner */}
          <div className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${status === 'connected' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' : status === 'connecting' ? 'bg-amber-950/40 border-amber-500/30 text-amber-200' : 'bg-rose-950/40 border-rose-500/30 text-rose-200'}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold">
                {status === 'connected' ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Firebase erfolgreich verbunden!</span>
                  </>
                ) : status === 'connecting' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Verbindungsaufbau läuft...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Verbindung noch nicht bereit</span>
                  </>
                )}
              </div>
              <p className="text-xs opacity-90">
                {status === 'connected'
                  ? `Authentifiziert als anonymer Kassen-Client (UID: ${userId?.slice(0, 8)}...). Live-Sync ist aktiv.`
                  : errorMessage || "Bitte prüfe die Checkliste unten in der Firebase Console."}
              </p>
            </div>

            <button
              onClick={onRetry}
              className="flex-none px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Erneut prüfen
            </button>
          </div>

          {/* Quick 3-Step Setup Guide */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
              3 Schritte in deiner Firebase Console ({activeProjectId})
            </h3>
            
            <ol className="space-y-3 text-xs leading-relaxed text-slate-300 ml-2">
              <li className="flex gap-2.5">
                <span className="font-bold text-indigo-400">A.</span>
                <div>
                  <strong className="text-white">Anonyme Anmeldung aktivieren:</strong> Gehe in der Firebase Console zu <em>Erstellen &gt; Authentication &gt; Anmeldemethode</em> und aktiviere den Anbieter <strong className="text-indigo-300">Anonym</strong>.
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className="font-bold text-indigo-400">B.</span>
                <div>
                  <strong className="text-white">Firestore erstellen:</strong> Gehe zu <em>Erstellen &gt; Firestore Database</em> und klicke auf <strong className="text-indigo-300">Datenbank erstellen</strong> (z.B. Standort <code>europe-west3</code> oder <code>eur3</code>).
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className="font-bold text-indigo-400">C.</span>
                <div>
                  <strong className="text-white">Sicherheitsregeln einfügen:</strong> Gehe zu <em>Firestore Database &gt; Regeln</em>, füge den folgenden Regelsatz ein und klicke auf <strong className="text-indigo-300">Veröffentlichen</strong>:
                </div>
              </li>
            </ol>
          </div>

          {/* Copyable Rules Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deine Firestore Security Rules</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Kopiert!' : 'Regeln kopieren'}
              </button>
            </div>

            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-indigo-300 overflow-x-auto">
              <pre className="whitespace-pre">{FIRESTORE_RULES_TEXT}</pre>
            </div>
          </div>

          {/* Config details */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">Eingetragene App-ID:</span>
              <code className="text-white font-mono">{DEFAULT_FIREBASE_CONFIG.appId}</code>
            </div>
            <a
              href={`https://console.firebase.google.com/project/${activeProjectId}/firestore/rules`}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 text-xs"
            >
              Direkt zu den Regeln in Firebase <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
