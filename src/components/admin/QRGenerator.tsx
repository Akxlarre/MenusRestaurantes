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
        doc.text('Mini wok', pageWidth / 2, 20, { align: 'center' });

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
        <div className="bg-white border border-[#E8C4C4]/30 rounded-2xl shadow-sm max-w-2xl mx-auto overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#E8C4C4]/20 text-center">
                <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#1C1C1E]">
                    {t.qrGenerator}
                </h2>
                <p className="text-[#5A5A5C] text-sm mt-1">{t.downloadQRs}</p>
            </div>

            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    {/* Preview */}
                    <div className="flex flex-col items-center">
                        <div className="bg-[#F7F7F2] p-4 rounded-2xl border border-[#E8C4C4]/30">
                            {qrUrl ? (
                                <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
                            ) : (
                                <div className="w-48 h-48 flex items-center justify-center">
                                    <span className="loading loading-spinner loading-lg text-[#B84A4A]"></span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs mt-4 text-[#5A5A5C]/50 font-mono">{MENU_URL}</p>
                    </div>

                    {/* Info & Actions */}
                    <div className="flex-1 space-y-4">
                        <div className="bg-[#F7F7F2] border border-[#E8C4C4]/30 rounded-xl p-4">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 bg-[#B84A4A]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-[#B84A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#1C1C1E] text-sm">
                                        {t.qrDuration}
                                    </h3>
                                    <p className="text-xs text-[#5A5A5C] mt-1 leading-relaxed">
                                        {t.qrInfo}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={downloadPDF}
                            className="w-full py-3 px-4 bg-[#B84A4A] hover:bg-[#8B3A3A] text-white font-semibold rounded-xl shadow-md shadow-[#B84A4A]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            )}
                            {t.downloadPDF}
                        </button>

                        <p className="text-xs text-center text-[#5A5A5C]/50">
                            {t.pdfIncludes}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
