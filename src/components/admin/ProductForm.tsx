import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '@nanostores/react';
import { adminLang, adminTranslations } from '../../stores/i18nStore';
import { compressImage, formatFileSize } from '../../lib/imageUtils';

interface Category {
    id: string;
    name_es: string;
    name_zh: string;
    slug: string;
}

interface ImageState {
    file: File | null;
    preview: string | null;
    originalSize: number;
    compressedBlob: Blob | null;
    compressedSize: number;
    isCompressing: boolean;
}

interface ProductFormProps {
    productId?: string;
}

export default function ProductForm({ productId }: ProductFormProps) {
    const lang = useStore(adminLang);
    const t = adminTranslations[lang];

    const isEditing = !!productId;
    const [loading, setLoading] = useState(false);
    const [loadingProduct, setLoadingProduct] = useState(isEditing);
    const [nameEs, setNameEs] = useState('');
    const [nameZh, setNameZh] = useState('');
    const [descriptionEs, setDescriptionEs] = useState('');
    const [descriptionZh, setDescriptionZh] = useState('');
    const [price, setPrice] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
    
    // Estado mejorado para imagen con preview y compresión
    const [imageState, setImageState] = useState<ImageState>({
        file: null,
        preview: null,
        originalSize: 0,
        compressedBlob: null,
        compressedSize: 0,
        isCompressing: false,
    });

    useEffect(() => {
        fetchCategories();
        if (productId) {
            fetchProduct(productId);
        }
    }, [productId]);

    const fetchProduct = async (id: string) => {
        setLoadingProduct(true);
        const { data, error } = await supabase
            .from('menu_items')
            .select(`
                *,
                menu_item_categories (
                    category_id
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching product:', error);
            alert('Error al cargar el producto');
            window.location.href = '/admin/dashboard';
            return;
        }

        if (data) {
            setNameEs(data.name_es || '');
            setNameZh(data.name_zh || '');
            setDescriptionEs(data.description_es || '');
            setDescriptionZh(data.description_zh || '');
            setPrice(data.price?.toString() || '');
            setExistingImageUrl(data.image_url || null);
            
            // Cargar categorías seleccionadas
            const categoryIds = data.menu_item_categories?.map((mic: { category_id: string }) => mic.category_id) || [];
            setSelectedCategories(categoryIds);
        }
        setLoadingProduct(false);
    };

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching categories:', error);
        } else if (data) {
            setAvailableCategories(data);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Crear preview inmediato
            const preview = URL.createObjectURL(file);
            
            setImageState({
                file,
                preview,
                originalSize: file.size,
                compressedBlob: null,
                compressedSize: 0,
                isCompressing: true,
            });

            try {
                // Comprimir a WebP
                const { blob } = await compressImage(file, {
                    maxWidth: 1200,
                    maxHeight: 1200,
                    quality: 0.85,
                    format: 'webp',
                });

                setImageState(prev => ({
                    ...prev,
                    compressedBlob: blob,
                    compressedSize: blob.size,
                    isCompressing: false,
                }));
            } catch (error) {
                console.error('Error comprimiendo imagen:', error);
                // Si falla la compresión, usar archivo original
                setImageState(prev => ({
                    ...prev,
                    compressedBlob: file,
                    compressedSize: file.size,
                    isCompressing: false,
                }));
            }
        }
    };

    // Limpiar preview al desmontar
    useEffect(() => {
        return () => {
            if (imageState.preview) {
                URL.revokeObjectURL(imageState.preview);
            }
        };
    }, [imageState.preview]);

    const toggleCategory = (categoryId: string) => {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
        } else {
            setSelectedCategories([...selectedCategories, categoryId]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedCategories.length === 0) {
            alert(t.selectAtLeastOne);
            return;
        }

        setLoading(true);

        let imageUrl = existingImageUrl; // Mantener imagen existente por defecto

        // 1. Upload Image (comprimida a WebP) si hay nueva imagen
        if (imageState.compressedBlob) {
            // Usar siempre extensión .webp para imágenes comprimidas
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(fileName, imageState.compressedBlob, {
                    contentType: 'image/webp',
                    cacheControl: '31536000', // Cache 1 año
                });

            if (uploadError) {
                alert('Error uploading image: ' + uploadError.message);
                setLoading(false);
                return;
            }

            // Get Public URL
            const { data } = supabase.storage
                .from('menu-images')
                .getPublicUrl(fileName);

            imageUrl = data.publicUrl;

            // Eliminar imagen anterior si existe
            if (existingImageUrl) {
                const oldFileName = existingImageUrl.split('/menu-images/')[1];
                if (oldFileName) {
                    await supabase.storage.from('menu-images').remove([oldFileName]);
                }
            }
        }

        if (isEditing && productId) {
            // MODO EDICIÓN: Update Product
            const { error: updateError } = await supabase
                .from('menu_items')
                .update({
                    name_es: nameEs,
                    name_zh: nameZh,
                    description_es: descriptionEs || null,
                    description_zh: descriptionZh || null,
                    price: Number(price),
                    image_url: imageUrl,
                })
                .eq('id', productId);

            if (updateError) {
                alert('Error updating product: ' + updateError.message);
                setLoading(false);
                return;
            }

            // Actualizar categorías: eliminar las anteriores e insertar las nuevas
            await supabase
                .from('menu_item_categories')
                .delete()
                .eq('menu_item_id', productId);

            const categoryRelations = selectedCategories.map(categoryId => ({
                menu_item_id: productId,
                category_id: categoryId
            }));

            const { error: relationsError } = await supabase
                .from('menu_item_categories')
                .insert(categoryRelations);

            if (relationsError) {
                alert('Error assigning categories: ' + relationsError.message);
                setLoading(false);
                return;
            }

            alert(t.productUpdated);
        } else {
            // MODO CREACIÓN: Insert Product
            const { data: newProduct, error: insertError } = await supabase
                .from('menu_items')
                .insert([{
                    name_es: nameEs,
                    name_zh: nameZh,
                    description_es: descriptionEs || null,
                    description_zh: descriptionZh || null,
                    price: Number(price),
                    image_url: imageUrl,
                    is_available: true
                }])
                .select()
                .single();

            if (insertError) {
                alert('Error creating product: ' + insertError.message);
                setLoading(false);
                return;
            }

            // Insert Category Relations
            const categoryRelations = selectedCategories.map(categoryId => ({
                menu_item_id: newProduct.id,
                category_id: categoryId
            }));

            const { error: relationsError } = await supabase
                .from('menu_item_categories')
                .insert(categoryRelations);

            if (relationsError) {
                alert('Error assigning categories: ' + relationsError.message);
                setLoading(false);
                return;
            }

            alert(t.productCreated);
        }

        window.location.href = '/admin/dashboard';
        setLoading(false);
    };

    if (loadingProduct) {
        return (
            <div className="bg-white border border-[#E8C4C4]/30 rounded-2xl shadow-sm max-w-2xl mx-auto overflow-hidden">
                <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-3">
                        <span className="loading loading-spinner loading-lg text-[#B84A4A]"></span>
                        <p className="text-[#5A5A5C] text-sm">{t.loading}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-[#E8C4C4]/30 rounded-2xl shadow-sm max-w-2xl mx-auto overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#E8C4C4]/20">
                <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#1C1C1E]">
                    {isEditing ? t.editProduct : t.createProduct}
                </h2>
                <p className="text-[#5A5A5C] text-sm mt-1">
                    {isEditing ? t.editProductDesc : t.addNewProduct}
                </p>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Names */}
                    <div>
                        <h3 className="text-sm font-semibold text-[#1C1C1E] mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-[#B84A4A]/10 rounded flex items-center justify-center text-[#B84A4A] text-xs">1</span>
                            {t.productNames}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[#5A5A5C]">{t.spanish}</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Arroz Chaufa" 
                                    className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-xl text-[#1C1C1E] placeholder-[#5A5A5C]/40 focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 focus:border-[#B84A4A]/50 transition-all" 
                                    required
                                    value={nameEs} 
                                    onChange={(e) => setNameEs(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[#5A5A5C]">{t.chinese}</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: 炒饭" 
                                    className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-xl text-[#1C1C1E] placeholder-[#5A5A5C]/40 focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 focus:border-[#B84A4A]/50 transition-all font-['Noto_Serif_SC']" 
                                    required
                                    value={nameZh} 
                                    onChange={(e) => setNameZh(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Descriptions */}
                    <div>
                        <h3 className="text-sm font-semibold text-[#1C1C1E] mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-[#B84A4A]/10 rounded flex items-center justify-center text-[#B84A4A] text-xs">2</span>
                            {t.description}
                            <span className="text-[#5A5A5C]/50 font-normal text-xs">({t.optional})</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[#5A5A5C]">{t.spanish}</label>
                                <textarea 
                                    placeholder="Ej: Arroz salteado con vegetales..." 
                                    className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-xl text-[#1C1C1E] placeholder-[#5A5A5C]/40 focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 focus:border-[#B84A4A]/50 transition-all h-24 resize-none" 
                                    value={descriptionEs} 
                                    onChange={(e) => setDescriptionEs(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[#5A5A5C]">{t.chinese}</label>
                                <textarea 
                                    placeholder="Ej: 蔬菜蛋炒饭配酱油" 
                                    className="w-full px-4 py-2.5 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-xl text-[#1C1C1E] placeholder-[#5A5A5C]/40 focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 focus:border-[#B84A4A]/50 transition-all h-24 resize-none font-['Noto_Serif_SC']" 
                                    value={descriptionZh} 
                                    onChange={(e) => setDescriptionZh(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Price */}
                    <div>
                        <h3 className="text-sm font-semibold text-[#1C1C1E] mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-[#B84A4A]/10 rounded flex items-center justify-center text-[#B84A4A] text-xs">3</span>
                            {t.price}
                        </h3>
                        <div className="relative max-w-xs">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A5C]">$</span>
                            <input 
                                type="number" 
                                placeholder="8500" 
                                className="w-full pl-8 pr-4 py-2.5 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-xl text-[#1C1C1E] placeholder-[#5A5A5C]/40 focus:outline-none focus:ring-2 focus:ring-[#B84A4A]/30 focus:border-[#B84A4A]/50 transition-all text-lg font-semibold tabular-nums" 
                                required
                                value={price} 
                                onChange={(e) => setPrice(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-sm font-semibold text-[#1C1C1E] mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-[#B84A4A]/10 rounded flex items-center justify-center text-[#B84A4A] text-xs">4</span>
                            {t.selectCategories}
                            <span className="text-[#5A5A5C]/50 font-normal text-xs">({t.minOne})</span>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-xl">
                            {availableCategories.map((category) => (
                                <label 
                                    key={category.id} 
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                                        selectedCategories.includes(category.id) 
                                            ? 'bg-[#B84A4A]/10 border border-[#B84A4A]/30' 
                                            : 'bg-white border border-transparent hover:border-[#E8C4C4]/50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={selectedCategories.includes(category.id)}
                                        onChange={() => toggleCategory(category.id)}
                                    />
                                    <span className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-all ${
                                        selectedCategories.includes(category.id)
                                            ? 'bg-[#B84A4A] border-[#B84A4A]'
                                            : 'border-[#E8C4C4] bg-white'
                                    }`}>
                                        {selectedCategories.includes(category.id) && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </span>
                                    <span className="text-sm text-[#1C1C1E]">
                                        {lang === 'zh' ? category.name_zh : category.name_es}
                                    </span>
                                </label>
                            ))}
                        </div>
                        {availableCategories.length === 0 && (
                            <p className="text-sm text-[#5A5A5C] mt-3">
                                {t.noCategoriesLink}{' '}
                                <a href="/admin/categories" className="text-[#B84A4A] hover:underline">{t.createCategoriesLink}</a>
                            </p>
                        )}
                    </div>

                    {/* Image */}
                    <div>
                        <h3 className="text-sm font-semibold text-[#1C1C1E] mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-[#B84A4A]/10 rounded flex items-center justify-center text-[#B84A4A] text-xs">5</span>
                            {t.image}
                            <span className="text-[#5A5A5C]/50 font-normal text-xs">({t.optional})</span>
                        </h3>
                        
                        {/* Preview de nueva imagen */}
                        {imageState.preview && (
                            <div className="mb-3 relative">
                                <div className="relative w-full max-w-xs mx-auto">
                                    <img 
                                        src={imageState.preview} 
                                        alt="Preview" 
                                        className="w-full aspect-square object-cover rounded-xl border border-[#E8C4C4]/30"
                                    />
                                    {/* Botón eliminar */}
                                    <button
                                        type="button"
                                        onClick={() => setImageState({
                                            file: null,
                                            preview: null,
                                            originalSize: 0,
                                            compressedBlob: null,
                                            compressedSize: 0,
                                            isCompressing: false,
                                        })}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-[#B84A4A] text-white rounded-full flex items-center justify-center hover:bg-[#8B3A3A] transition-colors shadow-md"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                {/* Indicador de compresión en proceso */}
                                {imageState.isCompressing && (
                                    <div className="mt-2 flex items-center justify-center gap-2 text-[#5A5A5C] text-xs">
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>{lang === 'es' ? 'Optimizando imagen...' : '优化图片中...'}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Imagen existente (solo en modo edición) */}
                        {!imageState.preview && existingImageUrl && (
                            <div className="mb-3">
                                <div className="relative w-full max-w-xs mx-auto">
                                    <img 
                                        src={existingImageUrl} 
                                        alt="Imagen actual" 
                                        className="w-full aspect-square object-cover rounded-xl border border-[#E8C4C4]/30"
                                    />
                                    <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                                        <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-lg">
                                            {t.keepCurrentImage}
                                        </span>
                                    </div>
                                </div>
                                <label className="mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-xl cursor-pointer hover:border-[#B84A4A]/50 transition-colors text-sm">
                                    <input 
                                        type="file" 
                                        className="sr-only" 
                                        accept="image/*" 
                                        onChange={handleFileChange} 
                                    />
                                    <svg className="w-4 h-4 text-[#5A5A5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-[#5A5A5C]">{t.changeImage}</span>
                                </label>
                            </div>
                        )}
                        
                        {/* Input de archivo (cuando no hay imagen) */}
                        {!imageState.preview && !existingImageUrl && (
                            <label className="flex items-center justify-center gap-3 px-4 py-6 bg-[#F7F7F2] border-2 border-dashed border-[#E8C4C4]/50 rounded-xl cursor-pointer hover:border-[#B84A4A]/50 transition-colors">
                                <input 
                                    type="file" 
                                    className="sr-only" 
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                />
                                <svg className="w-6 h-6 text-[#5A5A5C]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-[#5A5A5C]">{t.clickToUpload}</span>
                            </label>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="pt-4 border-t border-[#E8C4C4]/20">
                        <button 
                            type="submit" 
                            className="w-full py-3 px-4 bg-[#B84A4A] hover:bg-[#8B3A3A] text-white font-semibold rounded-xl shadow-md shadow-[#B84A4A]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    <span>{t.saving}</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{isEditing ? t.updateProduct : t.save}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
