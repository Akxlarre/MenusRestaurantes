import { useStore } from '@nanostores/react';
import { adminLang, adminTranslations } from '../../stores/i18nStore';

import MenuList from './MenuList';

export default function DashboardHome() {
    const lang = useStore(adminLang);
    const t = adminTranslations[lang];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[#1C1C1E]">
                        {t.dashboard}
                    </h1>
                    <p className="text-[#5A5A5C] text-sm mt-1">
                        {t.manageMenu}
                    </p>
                </div>
                <a 
                    href="/admin/create" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#B84A4A] text-white font-medium rounded-xl hover:bg-[#8B3A3A] transition-colors shadow-md shadow-[#B84A4A]/20 text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t.createProduct}
                </a>
            </div>

            {/* Línea decorativa */}
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E8C4C4] to-transparent"></div>
                <span className="font-['Noto_Serif_SC'] text-[#B84A4A]/50 text-sm">菜单</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E8C4C4] to-transparent"></div>
            </div>

            {/* Products Grid */}
            <MenuList />
        </div>
    );
}
