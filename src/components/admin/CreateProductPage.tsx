import { useStore } from '@nanostores/react';
import { adminLang, adminTranslations } from '../../stores/i18nStore';
import ProductForm from './ProductForm';

export default function CreateProductPage() {
    const lang = useStore(adminLang);
    const t = adminTranslations[lang];

    return (
        <div className="space-y-6">
            {/* Back button */}
            <a 
                href="/admin/dashboard" 
                className="inline-flex items-center gap-2 px-3 py-1.5 text-[#5A5A5C] hover:text-[#1C1C1E] hover:bg-[#F7F7F2] rounded-lg transition-colors text-sm"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t.backToPanel}
            </a>
            
            <ProductForm />
        </div>
    );
}
