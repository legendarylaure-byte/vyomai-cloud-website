export const BRAND = {
  colors: {
    start: '#8a50e8',
    mid: '#c060d0',
    end: '#e07040',
  },
  gradient: 'linear-gradient(135deg, #8a50e8, #c060d0, #e07040)',
  gradientHorizontal: 'linear-gradient(90deg, #8a50e8, #c060d0, #e07040)',
} as const;

export type BrandColor = typeof BRAND.colors;
