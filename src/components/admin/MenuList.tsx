import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '@nanostores/react';
import { adminLang, adminTranslations } from '../../stores/i18nStore';

interface Category {
    id: string;
    name_es: string;
    name_zh: string;
    slug: string;
}

interface MenuItem {
    id: string;
    name_es: string;
    name_zh: string;
    price: number;
    is_available: boolean;
    image_url?: string;
    menu_item_categories: {
        categories: Category;
    }[];
}

export default function MenuList() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const lang = useStore(adminLang);
    const t = adminTranslations[lang];

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('menu_items')
            .select(`
                *,
                menu_item_categories (
                    categories (
                        id,
                        name_es,
                        name_zh,
                        slug
                    )
                )
            `)
            .order('name_es', { ascending: true });

        if (error) {
            console.error('Error fetching items:', error);
        } else if (data) {
            setItems(data as MenuItem[]);
        }
        setLoading(false);
    };

    const toggleStock = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setItems(items.map(i => i.id === id ? { ...i, is_available: !currentStatus } : i));

        const { error } = await supabase
            .from('menu_items')
            .update({ is_available: !currentStatus })
            .eq('id', id);

        if (error) {
            console.error('Error updating stock', error);
            fetchItems(); // Revert on error
        }
    };

    const updatePrice = async (id: string, newPrice: number) => {
        const { error } = await supabase
            .from('menu_items')
            .update({ price: newPrice })
            .eq('id', id);

        if (error) console.error('Error updating price', error);
    };

    const deleteProduct = async (id: string, imageUrl?: string) => {
        // Confirmation dialog
        const itemToDelete = items.find(i => i.id === id);
        const itemName = lang === 'zh' ? itemToDelete?.name_zh : itemToDelete?.name_es;

        if (!confirm(`${t.confirmDelete} "${itemName}"? ${t.actionCantUndo}`)) {
            return;
        }

        // Optimistic update - remove from UI immediately
        const previousItems = [...items];
        setItems(items.filter(i => i.id !== id));

        try {
            // 1. Delete image from storage if exists
            if (imageUrl) {
                const fileName = imageUrl.split('/menu-images/')[1];
                if (fileName) {
                    const { error: storageError } = await supabase.storage
                        .from('menu-images')
                        .remove([fileName]);

                    if (storageError) {
                        console.error('Error deleting image from storage:', storageError);
                        // Continue with deletion even if image deletion fails
                    }
                }
            }

            // 2. Delete from database
            const { error: dbError } = await supabase
                .from('menu_items')
                .delete()
                .eq('id', id);

            if (dbError) {
                console.error('Error deleting product from database:', dbError);
                // Revert optimistic update
                setItems(previousItems);
                alert('Error al eliminar el producto: ' + dbError.message);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            // Revert optimistic update
            setItems(previousItems);
            alert('Error inesperado al eliminar el producto');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                    <span className="loading loading-spinner loading-lg text-[#B84A4A]"></span>
                    <p className="text-[#5A5A5C] text-sm">{t.loadingProducts}</p>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-[#E8C4C4]/30 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[#B84A4A]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                <h3 className="font-['Playfair_Display'] text-lg font-semibold text-[#1C1C1E] mb-1">
                    {t.noProducts}
                </h3>
                <p className="text-[#5A5A5C] text-sm mb-4">
                    {t.noProductsDesc}
                </p>
                <a 
                    href="/admin/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#B84A4A] text-white font-medium rounded-xl hover:bg-[#8B3A3A] transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t.createProduct}
                </a>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
                <div 
                    key={item.id} 
                    className={`group bg-white border border-[#E8C4C4]/30 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:border-[#E8C4C4]/50 ${!item.is_available ? 'opacity-60' : ''}`}
                >
                    {/* Header con controles */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-3">
                            <h3 className="font-['Playfair_Display'] font-semibold text-[#1C1C1E] text-lg leading-tight">
                                {lang === 'zh' ? item.name_zh : item.name_es}
                            </h3>
                            <p className="font-['Noto_Serif_SC'] text-[#B84A4A]/70 text-sm mt-0.5">
                                {lang === 'zh' ? item.name_es : item.name_zh}
                            </p>
                        </div>
                        
                        {/* Controles */}
                        <div className="flex items-center gap-2">
                            <button
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5A5A5C]/50 hover:text-[#B84A4A] hover:bg-[#B84A4A]/10 transition-colors"
                                onClick={() => deleteProduct(item.id, item.image_url)}
                                title="Eliminar producto"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={item.is_available}
                                    onChange={() => toggleStock(item.id, item.is_available)}
                                />
                                <div className="w-9 h-5 bg-[#E8C4C4]/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4A8A2C]"></div>
                            </label>
                        </div>
                    </div>

                    {/* Precio */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[#5A5A5C]/50 text-lg">$</span>
                        <input
                            type="number"
                            className="bg-transparent text-[#1C1C1E] text-xl font-bold w-24 focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 rounded px-1 tabular-nums"
                            defaultValue={item.price}
                            onBlur={(e) => updatePrice(item.id, Number(e.target.value))}
                        />
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-1.5">
                        {item.menu_item_categories && item.menu_item_categories.length > 0 ? (
                            item.menu_item_categories.map((mic) => (
                                <span 
                                    key={mic.categories.id} 
                                    className="px-2 py-0.5 bg-[#F7F7F2] text-[#5A5A5C] text-xs rounded-md border border-[#E8C4C4]/30"
                                >
                                    {lang === 'zh' ? mic.categories.name_zh : mic.categories.name_es}
                                </span>
                            ))
                        ) : (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-md border border-amber-200">
                                {t.noCategory}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
