import React from 'react';

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic syntax highlighting simulation (since we can't use external heavy libs easily)
  // This is a visual aid, not a full parser.
  const highlightCode = (codeStr: string) => {
    // Escape HTML first
    let escaped = codeStr
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Highlight keywords (simplified list)
    const keywords = /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|interface|type|public|private|protected|void|int|string|bool|float|def|print)\b/g;
    escaped = escaped.replace(keywords, '<span class="text-accent font-bold">$1</span>');

    // Highlight strings
    const strings = /(".*?"|'.*?'|`.*?`)/g;
    escaped = escaped.replace(strings, '<span class="text-green-400">$1</span>');

    // Highlight comments
    const comments = /(\/\/.*$)/gm;
    escaped = escaped.replace(comments, '<span class="text-gray-500 italic">$1</span>');

    return { __html: escaped };
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-[#0d1117] shadow-lg">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400 uppercase">{language || 'code'}</span>
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
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <pre className="font-mono text-sm leading-relaxed text-slate-200">
          <code dangerouslySetInnerHTML={highlightCode(code)} />
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
