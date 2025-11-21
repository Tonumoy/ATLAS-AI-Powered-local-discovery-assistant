
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-slate-200">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-medium">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>,
          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
          h3: ({ children }) => <h3 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h3>,
          p: ({ children }) => <p className="mb-4 text-slate-200 last:mb-0 text-justify">{children}</p>,
          hr: () => <hr className="my-6 border-slate-700/50" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
