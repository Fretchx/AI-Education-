
import React, { useState, useRef, useEffect } from 'react';
import { User, UserPreferences } from '../types';
import { 
  House, CircleUser, Camera, Fingerprint, Comment, 
  Inbox, CreditCard, Visa, Stripe, Google, Discord, 
  Facebook, Linkedin, Github, AccessibilityIcon, HelpIcon, File
} from './Icons';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  isDarkMode: boolean;
}

type Tab = 'profile' | 'notifications' | 'accessibility' | 'privacy' | 'terms' | 'billing' | 'help' | 'about';
type PaymentMethod = 'visa' | 'stripe' | 'google';

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
    publicProfile: false,
    reducedMotion: false,
    highContrast: false,
    largeText: false
  });
  
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('visa');
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

  const getPaymentBtnClass = (method: PaymentMethod) => {
    const isSelected = selectedPayment === method;
    const base = "flex-1 p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer relative overflow-hidden";
    
    if (isSelected) {
      return `${base} border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-md ring-1 ring-blue-500`;
    }
    return `${base} border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50`;
  };

  const bgMain = isDarkMode ? 'bg-slate-900' : 'bg-slate-50';
  const bgCard = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const borderClass = isDarkMode ? 'border-slate-700' : 'border-slate-200';
  const inputBg = isDarkMode ? 'bg-slate-900' : 'bg-slate-50';
  const sidebarHover = isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100';
  const sidebarActive = isDarkMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-blue-100 text-blue-700';

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
          <h1 className={`text-xl font-bold ${textPrimary}`}>Settings</h1>
        </div>
        <div className="flex items-center gap-4">
          {toastMessage && (
            <span className="text-green-500 text-sm font-medium animate-pulse">{toastMessage}</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 transform active:scale-95"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-64 flex-none border-r ${borderClass} ${bgCard} hidden md:flex flex-col overflow-y-auto`}>
          <div className="p-4 space-y-1">
             {[
               { id: 'profile', label: 'Profile', Icon: CircleUser },
               { id: 'notifications', label: 'Notifications', Icon: Inbox },
               { id: 'accessibility', label: 'Accessibility', Icon: AccessibilityIcon },
               { id: 'privacy', label: 'Privacy & Security', Icon: Fingerprint },
               { id: 'billing', label: 'Billing & Plans', Icon: CreditCard },
               { id: 'terms', label: 'Terms & Conditions', Icon: File },
               { id: 'help', label: 'Help & Support', Icon: HelpIcon },
               { id: 'about', label: 'About', Icon: House }
             ].map((item) => (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id as Tab)}
                 className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === item.id ? sidebarActive : `${textSecondary} ${sidebarHover}`}`}
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
        <main className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
          <div className="max-w-3xl mx-auto">
            {/* Mobile Tabs */}
            <div className="md:hidden flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
              {['profile', 'notifications', 'accessibility', 'privacy', 'billing', 'terms', 'help', 'about'].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t as Tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t ? 'bg-blue-600 text-white' : `${bgCard} ${textSecondary} border ${borderClass}`}`}
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
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'} shadow-lg flex items-center justify-center relative`}>
                        {formData.avatar ? (
                          <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <CircleUser className={`w-12 h-12 ${textSecondary}`} />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${textPrimary}`}>{formData.displayName || formData.email.split('@')[0]}</h3>
                      <p className={`text-sm ${textSecondary}`}>Student Account</p>
                    </div>
                  </div>
                  
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>Display Name</label>
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName || ''}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border ${borderClass} ${inputBg} ${textPrimary} focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow`}
                      />
                    </div>
                     <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border ${borderClass} ${inputBg} ${textPrimary} focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>Phone Number</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber || ''}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border ${borderClass} ${inputBg} ${textPrimary} focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>About</label>
                      <textarea
                        name="about"
                        value={formData.about || ''}
                        onChange={handleInputChange}
                        rows={3}
                        className={`w-full px-4 py-3 rounded-lg border ${borderClass} ${inputBg} ${textPrimary} focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow`}
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
                  <p className={`text-sm ${textSecondary} mt-1`}>Manage how you receive alerts.</p>
                </div>
                <div className={`rounded-2xl border ${borderClass} ${bgCard} overflow-hidden`}>
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Weekly summaries and important updates.' },
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Real-time alerts for your active sessions.' }
                  ].map((item) => (
                    <div key={item.key} className={`flex items-center justify-between p-6 border-b ${borderClass} last:border-0`}>
                      <div>
                        <h3 className={`font-medium ${textPrimary}`}>{item.label}</h3>
                        <p className={`text-sm ${textSecondary}`}>{item.desc}</p>
                      </div>
                      <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                          <input 
                            type="checkbox" 
                            checked={preferences[item.key as keyof UserPreferences] as boolean} 
                            onChange={() => handlePreferenceChange(item.key as keyof UserPreferences)} 
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6 checked:border-blue-600 border-gray-300 transition-all duration-300"
                          />
                          <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${preferences[item.key as keyof UserPreferences] ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: ACCESSIBILITY */}
            {activeTab === 'accessibility' && (
              <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                 <div>
                  <h2 className={`text-2xl font-bold ${textPrimary}`}>Accessibility</h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>Customize your viewing experience.</p>
                </div>
                <div className={`rounded-2xl border ${borderClass} ${bgCard} overflow-hidden`}>
                  {[
                    { key: 'reducedMotion', label: 'Reduced Motion', desc: 'Minimize animations throughout the application.' },
                    { key: 'highContrast', label: 'High Contrast Mode', desc: 'Increase contrast for better readability.' },
                    { key: 'largeText', label: 'Larger Text', desc: 'Increase font size for text content.' }
                  ].map((item) => (
                    <div key={item.key} className={`flex items-center justify-between p-6 border-b ${borderClass} last:border-0`}>
                      <div>
                        <h3 className={`font-medium ${textPrimary}`}>{item.label}</h3>
                        <p className={`text-sm ${textSecondary}`}>{item.desc}</p>
                      </div>
                      <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                          <input 
                            type="checkbox" 
                            checked={preferences[item.key as keyof UserPreferences] as boolean} 
                            onChange={() => handlePreferenceChange(item.key as keyof UserPreferences)} 
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6 checked:border-blue-600 border-gray-300 transition-all duration-300"
                          />
                          <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${preferences[item.key as keyof UserPreferences] ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                      </div>
                    </div>
                  ))}
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
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                             <Fingerprint className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className={`text-base font-bold ${textPrimary}`}>Two-Factor Authentication</p>
                            <p className={`text-sm ${textSecondary}`}>Add an extra layer of security.</p>
                          </div>
                       </div>
                       <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" checked={preferences.twoFactorAuth} onChange={() => handlePreferenceChange('twoFactorAuth')} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6 checked:border-purple-600 border-gray-300 transition-all duration-300"/>
                        <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${preferences.twoFactorAuth ? 'bg-purple-600' : 'bg-gray-300'}`}></label>
                    </div>
                    </div>
                </div>
               </div>
            )}

            {/* TAB: BILLING */}
             {activeTab === 'billing' && (
               <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                 <div>
                  <h2 className={`text-2xl font-bold ${textPrimary}`}>Billing & Plans</h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>Manage your subscription.</p>
                </div>
                
                <div className={`p-6 rounded-2xl border ${borderClass} ${bgCard} space-y-6`}>
                   <div>
                     <h3 className={`font-bold ${textPrimary} mb-4 flex items-center gap-2`}>
                       <CreditCard className="w-5 h-5 text-blue-500" />
                       Select Payment Method
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button 
                          onClick={() => setSelectedPayment('visa')} 
                          className={getPaymentBtnClass('visa')}
                        >
                          <Visa className="w-10 h-10" />
                          <span className="font-semibold">Visa Ending 4242</span>
                          {selectedPayment === 'visa' && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
                          )}
                        </button>

                        <button 
                          onClick={() => setSelectedPayment('stripe')} 
                          className={getPaymentBtnClass('stripe')}
                        >
                          <Stripe className="w-10 h-10" />
                          <span className="font-semibold">Stripe Link</span>
                          {selectedPayment === 'stripe' && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
                          )}
                        </button>

                        <button 
                          onClick={() => setSelectedPayment('google')} 
                          className={getPaymentBtnClass('google')}
                        >
                          <Google className="w-8 h-8" />
                          <span className="font-semibold">Google Pay</span>
                          {selectedPayment === 'google' && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
                          )}
                        </button>
                     </div>
                   </div>

                   <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'} border ${borderClass} flex justify-between items-center`}>
                      <div>
                        <p className={`text-sm font-medium ${textPrimary}`}>Current Plan: <span className="text-blue-500 font-bold">Pro Student</span></p>
                        <p className={`text-xs ${textSecondary}`}>Next billing date: August 1, 2024</p>
                      </div>
                      <button className="text-sm font-medium text-blue-500 hover:text-blue-400 hover:underline">
                        Manage Plan
                      </button>
                   </div>
                </div>
               </div>
            )}

            {/* TAB: TERMS */}
            {activeTab === 'terms' && (
              <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                <div>
                  <h2 className={`text-2xl font-bold ${textPrimary}`}>Terms & Conditions</h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>Last updated: August 2024</p>
                </div>
                <div className={`p-6 rounded-2xl border ${borderClass} ${bgCard} space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar`}>
                  <h3 className={`font-bold ${textPrimary}`}>1. Introduction</h3>
                  <p className={`text-sm ${textSecondary}`}>Welcome to InfoStack. By using our service, you agree to these terms. Please read them carefully.</p>
                  
                  <h3 className={`font-bold ${textPrimary}`}>2. Usage License</h3>
                  <p className={`text-sm ${textSecondary}`}>Permission is granted to temporarily download one copy of the materials (information or software) on InfoStack's website for personal, non-commercial transitory viewing only.</p>

                  <h3 className={`font-bold ${textPrimary}`}>3. Disclaimer</h3>
                  <p className={`text-sm ${textSecondary}`}>The materials on InfoStack's website are provided on an 'as is' basis. InfoStack makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                  
                  <h3 className={`font-bold ${textPrimary}`}>4. Limitations</h3>
                  <p className={`text-sm ${textSecondary}`}>In no event shall InfoStack or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on InfoStack's website.</p>
                </div>
              </div>
            )}

            {/* TAB: HELP */}
            {activeTab === 'help' && (
              <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                 <div>
                  <h2 className={`text-2xl font-bold ${textPrimary}`}>Help & Support</h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>We're here to help you.</p>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <a href="#" className={`group p-6 rounded-xl border ${borderClass} ${bgCard} hover:border-blue-500 transition-all shadow-sm hover:shadow-md block`}>
                      <Discord className="w-10 h-10 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
                      <h3 className={`font-bold ${textPrimary} text-lg`}>Community Chat</h3>
                      <p className={`text-sm ${textSecondary} mt-1`}>Join 5,000+ students on Discord.</p>
                   </a>
                   <a href="#" className={`group p-6 rounded-xl border ${borderClass} ${bgCard} hover:border-blue-500 transition-all shadow-sm hover:shadow-md block`}>
                      <Comment className="w-10 h-10 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
                      <h3 className={`font-bold ${textPrimary} text-lg`}>Email Support</h3>
                      <p className={`text-sm ${textSecondary} mt-1`}>Get help within 24 hours.</p>
                   </a>
                 </div>
                 
                 <div className={`p-6 rounded-2xl border ${borderClass} ${bgCard}`}>
                   <h3 className={`font-bold ${textPrimary} mb-4`}>Frequently Asked Questions</h3>
                   <div className="space-y-4">
                      {[
                        { q: "How do I reset my password?", a: "Go to the login screen and click 'Forgot Password' to receive a reset link via email." },
                        { q: "Is my data secure?", a: "Yes, we use industry-standard encryption for all data transmission and storage." },
                        { q: "Can I export my chat history?", a: "Currently, you can copy individual code blocks. Full export features are coming soon." }
                      ].map((faq, i) => (
                        <div key={i}>
                          <p className={`font-medium ${textPrimary} text-sm`}>{faq.q}</p>
                          <p className={`text-sm ${textSecondary} mt-1`}>{faq.a}</p>
                        </div>
                      ))}
                   </div>
                 </div>
              </div>
            )}

            {/* TAB: ABOUT */}
            {activeTab === 'about' && (
              <div className="space-y-8 animate-[fadeIn_0.3s_ease-out] text-center pt-10">
                 <div className="mx-auto w-16 h-16 text-blue-500 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                   <House className="w-8 h-8" />
                 </div>
                 <h2 className={`text-3xl font-bold ${textPrimary}`}>InfoStack</h2>
                 <p className={`text-lg ${textSecondary}`}>Version 2.4.0</p>
                 <p className={`text-sm ${textSecondary} max-w-md mx-auto mt-4`}>
                   InfoStack is an intelligent knowledge base and AI tutor designed specifically for Computer Science students. Our mission is to make learning to code accessible, personalized, and efficient.
                 </p>
                 <div className="flex justify-center gap-8 mt-12">
                    <button className="transform hover:scale-110 transition-transform"><Facebook className="w-8 h-8 text-slate-400 hover:text-blue-600" /></button>
                    <button className="transform hover:scale-110 transition-transform"><Linkedin className="w-8 h-8 text-slate-400 hover:text-blue-700" /></button>
                    <button className="transform hover:scale-110 transition-transform"><Github className="w-8 h-8 text-slate-400 hover:text-white" /></button>
                 </div>
                 <p className={`text-sm ${textSecondary} mt-12`}>© 2024 InfoStack AI. All rights reserved.</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfileSettings;
