import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '@nanostores/react';
import { adminLang, adminTranslations } from '../../stores/i18nStore';
import LanguageToggle from './LanguageToggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const lang = useStore(adminLang);
    const t = adminTranslations[lang];

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.href = '/admin/login';
            } else {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/admin/login';
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg"></span></div>;

    return (
        <div className="min-h-screen bg-base-200 pb-20">
            {/* Navbar */}
            <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
                <div className="flex-1">
                    <a className="btn btn-ghost text-xl">AION <span className="text-xs opacity-50">Admin</span></a>
                </div>
                <div className="flex-none gap-2">
                    <LanguageToggle />
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                            <div className="w-10 rounded-full bg-neutral text-neutral-content grid place-items-center">
                                <span>A</span>
                            </div>
                        </div>
                        <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                            <li><button onClick={handleLogout}>{t.logout}</button></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 max-w-4xl mx-auto">
                {children}
            </div>
        </div>
    );
}
