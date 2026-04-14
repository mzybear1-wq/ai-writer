import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Settings2, 
  History, 
  Copy, 
  Check, 
  Wand2, 
  FileText, 
  MessageSquare, 
  AlignLeft,
  Mail,
  Megaphone,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { promptTemplates } from './promptTemplates';
import type { WritingMode } from './promptTemplates';
import { generateContentStream } from './api';

const MODES = [
  { id: 'continue', label: '续写', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'rewrite', label: '改写', icon: <Wand2 className="w-4 h-4" /> },
  { id: 'expand', label: '扩展', icon: <AlignLeft className="w-4 h-4" /> },
  { id: 'summarize', label: '总结', icon: <FileText className="w-4 h-4" /> },
  { id: 'email', label: '邮件', icon: <Mail className="w-4 h-4" /> },
  { id: 'copywriting', label: '文案', icon: <Megaphone className="w-4 h-4" /> },
] as const;

interface HistoryItem {
  id: string;
  mode: WritingMode;
  input: string;
  output: string;
  timestamp: number;
}

function App() {
  const [mode, setMode] = useState<WritingMode>('continue');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [length, setLength] = useState(500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai_writer_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const saveToHistory = (newOutput: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      mode,
      input,
      output: newOutput,
      timestamp: Date.now()
    };
    setHistory(prev => {
      const newHistory = [newItem, ...prev].slice(0, 50); // Keep last 50
      localStorage.setItem('ai_writer_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发选中操作
    if (window.confirm('确定要删除这条生成记录吗？')) {
      setHistory(prev => {
        const newHistory = prev.filter(item => item.id !== id);
        localStorage.setItem('ai_writer_history', JSON.stringify(newHistory));
        return newHistory;
      });
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleGenerate = async () => {
    if (!input.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setOutput('');
    let fullOutput = '';
    
    const prompt = promptTemplates[mode](input);

    try {
      await generateContentStream(prompt, temperature, length, (chunk) => {
        fullOutput += chunk;
        setOutput(prev => prev + chunk);
        outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
      
      if (fullOutput) {
        saveToHistory(fullOutput);
      }
    } catch (error: any) {
      setOutput(`**[生成失败]**\n\n请检查 API Key 配置或网络连接。\n\n错误信息：${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizePrompt = async () => {
    if (!input.trim() || isGenerating) return;
    
    setIsGenerating(true);
    const originalInput = input;
    setInput('正在优化提示词，请稍候...');
    let optimizedInput = '';
    
    const optimizePromptStr = `请帮我润色和优化以下这段需求描述，使其表达更加清晰、结构更好，直接返回优化后的文本，不要加任何其他解释语：\n\n"${originalInput}"`;

    try {
      await generateContentStream(optimizePromptStr, 0.5, 500, (chunk) => {
        optimizedInput += chunk;
        setInput(optimizedInput);
      });
    } catch (error: any) {
      setInput(originalInput);
      alert(`优化失败: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans text-gray-800 overflow-hidden">
      
      {/* Sidebar - History */}
      <div className="w-64 bg-gray-900 text-gray-300 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2 text-white font-bold text-lg">
          <Sparkles className="w-6 h-6 text-blue-400" />
          <span>AI Writer Pro</span>
        </div>
        <div className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          最近生成记录
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-4">
          {history.length === 0 ? (
            <div className="text-gray-500 text-xs text-center py-4">暂无历史记录</div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setMode(item.mode);
                  setInput(item.input);
                  setOutput(item.output);
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors text-sm flex flex-col gap-1.5 group relative cursor-pointer"
              >
                <div className="flex items-center justify-between text-gray-400 text-xs">
                  <span className="flex items-center gap-1.5">
                    {MODES.find(m => m.id === item.mode)?.icon || <History className="w-3.5 h-3.5" />}
                    {MODES.find(m => m.id === item.mode)?.label}
                  </span>
                  <span>{formatDate(item.timestamp)}</span>
                </div>
                <div className="text-gray-200 line-clamp-2 leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity">
                  {item.input}
                </div>
                <button
                  onClick={(e) => deleteHistoryItem(item.id, e)}
                  className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  title="删除记录"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">智能写作助手</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              API Ready
            </span>
          </div>
        </header>

        {/* Split Pane Workspace */}
        <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 overflow-hidden">
          
          {/* Left Panel: Input & Config */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 font-semibold text-gray-700">
              <Settings2 className="w-5 h-5 text-blue-500" />
              创作配置
            </div>
            
            <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto">
              
              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">写作模式</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id as WritingMode)}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                        mode === m.id 
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500' 
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings Collapsible */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-gray-500" />
                    高级设置
                  </span>
                  {showAdvanced ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {showAdvanced && (
                  <div className="p-4 border-t border-gray-100 bg-white grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>创意度 (Temperature)</span>
                        <span className="text-gray-500">{temperature}</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" max="1" step="0.1" 
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>严谨</span>
                        <span>发散</span>
                      </div>
                    </div>
                    <div>
                      <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>输出长度限制 (Max Tokens)</span>
                        <span className="text-gray-500">{length} 字</span>
                      </label>
                      <input 
                        type="range" 
                        min="100" max="2000" step="100" 
                        value={length}
                        onChange={(e) => setLength(parseInt(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="flex-1 flex flex-col min-h-[250px]">
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>原始素材 / 提示词</span>
                  <button 
                    onClick={handleOptimizePrompt}
                    disabled={isGenerating || !input.trim()}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded disabled:opacity-50"
                    title="让 AI 帮你完善当前的描述"
                  >
                    <Wand2 className="w-3 h-3" />
                    优化提示词
                  </button>
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="在这里输入你的基础文本或需求描述..."
                  className="flex-1 w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700 bg-gray-50/30"
                ></textarea>
              </div>

            </div>

            {/* Action Bottom */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !input.trim()}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    开始生成
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Output */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                生成结果
              </div>
              <button
                onClick={handleCopy}
                disabled={!output}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-gray-600 transition-colors shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50/30">
              {!output && !isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-gray-300" />
                  </div>
                  <p>左侧输入内容并点击生成，结果将显示在这里</p>
                </div>
              ) : (
                <div className="prose prose-blue max-w-none text-gray-700 break-words overflow-x-auto pb-8">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        return !inline && match ? (
                          <div className="relative group/code rounded-lg overflow-hidden my-2 border border-gray-200">
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 text-gray-600 text-xs font-sans">
                              <span>{match[1]}</span>
                            </div>
                            <SyntaxHighlighter
                              {...props}
                              children={codeString}
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="!m-0 text-sm"
                              customStyle={{ margin: 0, borderRadius: '0 0 0.5rem 0.5rem' }}
                            />
                          </div>
                        ) : (
                          <code {...props} className={`${className} bg-gray-100 text-blue-600 px-1.5 py-0.5 rounded text-sm font-mono`}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {output + (isGenerating ? ' ▍' : '')}
                  </ReactMarkdown>
                  <div ref={outputEndRef} />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;