import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '@nanostores/react';
import { adminLang, adminTranslations } from '../../stores/i18nStore';

interface Category {
    id: string;
    name_es: string;
    name_zh: string;
    slug: string;
    display_order: number;
}

export default function CategoriesList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name_es: '', name_zh: '', slug: '' });
    const lang = useStore(adminLang);
    const t = adminTranslations[lang];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching categories:', error);
        } else if (data) {
            setCategories(data);
        }
        setLoading(false);
    };

    const startEdit = (category: Category) => {
        setEditingId(category.id);
        setEditForm({
            name_es: category.name_es,
            name_zh: category.name_zh,
            slug: category.slug
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ name_es: '', name_zh: '', slug: '' });
    };

    const saveEdit = async (id: string) => {
        const { error } = await supabase
            .from('categories')
            .update({
                name_es: editForm.name_es,
                name_zh: editForm.name_zh,
                slug: editForm.slug,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating category:', error);
            alert('Error al actualizar la categoría: ' + error.message);
        } else {
            setEditingId(null);
            fetchCategories();
        }
    };

    const deleteCategory = async (id: string, name: string) => {
        const { data: relatedProducts, error: checkError } = await supabase
            .from('menu_item_categories')
            .select('id')
            .eq('category_id', id)
            .limit(1);

        if (checkError) {
            console.error('Error checking category:', checkError);
            return;
        }

        if (relatedProducts && relatedProducts.length > 0) {
            if (!confirm(`"${name}" ${t.categoryHasProducts}`)) {
                return;
            }
        } else {
            if (!confirm(`${t.confirmDeleteCategory} "${name}"?`)) {
                return;
            }
        }

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting category:', error);
            alert('Error al eliminar: ' + error.message);
        } else {
            fetchCategories();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                    <span className="loading loading-spinner loading-lg text-[#B84A4A]"></span>
                    <p className="text-[#5A5A5C] text-sm">{t.loadingCategories}</p>
                </div>
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-[#E8C4C4]/30 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[#B84A4A]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                </div>
                <h3 className="font-['Playfair_Display'] text-lg font-semibold text-[#1C1C1E] mb-1">
                    {t.noCategories}
                </h3>
                <p className="text-[#5A5A5C] text-sm">
                    {t.noCategoriesDesc}
                </p>
            </div>
        );
    }

    // Bento Grid Card Component
    const CategoryCard = ({ category }: { category: Category }) => {
        const isEditing = editingId === category.id;

        return (
            <div className={`bg-white border rounded-xl p-4 transition-all duration-200 ${
                isEditing 
                    ? 'border-[#B84A4A] ring-2 ring-[#B84A4A]/20' 
                    : 'border-[#E8C4C4]/30 hover:shadow-md hover:border-[#E8C4C4]/50'
            }`}>
                {isEditing ? (
                    // Edit Mode
                    <div className="space-y-3">
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-lg text-[#1C1C1E] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30"
                            placeholder="Nombre (ES)"
                            value={editForm.name_es}
                            onChange={(e) => setEditForm({ ...editForm, name_es: e.target.value })}
                        />
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-lg text-[#1C1C1E] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 font-['Noto_Serif_SC']"
                            placeholder="Nombre (ZH)"
                            value={editForm.name_zh}
                            onChange={(e) => setEditForm({ ...editForm, name_zh: e.target.value })}
                        />
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-lg text-[#1C1C1E] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 font-mono"
                            placeholder="slug"
                            value={editForm.slug}
                            onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        />
                        <div className="flex gap-2 pt-2">
                            <button
                                className="flex-1 py-2 px-3 bg-[#B84A4A] text-white text-sm font-medium rounded-lg hover:bg-[#8B3A3A] transition-colors"
                                onClick={() => saveEdit(category.id)}
                            >
                                {t.save}
                            </button>
                            <button
                                className="flex-1 py-2 px-3 bg-[#F7F7F2] text-[#5A5A5C] text-sm font-medium rounded-lg hover:bg-[#E8C4C4]/30 transition-colors"
                                onClick={cancelEdit}
                            >
                                {t.cancel}
                            </button>
                        </div>
                    </div>
                ) : (
                    // View Mode
                    <>
                        <div className="mb-3">
                            <h3 className="font-['Playfair_Display'] font-semibold text-[#1C1C1E] text-lg">{category.name_es}</h3>
                            <p className="font-['Noto_Serif_SC'] text-[#B84A4A]/70 text-sm">{category.name_zh}</p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-[#E8C4C4]/20">
                            <code className="text-xs text-[#5A5A5C]/50 bg-[#F7F7F2] px-2 py-0.5 rounded">{category.slug}</code>
                            <div className="flex gap-1">
                                <button
                                    className="px-2.5 py-1 text-xs font-medium text-[#5A5A5C] hover:text-[#1C1C1E] hover:bg-[#F7F7F2] rounded-md transition-colors"
                                    onClick={() => startEdit(category)}
                                >
                                    {t.edit}
                                </button>
                                <button
                                    className="px-2.5 py-1 text-xs font-medium text-[#B84A4A] hover:bg-[#B84A4A]/10 rounded-md transition-colors"
                                    onClick={() => deleteCategory(category.id, lang === 'zh' ? category.name_zh : category.name_es)}
                                >
                                    {t.delete}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
            ))}
        </div>
    );
}
