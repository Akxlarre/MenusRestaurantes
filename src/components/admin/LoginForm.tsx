import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { supabase } from '../../lib/supabase';
import { adminLang, toggleAdminLang, adminTranslations, type AdminLanguage } from '../../stores/i18nStore';

const STORAGE_KEY = 'admin-lang';

const loginTranslations = {
    es: {
        title: 'Panel de Administración',
        email: 'Correo electrónico',
        password: 'Contraseña',
        login: 'Iniciar Sesión',
        logging: 'Iniciando...',
        help: '¿Problemas para acceder?',
        support: 'Contactar soporte'
    },
    zh: {
        title: '管理面板',
        email: '电子邮箱',
        password: '密码',
        login: '登录',
        logging: '登录中...',
        help: '登录问题？',
        support: '联系支持'
    }
};

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const lang = useStore(adminLang);
    const t = loginTranslations[lang];

    // Sincronizar desde localStorage al montar
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'es' || stored === 'zh') {
            if (stored !== adminLang.get()) {
                adminLang.set(stored as AdminLanguage);
            }
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            window.location.href = '/admin/dashboard';
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm border border-[#E8C4C4]/30 rounded-2xl shadow-xl overflow-hidden">
            {/* Header con logo */}
            <div className="px-8 py-8 text-center border-b border-[#E8C4C4]/30">
                {/* Toggle de idioma */}
                <div className="flex justify-end mb-4">
                    <button
                        type="button"
                        onClick={toggleAdminLang}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F7F2] hover:bg-[#E8C4C4]/30 transition-colors text-sm"
                    >
                        <span className={lang === 'es' ? 'font-semibold text-[#B84A4A]' : 'text-[#5A5A5C]/60'}>ES</span>
                        <span className="text-[#5A5A5C]/30">|</span>
                        <span className={lang === 'zh' ? 'font-semibold text-[#B84A4A]' : 'text-[#5A5A5C]/60'}>中文</span>
                    </button>
                </div>

                {/* Logo */}
                <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1C1C1E] tracking-tight">
                    Mini wok
                </h1>
                <p className="font-['Noto_Serif_SC'] text-[#B84A4A] text-lg mt-1">
                    餐厅
                </p>
                <p className="text-[#5A5A5C] text-sm mt-2">
                    {t.title}
                </p>
            </div>

            {/* Formulario */}
            <div className="p-8">
                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Campo Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C1C1E]">
                            {t.email}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg 
                                    className="w-5 h-5 text-[#5A5A5C]/50" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={1.5} 
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                                    />
                                </svg>
                            </div>
                            <input
                                type="email"
                                placeholder="admin@miniwok.cl"
                                className="w-full pl-10 pr-4 py-3 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-xl text-[#1C1C1E] placeholder-[#5A5A5C]/40 focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 focus:border-[#B84A4A]/50 transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Campo Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C1C1E]">
                            {t.password}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg 
                                    className="w-5 h-5 text-[#5A5A5C]/50" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={1.5} 
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                                    />
                                </svg>
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-12 py-3 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-xl text-[#1C1C1E] placeholder-[#5A5A5C]/40 focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 focus:border-[#B84A4A]/50 transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5A5A5C]/50 hover:text-[#B84A4A] transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-[#B84A4A]/10 border border-[#B84A4A]/20 rounded-xl text-[#8B3A3A] text-sm">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Botón Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-[#B84A4A] hover:bg-[#8B3A3A] text-white font-semibold rounded-xl shadow-md shadow-[#B84A4A]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                <span>{t.logging}</span>
                            </>
                        ) : (
                            <>
                                <span>{t.login}</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                {/* Línea decorativa */}
                <div className="flex items-center justify-center my-6">
                    <div className="w-16 h-px bg-[#E8C4C4]"></div>
                    <span className="px-3 font-['Noto_Serif_SC'] text-[#B84A4A]/60 text-sm">美食</span>
                    <div className="w-16 h-px bg-[#E8C4C4]"></div>
                </div>

                {/* Link de ayuda */}
                <p className="text-center text-[#5A5A5C]/70 text-sm">
                    {t.help}{' '}
                    <a href="mailto:soporte@miniwok.cl" className="text-[#B84A4A] hover:text-[#8B3A3A] transition-colors underline-offset-2 hover:underline">
                        {t.support}
                    </a>
                </p>
            </div>
        </div>
    );
}
