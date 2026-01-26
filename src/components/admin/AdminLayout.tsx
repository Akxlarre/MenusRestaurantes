import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '@nanostores/react';
import { adminLang, adminTranslations, toggleAdminLang, type AdminLanguage } from '../../stores/i18nStore';

const STORAGE_KEY = 'admin-lang';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const lang = useStore(adminLang);
    const t = adminTranslations[lang];

    useEffect(() => {
        // Sincronizar idioma desde localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'es' || stored === 'zh') {
            if (stored !== adminLang.get()) {
                adminLang.set(stored as AdminLanguage);
            }
        }

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.href = '/admin/login';
            } else {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/admin/login';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F7F7F2] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-lg text-[#B84A4A]"></span>
                    <p className="text-[#5A5A5C] text-sm">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F7F2] pb-20">
            {/* Navbar */}
            <nav className="bg-white/90 backdrop-blur-sm border-b border-[#E8C4C4]/30 sticky top-0 z-50 shadow-sm">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <a href="/admin/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <span className="font-['Playfair_Display'] text-xl font-bold text-[#1C1C1E]">
                                Mini wok
                            </span>
                            <span className="text-[#B84A4A] font-['Noto_Serif_SC'] text-sm">
                                餐厅
                            </span>
                            <span className="px-2 py-0.5 bg-[#B84A4A]/10 text-[#B84A4A] text-xs font-medium rounded-full">
                                Admin
                            </span>
                        </a>

                        {/* Right side */}
                        <div className="flex items-center gap-3">
                            {/* Language Toggle */}
                            <button
                                type="button"
                                onClick={toggleAdminLang}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F7F2] hover:bg-[#E8C4C4]/30 transition-colors text-sm"
                            >
                                <span className={lang === 'es' ? 'font-semibold text-[#B84A4A]' : 'text-[#5A5A5C]/60'}>ES</span>
                                <span className="text-[#5A5A5C]/30">|</span>
                                <span className={lang === 'zh' ? 'font-semibold text-[#B84A4A]' : 'text-[#5A5A5C]/60'}>中文</span>
                            </button>

                            {/* User Menu */}
                            <div className="dropdown dropdown-end">
                                <div tabIndex={0} role="button" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#F7F7F2] transition-colors cursor-pointer">
                                    <div className="w-8 h-8 rounded-full bg-[#B84A4A] text-white grid place-items-center text-sm font-medium">
                                        A
                                    </div>
                                    <svg className="w-4 h-4 text-[#5A5A5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                                <ul tabIndex={0} className="menu dropdown-content mt-2 z-[1] p-2 bg-white border border-[#E8C4C4]/30 rounded-xl shadow-lg w-52">
                                    <li>
                                        <a 
                                            href="https://wa.me/56933197338?text=Necesito%20soporte%20para%20Menu%20Mini%20wok"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-[#5A5A5C] hover:bg-[#F7F7F2] hover:text-[#1C1C1E]"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            {t.support}
                                        </a>
                                    </li>
                                    <li className="my-1">
                                        <div className="h-px bg-[#E8C4C4]/30"></div>
                                    </li>
                                    <li>
                                        <button 
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 text-[#8B3A3A] hover:bg-[#B84A4A]/10"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            {t.logout}
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-[#E8C4C4]/20">
                <div className="max-w-6xl mx-auto px-4">
                    <nav className="flex gap-1 py-2">
                        <a 
                            href="/admin/dashboard" 
                            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#F7F7F2] text-[#1C1C1E]"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                {t.dashboard}
                            </span>
                        </a>
                        <a 
                            href="/admin/categories" 
                            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#F7F7F2] text-[#1C1C1E]"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {t.categories}
                            </span>
                        </a>
                        <a 
                            href="/admin/qr" 
                            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#F7F7F2] text-[#1C1C1E]"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                                {t.generateQR}
                            </span>
                        </a>
                    </nav>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-4 py-6">
                {children}
            </main>
        </div>
    );
}
