/**
 * Utilidades para optimización de imágenes
 * - Compresión
 * - Conversión a WebP
 * - Redimensionado
 */

export interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'webp' | 'jpeg';
}

const DEFAULT_OPTIONS: CompressOptions = {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
    format: 'webp',
};

/**
 * Comprime y convierte una imagen a WebP
 * Reduce significativamente el tamaño del archivo manteniendo calidad visual
 */
export async function compressImage(
    file: File,
    options: CompressOptions = {}
): Promise<{ blob: Blob; width: number; height: number }> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            try {
                // Calcular dimensiones manteniendo aspect ratio
                let { width, height } = img;
                const maxW = opts.maxWidth!;
                const maxH = opts.maxHeight!;

                if (width > maxW || height > maxH) {
                    const ratio = Math.min(maxW / width, maxH / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                // Crear canvas y dibujar imagen redimensionada
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('No se pudo crear contexto de canvas'));
                    return;
                }

                // Mejorar calidad de redimensionado
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a blob
                const mimeType = opts.format === 'webp' ? 'image/webp' : 'image/jpeg';
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve({ blob, width, height });
                        } else {
                            reject(new Error('Error al crear blob de imagen'));
                        }
                    },
                    mimeType,
                    opts.quality
                );
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => {
            reject(new Error('Error al cargar la imagen'));
        };

        // Cargar imagen desde File
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Formatea el tamaño de archivo para mostrar
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Verifica si el navegador soporta WebP
 */
export function supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}
