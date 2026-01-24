import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '@nanostores/react';
import { adminLang, adminTranslations } from '../../stores/i18nStore';

interface MenuItem {
    id: string;
    name_es: string;
    name_zh: string;
    price: number;
    is_available: boolean;
    category: string;
    image_url?: string;
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
        const { data } = await supabase
            .from('menu_items')
            .select('*')
            .order('category', { ascending: true });

        if (data) setItems(data);
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

    if (loading) return <div className="p-10 text-center"><span className="loading loading-dots loading-lg"></span></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
                <div key={item.id} className={`card bg-base-100 shadow-sm border border-base-200 transition-opacity ${!item.is_available ? 'opacity-75' : ''}`}>
                    <div className="card-body p-4 relative">
                        <div className="absolute top-4 right-4 z-10">
                            <input
                                type="checkbox"
                                className="toggle toggle-success toggle-sm"
                                checked={item.is_available}
                                onChange={() => toggleStock(item.id, item.is_available)}
                            />
                        </div>

                        <h2 className="card-title text-xl">
                            {lang === 'zh' ? item.name_zh : item.name_es}
                            {lang === 'zh' && <span className="text-sm font-normal opacity-50 block">{item.name_es}</span>}
                            {lang === 'es' && <span className="text-sm font-normal opacity-50 block">{item.name_zh}</span>}
                        </h2>

                        <div className="flex items-center gap-2 mt-4">
                            <span className="text-lg opacity-50">$</span>
                            <input
                                type="number"
                                className="input input-ghost input-sm w-full text-lg font-bold p-0"
                                defaultValue={item.price}
                                onBlur={(e) => updatePrice(item.id, Number(e.target.value))}
                            />
                        </div>

                        <div className="badge badge-outline mt-2 opacity-50">{item.category}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
