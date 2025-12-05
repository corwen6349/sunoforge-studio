import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { SongGenerationResult } from '../types';
import { History, ArrowLeft, Trash2, RefreshCw, Cloud, CloudOff, Search, Filter, Calendar, Music, Disc3, Download, Loader2, X, AlertCircle } from 'lucide-react';
import { getCloudHistory, deleteGeneration, isApiConfigured } from '../services/api';

interface HistoryViewProps {
  user: User | null;
  localHistory: SongGenerationResult[];
  onLoadFromHistory: (result: SongGenerationResult) => void;
  onBackToStudio: () => void;
  onDeleteLocal?: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ 
  user, 
  localHistory, 
  onLoadFromHistory, 
  onBackToStudio,
  onDeleteLocal 
}) => {
  const [cloudHistory, setCloudHistory] = useState<SongGenerationResult[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [viewMode, setViewMode] = useState<'local' | 'cloud'>('local');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'single' | 'album'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const apiEnabled = isApiConfigured();

  useEffect(() => {
    if (user && apiEnabled && viewMode === 'cloud') {
      loadCloudHistory();
    }
  }, [user, viewMode]);

  const loadCloudHistory = async () => {
    if (!user) return;
    
    setIsLoadingCloud(true);
    try {
      const data = await getCloudHistory(user.id);
      setCloudHistory(data);
    } catch (err: any) {
      console.error('Failed to load cloud history:', err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleDelete = async (id: string, isCloud: boolean) => {
    if (!id) return;

    try {
      if (isCloud && user) {
        await deleteGeneration(id, user.id);
        setCloudHistory(prev => prev.filter(item => item.id !== id));
      } else if (onDeleteLocal) {
        onDeleteLocal(id);
      }
      setShowDeleteConfirm(null);
    } catch (err: any) {
      console.error('Failed to delete:', err);
      alert('删除失败，请重试');
    }
  };

  const currentHistory = viewMode === 'cloud' ? cloudHistory : localHistory;

  const filteredHistory = currentHistory.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.albumTitle?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.stylePrompt.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' || 
      item.type === filterType;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToStudio} 
            className="md:hidden p-2 rounded-lg bg-white dark:bg-suno-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-suno-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <History size={32} />
              历史记录
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {viewMode === 'cloud' ? '云端同步的创作' : '本地存储的创作'}
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        {apiEnabled && user && (
          <div className="flex bg-gray-100 dark:bg-suno-900 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('local')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === 'local' 
                  ? 'bg-white dark:bg-suno-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Download size={16} />
              本地 ({localHistory.length})
            </button>
            <button
              onClick={() => setViewMode('cloud')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === 'cloud' 
                  ? 'bg-white dark:bg-suno-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Cloud size={16} />
              云端 ({cloudHistory.length})
            </button>
          </div>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-suno-800 rounded-xl border border-gray-200 dark:border-suno-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索标题、专辑或风格..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-suno-900/50 border border-gray-200 dark:border-suno-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 bg-gray-50 dark:bg-suno-900/50 border border-gray-200 dark:border-suno-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">全部类型</option>
              <option value="single">单曲</option>
              <option value="album">专辑</option>
            </select>
          </div>

          {/* Refresh Cloud */}
          {viewMode === 'cloud' && user && (
            <button
              onClick={loadCloudHistory}
              disabled={isLoadingCloud}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoadingCloud ? 'animate-spin' : ''} />
              刷新
            </button>
          )}
        </div>
      </div>

      {/* History Grid */}
      {isLoadingCloud ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={48} />
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white dark:bg-suno-800 rounded-2xl border border-dashed border-gray-300 dark:border-suno-700 p-12 text-center">
          {searchTerm || filterType !== 'all' ? (
            <>
              <AlertCircle size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">没有找到匹配的结果</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
              >
                清除筛选条件
              </button>
            </>
          ) : (
            <>
              <History size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                {viewMode === 'cloud' ? '云端暂无创作记录' : '暂无创作记录'}
              </p>
              <button 
                onClick={onBackToStudio}
                className="mt-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
              >
                去创作第一首歌 →
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHistory.map((item, idx) => {
            const itemId = item.id || `local-${idx}`;
            const isDeleting = showDeleteConfirm === itemId;

            return (
              <div 
                key={itemId} 
                className="bg-white dark:bg-suno-800 rounded-xl border border-gray-200 dark:border-suno-700 overflow-hidden hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group shadow-sm hover:shadow-lg relative"
              >
                {/* Cover Image */}
                <div className="h-40 bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
                  <img 
                    src={`https://picsum.photos/seed/${encodeURIComponent(item.title + (item.albumTitle || ''))}/400/300`} 
                    alt={item.title} 
                    className="w-full h-full object-cover opacity-90 dark:opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                  />
                  {item.type === 'album' && (
                    <div className="absolute top-3 left-3 bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow-lg flex items-center gap-1 font-medium">
                      <Disc3 size={12} />
                      专辑
                    </div>
                  )}
                  {item.type === 'single' && (
                    <div className="absolute top-3 left-3 bg-purple-600 text-white text-xs px-2 py-1 rounded shadow-lg flex items-center gap-1 font-medium">
                      <Music size={12} />
                      单曲
                    </div>
                  )}
                  {viewMode === 'cloud' && (
                    <div className="absolute top-3 right-3 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-lg flex items-center gap-1">
                      <Cloud size={10} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-gray-900 dark:text-white font-bold text-lg truncate mb-1">
                    {item.albumTitle ? item.albumTitle : item.title}
                  </h3>
                  {item.albumTitle && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                      主打: {item.title}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 mb-3">
                    {item.stylePrompt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
                      <Calendar size={12} />
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </div>

                    <div className="flex gap-2">
                      {/* Delete Confirmation */}
                      {isDeleting ? (
                        <div className="flex gap-2 animate-fade-in">
                          <button
                            onClick={() => handleDelete(itemId, viewMode === 'cloud')}
                            className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            确认
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="text-xs bg-gray-200 dark:bg-suno-700 hover:bg-gray-300 dark:hover:bg-suno-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => onLoadFromHistory(item)}
                            className="text-xs bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-300 dark:hover:text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            查看
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(itemId)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cloud Sync Info */}
      {!apiEnabled && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
          <CloudOff size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">云端同步未启用</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              配置 API 后即可将创作同步到云端，随时随地访问您的作品
            </p>
          </div>
        </div>
      )}

      {apiEnabled && !user && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-300">未登录</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              登录账户后，您的创作将自动同步到云端
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
