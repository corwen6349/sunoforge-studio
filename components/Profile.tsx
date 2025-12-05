import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { UserProfile, UserStats } from '../types';
import { 
  User as UserIcon, Mail, Calendar, Music, Disc3, Edit3, Save, X, 
  Loader2, Camera, LogOut, Cloud, CloudOff, TrendingUp,
  Award, Sparkles
} from 'lucide-react';
import { getUserProfile, updateUserProfile, getUserStats, signOut, isApiConfigured } from '../services/api';

interface ProfileProps {
  user: User | null;
  onSignOut: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onSignOut }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');

  const apiEnabled = isApiConfigured();

  useEffect(() => {
    if (user && apiEnabled) {
      loadProfile();
      loadStats();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const data = await getUserProfile(user.id);
      setProfile(data);
      setEditDisplayName(data.display_name || '');
      setEditBio(data.bio || '');
    } catch (err: any) {
      setError('无法加载个人资料');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const data = await getUserStats(user.id);
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updated = await updateUserProfile(user.id, {
        display_name: editDisplayName,
        bio: editBio,
      });
      setProfile(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (apiEnabled) {
        await signOut();
      }
      onSignOut();
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  if (!apiEnabled) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">个人资料</h1>
        </div>

        <div className="bg-white dark:bg-suno-800 rounded-2xl border border-gray-200 dark:border-suno-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-suno-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CloudOff size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            未配置云端服务
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            您需要配置 TiDB 后端服务才能使用个人资料和云端同步功能。<br />
            请查看 README.md 了解配置说明。
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">个人资料</h1>
        </div>

        <div className="bg-white dark:bg-suno-800 rounded-2xl border border-gray-200 dark:border-suno-700 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon size={32} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            未登录
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            登录账户即可使用个人资料和云端同步功能
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">个人资料</h1>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors border border-red-200 dark:border-red-800"
        >
          <LogOut size={16} />
          退出登录
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-white dark:bg-suno-800 rounded-2xl border border-gray-200 dark:border-suno-700 overflow-hidden">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
            <div className="absolute -bottom-12 left-6">
              <div className="w-24 h-24 bg-white dark:bg-suno-800 rounded-2xl border-4 border-white dark:border-suno-900 flex items-center justify-center shadow-xl">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <UserIcon size={40} className="text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-16 px-6 pb-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Display Mode */}
            {!isEditing ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile?.display_name || '未命名用户'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <Mail size={14} />
                      {user.email}
                    </div>
                    {profile?.created_at && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar size={14} />
                        加入于 {new Date(profile.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors"
                  >
                    <Edit3 size={16} />
                    编辑
                  </button>
                </div>

                {profile?.bio && (
                  <div className="p-4 bg-gray-50 dark:bg-suno-900/50 rounded-xl">
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    显示名称
                  </label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-suno-900/50 border border-gray-200 dark:border-suno-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    个人简介
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    placeholder="介绍一下你自己..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-suno-900/50 border border-gray-200 dark:border-suno-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditDisplayName(profile?.display_name || '');
                      setEditBio(profile?.bio || '');
                      setError(null);
                    }}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-suno-900/50 hover:bg-gray-200 dark:hover:bg-suno-900 text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
                  >
                    <X size={18} />
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="space-y-4">
          {/* Total Generations */}
          <div className="bg-white dark:bg-suno-800 rounded-2xl border border-gray-200 dark:border-suno-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <TrendingUp size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">总创作数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalGenerations || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Single Songs */}
          <div className="bg-white dark:bg-suno-800 rounded-2xl border border-gray-200 dark:border-suno-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Music size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">单曲</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.singleCount || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Albums */}
          <div className="bg-white dark:bg-suno-800 rounded-2xl border border-gray-200 dark:border-suno-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <Disc3 size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">专辑</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.albumCount || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Cloud Status */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-6">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
              <Cloud size={20} />
              <span className="font-semibold">云端同步已启用</span>
            </div>
            <p className="text-xs text-green-600/70 dark:text-green-400/70">
              您的创作会自动保存到云端
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
