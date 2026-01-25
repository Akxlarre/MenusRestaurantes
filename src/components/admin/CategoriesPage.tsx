import { useStore } from '@nanostores/react';
import { adminLang, adminTranslations } from '../../stores/i18nStore';
import CategoriesList from './CategoriesList';
import CategoryForm from './CategoryForm';

export default function CategoriesPage() {
    const lang = useStore(adminLang);
    const t = adminTranslations[lang];

    const openModal = () => {
        const modal = document.getElementById('new_category_modal') as HTMLDialogElement;
        if (modal) modal.showModal();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[#1C1C1E]">
                        {t.categories}
                    </h1>
                    <p className="text-[#5A5A5C] text-sm mt-1">
                        {t.organizeMenu}
                    </p>
                </div>
                <button
                    onClick={openModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#B84A4A] text-white font-medium rounded-xl hover:bg-[#8B3A3A] transition-colors shadow-md shadow-[#B84A4A]/20 text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t.createCategory}
                </button>
            </div>

            {/* Línea decorativa */}
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E8C4C4] to-transparent"></div>
                <span className="font-['Noto_Serif_SC'] text-[#B84A4A]/50 text-sm">分类</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E8C4C4] to-transparent"></div>
            </div>

            <CategoriesList />

            {/* Modal */}
            <dialog id="new_category_modal" className="modal">
                <div className="modal-box bg-white border border-[#E8C4C4]/30 rounded-2xl shadow-xl max-w-md">
                    <CategoryForm modalId="new_category_modal" />
                </div>
                <form method="dialog" className="modal-backdrop bg-black/20 backdrop-blur-sm">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
}
