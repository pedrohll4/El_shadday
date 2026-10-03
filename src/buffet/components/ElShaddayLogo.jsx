import React from 'react';

/**
 * High-end Gold Lion Crest & Typography for El Shadday Serviços de Buffet
 * Faithfully reflects the client's reference visual identity:
 * - Golden Lion Head with Crown inside a Circular Shield
 * - Classical Serif "EL SHADDAY"
 * - Subtitle "SERVIÇOS DE BUFFET" with premium letter-spacing
 */
export function ElShaddayLogo({ 
  className = "", 
  variant = "full", // "full" | "icon" | "horizontal" | "badge"
  size = "md"       // "sm" | "md" | "lg" | "xl"
}) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  const titleSizes = {
    sm: "text-base tracking-[0.2em]",
    md: "text-xl sm:text-2xl tracking-[0.25em]",
    lg: "text-3xl sm:text-4xl tracking-[0.3em]",
    xl: "text-4xl sm:text-5xl tracking-[0.35em]"
  };

  const subtitleSizes = {
    sm: "text-[8px] tracking-[0.3em]",
    md: "text-[10px] sm:text-xs tracking-[0.35em]",
    lg: "text-xs sm:text-sm tracking-[0.4em]",
    xl: "text-sm sm:text-base tracking-[0.45em]"
  };

  // Official El Shadday Logo Crest (Image with SVG fallback)
  const [imgError, setImgError] = React.useState(false);
  const officialLogoUrl = "https://assets.olaclick.app/companies/logos/67bb7c61-2505-4b36-a16c-6a4979bb3651.png";

  const LionCrest = (
    <div className={`relative flex items-center justify-center flex-shrink-0 rounded-full overflow-hidden border-2 border-[#D8B85A] p-0.5 bg-[#15191F] shadow-glow-gold transition-transform duration-300 hover:scale-105 ${iconSizes[size] || iconSizes.md}`}>
      {!imgError ? (
        <img 
          src={officialLogoUrl} 
          alt="El Shadday" 
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full drop-shadow-[0_2px_8px_rgba(216,184,90,0.35)]"
        />
      ) : (
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(216,184,90,0.35)]"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
        <defs>
          <linearGradient id="goldGradientLogo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5E7B2" />
            <stop offset="40%" stopColor="#D8B85A" />
            <stop offset="70%" stopColor="#E8D58A" />
            <stop offset="100%" stopColor="#B3913A" />
          </linearGradient>
          <radialGradient id="shieldBg" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#15191F" />
            <stop offset="100%" stopColor="#0B0D11" />
          </radialGradient>
        </defs>

        {/* Circular Outer Shield */}
        <circle cx="50" cy="50" r="46" stroke="url(#goldGradientLogo)" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="41.5" stroke="url(#goldGradientLogo)" strokeWidth="0.8" strokeDasharray="3 2" />
        <circle cx="50" cy="50" r="40" fill="url(#shieldBg)" />

        {/* Crown on Top */}
        <path 
          d="M38 31 L44 38 L50 28 L56 38 L62 31 L60 41 L40 41 Z" 
          fill="url(#goldGradientLogo)" 
        />
        <circle cx="38" cy="30" r="1.5" fill="#FFF8DC" />
        <circle cx="50" cy="27" r="1.8" fill="#FFF8DC" />
        <circle cx="62" cy="30" r="1.5" fill="#FFF8DC" />

        {/* Lion Mane & Face Silhouette (Geometric Regal Luxury) */}
        <path 
          d="M50 43 
             C43 43 38 48 38 54 
             C36 56 34 60 36 64 
             C37 67 40 69 43 70 
             C44 74 47 78 50 80 
             C53 78 56 74 57 70 
             C60 69 63 67 64 64 
             C66 60 64 56 62 54 
             C62 48 57 43 50 43 Z" 
          stroke="url(#goldGradientLogo)" 
          strokeWidth="1.8" 
          strokeLinejoin="round"
        />

        {/* Lion Facial Details */}
        <path d="M46 56 L50 62 L54 56" stroke="url(#goldGradientLogo)" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="45" cy="52" r="1.2" fill="#E8D58A" />
        <circle cx="55" cy="52" r="1.2" fill="#E8D58A" />
        <path d="M48 66 L52 66" stroke="url(#goldGradientLogo)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M50 66 L50 71" stroke="url(#goldGradientLogo)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      )}
    </div>
  );

  if (variant === "icon") {
    return LionCrest;
  }

  if (variant === "horizontal") {
    return (
      <div className={`flex items-center gap-3.5 ${className}`}>
        {LionCrest}
        <div className="flex flex-col">
          <span className={`font-serif font-bold text-[#E8D58A] tracking-[0.2em] leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${titleSizes[size] || titleSizes.md}`}>
            EL SHADDAY
          </span>
          <span className={`font-sans font-medium text-[#D8B85A]/90 tracking-[0.35em] uppercase leading-none mt-1 ${subtitleSizes[size] || subtitleSizes.md}`}>
            SERVIÇOS DE BUFFET
          </span>
        </div>
      </div>
    );
  }

  // Full / Stacked Logo (as seen in the header of the reference poster)
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {LionCrest}
      <h1 className={`font-serif font-bold text-[#E8D58A] uppercase mt-2.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${titleSizes[size] || titleSizes.md}`}>
        EL SHADDAY
      </h1>
      <p className={`font-sans font-semibold text-[#D8B85A] uppercase tracking-[0.38em] mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${subtitleSizes[size] || subtitleSizes.md}`}>
        SERVIÇOS DE BUFFET
      </p>
    </div>
  );
}

/**
 * Elegant Gold Arabesque / Filigree Divider
 * Directly inspired by the gold flourishes on the client's reference visual
 */
export function GoldFiligree({ className = "my-4", width = "w-48 sm:w-64" }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {/* Left Flourish Line */}
      <div className="h-[1px] flex-1 max-w-[80px] sm:max-w-[120px] bg-gradient-to-r from-transparent via-[#D8B85A]/60 to-[#D8B85A]" />
      
      {/* Center Victorian / Baroque Petal Motif */}
      <svg 
        className="w-10 h-4 text-[#D8B85A]" 
        viewBox="0 0 60 20" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M30 2 C28 8 20 10 15 10 C10 10 5 7 2 10 C7 13 14 11 20 11 C26 11 28 17 30 18 C32 17 34 11 40 11 C46 11 53 13 58 10 C55 7 50 10 45 10 C40 10 32 8 30 2 Z" 
          fill="#D8B85A" 
          opacity="0.85" 
        />
        <circle cx="30" cy="10" r="2.2" fill="#F5E7B2" />
        <circle cx="15" cy="10" r="1.3" fill="#D8B85A" />
        <circle cx="45" cy="10" r="1.3" fill="#D8B85A" />
      </svg>

      {/* Right Flourish Line */}
      <div className="h-[1px] flex-1 max-w-[80px] sm:max-w-[120px] bg-gradient-to-l from-transparent via-[#D8B85A]/60 to-[#D8B85A]" />
    </div>
  );
}
