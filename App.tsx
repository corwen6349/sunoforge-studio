
import React, { useState, useEffect, useRef } from 'react';
import Layout, { ThemeMode } from './components/Layout';
import SongResult from './components/SongResult';
import Auth from './components/Auth';
import Profile from './components/Profile';
import HistoryView from './components/HistoryView';
import { LIVE_MODIFIERS, EXAMPLE_PROMPTS, MUSIC_STYLES, AI_PROVIDERS, AI_MODELS } from './constants';
import { generateSong, generateRandomTopic } from './services/gemini';
import { isApiConfigured, saveGenerationToCloud, getCurrentUser } from './services/api';
import { GenerationState, SongGenerationResult, AIProvider, User } from './types';
import { Wand2, Music, Sparkles, Loader2, Play, History, ArrowLeft, Info, Disc3, Mic2, Users, Settings as SettingsIcon, Moon, Sun, Monitor, ChevronDown, ChevronUp, Baby, Music2, Copy, FileAudio, Link, Upload, X, SlidersHorizontal, CheckCircle2, Dices, BrainCircuit, Key, LogIn, User as UserIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const App = () => {
  const [currentView, setCurrentView] = useState('studio');
  const [showResult, setShowResult] = useState(false);
  
  // User State
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  
  // Tab State: 'create' or 'mimic'
  const [creationTab, setCreationTab] = useState<'create' | 'mimic'>('create');

  const [generationMode, setGenerationMode] = useState<'single' | 'album'>('single');
  const [voiceType, setVoiceType] = useState<'auto' | 'male' | 'female' | 'child' | 'elderly' | 'androgynous'>('auto');
  const [musicalStyle, setMusicalStyle] = useState<string>('auto');
  const [topic, setTopic] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  
  // UI Toggles
  const [showSettings, setShowSettings] = useState(false);
  const [showAllModifiers, setShowAllModifiers] = useState(false);
  const [showAllStyles, setShowAllStyles] = useState(false);

  // Loading States
  const [isRandomLoading, setIsRandomLoading] = useState(false);

  // Mimic Mode State
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceLink, setReferenceLink] = useState('');
  const [mimicError, setMimicError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [generationState, setGenerationState] = useState<GenerationState>({
    isLoading: false,
    result: null,
    error: null
  });
  const [history, setHistory] = useState<SongGenerationResult[]>([]);
  
  // Theme State
  const [theme, setTheme] = useState<ThemeMode>('system');

  // AI Configuration State
  const [aiProvider, setAiProvider] = useState<AIProvider>('google');
  const [aiModel, setAiModel] = useState<string>('gemini-2.5-flash');
  const [deepseekKey, setDeepseekKey] = useState<string>('');

  // Initialize History, Theme, and AI Config
  useEffect(() => {
    // Check API auth state
    if (isApiConfigured()) {
      getCurrentUser().then(u => setUser(u));
    }
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem('suno_forge_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }

    const savedTheme = localStorage.getItem('suno_forge_theme_preference') as ThemeMode;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedProvider = localStorage.getItem('suno_forge_ai_provider') as AIProvider;
    if (savedProvider) setAiProvider(savedProvider);

    const savedModel = localStorage.getItem('suno_forge_ai_model');
    if (savedModel) setAiModel(savedModel);

    const savedDSKey = localStorage.getItem('suno_forge_deepseek_key');
    if (savedDSKey) {
      setDeepseekKey(savedDSKey);
    } else if (process.env.DEEPSEEK_API_KEY) {
      setDeepseekKey(process.env.DEEPSEEK_API_KEY);
    }
  }, []);

  // Persist History
  useEffect(() => {
    localStorage.setItem('suno_forge_history', JSON.stringify(history));
  }, [history]);

  // Persist AI Config
  useEffect(() => {
    localStorage.setItem('suno_forge_ai_provider', aiProvider);
    localStorage.setItem('suno_forge_ai_model', aiModel);
    
    // Only save to localStorage if it's different from env var (to allow user override)
    // or if the user manually entered something.
    if (deepseekKey) {
      localStorage.setItem('suno_forge_deepseek_key', deepseekKey);
    }
  }, [aiProvider, aiModel, deepseekKey]);

  // Apply Theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('suno_forge_theme_preference', theme);
  }, [theme]);

  const toggleModifier = (id: string) => {
    setSelectedModifiers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const validateAndSetFile = (file: File) => {
     if (!file.type.startsWith('audio/')) {
        setMimicError('不支持的文件格式。请上传音频文件 (MP3, WAV, AAC 等)。');
        return;
      }
      // 9MB safety net for base64 encoding stability
      if (file.size > 9 * 1024 * 1024) { 
         setMimicError('文件过大。为了确保生成稳定性，请上传小于 9MB 的音频片段。');
         return;
      }
      setReferenceFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMimicError(null);
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setMimicError(null);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const clearFile = () => {
    setReferenceFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMimicError(null);
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;  
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    // Mimic Validation
    if (creationTab === 'mimic' && !referenceFile && !referenceLink) {
        setGenerationState({ 
            isLoading: false, 
            result: null, 
            error: "请在“风格模仿”模式下上传音频文件或粘贴参考链接。" 
        });
        return;
    }

    // DeepSeek Validation
    if (aiProvider === 'deepseek' && !deepseekKey) {
       alert("请在设置中配置 DeepSeek API Key");
       setCurrentView('settings');
       return;
    }

    setGenerationState({ isLoading: true, result: null, error: null });
    
    try {
      let refAudioData = undefined;
      
      // Process Audio File if present
      if (creationTab === 'mimic' && referenceFile) {
        const base64Data = await new Promise<string>((resolve, reject) => {
           const reader = new FileReader();
           reader.onloadend = () => {
              const res = reader.result as string;
              // Remove data url prefix (e.g. "data:audio/mpeg;base64,")
              const base64 = res.split(',')[1];
              resolve(base64);
           };
           reader.onerror = reject;
           reader.readAsDataURL(referenceFile);
        });
        refAudioData = { data: base64Data, mimeType: referenceFile.type };
      }

      const result = await generateSong(
          topic, 
          selectedModifiers, 
          generationMode, 
          voiceType, 
          musicalStyle,
          refAudioData, 
          (creationTab === 'mimic' && referenceLink) ? referenceLink : undefined,
          // AI Config
          aiProvider,
          aiModel,
          deepseekKey
      );
      
      setGenerationState({ isLoading: false, result, error: null });
      setHistory(prev => [result, ...prev]);
      
      // Save to cloud if user is logged in
      if (user && isApiConfigured()) {
        try {
          await saveGenerationToCloud(user.id, result);
        } catch (err) {
          console.error('Failed to save to cloud:', err);
        }
      }
      
      setShowResult(true); 
    } catch (err: any) {
      setGenerationState({ 
        isLoading: false, 
        result: null, 
        error: err.message || "Something went wrong." 
      });
    }
  };

  const fillExample = (text: string) => {
    setTopic(text);
  };

  const handleRandomPrompt = async () => {
    if (isRandomLoading) return;
    setIsRandomLoading(true);
    try {
      const randomTopic = await generateRandomTopic(aiProvider, aiModel, deepseekKey);
      setTopic(randomTopic);
    } catch (error) {
      console.error(error);
      setTopic("无法生成随机灵感，请稍后重试。");
    } finally {
      setIsRandomLoading(false);
    }
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (view === 'studio') {
      setShowResult(false);
    }
    if (view === 'profile' && !user && isApiConfigured()) {
      setShowAuth(true);
    }
  };

  const loadFromHistory = (result: SongGenerationResult) => {
    setGenerationState({
      isLoading: false,
      result: result,
      error: null
    });
    setGenerationMode(result.type || 'single');
    setCurrentView('studio');
    setShowResult(true);
  };

  const handleDeleteLocal = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleAuthSuccess = async () => {
    setShowAuth(false);
    const u = await getCurrentUser();
    setUser(u);
  };

  const handleSignOut = () => {
    setUser(null);
    setCurrentView('studio');
  };

  const voiceOptions = [
    { id: 'auto', label: '自动 (Auto)', icon: Users, color: 'text-gray-500' },
    { id: 'male', label: '男声 (Male)', icon: UserIcon, color: 'text-blue-600' },
    { id: 'female', label: '女声 (Female)', icon: UserIcon, color: 'text-pink-600' },
    { id: 'child', label: '童声 (Child)', icon: Baby, color: 'text-green-600' },
    { id: 'elderly', label: '老年 (Elderly)', icon: UserIcon, color: 'text-amber-700' },
    { id: 'androgynous', label: '中性 (Neutral)', icon: Users, color: 'text-purple-600' },
  ] as const;

  const renderEditor = () => {
    // Show 5 modifiers by default (so the 6th slot is the button)
    const visibleModifiers = showAllModifiers ? LIVE_MODIFIERS : LIVE_MODIFIERS.slice(0, 5);
    // Show 7 styles by default
    const visibleStyles = showAllStyles ? MUSIC_STYLES : MUSIC_STYLES.slice(0, 7);

    const activeStyleLabel = MUSIC_STYLES.find(s => s.id === musicalStyle)?.label.split(' ')[0] || 'Auto';
    const activeVoiceLabel = voiceOptions.find(v => v.id === voiceType)?.label.split(' ')[0] || 'Auto';

    return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col items-center justify-center text-center gap-2 py-4">
         <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-600 dark:from-white dark:to-indigo-300 tracking-tight">
           SunoForge Studio
         </h1>
         <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
           专业级 AI 音乐提示词生成与制作助手
         </p>
         {aiProvider !== 'google' && (
           <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
             当前模型: {AI_MODELS.find(m => m.id === aiModel)?.name || aiModel}
           </span>
         )}
      </div>

      {/* Main Studio Card */}
      <div className="bg-white/80 dark:bg-suno-800/60 border border-white/20 dark:border-suno-700/50 rounded-3xl shadow-xl backdrop-blur-md overflow-hidden relative">
         
         {/* Tab Switcher */}
         <div className="flex p-1 bg-gray-100/50 dark:bg-suno-900/50 backdrop-blur-sm m-2 rounded-2xl">
            <button
               onClick={() => { setCreationTab('create'); setMimicError(null); }}
               className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                  creationTab === 'create' 
                  ? 'bg-white dark:bg-suno-700 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
               }`}
            >
               <span className="flex items-center justify-center gap-2">
                  <Sparkles size={16} /> 自由创作
               </span>
            </button>
            <button
               onClick={() => setCreationTab('mimic')}
               className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                  creationTab === 'mimic' 
                  ? 'bg-white dark:bg-suno-700 text-purple-600 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
               }`}
            >
               <span className="flex items-center justify-center gap-2">
                  <Copy size={16} /> 风格模仿
               </span>
            </button>
         </div>

         <div className="px-6 pb-6 pt-4 space-y-6">
            
            {/* MIMIC MODE INPUTS */}
            {creationTab === 'mimic' && (
               <div className="animate-fade-in space-y-4">
                  <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-2xl p-5 transition-all">
                     
                     <div className="flex items-center gap-2 mb-3 text-purple-800 dark:text-purple-300 font-semibold text-sm">
                        <Sparkles size={16} />
                        <span>上传参考素材 (Upload Reference)</span>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Audio File Upload */}
                        <div 
                           onDragOver={handleDragOver}
                           onDragLeave={handleDragLeave}
                           onDrop={handleDrop}
                           onClick={() => fileInputRef.current?.click()}
                           className={`
                              relative h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group overflow-hidden
                              ${referenceFile 
                                 ? 'border-green-400 bg-green-50/50 dark:bg-green-900/20' 
                                 : isDragging
                                    ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30 scale-[1.02]'
                                    : 'border-purple-200 dark:border-purple-800 hover:border-purple-400 hover:bg-white dark:hover:bg-suno-700/50'
                              }
                           `}
                        >
                           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                           
                           {referenceFile ? (
                              <div className="flex flex-col items-center p-4 w-full text-center z-10 animate-fade-in">
                                 <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mb-2 shadow-sm">
                                    <FileAudio size={20} className="text-green-600 dark:text-green-300" />
                                 </div>
                                 <span className="text-xs font-bold text-green-800 dark:text-green-300 truncate max-w-full px-2">
                                    {referenceFile.name}
                                 </span>
                                 <span className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-mono">
                                    {(referenceFile.size / 1024 / 1024).toFixed(2)} MB
                                 </span>
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); clearFile(); }} 
                                    className="absolute top-2 right-2 p-1.5 bg-white/50 hover:bg-red-100 dark:bg-black/20 dark:hover:bg-red-900/50 text-gray-500 hover:text-red-500 rounded-full transition-colors backdrop-blur-sm"
                                    title="移除文件"
                                 >
                                    <X size={14} />
                                 </button>
                              </div>
                           ) : (
                              <div className="flex flex-col items-center text-center p-4">
                                 <div className={`p-2.5 rounded-full mb-2 transition-colors ${isDragging ? 'bg-purple-200 text-purple-700' : 'bg-purple-100 dark:bg-purple-900/50 text-purple-500'}`}>
                                    <Upload size={20} />
                                 </div>
                                 <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                    {isDragging ? '释放以上传' : '点击上传音频'}
                                 </span>
                                 <span className="text-[10px] text-purple-400 dark:text-purple-500 mt-1 leading-tight">
                                    支持 MP3, WAV (Max 9MB) <br/> 或拖拽文件至此
                                 </span>
                              </div>
                           )}
                           
                           {/* Success Pulse Effect */}
                           {referenceFile && (
                              <div className="absolute inset-0 border-4 border-green-400/30 rounded-xl animate-pulse pointer-events-none"></div>
                           )}
                        </div>

                        {/* Link Input */}
                        <div className="relative h-36 flex flex-col">
                           <div className={`
                              h-full bg-white dark:bg-black/20 border-2 rounded-xl transition-all flex flex-col relative overflow-hidden focus-within:ring-2 focus-within:ring-purple-400/50
                              ${referenceLink && isValidUrl(referenceLink) 
                                 ? 'border-green-400/50' 
                                 : 'border-purple-100 dark:border-purple-800 focus-within:border-purple-400'
                              }
                           `}>
                              <div className="flex-1 relative">
                                 <textarea 
                                    value={referenceLink}
                                    onChange={(e) => {
                                        setReferenceLink(e.target.value);
                                        setMimicError(null);
                                    }}
                                    placeholder="或者粘贴 Suno/YouTube 链接..."
                                    className="w-full h-full p-4 bg-transparent border-none outline-none text-sm resize-none pr-10 text-gray-700 dark:text-gray-300 placeholder-gray-400"
                                 />
                                 <div className="absolute top-4 right-4 pointer-events-none text-purple-400">
                                    <Link size={16} />
                                 </div>
                              </div>
                              
                              {/* Validation Status Bar */}
                              <div className={`
                                 h-8 flex items-center px-4 text-xs font-medium transition-colors border-t
                                 ${referenceLink 
                                    ? (isValidUrl(referenceLink) ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 border-yellow-200 dark:border-yellow-800')
                                    : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 border-gray-100 dark:border-gray-700'
                                 }
                              `}>
                                 {referenceLink ? (
                                    isValidUrl(referenceLink) 
                                       ? <span className="flex items-center gap-1.5"><CheckCircle2 size={12}/> 链接有效</span>
                                       : <span className="flex items-center gap-1.5"><Info size={12}/> 请输入有效的 URL (http://...)</span>
                                 ) : (
                                    <span>未输入链接</span>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                     
                     {/* Global Mimic Error */}
                     {mimicError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-300 animate-fade-in shadow-sm">
                           <Info size={14} className="flex-shrink-0" />
                           <span>{mimicError}</span>
                           <button onClick={() => setMimicError(null)} className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><X size={12}/></button>
                        </div>
                     )}
                  </div>
               </div>
            )}

            {/* MAIN TEXT INPUT */}
            <div className="space-y-3">
              <div className="relative group">
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={creationTab === 'mimic'
                    ? "输入新歌的主题... (AI 将保持上传音频的曲风，但内容将基于此主题)"
                    : (generationMode === 'single' 
                      ? "描述你的歌曲创意...\n例如：'一首关于迷失在霓虹灯下的赛博朋克民谣，带有孤独感'" 
                      : "描述你的专辑概念...\n例如：'一张关于太空探索的史诗管弦乐专辑，包含起飞、漂流和归乡'")
                  }
                  className="w-full h-40 bg-gray-50 dark:bg-black/30 border-2 border-transparent focus:border-indigo-500/50 rounded-2xl p-4 pr-12 text-lg leading-relaxed text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-0 transition-all resize-none outline-none shadow-inner"
                />
                
                {/* Random Prompt Button (AI Powered) */}
                <button
                  onClick={handleRandomPrompt}
                  disabled={isRandomLoading}
                  className={`
                    absolute top-3 right-3 p-1.5 rounded-lg transition-all
                    ${isRandomLoading 
                       ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 cursor-not-allowed' 
                       : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-transparent hover:bg-gray-100 dark:hover:bg-white/10'
                    }
                  `}
                  title="随机灵感 (AI Random Prompt)"
                >
                  {isRandomLoading ? <Loader2 className="animate-spin" size={18} /> : <Dices size={18} />}
                </button>

                <div className="absolute bottom-3 right-3 text-xs font-mono text-gray-300 dark:text-gray-600 pointer-events-none">
                  {topic.length}/500
                </div>
              </div>

              {creationTab === 'create' && !topic && (
                 <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide px-1">
                    <span className="text-xs font-medium text-gray-400 flex-shrink-0 flex items-center gap-1">
                      <Sparkles size={12} /> 试一试:
                    </span>
                    {EXAMPLE_PROMPTS.map((prompt, i) => (
                      <button 
                        key={i} 
                        onClick={() => fillExample(prompt)}
                        className="whitespace-nowrap text-xs bg-white dark:bg-suno-800/50 border border-gray-200 dark:border-suno-700 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors shadow-sm flex-shrink-0"
                      >
                        {prompt}
                      </button>
                    ))}
                 </div>
              )}
            </div>

            {/* SETTINGS BAR (Collapsed View) */}
            <div 
              onClick={() => setShowSettings(!showSettings)}
              className={`
                group cursor-pointer flex items-center justify-between p-4 rounded-xl border transition-all duration-300 select-none
                ${showSettings 
                   ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800' 
                   : 'bg-white dark:bg-suno-700/30 border-gray-200 dark:border-suno-700 hover:border-indigo-300 dark:hover:border-suno-600'
                }
              `}
            >
               <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${showSettings ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-suno-800 text-gray-500 dark:text-gray-400'}`}>
                     <SlidersHorizontal size={20} />
                  </div>
                  <div>
                     <h3 className={`text-sm font-bold ${showSettings ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        高级配置 (Studio Config)
                     </h3>
                     <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1"><Mic2 size={10} /> {activeVoiceLabel}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                        <span className="flex items-center gap-1"><Music2 size={10} /> {activeStyleLabel}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                        <span className="flex items-center gap-1"><Sparkles size={10} /> {selectedModifiers.length} 个要素</span>
                     </div>
                  </div>
               </div>
               <div className={`transition-transform duration-300 ${showSettings ? 'rotate-180' : ''} text-gray-400`}>
                  <ChevronDown size={20} />
               </div>
            </div>

            {/* EXPANDED SETTINGS PANEL */}
            {showSettings && (
               <div className="space-y-6 pt-2 animate-fade-in pl-2 pr-2">
                  
                  {/* Row 1: Type & Voice */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Generation Type */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">生成格式</label>
                        <div className="flex bg-gray-100 dark:bg-suno-900/50 p-1 rounded-lg">
                           <button
                              onClick={() => setGenerationMode('single')}
                              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                                 generationMode === 'single' ? 'bg-white dark:bg-suno-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500'
                              }`}
                           >
                              单曲 (Single)
                           </button>
                           <button
                              onClick={() => setGenerationMode('album')}
                              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                                 generationMode === 'album' ? 'bg-white dark:bg-suno-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500'
                              }`}
                           >
                              专辑 (Album)
                           </button>
                        </div>
                     </div>

                     {/* Voice Type */}
                     <div className={`space-y-2 ${creationTab === 'mimic' ? 'opacity-50 pointer-events-none' : ''}`}>
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">人声偏好</label>
                         <div className="grid grid-cols-3 gap-2">
                           {voiceOptions.slice(0,3).map((v) => (
                              <button
                                 key={v.id}
                                 onClick={() => setVoiceType(v.id as any)}
                                 className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                                    voiceType === v.id 
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300' 
                                    : 'bg-white dark:bg-suno-800 border-gray-200 dark:border-suno-700 text-gray-500'
                                 }`}
                              >
                                 <v.icon size={12} /> {v.label.split(' ')[0]}
                              </button>
                           ))}
                           {voiceOptions.slice(3,6).map((v) => (
                              <button
                                 key={v.id}
                                 onClick={() => setVoiceType(v.id as any)}
                                 className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                                    voiceType === v.id 
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300' 
                                    : 'bg-white dark:bg-suno-800 border-gray-200 dark:border-suno-700 text-gray-500'
                                 }`}
                              >
                                 <v.icon size={12} /> {v.label.split(' ')[0]}
                              </button>
                           ))}
                         </div>
                     </div>
                  </div>

                  {/* Row 2: Musical Style */}
                  {creationTab === 'create' && (
                     <div className="space-y-3">
                        <div className="flex justify-between items-center">
                           <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">音乐风格</label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {visibleStyles.map((style) => {
                              const isSelected = musicalStyle === style.id;
                              return (
                                 <button
                                    key={style.id}
                                    onClick={() => setMusicalStyle(style.id)}
                                    className={`
                                       px-3 py-2 rounded-lg text-xs font-medium border transition-all
                                       ${isSelected 
                                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300' 
                                          : 'bg-white dark:bg-suno-800 border-gray-200 dark:border-suno-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-suno-700'
                                       }
                                    `}
                                 >
                                    {style.label.split(' ')[0]}
                                 </button>
                              )
                           })}
                           <button
                              onClick={() => setShowAllStyles(!showAllStyles)}
                              className="px-3 py-2 rounded-lg text-xs font-medium border border-dashed border-gray-300 dark:border-suno-700 text-gray-500 hover:text-indigo-600 hover:border-indigo-400 transition-all flex items-center gap-1"
                           >
                              {showAllStyles ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                              {showAllStyles ? '收起' : '更多'}
                           </button>
                        </div>
                     </div>
                  )}

                  {/* Row 3: Live Modifiers */}
                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">拟人化要素</label>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {visibleModifiers.map((modifier) => {
                           const IconComponent = (LucideIcons as any)[modifier.icon] || Music;
                           const isSelected = selectedModifiers.includes(modifier.id);
                           return (
                              <button
                                 key={modifier.id}
                                 onClick={() => toggleModifier(modifier.id)}
                                 className={`
                                    flex items-center gap-3 p-2 rounded-lg border text-left transition-all
                                    ${isSelected 
                                       ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500' 
                                       : 'bg-white dark:bg-suno-800 border-gray-200 dark:border-suno-700 hover:border-gray-300 dark:hover:border-suno-600'
                                    }
                                 `}
                              >
                                 <div className={`p-1.5 rounded-md ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-suno-700 text-gray-500'}`}>
                                    <IconComponent size={14} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>{modifier.label}</div>
                                 </div>
                                 {isSelected && <CheckCircle2 size={14} className="text-indigo-500" />}
                              </button>
                           )
                        })}
                        <button
                           onClick={() => setShowAllModifiers(!showAllModifiers)}
                           className="flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-gray-300 dark:border-suno-700 text-gray-500 hover:text-indigo-600 hover:border-indigo-400 transition-all text-xs font-medium"
                        >
                           {showAllModifiers ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                           {showAllModifiers ? '收起' : '更多'}
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generationState.isLoading || !topic.trim()}
              className={`
                w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] mt-4
                ${generationState.isLoading || !topic.trim()
                  ? 'bg-gray-200 dark:bg-suno-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-300 dark:border-suno-700' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                }
              `}
            >
              {generationState.isLoading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span className="text-base">AI 正在制作中...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span className="text-base">{creationTab === 'mimic' ? '开始模仿创作' : `生成${generationMode === 'album' ? '专辑' : '作品'}`}</span>
                </>
              )}
            </button>
            
            {/* Error Message */}
            {generationState.error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 text-sm text-center animate-pulse">
                {generationState.error}
              </div>
            )}
         </div>
      </div>
    </div>
  );
  }

  const renderResultPage = () => (
    <div className="space-y-6 pb-20 animate-fade-in-up">
       {/* Result Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-suno-800/50 p-6 rounded-2xl border border-gray-200 dark:border-suno-700/50 shadow-sm backdrop-blur-md">
         <div>
            <button 
              onClick={() => setShowResult(false)}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-2 group"
            >
               <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/>
               <span className="text-sm font-medium">返回创作室 (Back to Studio)</span>
            </button>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                 {generationState.result?.type === 'album' ? '专辑生成完成' : '单曲生成完成'}
               </span>
               <div className="px-3 py-1 bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-full text-xs text-green-700 dark:text-green-400 font-mono tracking-wide">
                 SUCCESS
               </div>
            </h2>
         </div>
         <button
            onClick={() => setShowResult(false)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/30 dark:shadow-indigo-900/40 transition-all font-medium"
         >
            <Sparkles size={18} />
            创作下一首
         </button>
       </div>

       {generationState.result && <SongResult result={generationState.result} />}
    </div>
  );

  const renderStudio = () => {
    // If showResult is true AND we have a result, show the result page
    if (showResult && generationState.result) {
       return renderResultPage();
    }
    // Otherwise show the editor
    return renderEditor();
  };

  const renderHistory = () => (
    <HistoryView 
      user={user}
      localHistory={history}
      onLoadFromHistory={loadFromHistory}
      onBackToStudio={() => setCurrentView('studio')}
      onDeleteLocal={handleDeleteLocal}
    />
  );

  const renderSettings = () => (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
              <button onClick={() => setCurrentView('studio')} className="md:hidden p-2 rounded-lg bg-white dark:bg-suno-800 text-gray-500 dark:text-gray-400">
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">设置</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Appearance */}
           <div className="bg-white dark:bg-suno-800 rounded-xl border border-gray-200 dark:border-suno-700 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <SettingsIcon size={20} />
                  外观与偏好
              </h3>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-suno-900/50 rounded-lg border border-gray-200 dark:border-suno-700/50">
                  <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                          {theme === 'dark' ? <Moon size={20} /> : theme === 'light' ? <Sun size={20} /> : <Monitor size={20} />}
                      </div>
                      <div>
                          <div className="font-medium text-gray-900 dark:text-gray-200">当前主题</div>
                          <div className="text-xs text-gray-500">
                             {theme === 'system' ? '跟随系统设置' : theme === 'dark' ? '深色模式' : '浅色模式'}
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex bg-gray-200 dark:bg-suno-900 p-1 rounded-md">
                     {['light', 'system', 'dark'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t as ThemeMode)}
                          className={`px-3 py-1 text-xs rounded transition-colors capitalize ${theme === t ? 'bg-white dark:bg-suno-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
                        >
                          {t}
                        </button>
                     ))}
                  </div>
              </div>
           </div>

           {/* AI Configuration */}
           <div className="bg-white dark:bg-suno-800 rounded-xl border border-gray-200 dark:border-suno-700 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <BrainCircuit size={20} />
                  AI 模型配置
              </h3>

              <div className="space-y-4">
                 {/* Provider Selector */}
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">AI 提供商 (Provider)</label>
                    <div className="grid grid-cols-2 gap-2">
                       {AI_PROVIDERS.map((provider) => (
                          <button
                            key={provider.id}
                            onClick={() => {
                               setAiProvider(provider.id);
                               // Reset model to first available for this provider
                               const firstModel = AI_MODELS.find(m => m.provider === provider.id)?.id;
                               if (firstModel) setAiModel(firstModel);
                            }}
                            className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                               aiProvider === provider.id 
                               ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300' 
                               : 'bg-white dark:bg-suno-900/50 border-gray-200 dark:border-suno-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {provider.name}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Model Selector */}
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">选择模型 (Model)</label>
                    <select 
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-suno-900/50 border border-gray-200 dark:border-suno-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                       {AI_MODELS.filter(m => m.provider === aiProvider).map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                       ))}
                    </select>
                 </div>

                 {/* DeepSeek API Key Input */}
                 {aiProvider === 'deepseek' && (
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-suno-700 mt-2">
                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Key size={14} /> DeepSeek API Key
                       </label>
                       <input 
                         type="password"
                         value={deepseekKey}
                         onChange={(e) => setDeepseekKey(e.target.value)}
                         placeholder={process.env.DEEPSEEK_API_KEY && !localStorage.getItem('suno_forge_deepseek_key') ? "已通过环境变量配置 (DEEPSEEK_API_KEY)" : "sk-..."}
                         className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-suno-900/50 border border-gray-200 dark:border-suno-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                       />
                       <p className="text-xs text-gray-500 dark:text-gray-400">
                          {process.env.DEEPSEEK_API_KEY && deepseekKey === process.env.DEEPSEEK_API_KEY
                             ? "已加载系统环境变量配置 (DEEPSEEK_API_KEY)。"
                             : "您的 API Key 仅存储在本地浏览器中，不会上传到服务器。"
                          }
                       </p>
                    </div>
                 )}
                 
                 {aiProvider === 'google' && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                       Google Gemini 使用系统预设的 Key (或环境变量)。无需配置。
                    </div>
                 )}
              </div>
           </div>
        </div>
    </div>
  );

  const renderPlaceholder = (title: string) => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <div className="w-16 h-16 bg-white dark:bg-suno-800 rounded-2xl flex items-center justify-center mb-6 border border-gray-200 dark:border-suno-700 shadow-sm">
        <Info className="text-gray-400 dark:text-gray-500" size={32} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md">此功能即将上线。</p>
      <button 
            onClick={() => setCurrentView('studio')}
            className="mt-6 px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/30"
          >
            返回创作室
      </button>
    </div>
  );

  return (
    <>
      <Layout 
        currentView={currentView} 
        onViewChange={handleViewChange} 
        theme={theme} 
        onThemeChange={setTheme}
        user={user}
        onShowAuth={() => setShowAuth(true)}
      >
        {currentView === 'studio' && renderStudio()}
        {currentView === 'history' && renderHistory()}
        {currentView === 'profile' && <Profile user={user} onSignOut={handleSignOut} />}
        {currentView === 'settings' && renderSettings()}
      </Layout>
      
      {showAuth && (
        <Auth 
          onSuccess={handleAuthSuccess} 
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  );
};

export default App;
