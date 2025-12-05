import React from 'react';
import { User as AppUser } from '../types';
import { Disc, Music4, Settings, ListMusic, User, Sun, Moon, Monitor, LogIn, Cloud } from 'lucide-react';
import { isApiConfigured } from '../services/api';

export type ThemeMode = 'light' | 'dark' | 'system';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  user?: AppUser | null;
  onShowAuth?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange, theme, onThemeChange, user, onShowAuth }) => {
  const apiEnabled = isApiConfigured();

  return (
    <div className="min-h-screen flex font-sans bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-16 md:w-64 flex-shrink-0 border-r border-gray-200 dark:border-suno-700 bg-white dark:bg-suno-800 flex flex-col items-center md:items-stretch py-6 z-10 sticky top-0 h-screen transition-colors duration-300">
        <div className="px-4 mb-10 flex items-center justify-center md:justify-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20">
            <Disc className="text-white w-6 h-6 animate-spin-slow" />
          </div>
          <span className="hidden md:block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-white dark:to-gray-400">
            SunoForge
          </span>
        </div>

        <nav className="flex-1 px-2 space-y-2">
          <NavItem 
            icon={<Music4 />} 
            label="创作室" 
            active={currentView === 'studio'} 
            onClick={() => onViewChange('studio')}
          />
          <NavItem 
            icon={<ListMusic />} 
            label="历史记录" 
            active={currentView === 'history'}
            onClick={() => onViewChange('history')}
          />
          <NavItem 
            icon={<User />} 
            label="个人资料" 
            active={currentView === 'profile'}
            onClick={() => onViewChange('profile')}
          />
        </nav>

        {/* User Section */}
        {apiEnabled && (
          <div className="px-2 mb-2">
            {user ? (
              <button
                onClick={() => onViewChange('profile')}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-suno-700/50 hover:text-gray-900 dark:hover:text-white"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center overflow-hidden">
                  <User size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="hidden md:block font-medium truncate text-sm max-w-[120px]">
                  {user.username || user.email?.split('@')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={onShowAuth}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-suno-700/50 hover:text-gray-900 dark:hover:text-white"
              >
                <LogIn size={20} />
                <span className="hidden md:block font-medium">登录 / 注册</span>
              </button>
            )}
          </div>
        )}

        {/* Bottom Section: Theme Switcher & Settings */}
        <div className="px-2 mt-auto space-y-3">
          {/* Login Button (if not logged in and API enabled) */}
          {apiEnabled && !user && onShowAuth && (
            <button
              onClick={onShowAuth}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30"
            >
              <LogIn size={20} />
              <span className="hidden md:block font-medium">登录/注册</span>
            </button>
          )}

          {/* User Status Badge (if logged in) */}
          {apiEnabled && user && (
            <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Cloud size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="hidden md:block text-xs text-green-700 dark:text-green-400 font-medium truncate">
                  {user.email?.split('@')[0] || '已登录'}
                </span>
              </div>
            </div>
          )}

          {/* Theme Switcher */}
          <div className="p-1 bg-gray-100 dark:bg-suno-900 rounded-lg flex items-center justify-between shadow-inner">
             <ThemeBtn 
                active={theme === 'light'} 
                onClick={() => onThemeChange('light')} 
                icon={<Sun size={16}/>} 
                label="Light"
             />
             <ThemeBtn 
                active={theme === 'system'} 
                onClick={() => onThemeChange('system')} 
                icon={<Monitor size={16}/>} 
                label="System"
             />
             <ThemeBtn 
                active={theme === 'dark'} 
                onClick={() => onThemeChange('dark')} 
                icon={<Moon size={16}/>} 
                label="Dark"
             />
          </div>

           <NavItem 
            icon={<Settings />} 
            label="设置" 
            active={currentView === 'settings'}
            onClick={() => onViewChange('settings')}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 pointer-events-none mix-blend-overlay"></div>
        <div className="max-w-6xl mx-auto px-6 py-8 relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
};

const ThemeBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    title={label}
    className={`
      flex-1 flex items-center justify-center py-1.5 rounded-md transition-all duration-200
      ${active 
        ? 'bg-white dark:bg-suno-700 text-indigo-600 dark:text-indigo-400 shadow-sm scale-100' 
        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
      }
    `}
  >
    {icon}
  </button>
)

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-indigo-50 dark:bg-suno-700 text-indigo-700 dark:text-white shadow-sm' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-suno-700/50 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
    <span className="hidden md:block font-medium">{label}</span>
  </button>
);

export default Layout;