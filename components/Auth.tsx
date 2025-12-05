import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, Loader2, AlertCircle, X } from 'lucide-react';
import { signIn, signUp } from '../services/api';

interface AuthProps {
  onSuccess: () => void;
  onClose?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-suno-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-suno-700 animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
          <div className="flex items-center gap-3 mb-2">
            {mode === 'signin' ? <LogIn size={28} /> : <UserPlus size={28} />}
            <h2 className="text-2xl font-bold">
              {mode === 'signin' ? '登录账户' : '创建账户'}
            </h2>
          </div>
          <p className="text-white/80 text-sm">
            {mode === 'signin' 
              ? '登录以同步您的创作历史到云端' 
              : '注册账户，保存您的所有创作'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <UserIcon size={14} />
                显示名称
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="请输入您的昵称"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-suno-900/50 border border-gray-200 dark:border-suno-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white transition-all"
                required={mode === 'signup'}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Mail size={14} />
              邮箱地址
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-suno-900/50 border border-gray-200 dark:border-suno-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Lock size={14} />
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-suno-900/50 border border-gray-200 dark:border-suno-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white transition-all"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-300 animate-fade-in">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
              ${isLoading 
                ? 'bg-gray-200 dark:bg-suno-700 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                处理中...
              </>
            ) : (
              <>
                {mode === 'signin' ? <LogIn size={18} /> : <UserPlus size={18} />}
                {mode === 'signin' ? '登录' : '注册'}
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {mode === 'signin' 
                ? '还没有账户？立即注册 →' 
                : '已有账户？立即登录 →'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
