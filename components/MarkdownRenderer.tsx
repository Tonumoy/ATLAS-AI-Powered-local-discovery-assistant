import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Coordinates } from '../types';

interface MarkdownRendererProps {
  content: string;
  userLocation?: Coordinates | null;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, userLocation }) => {
  return (
    <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-zinc-300">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium transition-colors">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc pl-4 my-2 space-y-1 marker:text-zinc-500">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 my-2 space-y-1 marker:text-zinc-500">{children}</ol>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          h3: ({ children }) => <h3 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h3>,
          p: ({ children }) => <p className="mb-3 text-zinc-300 last:mb-0">{children}</p>,
          hr: () => <hr className="my-6 border-white/10" />,
          code: ({ children }) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-200">{children}</code>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
