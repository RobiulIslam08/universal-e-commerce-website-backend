export interface ICarousel {
  title: string;
  subtitle: string;
  badge: string;
  badgeSubtext: string;
  bgColor: string;
  overlayType: 'dark' | 'light' | 'none';
  image?: string;
  buttonText?: string;
  buttonLink?: string;
  isActive: boolean;
  order: number;
}
