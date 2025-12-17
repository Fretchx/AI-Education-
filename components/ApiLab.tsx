
import React, { useState } from 'react';
import { Globe, Activity, Copy, Clipboard } from './Icons';

interface ApiLabProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiLab: React.FC<ApiLabProps> = ({ isOpen, onClose }) => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  const [body, setBody] = useState('{\n  "title": "Learn HTTP",\n  "body": "This is a test request",\n  "userId": 1\n}');
  const [response, setResponse] = useState<any>(null);
  const [headers, setHeaders] = useState<any>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');
  
  // Copy states
  const [copiedReq, setCopiedReq] = useState(false);
  const [copiedRes, setCopiedRes] = useState(false);

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    setStatus(null);
    setTime(null);
    setActiveTab('response'); 

    const startTime = performance.now();
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (method !== 'GET' && method !== 'HEAD') {
        try {
            JSON.parse(body); // Validate JSON
            options.body = body;
        } catch (e) {
            alert("Invalid JSON Body");
            setLoading(false);
            return;
        }
      }

      const res = await fetch(url, options);
      const endTime = performance.now();
      
      setStatus(res.status);
      setTime(Math.round(endTime - startTime));
      
      const resHeaders: any = {};
      res.headers.forEach((value, key) => { resHeaders[key] = value });
      setHeaders(resHeaders);

      const data = await res.json();
      setResponse(data);

    } catch (error: any) {
      setResponse({ error: error.message });
      setStatus(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, isResponse: boolean) => {
    navigator.clipboard.writeText(text);
    if (isResponse) {
      setCopiedRes(true);
      setTimeout(() => setCopiedRes(false), 2000);
    } else {
      setCopiedReq(true);
      setTimeout(() => setCopiedReq(false), 2000);
    }
  };
  
  const handleFormatBody = () => {
      try {
          const parsed = JSON.parse(body);
          setBody(JSON.stringify(parsed, null, 2));
      } catch (e) {
          // Ignore if invalid
      }
  };

  const getStatusColor = (s: number | null) => {
    if (!s) return 'text-slate-500';
    if (s >= 200 && s < 300) return 'text-green-500';
    if (s >= 400) return 'text-red-500';
    return 'text-yellow-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-[#0f172a] border border-slate-700 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[scaleIn_0.2s_ease-out]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" /> API Laboratory
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">✕</button>
        </div>

        {/* Request Bar */}
        <div className="p-4 bg-slate-800/50 flex flex-col md:flex-row gap-2 border-b border-slate-700">
          <select 
            value={method} 
            onChange={(e) => setMethod(e.target.value)}
            className="bg-slate-900 text-white font-mono font-bold px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none"
          >
            {methods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 bg-slate-900 text-slate-300 font-mono text-sm px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <Activity className="w-4 h-4 animate-spin" /> : "Send Request"}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Mobile Tabs */}
          <div className="md:hidden flex border-b border-slate-700 bg-slate-900">
            <button 
              onClick={() => setActiveTab('request')} 
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'request' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
            >
              Request Body
            </button>
            <button 
              onClick={() => setActiveTab('response')} 
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'response' ? 'text-green-400 border-b-2 border-green-400' : 'text-slate-400'}`}
            >
              Response
            </button>
          </div>

          {/* Request Panel */}
          <div className={`flex-1 flex flex-col border-r border-slate-700 ${activeTab === 'request' ? 'block' : 'hidden md:flex'}`}>
            <div className="p-3 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Request Body (JSON)</span>
                <div className="flex gap-2">
                     <button 
                        onClick={handleFormatBody} 
                        className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1 text-[10px] uppercase font-bold"
                        title="Format JSON"
                    >
                        <Clipboard className="w-3 h-3" /> Format
                    </button>
                    <button 
                        onClick={() => handleCopy(body, false)}
                        className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] uppercase font-bold"
                    >
                        <Copy className={`w-3 h-3 ${copiedReq ? 'text-green-400' : ''}`} />
                        {copiedReq ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>
            <textarea 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 bg-[#0d1117] text-slate-300 font-mono text-sm p-4 resize-none outline-none focus:bg-[#161b22] transition-colors"
              spellCheck={false}
              disabled={method === 'GET' || method === 'DELETE'}
            />
             {(method === 'GET' || method === 'DELETE') && (
                <div className="absolute inset-0 top-[180px] md:top-[125px] md:left-0 md:w-1/2 flex items-center justify-center pointer-events-none">
                    <span className="text-slate-600 text-sm">Body not used for {method}</span>
                </div>
            )}
          </div>

          {/* Response Panel */}
          <div className={`flex-1 flex flex-col bg-[#0d1117] ${activeTab === 'response' ? 'block' : 'hidden md:flex'}`}>
             <div className="p-3 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Response</span>
                <div className="flex gap-4 text-xs font-mono items-center">
                  {response && (
                    <button 
                        onClick={() => handleCopy(JSON.stringify(response, null, 2), true)}
                        className="flex items-center gap-1 hover:text-white transition-colors text-slate-400" 
                        title="Copy Response"
                    >
                        <Copy className={`w-3 h-3 ${copiedRes ? 'text-green-400' : ''}`} />
                    </button>
                  )}
                  <span>Status: <span className={`font-bold ${getStatusColor(status)}`}>{status || '-'}</span></span>
                  <span>Time: <span className="text-blue-400">{time ? `${time}ms` : '-'}</span></span>
                </div>
             </div>
             <div className="flex-1 overflow-auto custom-scrollbar p-4 relative">
                {!response && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <Globe className="w-12 h-12 mb-2 opacity-20" />
                        <p>Ready to send request</p>
                    </div>
                )}
                {loading && (
                    <div className="h-full flex flex-col items-center justify-center text-blue-400">
                        <Activity className="w-8 h-8 animate-spin mb-2" />
                        <p className="text-xs uppercase tracking-widest">Fetching...</p>
                    </div>
                )}
                {response && (
                  <pre className="text-green-400 font-mono text-xs md:text-sm whitespace-pre-wrap break-all">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                )}
             </div>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="bg-slate-900 p-2 text-[10px] text-slate-500 text-center border-t border-slate-700">
            Use this tool to test API endpoints. Default is set to JSONPlaceholder (Free Fake API).
        </div>
      </div>
    </div>
  );
};

export default ApiLab;
