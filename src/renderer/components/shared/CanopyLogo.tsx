import logoH48 from '../../assets/logo-transparent-h48.png';
import logoH64 from '../../assets/logo-transparent-h64.png';
import logoH128 from '../../assets/logo-transparent-h128.png';

const SIZE_CONFIG = {
  sm: { height: 48, src: logoH48 },
  md: { height: 64, src: logoH64 },
  lg: { height: 128, src: logoH128 },
} as const;

export function CanopyLogo({ size, className }: { size: 'sm' | 'md' | 'lg'; className?: string }) {
  const config = SIZE_CONFIG[size];
  return (
    <div className={className}>
      <img src={config.src} alt="Canopy" height={config.height} className="h-auto" />
    </div>
  );
}
