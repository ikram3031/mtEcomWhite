import logoImage from '@/assets/decantre_logo.png';

export const DecantreLogo = ({
  className = 'h-10 w-auto',
  alt = 'Decantre logo',
}) => {
  return (
    <div className={`relative overflow-hidden flex items-center ${className}`}>
      <img
        src={logoImage}
        alt={alt}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
