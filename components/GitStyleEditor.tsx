import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bold, Italic, List, Link, Image, Table, Eye, Edit3, Heading, Quote, Code, Maximize2, Minimize2 } from 'lucide-react';

interface GitStyleEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
}

const GitStyleEditor: React.FC<GitStyleEditorProps> = ({ value, onChange, placeholder, disabled, className, minHeight = '200px' }) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    
    onChange(newText);
    
    // Restore cursor position and focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const containerClasses = isFullscreen
    ? `fixed inset-0 z-[100] bg-white flex flex-col ${className || ''}`
    : `border rounded-[1.5rem] overflow-hidden bg-white ${className || ''} ${disabled ? 'opacity-60 pointer-events-none' : ''}`;

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'write' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Edit3 size={14} /> Write 写
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Eye size={14} /> Preview 预览
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          {activeTab === 'write' && (
            <>
              <button onClick={() => insertText('**', '**')} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Bold">
                <Bold size={14} />
              </button>
              <button onClick={() => insertText('*', '*')} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Italic">
                <Italic size={14} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button onClick={() => insertText('### ')} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Heading">
                <Heading size={14} />
              </button>
              <button onClick={() => insertText('> ')} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Quote">
                <Quote size={14} />
              </button>
              <button onClick={() => insertText('`', '`')} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Code">
                <Code size={14} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button onClick={() => insertText('- ')} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="List">
                <List size={14} />
              </button>
              <button onClick={() => insertText('[Link Text](url)')} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Link">
                <Link size={14} />
              </button>
              <button onClick={() => insertText('![Image Alt](url)')} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Image">
                <Image size={14} />
              </button>
              <button onClick={() => insertText('\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n')} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Table">
                <Table size={14} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
            </>
          )}
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)} 
            className={`p-1.5 rounded-lg transition-colors ${isFullscreen ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`} 
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      <div className={`relative ${isFullscreen ? 'flex-1 overflow-auto' : ''}`} style={!isFullscreen ? { minHeight } : {}}>
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full h-full p-4 text-sm font-mono outline-none bg-transparent focus:ring-4 focus:ring-indigo-500/10 transition-all ${isFullscreen ? 'resize-none' : 'resize-y min-h-[inherit]'}`}
            disabled={disabled}
          />
        ) : (
          <div className="p-6 prose prose-sm max-w-none prose-slate prose-headings:font-bold prose-a:text-indigo-600 prose-img:rounded-xl prose-table:border-collapse prose-th:border prose-th:border-slate-200 prose-th:p-2 prose-td:border prose-td:border-slate-200 prose-td:p-2 prose-th:bg-slate-50">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value || '*No content to preview*'}</ReactMarkdown>
          </div>
        )}
      </div>
      
      {activeTab === 'write' && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-medium flex justify-between items-center">
          <span>Supports Markdown 支持 Markdown</span>
          <span>{value.length} characters 字符</span>
        </div>
      )}
    </div>
  );
};

export default GitStyleEditor;
