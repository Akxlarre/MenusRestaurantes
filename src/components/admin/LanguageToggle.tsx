import { useStore } from '@nanostores/react';
import { adminLang, toggleAdminLang } from '../../stores/i18nStore';

export default function LanguageToggle() {
    const lang = useStore(adminLang);

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
