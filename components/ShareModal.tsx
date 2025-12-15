
import React, { useState } from 'react';
import { Message } from '../types';
import { generateShareableLink } from '../services/share';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, messages }) => {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (messages.length === 0) {
      setError("No conversation to share.");
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const url = await generateShareableLink(messages);
      setLink(url);
    } catch (e) {
      setError("Content too large or encryption failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              Share Session
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <p className="text-slate-300 text-sm mb-2">
                Create a secure, encrypted link to share this conversation. 
              </p>
              <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                <li>End-to-End Encrypted (AES-GCM)</li>
                <li>Data is stored in the URL (No server storage)</li>
                <li>Link contains the decryption key</li>
              </ul>
            </div>

            {!link ? (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                   <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Encrypting...
                   </>
                ) : (
                  <>Generate Secure Link</>
                )}
              </button>
            ) : (
              <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
                <label className="block text-xs font-mono text-slate-400 uppercase">Shareable Link</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={link}
                    className="flex-1 bg-black/30 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm font-mono truncate focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      copied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-orange-400 mt-2">
                  ⚠️ Note: Very long conversations may produce links that exceed browser limits.
                </p>
              </div>
            )}
            
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
