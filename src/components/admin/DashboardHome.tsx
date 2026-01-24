import { useStore } from '@nanostores/react';
import { adminLang, adminTranslations } from '../../stores/i18nStore';

import MenuList from './MenuList';

export default function DashboardHome() {
    const lang = useStore(adminLang);
    const t = adminTranslations[lang];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t.dashboard}</h1>
                <div className="flex gap-2">
                    <a href="/admin/qr" className="btn btn-neutral btn-sm">{t.generateQR}</a>
                    <a href="/admin/create" className="btn btn-primary btn-sm">{t.createProduct}</a>
                </div>
            </div>

            <MenuList />
        </div>
    );
}
