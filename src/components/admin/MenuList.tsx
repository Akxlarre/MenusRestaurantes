import { useEffect, useState, useMemo } from 'react';
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

type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';
type StatusFilter = 'all' | 'available' | 'unavailable';

export default function MenuList() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const lang = useStore(adminLang);
    const t = adminTranslations[lang];

    // Estados de filtro, búsqueda y ordenamiento
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortOption, setSortOption] = useState<SortOption>('name_asc');

    useEffect(() => {
        fetchItems();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (!error && data) {
            setCategories(data);
        }
    };

    // Filtrar y ordenar items
    const filteredItems = useMemo(() => {
        let result = [...items];

        // Búsqueda por nombre
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(item => 
                item.name_es.toLowerCase().includes(query) ||
                item.name_zh.includes(query)
            );
        }

        // Filtro por categoría
        if (categoryFilter !== 'all') {
            result = result.filter(item =>
                item.menu_item_categories?.some(mic => mic.categories.id === categoryFilter)
            );
        }

        // Filtro por disponibilidad
        if (statusFilter === 'available') {
            result = result.filter(item => item.is_available);
        } else if (statusFilter === 'unavailable') {
            result = result.filter(item => !item.is_available);
        }

        // Ordenamiento
        result.sort((a, b) => {
            switch (sortOption) {
                case 'name_asc':
                    return (lang === 'zh' ? a.name_zh : a.name_es).localeCompare(lang === 'zh' ? b.name_zh : b.name_es);
                case 'name_desc':
                    return (lang === 'zh' ? b.name_zh : b.name_es).localeCompare(lang === 'zh' ? a.name_zh : a.name_es);
                case 'price_asc':
                    return a.price - b.price;
                case 'price_desc':
                    return b.price - a.price;
                default:
                    return 0;
            }
        });

        return result;
    }, [items, searchQuery, categoryFilter, statusFilter, sortOption, lang]);

    const hasActiveFilters = searchQuery || categoryFilter !== 'all' || statusFilter !== 'all';

    const clearFilters = () => {
        setSearchQuery('');
        setCategoryFilter('all');
        setStatusFilter('all');
    };

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
        <div className="space-y-4">
            {/* Barra de búsqueda y filtros */}
            <div className="bg-white border border-[#E8C4C4]/30 rounded-xl p-4 space-y-3">
                {/* Fila 1: Búsqueda */}
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A5C]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder={t.searchProducts}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-xl text-[#1C1C1E] placeholder-[#5A5A5C]/50 focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 focus:border-[#B84A4A]/50 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#5A5A5C]/20 flex items-center justify-center hover:bg-[#5A5A5C]/30 transition-colors"
                        >
                            <svg className="w-3 h-3 text-[#5A5A5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Fila 2: Filtros y ordenamiento */}
                <div className="flex flex-wrap gap-2">
                    {/* Filtro por categoría */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-lg text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 cursor-pointer min-w-[140px]"
                    >
                        <option value="all">{t.allCategories}</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {lang === 'zh' ? cat.name_zh : cat.name_es}
                            </option>
                        ))}
                    </select>

                    {/* Filtro por disponibilidad */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className="px-3 py-2 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-lg text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 cursor-pointer min-w-[120px]"
                    >
                        <option value="all">{t.allStatus}</option>
                        <option value="available">{t.availableOnly}</option>
                        <option value="unavailable">{t.unavailableOnly}</option>
                    </select>

                    {/* Ordenamiento */}
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="px-3 py-2 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-lg text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 cursor-pointer min-w-[140px]"
                    >
                        <option value="name_asc">{t.sortNameAsc}</option>
                        <option value="name_desc">{t.sortNameDesc}</option>
                        <option value="price_asc">{t.sortPriceAsc}</option>
                        <option value="price_desc">{t.sortPriceDesc}</option>
                    </select>

                    {/* Botón limpiar filtros */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-sm text-[#B84A4A] hover:bg-[#B84A4A]/10 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {t.clearFilters}
                        </button>
                    )}

                    {/* Contador de resultados */}
                    <div className="ml-auto flex items-center text-sm text-[#5A5A5C]">
                        <span className="font-medium text-[#1C1C1E]">{filteredItems.length}</span>
                        <span className="ml-1">{t.resultsCount}</span>
                    </div>
                </div>
            </div>

            {/* Lista de productos o mensaje de no resultados */}
            {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-[#E8C4C4]/30 rounded-xl">
                    <svg className="w-12 h-12 text-[#5A5A5C]/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-[#5A5A5C] mb-3">{t.noResults}</p>
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm text-[#B84A4A] hover:bg-[#B84A4A]/10 rounded-lg transition-colors"
                    >
                        {t.clearFilters}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => (
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
                            <a
                                href={`/admin/create?edit=${item.id}`}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5A5A5C]/50 hover:text-[#B84A4A] hover:bg-[#B84A4A]/10 transition-colors"
                                title={t.edit}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </a>
                            <button
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5A5A5C]/50 hover:text-[#B84A4A] hover:bg-[#B84A4A]/10 transition-colors"
                                onClick={() => deleteProduct(item.id, item.image_url)}
                                title={t.delete}
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
            )}
        </div>
    );
}
