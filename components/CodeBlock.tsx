
import React, { useState } from 'react';
import { saveToMemory } from '../services/memory';
import { Clipboard, Bookmark, Copy as CopyIcon, Download } from './Icons';

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [highlightError, setHighlightError] = useState(false);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!code) return;
    try {
      await saveToMemory(code, language);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save snippet:", err);
    }
  };

  const highlightCode = (codeStr: string) => {
    // Escape helper to prevent XSS and ensure safe rendering
    const escapeHTML = (str: string) => 
      str.replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;");

    if (!codeStr) return { __html: '' };

    try {
      let escaped = escapeHTML(codeStr);

      // Apply basic highlighting patterns
      const keywords = /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|interface|type|public|private|protected|void|int|string|bool|float|def|print|self|None|True|False|elif|try|except|finally|with|as|yield|lambda|in|is|not|and|or)\b/g;
      escaped = escaped.replace(keywords, '<span class="text-accent font-bold">$1</span>');

      const strings = /(".*?"|'.*?'|`.*?`)/g;
      escaped = escaped.replace(strings, '<span class="text-green-400">$1</span>');

      const comments = /(\/\/.*$|#.*$)/gm;
      escaped = escaped.replace(comments, '<span class="text-gray-500 italic">$1</span>');

      return { __html: escaped };
    } catch (error) {
      console.error("Syntax highlighting error:", error);
      if (!highlightError) setHighlightError(true);
      return { __html: escapeHTML(codeStr) }; // Return escaped but unhighlighted as fallback
    }
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-[#0d1117] shadow-lg group">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 uppercase">{language || 'code'}</span>
          {highlightError && (
            <span className="text-[10px] text-yellow-500/80 px-1.5 py-0.5 rounded border border-yellow-500/20 bg-yellow-500/5">
              Raw Output
            </span>
          )}
        </div>
        <div className="flex gap-3">
           <button 
            onClick={handleSave}
            disabled={!code}
            className="text-xs text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1 disabled:opacity-50"
            title="Save to Library"
          >
            <Bookmark className={`w-3 h-3 ${saved ? 'text-blue-400 fill-blue-400' : ''}`} />
            {saved ? "Saved" : "Save"}
          </button>
          <button 
            onClick={handleCopy}
            disabled={!code}
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <CopyIcon className={`w-3 h-3 ${copied ? 'text-green-400' : ''}`} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <pre className="font-mono text-sm leading-relaxed text-slate-200">
          <code dangerouslySetInnerHTML={highlightCode(code)} />
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
