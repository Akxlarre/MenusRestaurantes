import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '@nanostores/react';
import { adminLang, adminTranslations } from '../../stores/i18nStore';

export default function ProductForm() {
    const lang = useStore(adminLang);
    const t = adminTranslations[lang];

    const [loading, setLoading] = useState(false);
    const [nameEs, setNameEs] = useState('');
    const [nameZh, setNameZh] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('Fondos');
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let imageUrl = null;

        // 1. Upload Image
        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(filePath, file);

            if (uploadError) {
                alert('Error uploading image: ' + uploadError.message);
                setLoading(false);
                return;
            }

            // Get Public URL
            const { data } = supabase.storage
                .from('menu-images')
                .getPublicUrl(filePath);

            imageUrl = data.publicUrl;
        }

        // 2. Insert Data
        const { error: insertError } = await supabase
            .from('menu_items')
            .insert([{
                name_es: nameEs,
                name_zh: nameZh,
                price: Number(price),
                category,
                image_url: imageUrl,
                is_available: true
            }]);

        if (insertError) {
            alert('Error creating product: ' + insertError.message);
        } else {
            alert('Product created successfully!');
            window.location.href = '/admin/dashboard';
        }
        setLoading(false);
    };

    return (
        <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
            <div className="card-body">
                <h2 className="card-title mb-4">{t.createProduct}</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    {/* Names */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">Nombre (ES)</span></label>
                            <input type="text" placeholder="Ej: Arroz Chaufa" className="input input-bordered" required
                                value={nameEs} onChange={(e) => setNameEs(e.target.value)} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Nombre (ZH)</span></label>
                            <input type="text" placeholder="Ej: 炒饭" className="input input-bordered" required
                                value={nameZh} onChange={(e) => setNameZh(e.target.value)} />
                        </div>
                    </div>

                    {/* Price & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">Precio ($)</span></label>
                            <input type="number" placeholder="8500" className="input input-bordered" required
                                value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Categoría</span></label>
                            <select className="select select-bordered" value={category} onChange={(e) => setCategory(e.target.value)}>
                                <option value="Entradas">Entradas</option>
                                <option value="Fondos">Fondos</option>
                                <option value="Bebidas">Bebidas</option>
                                <option value="Postres">Postres</option>
                            </select>
                        </div>
                    </div>

                    {/* Image */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Foto (Opcional)</span></label>
                        <input type="file" className="file-input file-input-bordered w-full" accept="image/*" onChange={handleFileChange} />
                    </div>

                    <div className="form-control mt-6">
                        <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading}>
                            {t.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
