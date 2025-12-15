import React, { useState } from 'react';
import { saveToMemory } from '../services/memory';

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    await saveToMemory(code, language);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const highlightCode = (codeStr: string) => {
    let escaped = codeStr
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const keywords = /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|interface|type|public|private|protected|void|int|string|bool|float|def|print)\b/g;
    escaped = escaped.replace(keywords, '<span class="text-accent font-bold">$1</span>');

    const strings = /(".*?"|'.*?'|`.*?`)/g;
    escaped = escaped.replace(strings, '<span class="text-green-400">$1</span>');

    const comments = /(\/\/.*$)/gm;
    escaped = escaped.replace(comments, '<span class="text-gray-500 italic">$1</span>');

    return { __html: escaped };
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-[#0d1117] shadow-lg group">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400 uppercase">{language || 'code'}</span>
        <div className="flex gap-3">
           <button 
            onClick={handleSave}
            className="text-xs text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1"
            title="Save to Knowledge Base (Pinecone)"
          >
            {saved ? (
              <span className="text-blue-400">Saved</span>
            ) : (
              <span>Save to KB</span>
            )}
          </button>
          <button 
            onClick={handleCopy}
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            {copied ? (
              <span className="text-green-400">Copied!</span>
            ) : (
              <span>Copy</span>
            )}
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