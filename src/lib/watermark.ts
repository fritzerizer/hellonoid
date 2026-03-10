import sharp from 'sharp';

export interface WatermarkOptions {
  text?: string;
  logoPath?: string;
  position?: 'bottom-right' | 'bottom-left' | 'center' | 'bottom-center';
  opacity?: number;
  fontSize?: number;
  color?: string;
}

export async function addWatermark(
  imageBuffer: Buffer, 
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const {
    text = 'hellonoid.com',
    position = 'bottom-right',
    opacity = 0.7,
    fontSize = 24,
    color = 'rgba(255,255,255,0.8)'
  } = options;

  const image = sharp(imageBuffer);
  const { width, height } = await image.metadata();
  
  if (!width || !height) {
    throw new Error('Invalid image dimensions');
  }

  // Create SVG watermark
  const padding = 20;
  const svgText = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .watermark { 
            font-family: Arial, sans-serif; 
            font-size: ${fontSize}px; 
            font-weight: 500;
            fill: ${color};
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          }
        </style>
      </defs>
      <text 
        x="${getTextX(position, width, text.length * fontSize * 0.6, padding)}" 
        y="${getTextY(position, height, fontSize, padding)}"
        class="watermark"
        opacity="${opacity}"
      >${text}</text>
    </svg>
  `;

  const watermarkBuffer = Buffer.from(svgText);

  return image
    .composite([{
      input: watermarkBuffer,
      blend: 'over'
    }])
    .png()
    .toBuffer();
}

function getTextX(position: string, width: number, textWidth: number, padding: number): number {
  switch (position) {
    case 'bottom-left':
      return padding;
    case 'bottom-right':
      return width - textWidth - padding;
    case 'center':
      return (width - textWidth) / 2;
    case 'bottom-center':
      return (width - textWidth) / 2;
    default:
      return width - textWidth - padding;
  }
}

function getTextY(position: string, height: number, fontSize: number, padding: number): number {
  switch (position) {
    case 'center':
      return height / 2;
    default:
      return height - padding - fontSize * 0.3;
  }
}

export async function resizeWithWatermark(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  watermarkOpts?: WatermarkOptions
): Promise<Buffer> {
  const resized = await sharp(imageBuffer)
    .resize(targetWidth, targetHeight, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  if (!watermarkOpts) {
    return resized;
  }

  return addWatermark(resized, watermarkOpts);
}