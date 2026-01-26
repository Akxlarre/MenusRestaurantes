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
        support: 'Contactar soporte',
        errors: {
            'Invalid login credentials': 'Correo o contraseña incorrectos',
            'Email not confirmed': 'Por favor, confirma tu correo electrónico',
            'User not found': 'No existe una cuenta con este correo',
            'Too many requests': 'Demasiados intentos. Espera unos minutos',
            'Invalid email': 'El formato del correo no es válido',
            'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
            'Network error': 'Error de conexión. Verifica tu internet',
            'default': 'Error al iniciar sesión. Intenta de nuevo'
        }
    },
    zh: {
        title: '管理面板',
        email: '电子邮箱',
        password: '密码',
        login: '登录',
        logging: '登录中...',
        help: '登录问题？',
        support: '联系支持',
        errors: {
            'Invalid login credentials': '邮箱或密码不正确',
            'Email not confirmed': '请先确认您的电子邮件',
            'User not found': '该邮箱没有关联账户',
            'Too many requests': '请求过多，请稍后再试',
            'Invalid email': '邮箱格式无效',
            'Password should be at least 6 characters': '密码至少需要6个字符',
            'Network error': '网络错误，请检查您的网络连接',
            'default': '登录失败，请重试'
        }
    }
};

// Función para obtener mensaje de error traducido
const getErrorMessage = (error: string, lang: 'es' | 'zh'): string => {
    const errors = loginTranslations[lang].errors;
    // Buscar coincidencia parcial en el mensaje de error
    for (const [key, value] of Object.entries(errors)) {
        if (key !== 'default' && error.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    return errors.default;
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

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                const translatedError = getErrorMessage(error.message, lang);
                setError(translatedError);
                setLoading(false);
            } else {
                window.location.href = '/admin/dashboard';
            }
        } catch (err) {
            // Error de red u otro error inesperado
            setError(getErrorMessage('Network error', lang));
            setLoading(false);
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
                        <div 
                            className="flex items-start gap-3 p-4 bg-[#B84A4A]/10 border border-[#B84A4A]/30 rounded-xl text-[#8B3A3A] animate-shake"
                            role="alert"
                        >
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{error}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setError(null)}
                                className="flex-shrink-0 text-[#8B3A3A]/60 hover:text-[#8B3A3A] transition-colors"
                                aria-label="Cerrar"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
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
                    <a 
                        href="https://wa.me/56933197338?text=Necesito%20soporte%20para%20Menu%20Mini%20wok"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#B84A4A] hover:text-[#8B3A3A] transition-colors underline-offset-2 hover:underline inline-flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        {t.support}
                    </a>
                </p>
            </div>
        </div>
    );
}
