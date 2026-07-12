export interface SlideVisual {
  provider: 'Wikimedia Commons' | 'Lumio Visual' | 'Lumio Geometry';
  query: string;
  url: string;
  sourceUrl?: string;
  alt: string;
  author: string;
  license?: string;
  licenseUrl?: string;
  fit?: 'cover' | 'contain';
  width?: number;
  height?: number;
}

export interface VisualSlideInput {
  position: number;
  layout: string;
  content: Record<string, unknown>;
}
