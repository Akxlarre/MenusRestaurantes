import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { adminLang, toggleAdminLang, type AdminLanguage } from '../../stores/i18nStore';

const STORAGE_KEY = 'admin-lang';

export default function LanguageToggle() {
    const lang = useStore(adminLang);

    // Sincronizar desde localStorage al montar (para hidratación SSR)
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'es' || stored === 'zh') {
            if (stored !== adminLang.get()) {
                adminLang.set(stored as AdminLanguage);
            }
        }
    }, []);

    return (
        <button
            className="btn btn-ghost gap-2"
            onClick={toggleAdminLang}
        >
            <span className={lang === 'es' ? 'font-bold text-primary' : 'opacity-50'}>🇨🇱 ES</span>
            <span className="opacity-30">/</span>
            <span className={lang === 'zh' ? 'font-bold text-primary' : 'opacity-50'}>🇨🇳 ZH</span>
        </button>
    );
}
