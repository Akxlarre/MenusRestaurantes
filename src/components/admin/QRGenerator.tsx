import { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { useStore } from '@nanostores/react';
import { adminLang, adminTranslations } from '../../stores/i18nStore';

export default function QRGenerator() {
    const lang = useStore(adminLang);
    const t = adminTranslations[lang];
    const [qrUrl, setQrUrl] = useState('');
    const [loading, setLoading] = useState(false);

    // The public URL of the menu
    const MENU_URL = typeof window !== 'undefined' ? window.location.origin : 'https://aion-menu.vercel.app';

    useEffect(() => {
        generateQRCode();
    }, []);

    const generateQRCode = async () => {
        try {
            const url = await QRCode.toDataURL(MENU_URL, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            });
            setQrUrl(url);
        } catch (err) {
            console.error(err);
        }
    };

    const downloadPDF = () => {
        setLoading(true);
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Logo / Header
        doc.setFontSize(22);
        doc.text('AION Menu', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`${MENU_URL}`, pageWidth / 2, 30, { align: 'center' });

        // 6 QRs Layout (2 columns x 3 rows)
        const qrSize = 60;
        const marginX = (pageWidth - (qrSize * 2)) / 3;
        const marginY = 40;
        const spacingY = 80;

        for (let i = 0; i < 6; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);

            const x = marginX + (col * (qrSize + marginX));
            const y = marginY + (row * spacingY);

            // QR Image
            if (qrUrl) {
                doc.addImage(qrUrl, 'PNG', x, y, qrSize, qrSize);
            }

            // CTA
            doc.setFontSize(10);
            doc.text('Escanea para ver el menú', x + (qrSize / 2), y + qrSize + 10, { align: 'center' });
            doc.text('扫描查看菜单', x + (qrSize / 2), y + qrSize + 16, { align: 'center' });
        }

        doc.save('aion-menu-qrs.pdf');
        setLoading(false);
    };

    return (
        <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
            <div className="card-body">
                <h2 className="card-title justify-center mb-6">{lang === 'es' ? 'Generador de QR' : '二维码生成器'}</h2>

                <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                    {/* Preview */}
                    <div className="flex flex-col items-center">
                        <div className="bg-white p-4 rounded-xl shadow-inner">
                            {qrUrl ? <img src={qrUrl} alt="QR Code" className="w-48 h-48" /> : <div className="skeleton w-48 h-48"></div>}
                        </div>
                        <p className="text-sm mt-4 opacity-50 font-mono">{MENU_URL}</p>
                    </div>

                    {/* Info & Actions */}
                    <div className="flex-1 space-y-4">
                        <div className="alert alert-info shadow-sm text-sm">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <div>
                                    <h3 className="font-bold">{lang === 'es' ? '¿Cuánto dura este QR?' : '二维码有效期？'}</h3>
                                    <div className="text-xs opacity-90">
                                        {lang === 'es'
                                            ? 'Este QR es ETERNO mientras tu dominio web exista. Si actualizas platos o precios, el QR sigue funcionando porque envía a los clientes a tu sitio web, donde ven la información en tiempo real.'
                                            : '只要您的网站域名存在，此二维码永久有效。如果您更新菜品或价格，二维码仍然有效，因为它会将客户通过引导至您的网站来查看实时信息。'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={downloadPDF}
                            className="btn btn-primary w-full gap-2"
                            disabled={loading}
                        >
                            {loading ? <span className="loading loading-spinner"></span> : '📄'}
                            {lang === 'es' ? 'Descargar PDF para Imprimir (x6)' : '下载 PDF (x6)'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
