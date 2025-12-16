
import React, { useState, useRef, useEffect } from 'react';
import { User, UserPreferences } from '../types';
import { 
  House, CircleUser, Camera, Fingerprint, Comment, 
  Inbox, CreditCard, Visa, Stripe, Google, Discord, 
  Facebook, Linkedin, Github 
} from './Icons';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  isDarkMode: boolean;
}

type Tab = 'profile' | 'notifications' | 'privacy' | 'billing' | 'support' | 'about';

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onUpdateUser, 
  onLogout,
  isDarkMode 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [formData, setFormData] = useState<User>(user);
  const [preferences, setPreferences] = useState<UserPreferences>(user.preferences || {
    emailNotifications: true,
    pushNotifications: true,
    twoFactorAuth: false,
    publicProfile: false
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(user);
      if (user.preferences) {
        setPreferences(user.preferences);
      }
    }
  }, [isOpen, user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreferenceChange = (key: keyof UserPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = { ...formData, preferences };
      await onUpdateUser(updatedUser);
      showToast('Changes saved successfully.');
    } catch (error) {
      showToast('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const bgMain = isDarkMode ? 'bg-slate-900' : 'bg-slate-50';
  const bgCard = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const borderClass = isDarkMode ? 'border-slate-700' : 'border-slate-200';
  const inputBg = isDarkMode ? 'bg-slate-900' : 'bg-slate-50';
  const sidebarHover = isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100';
  const sidebarActive = isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700';

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${bgMain} transition-colors duration-300`}>
      {/* Top Bar */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${borderClass} ${bgCard}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${sidebarHover} ${textSecondary}`}
            title="Go Home"
          >
            <House className="w-6 h-6" />
          </button>
          <h1 className={`text-xl font-bold ${textPrimary}`}>Profile Settings</h1>
        </div>
        <div className="flex items-center gap-4">
          {toastMessage && (
            <span className="text-green-500 text-sm font-medium animate-pulse">{toastMessage}</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-64 flex-none border-r ${borderClass} ${bgCard} hidden md:flex flex-col`}>
          <div className="p-4 space-y-1">
             {[
               { id: 'profile', label: 'Edit Profile', Icon: CircleUser },
               { id: 'notifications', label: 'Notifications', Icon: Inbox },
               { id: 'privacy', label: 'Privacy & Security', Icon: Fingerprint },
               { id: 'billing', label: 'Billing & Plans', Icon: CreditCard },
               { id: 'support', label: 'Help & Support', Icon: Comment },
               { id: 'about', label: 'About', Icon: House } // House acts as "About InfoStack"
             ].map((item) => (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id as Tab)}
                 className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === item.id ? sidebarActive : `${textSecondary} ${sidebarHover}`}`}
               >
                 <item.Icon className="w-5 h-5" />
                 {item.label}
               </button>
             ))}
          </div>
          <div className="mt-auto p-4 border-t border-slate-700/10">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className="max-w-3xl mx-auto">
            {/* Mobile Tabs */}
            <div className="md:hidden flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
              {['profile', 'notifications', 'privacy', 'billing', 'support'].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t as Tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeTab === t ? 'bg-blue-600 text-white' : `${bgCard} ${textSecondary} border ${borderClass}`}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                <div>
                  <h2 className={`text-2xl font-bold ${textPrimary}`}>Public Profile</h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>Manage your personal information.</p>
                </div>

                <div className={`p-6 rounded-2xl border ${borderClass} ${bgCard}`}>
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative group">
                      <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'} shadow-lg flex items-center justify-center`}>
                        {formData.avatar ? (
                          <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <CircleUser className={`w-12 h-12 ${textSecondary}`} />
                        )}
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-all cursor-pointer text-white"
                      >
                        <Camera className="w-6 h-6" />
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${textPrimary}`}>{formData.displayName || formData.email.split('@')[0]}</h3>
                      <p className={`text-sm ${textSecondary}`}>Student Account</p>
                    </div>
                  </div>
                  {/* ... Inputs same as before ... */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>Display Name</label>
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName || ''}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border ${borderClass} ${inputBg} ${textPrimary} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                      />
                    </div>
                     <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border ${borderClass} ${inputBg} ${textPrimary} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>Phone Number</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber || ''}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border ${borderClass} ${inputBg} ${textPrimary} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>About</label>
                      <textarea
                        name="about"
                        value={formData.about || ''}
                        onChange={handleInputChange}
                        rows={3}
                        className={`w-full px-4 py-3 rounded-lg border ${borderClass} ${inputBg} ${textPrimary} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                 <div>
                  <h2 className={`text-2xl font-bold ${textPrimary}`}>Notifications</h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>Manage alerts.</p>
                </div>
                <div className={`rounded-2xl border ${borderClass} ${bgCard} overflow-hidden`}>
                  {/* Reusing checkboxes but wrapped nicely */}
                  <div className={`flex items-center justify-between p-6 border-b ${borderClass}`}>
                    <div>
                      <h3 className={`font-medium ${textPrimary}`}>Email Notifications</h3>
                      <p className={`text-sm ${textSecondary}`}>Weekly summaries.</p>
                    </div>
                    <input type="checkbox" checked={preferences.emailNotifications} onChange={() => handlePreferenceChange('emailNotifications')} className="accent-blue-600 w-5 h-5" />
                  </div>
                   <div className={`flex items-center justify-between p-6`}>
                    <div>
                      <h3 className={`font-medium ${textPrimary}`}>Push Notifications</h3>
                      <p className={`text-sm ${textSecondary}`}>Real-time updates.</p>
                    </div>
                    <input type="checkbox" checked={preferences.pushNotifications} onChange={() => handlePreferenceChange('pushNotifications')} className="accent-blue-600 w-5 h-5" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PRIVACY */}
            {activeTab === 'privacy' && (
               <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                 <div>
                  <h2 className={`text-2xl font-bold ${textPrimary}`}>Privacy & Security</h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>Security settings.</p>
                </div>
                <div className={`p-6 rounded-2xl border ${borderClass} ${bgCard} space-y-6`}>
                   <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Fingerprint className="w-8 h-8 text-blue-500" />
                          <div>
                            <p className={`text-sm font-bold ${textPrimary}`}>Two-Factor Authentication</p>
                          </div>
                       </div>
                       <input type="checkbox" checked={preferences.twoFactorAuth} onChange={() => handlePreferenceChange('twoFactorAuth')} className="accent-purple-600 w-5 h-5" />
                    </div>
                </div>
               </div>
            )}

            {/* TAB: BILLING (NEW) */}
             {activeTab === 'billing' && (
               <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                 <div>
                  <h2 className={`text-2xl font-bold ${textPrimary}`}>Billing & Plans</h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>Manage your subscription.</p>
                </div>
                <div className={`p-6 rounded-2xl border ${borderClass} ${bgCard} space-y-4`}>
                   <h3 className={`font-bold ${textPrimary} mb-4`}>Payment Methods</h3>
                   <div className="flex gap-3">
                      <div className="p-3 border border-slate-600 rounded bg-white text-slate-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" /> Visa
                      </div>
                      <div className="p-3 border border-slate-600 rounded bg-white text-slate-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" /> Stripe
                      </div>
                      <div className="p-3 border border-slate-600 rounded bg-white text-slate-900 flex items-center gap-2">
                         <Google className="w-5 h-5" /> Pay
                      </div>
                   </div>
                   <p className={`text-xs ${textSecondary} mt-2`}>Secured by Stripe.</p>
                </div>
               </div>
            )}

            {/* TAB: SUPPORT */}
            {activeTab === 'support' && (
              <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                 <div>
                  <h2 className={`text-2xl font-bold ${textPrimary}`}>Help & Support</h2>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className={`p-6 rounded-xl border ${borderClass} ${bgCard} hover:border-blue-500 transition-colors`}>
                      <Discord className="w-8 h-8 text-blue-500 mb-2" />
                      <h3 className={`font-bold ${textPrimary}`}>Community Chat</h3>
                      <p className={`text-sm ${textSecondary}`}>Join our Discord.</p>
                   </div>
                 </div>
              </div>
            )}

            {/* TAB: ABOUT */}
            {activeTab === 'about' && (
              <div className="space-y-8 animate-[fadeIn_0.3s_ease-out] text-center pt-10">
                 <div className="mx-auto w-12 h-12 text-blue-500">
                   <House className="w-12 h-12" />
                 </div>
                 <h2 className={`text-3xl font-bold ${textPrimary}`}>InfoStack</h2>
                 <p className={`text-lg ${textSecondary}`}>Version 2.4.0</p>
                 <div className="flex justify-center gap-6 mt-12">
                    <Facebook className="w-6 h-6 text-slate-400 hover:text-blue-600 cursor-pointer" />
                    <Linkedin className="w-6 h-6 text-slate-400 hover:text-blue-700 cursor-pointer" />
                    <Github className="w-6 h-6 text-slate-400 hover:text-white cursor-pointer" />
                 </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfileSettings;
