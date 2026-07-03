"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Clipboard, Check } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-none text-xs leading-relaxed">
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h1 className="text-sm font-bold text-white mt-3 mb-1.5" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xs font-bold text-slate-200 mt-2.5 mb-1" {...props} />,
          p: ({node, ...props}) => <p className="mb-2 text-slate-350 leading-relaxed" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1 text-slate-400" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-slate-400" {...props} />,
          li: ({node, ...props}) => <li className="text-xs" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-indigo-500 pl-3 py-0.5 my-2 text-slate-450 italic bg-slate-900/40 rounded-r" {...props} />,
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-3 border border-slate-800 rounded-lg">
              <table className="w-full text-left border-collapse text-[10px]" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800" {...props} />,
          th: ({node, ...props}) => <th className="p-2" {...props} />,
          td: ({node, ...props}) => <td className="p-2 border-b border-slate-850" {...props} />,
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const codeString = String(children).replace(/\n$/, "");
            
            return language ? (
              <CodeBlock language={language} code={codeString} />
            ) : (
              <code className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-mono text-indigo-400" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="my-3 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      {/* Code Header Bar */}
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-850 flex justify-between items-center text-[10px] text-slate-500 font-mono font-semibold select-none">
        <span>{language.toUpperCase()}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-indigo-455 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" /> <span className="text-emerald-500">Copied!</span>
            </>
          ) : (
            <>
              <Clipboard className="h-3 w-3" /> <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code Content */}
      <div className="text-[11px]">
        <SyntaxHighlighter
          language={language}
          style={atomDark}
          customStyle={{
            margin: 0,
            padding: "1rem",
            backgroundColor: "#0a0a0f",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
