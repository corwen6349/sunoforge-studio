
import React, { useState, useMemo } from 'react';
import { Copy, Check, Disc, Mic2, FileAudio, ListOrdered, FileText, FileJson, Download, Music, Activity } from 'lucide-react';
import { SongGenerationResult } from '../types';
import { createMidiFile } from '../utils/midi';

interface SongResultProps {
  result: SongGenerationResult;
}

const SongResult: React.FC<SongResultProps> = ({ result }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const downloadFile = (content: string | Blob, filename: string, type: string) => {
    const url = typeof content === 'string' 
      ? URL.createObjectURL(new Blob([content], { type }))
      : URL.createObjectURL(content);
      
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const filename = `suno-forge-${result.title.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_')}.json`;
    downloadFile(JSON.stringify(result, null, 2), filename, 'application/json');
  };

  const handleExportTXT = () => {
    const isAlbum = result.type === 'album';
    let content = `SUNOFORGE STUDIO - 创作生成结果\n`;
    content += `====================================\n\n`;
    
    if (isAlbum) {
      content += `专辑标题 (ALBUM): ${result.albumTitle || 'Untitled'}\n`;
      content += `主打单曲 (SINGLE): ${result.title}\n`;
    } else {
      content += `歌曲标题 (TITLE): ${result.title}\n`;
    }
    
    content += `类型 (TYPE): ${isAlbum ? '专辑概念 (Album Concept)' : '单曲 (Single Song)'}\n`;
    content += `创建时间 (DATE): ${result.createdAt ? new Date(result.createdAt).toLocaleString() : 'N/A'}\n\n`;
    
    if (result.musicalKey) content += `调式 (KEY): ${result.musicalKey}\n`;
    if (result.bpm) content += `速度 (BPM): ${result.bpm}\n`;
    if (result.chordProgression) content += `和弦进行 (CHORDS): ${result.chordProgression.join(' - ')}\n`;
    content += `\n`;

    if (isAlbum && result.trackList) {
       content += `专辑曲目表 (TRACKLIST)\n----------------------\n`;
       result.trackList.forEach(t => {
         content += `${t.position}. ${t.title} - [${t.style}]\n`;
       });
       content += `\n`;
    }

    content += `风格提示词 (STYLE PROMPT)\n-------------------------\n${result.stylePrompt}\n\n`;
    content += `封面提示词 (ART PROMPT)\n-----------------------\n${result.coverArtPrompt}\n\n`;
    
    content += `歌词 (LYRICS)\n-------------\n${result.lyrics}\n\n`;
    
    if (result.explanation) {
      content += `设计理念 (EXPLANATION)\n----------------------\n${result.explanation}\n`;
    }

    const filename = `suno-forge-${result.title.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_')}.txt`;
    downloadFile(content, filename, 'text/plain');
  };

  const handleExportMIDI = () => {
    if (!result.chordProgression || result.chordProgression.length === 0) {
      alert("没有可用的和弦数据来生成 MIDI (No chord data available).");
      return;
    }
    const midiBlob = createMidiFile(result.bpm, result.chordProgression);
    const filename = `suno-forge-${result.title.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_')}.mid`;
    downloadFile(midiBlob, filename, 'audio/midi');
  };

  const isAlbum = result.type === 'album';

  // Process lyrics to ensure structural tags are on new lines and formatted correctly
  const formattedLines = useMemo(() => {
    if (!result.lyrics) return [];
    
    const structuralKeywords = [
      'Intro', 'Verse', 'Chorus', 'Bridge', 'Pre-Chorus', 'Outro', 
      'Hook', 'Drop', 'Solo', 'Instrumental', 'Interlude', 'Big Finish'
    ];
    
    const structureTagRegex = new RegExp(`\\[(${structuralKeywords.join('|')})[^\\]]*\\]`, 'gi');

    let text = result.lyrics.replace(structureTagRegex, (match) => `\n${match}\n`);
    
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }, [result.lyrics]);

  const isStructuralHeader = (line: string) => {
    return line.startsWith('[') && line.endsWith(']') && line.length < 50 && !line.includes(':');
  };

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Export Toolbar */}
      <div className="flex justify-end gap-3 flex-wrap">
         {result.chordProgression && result.chordProgression.length > 0 && (
           <button 
             onClick={handleExportMIDI}
             className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs font-medium text-indigo-700 dark:text-indigo-300 transition-colors shadow-sm"
             title="导出和弦为 MIDI 文件"
           >
             <Music size={14} />
             导出 MIDI
           </button>
         )}
         <button 
           onClick={handleExportTXT}
           className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-suno-800 hover:bg-gray-100 dark:hover:bg-suno-700 border border-gray-200 dark:border-suno-700 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors shadow-sm"
           title="导出为文本文件"
         >
           <FileText size={14} />
           导出 TXT
         </button>
         <button 
           onClick={handleExportJSON}
           className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-suno-800 hover:bg-gray-100 dark:hover:bg-suno-700 border border-gray-200 dark:border-suno-700 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors shadow-sm"
           title="导出为 JSON 数据"
         >
           <FileJson size={14} />
           导出 JSON
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Meta Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Album Art Placeholder */}
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-800 dark:to-black border border-gray-200 dark:border-suno-700 shadow-2xl relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 z-0"></div>
              <img 
                src={`https://picsum.photos/seed/${encodeURIComponent(result.title + (result.albumTitle || ''))}/800/800`} 
                alt="Generated Cover Art" 
                className="w-full h-full object-cover opacity-90 dark:opacity-80 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                  {isAlbum && result.albumTitle && (
                    <h3 className="text-indigo-300 text-sm font-mono uppercase tracking-wider mb-1">
                      {result.albumTitle}
                    </h3>
                  )}
                  <h2 className={`font-bold text-white leading-tight ${isAlbum ? 'text-xl' : 'text-2xl'}`}>
                    {result.title}
                  </h2>
                  <p className="text-gray-300 text-xs mt-2 font-mono uppercase tracking-wider">
                    {isAlbum ? '主打单曲 (Lead Single)' : '生成单曲'}
                  </p>
              </div>
          </div>

          {/* Composition Card */}
          {(result.musicalKey || result.bpm || result.chordProgression) && (
            <div className="bg-white dark:bg-suno-800 rounded-xl border border-gray-200 dark:border-suno-700 p-5 shadow-lg">
               <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-4">
                <Activity size={18} />
                <span className="font-semibold text-sm uppercase tracking-wide">作曲信息 (Composition)</span>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Key (调式)</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{result.musicalKey || 'N/A'}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">BPM (速度)</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{result.bpm || 'N/A'}</span>
                 </div>
                 {result.chordProgression && (
                   <div className="pt-2 border-t border-gray-100 dark:border-suno-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">和弦进行 (Chords)</span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.chordProgression.map((chord, idx) => (
                          <span key={idx} className="inline-block px-2 py-1 bg-gray-100 dark:bg-suno-900 text-gray-700 dark:text-gray-300 text-xs font-mono rounded border border-gray-200 dark:border-suno-600">
                            {chord}
                          </span>
                        ))}
                      </div>
                   </div>
                 )}
              </div>
            </div>
          )}

          {/* Tracklist Card (Only for Albums) */}
          {isAlbum && result.trackList && (
            <div className="bg-white dark:bg-suno-800 rounded-xl border border-gray-200 dark:border-suno-700 p-5 shadow-lg">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-4">
                <ListOrdered size={18} />
                <span className="font-semibold text-sm uppercase tracking-wide">专辑曲目表 (Tracklist)</span>
              </div>
              <div className="space-y-3">
                {result.trackList.map((track, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm group">
                    <span className="text-gray-400 dark:text-gray-600 font-mono w-4 pt-0.5">{track.position || idx + 1}.</span>
                    <div className="flex-1">
                      <div className={`font-medium ${track.title === result.title ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-300'}`}>
                        {track.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{track.style}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Style Card */}
          <div className="bg-white dark:bg-suno-800 rounded-xl border border-gray-200 dark:border-suno-700 p-5 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Disc size={18} />
                <span className="font-semibold text-sm uppercase tracking-wide">风格提示词 (Style)</span>
              </div>
              <button 
                onClick={() => copyToClipboard(result.stylePrompt, 'style')}
                className="text-xs flex items-center gap-1 bg-gray-100 dark:bg-suno-700 hover:bg-gray-200 dark:hover:bg-suno-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded transition-colors"
              >
                {copiedSection === 'style' ? <Check size={14} className="text-green-500 dark:text-green-400"/> : <Copy size={14} />}
                {copiedSection === 'style' ? '已复制' : '复制'}
              </button>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-medium bg-gray-50 dark:bg-black/20 p-3 rounded-lg border border-gray-200 dark:border-suno-700/50">
              {result.stylePrompt}
            </p>
          </div>

          {/* Meta Prompt */}
          <div className="bg-white dark:bg-suno-800 rounded-xl border border-gray-200 dark:border-suno-700 p-5 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <FileAudio size={18} />
                <span className="font-semibold text-sm uppercase tracking-wide">封面提示词</span>
              </div>
              <button 
                onClick={() => copyToClipboard(result.coverArtPrompt, 'art')}
                className="text-xs flex items-center gap-1 bg-gray-100 dark:bg-suno-700 hover:bg-gray-200 dark:hover:bg-suno-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded transition-colors"
              >
                {copiedSection === 'art' ? <Check size={14} className="text-green-500 dark:text-green-400"/> : <Copy size={14} />}
                {copiedSection === 'art' ? '已复制' : '复制'}
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed italic">
              {result.coverArtPrompt}
            </p>
          </div>
        </div>

        {/* Right Col: Lyrics */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-suno-800 rounded-2xl border border-gray-200 dark:border-suno-700 shadow-2xl overflow-hidden h-full flex flex-col">
            <div className="bg-white dark:bg-suno-800 border-b border-gray-200 dark:border-suno-700 p-4 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md bg-opacity-90">
              <div className="flex items-center gap-2 text-gray-900 dark:text-gray-200">
                  <Mic2 size={20} className="text-indigo-600 dark:text-indigo-400"/>
                  <span className="font-bold">
                    {isAlbum ? `主打歌歌词: ${result.title}` : '歌词与结构'}
                  </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => copyToClipboard(result.lyrics, 'lyrics')}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {copiedSection === 'lyrics' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedSection === 'lyrics' ? '已复制歌词' : '复制歌词'}
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[800px] font-mono text-sm md:text-base bg-gray-50 dark:bg-[#121214] border-2 border-indigo-500/20 dark:border-indigo-400/20 m-4 rounded-xl shadow-[inset_0_0_20px_rgba(79,70,229,0.05)]">
               {formattedLines.map((line, idx) => {
                  const isHeader = isStructuralHeader(line);
                  
                  if (isHeader) {
                     return (
                       <div key={idx} className="mt-8 mb-3 first:mt-0">
                         <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md text-sm font-bold border border-indigo-200 dark:border-indigo-500/30 shadow-sm">
                           {line}
                         </span>
                       </div>
                     );
                  }

                  const parts = line.split(/(\[.*?\])/g);
                  return (
                    <div key={idx} className="mb-1.5 leading-relaxed pl-1">
                      {parts.map((part, pIdx) => {
                        if (part.startsWith('[') && part.endsWith(']')) {
                          return (
                            <span key={pIdx} className="text-purple-600 dark:text-purple-400 font-bold text-xs md:text-sm mr-1.5 align-middle opacity-90">
                               {part}
                            </span>
                          );
                        }
                        return <span key={pIdx} className="text-gray-800 dark:text-gray-300">{part}</span>
                      })}
                    </div>
                  );
               })}
               <div className="h-8"></div>
            </div>
            
            {result.explanation && (
              <div className="bg-gray-100 dark:bg-suno-900/50 p-4 text-xs text-gray-500 border-t border-gray-200 dark:border-suno-700">
                  AI 备注: {result.explanation}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongResult;
