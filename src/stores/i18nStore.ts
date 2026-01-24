import { atom } from 'nanostores';

export type AdminLanguage = 'es' | 'zh';

// Default to Spanish
export const adminLang = atom<AdminLanguage>('es');

export function toggleAdminLang() {
    const current = adminLang.get();
    adminLang.set(current === 'es' ? 'zh' : 'es');
}

export const adminTranslations = {
    es: {
        dashboard: 'Panel de Control',
        products: 'Productos',
        stock: 'Stock',
        price: 'Precio',
        save: 'Guardar',
        edit: 'Editar',
        logout: 'Cerrar Sesión',
        available: 'Disponible',
        outOfStock: 'Agotado',
        createProduct: 'Crear Producto',
        generateQR: 'Generar QR',
    },
    zh: {
        dashboard: '控制面板',
        products: '产品管理',
        stock: '库存',
        price: '价格',
        save: '保存',
        edit: '编辑',
        logout: '退出登录',
        available: '有货',
        outOfStock: '缺货',
        createProduct: '新增产品',
        generateQR: '生成二维码',
    }
};
