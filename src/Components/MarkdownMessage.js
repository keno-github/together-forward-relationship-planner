import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * MarkdownMessage - Renders markdown content with consistent styling
 *
 * Used for Luna chat messages to properly render:
 * - **bold text**
 * - *italic text*
 * - Lists (ordered and unordered)
 * - Links
 * - Code blocks
 *
 * @param {string} content - Markdown content to render
 * @param {string} className - Additional CSS classes
 * @param {boolean} isStreaming - Whether content is still streaming (shows cursor)
 */
const MarkdownMessage = ({ content, className = '', isStreaming = false }) => {
  if (!content) return null;

  return (
    <div className={`markdown-message ${className}`}>
      <ReactMarkdown
        components={{
          // Paragraphs with proper spacing
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          // Bold text
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          // Italic text
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          // Unordered lists
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
          ),
          // Ordered lists
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
          ),
          // List items
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 underline"
            >
              {children}
            </a>
          ),
          // Inline code
          code: ({ inline, children }) =>
            inline ? (
              <code className="bg-stone-100 px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ) : (
              <code className="block bg-stone-100 p-2 rounded text-sm font-mono overflow-x-auto mb-2">
                {children}
              </code>
            ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-300 pl-3 italic text-stone-600 mb-2">
              {children}
            </blockquote>
          ),
          // Headers (in case Luna uses them)
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mb-1">{children}</h3>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {/* Streaming cursor indicator */}
      {isStreaming && (
        <span
          className="inline-block w-2 h-4 bg-purple-500 ml-0.5 animate-pulse"
          style={{ verticalAlign: 'text-bottom' }}
        />
      )}
    </div>
  );
};

export default MarkdownMessage;
