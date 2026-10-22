import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vipDir = path.resolve(__dirname, "../../vippartyin/public/images/downloads");
const backendDir = path.resolve(__dirname, "../public/images/downloads");

[vipDir, backendDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper to save to both directories
function saveFile(filename, content) {
  fs.writeFileSync(path.join(vipDir, filename), content, "utf8");
  fs.writeFileSync(path.join(backendDir, filename), content, "utf8");
}

// 1. Mukesh Sahani Leader
saveFile("mukesh-sahani-leader.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001428"/>
      <stop offset="40%" stop-color="#003a6c"/>
      <stop offset="100%" stop-color="#001020"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="50%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <rect width="1200" height="1500" fill="url(#bgGrad)"/>

  <!-- Decorative Background Elements -->
  <circle cx="600" cy="580" r="420" fill="none" stroke="#004b87" stroke-width="2" opacity="0.4"/>
  <circle cx="600" cy="580" r="360" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="10 8" opacity="0.6"/>
  <circle cx="600" cy="580" r="300" fill="#002b54" opacity="0.7"/>

  <!-- Top Header Badge -->
  <g transform="translate(600, 110)">
    <rect x="-240" y="-36" width="480" height="72" rx="36" fill="#001e38" stroke="url(#goldGrad)" stroke-width="2.5"/>
    <text x="0" y="8" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="24" font-weight="900" fill="#fbbf24" text-anchor="middle" letter-spacing="3">VIKASSHEEL INSAAN PARTY</text>
  </g>

  <!-- Central Leader Avatar Illustration -->
  <g transform="translate(600, 580)" filter="url(#shadow)">
    <!-- Aura Glow -->
    <circle cx="0" cy="0" r="260" fill="#004b87" opacity="0.3"/>
    <circle cx="0" cy="0" r="230" fill="#002244" stroke="url(#goldGrad)" stroke-width="6"/>
    
    <!-- Stylized Leader Silhouette & Torso -->
    <path d="M-150,220 C-150,140 -80,90 0,90 C80,90 150,140 150,220 Z" fill="#f8fafc"/>
    <path d="M-110,220 L-60,110 L0,170 L60,110 L110,220 Z" fill="#004b87"/>
    <!-- Head / Hair -->
    <ellipse cx="0" cy="0" rx="90" ry="105" fill="#fbcfe8" opacity="0.95"/>
    <path d="M-90,-10 C-85,-90 -40,-120 0,-120 C40,-120 85,-90 90,-10 C70,-70 30,-90 0,-90 C-30,-90 -70,-70 -90,-10 Z" fill="#0f172a"/>
    <!-- Tilak / Saffron Scarf -->
    <path d="M-6,-40 L6,-40 L0,-65 Z" fill="#ea580c"/>
    <path d="M-130,220 C-90,160 -50,150 0,160 C50,150 90,160 130,220 L150,230 L-150,230 Z" fill="#f59e0b"/>
  </g>

  <!-- Boat Symbol Emblem at Left-Right -->
  <g transform="translate(600, 880)">
    <rect x="-180" y="-24" width="360" height="48" rx="24" fill="#f59e0b" filter="url(#shadow)"/>
    <text x="0" y="8" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="900" fill="#001426" text-anchor="middle">★ सन ऑफ मल्लाह ★</text>
  </g>

  <!-- Name & Designation -->
  <text x="600" y="1030" font-family="'Noto Sans Devanagari', 'Plus Jakarta Sans', Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle">श्री मुकेश सहनी</text>
  <text x="600" y="1090" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="34" font-weight="700" fill="#fbbf24" text-anchor="middle" letter-spacing="1">SHRI MUKESH SAHANI</text>
  
  <line x1="250" y1="1130" x2="950" y2="1130" stroke="url(#goldLine)" stroke-width="3"/>

  <text x="600" y="1180" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="600" fill="#cbd5e1" text-anchor="middle">संस्थापक एवं राष्ट्रीय अध्यक्ष, विकासशील इंसान पार्टी</text>
  <text x="600" y="1225" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="500" fill="#94a3b8" text-anchor="middle">पूर्व मंत्री, पशु एवं मत्स्य संसाधन विभाग, बिहार सरकार</text>

  <!-- Bottom Official Stamp Footer -->
  <rect x="0" y="1380" width="1200" height="120" fill="#000c18"/>
  <line x1="0" y1="1380" x2="1200" y2="1380" stroke="url(#goldGrad)" stroke-width="4"/>
  <text x="80" y="1450" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="700" fill="#f8fafc">विकासशील इंसान पार्टी (VIP)</text>
  <text x="1120" y="1450" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="700" fill="#fbbf24" text-anchor="end">OFFICIAL HIGH-RESOLUTION PORTRAIT</text>
</svg>`);

// 2. Jubba Sahani Leader
saveFile("jubba-sahani-leader.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500">
  <defs>
    <linearGradient id="jubbaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="amberGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1500" fill="url(#jubbaGrad)"/>
  <circle cx="600" cy="580" r="320" fill="#312e81" opacity="0.3"/>
  <circle cx="600" cy="580" r="260" fill="#1e1b4b" stroke="url(#amberGold)" stroke-width="6"/>

  <g transform="translate(600, 110)">
    <rect x="-260" y="-36" width="520" height="72" rx="36" fill="#1e1b4b" stroke="url(#amberGold)" stroke-width="2"/>
    <text x="0" y="8" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="900" fill="#fbbf24" text-anchor="middle">★ अमर शहीद कुल गौरव ★</text>
  </g>

  <!-- Stylized Martyr Silhouette -->
  <g transform="translate(600, 580)">
    <circle cx="0" cy="-30" r="100" fill="#fed7aa"/>
    <path d="M-140,200 C-140,120 -80,80 0,80 C80,80 140,120 140,200 Z" fill="#ffffff"/>
    <path d="M-100,-70 C-90,-120 0,-140 0,-140 C0,-140 90,-120 100,-70 Z" fill="#475569"/>
  </g>

  <g transform="translate(600, 880)">
    <rect x="-200" y="-24" width="400" height="48" rx="24" fill="#dc2626"/>
    <text x="0" y="8" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">भारतीय स्वतंत्रता सेनानी (1906 - 1944)</text>
  </g>

  <text x="600" y="1030" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="62" font-weight="900" fill="#ffffff" text-anchor="middle">अमर शहीद जुब्बा सहनी</text>
  <text x="600" y="1090" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="32" font-weight="700" fill="#fbbf24" text-anchor="middle">AMAR SHAHEED JUBBA SAHANI</text>

  <text x="600" y="1170" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="600" fill="#e2e8f0" text-anchor="middle">अंग्रेजी हुकूमत के छक्के छुड़ाने वाले स्वतंत्रता संग्राम के अमर नायक</text>
  <text x="600" y="1220" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="500" fill="#94a3b8" text-anchor="middle">11 मार्च 1944 को भागलपुर सेंट्रल जेल में हंसते-हंसते फांसी के फंदे को चूमा</text>

  <rect x="0" y="1380" width="1200" height="120" fill="#020617"/>
  <line x1="0" y1="1380" x2="1200" y2="1380" stroke="url(#amberGold)" stroke-width="4"/>
  <text x="80" y="1450" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="700" fill="#f8fafc">विकासशील इंसान पार्टी (VIP)</text>
  <text x="1120" y="1450" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="700" fill="#fbbf24" text-anchor="end">HEROIC TRIBUTE ARCHIVE</text>
</svg>`);

// 3. Phoolan Devi Leader
saveFile("phoolan-devi-leader.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500">
  <defs>
    <linearGradient id="phoolanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#831843"/>
      <stop offset="50%" stop-color="#4c0519"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="gold2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fde047"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1500" fill="url(#phoolanGrad)"/>
  <circle cx="600" cy="580" r="260" fill="#701a75" stroke="url(#gold2)" stroke-width="6"/>

  <g transform="translate(600, 110)">
    <rect x="-240" y="-36" width="480" height="72" rx="36" fill="#4c0519" stroke="url(#gold2)" stroke-width="2"/>
    <text x="0" y="8" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="900" fill="#fbbf24" text-anchor="middle">★ नारी शक्ति व स्वाभिमान की प्रतीक ★</text>
  </g>

  <!-- Silhouette & Scarf -->
  <g transform="translate(600, 580)">
    <circle cx="0" cy="-30" r="100" fill="#fed7aa"/>
    <!-- Red Headband -->
    <rect x="-105" y="-70" width="210" height="35" rx="10" fill="#dc2626"/>
    <path d="M-130,190 C-130,110 -70,80 0,80 C70,80 130,110 130,190 Z" fill="#15803d"/>
  </g>

  <g transform="translate(600, 880)">
    <rect x="-180" y="-24" width="360" height="48" rx="24" fill="#f59e0b"/>
    <text x="0" y="8" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="900" fill="#001426" text-anchor="middle">पूर्व सांसद, मिर्ज़ापुर</text>
  </g>

  <text x="600" y="1030" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="62" font-weight="900" fill="#ffffff" text-anchor="middle">वीरांगना फूलन देवी</text>
  <text x="600" y="1090" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="32" font-weight="700" fill="#fbbf24" text-anchor="middle">VEERANGANA PHOOLAN DEVI</text>

  <text x="600" y="1170" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="600" fill="#fce7f3" text-anchor="middle">शोषितों, पीड़ितों और महिलाओं के हक व सम्मान की अडिग आवाज</text>
  <text x="600" y="1220" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="500" fill="#f9a8d4" text-anchor="middle">अन्याय के खिलाफ कभी न झुकने वाला क्रांतिकारी जीवन</text>

  <rect x="0" y="1380" width="1200" height="120" fill="#0f172a"/>
  <line x1="0" y1="1380" x2="1200" y2="1380" stroke="url(#gold2)" stroke-width="4"/>
  <text x="80" y="1450" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="700" fill="#f8fafc">विकासशील इंसान पार्टी (VIP)</text>
  <text x="1120" y="1450" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="700" fill="#fbbf24" text-anchor="end">INSPIRATIONAL LEADERS ARCHIVE</text>
</svg>`);

// 4. Dr. B.R. Ambedkar
saveFile("dr-ambedkar-leader.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500">
  <defs>
    <linearGradient id="ambedkarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c4a6e"/>
      <stop offset="50%" stop-color="#082f49"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="gold3" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1500" fill="url(#ambedkarGrad)"/>
  <circle cx="600" cy="580" r="260" fill="#0369a1" stroke="url(#gold3)" stroke-width="6"/>

  <g transform="translate(600, 110)">
    <rect x="-240" y="-36" width="480" height="72" rx="36" fill="#082f49" stroke="url(#gold3)" stroke-width="2"/>
    <text x="0" y="8" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="900" fill="#38bdf8" text-anchor="middle">★ भारत रत्न व संविधान निर्माता ★</text>
  </g>

  <!-- Silhouette: Suit & Glasses -->
  <g transform="translate(600, 580)">
    <circle cx="0" cy="-30" r="100" fill="#fed7aa"/>
    <!-- Glasses -->
    <rect x="-55" y="-45" width="40" height="30" rx="6" fill="none" stroke="#0f172a" stroke-width="5"/>
    <rect x="15" y="-45" width="40" height="30" rx="6" fill="none" stroke="#0f172a" stroke-width="5"/>
    <line x1="-15" y1="-30" x2="15" y2="-30" stroke="#0f172a" stroke-width="5"/>
    <!-- Suit -->
    <path d="M-140,200 C-140,120 -80,80 0,80 C80,80 140,120 140,200 Z" fill="#1e3a8a"/>
    <polygon points="0,95 -25,200 25,200" fill="#dc2626"/>
  </g>

  <g transform="translate(600, 880)">
    <rect x="-180" y="-24" width="360" height="48" rx="24" fill="#0284c7"/>
    <text x="0" y="8" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">सामाजिक न्याय के अग्रदूत</text>
  </g>

  <text x="600" y="1030" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="58" font-weight="900" fill="#ffffff" text-anchor="middle">बाबा साहेब डॉ. भीमराव अंबेडकर</text>
  <text x="600" y="1090" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="32" font-weight="700" fill="#38bdf8" text-anchor="middle">DR. B.R. AMBEDKAR</text>

  <text x="600" y="1170" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="600" fill="#e0f2fe" text-anchor="middle">"शिक्षित बनो, संगठित रहो, संघर्ष करो"</text>
  <text x="600" y="1220" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="500" fill="#7dd3fc" text-anchor="middle">समतामूलक भारत के निर्माण की प्रेरणा</text>

  <rect x="0" y="1380" width="1200" height="120" fill="#020617"/>
  <line x1="0" y1="1380" x2="1200" y2="1380" stroke="url(#gold3)" stroke-width="4"/>
  <text x="80" y="1450" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="700" fill="#f8fafc">विकासशील इंसान पार्टी (VIP)</text>
  <text x="1120" y="1450" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="700" fill="#38bdf8" text-anchor="end">CONSTITUTIONAL GUIDE ARCHIVE</text>
</svg>`);

// 5. Nishad Aarakshan Banner (1920x1080)
saveFile("nishad-aarakshan-banner.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="rallyBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001428"/>
      <stop offset="50%" stop-color="#004b87"/>
      <stop offset="100%" stop-color="#001e38"/>
    </linearGradient>
    <linearGradient id="goldRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="50%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>

  <rect width="1920" height="1080" fill="url(#rallyBg)"/>

  <!-- Top Ribbon -->
  <rect x="0" y="0" width="1920" height="70" fill="#001426"/>
  <text x="960" y="46" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="26" font-weight="900" fill="#fbbf24" text-anchor="middle" letter-spacing="2">विकासशील इंसान पार्टी (VIP) आधिकारिक महाअभियान बैनर</text>

  <!-- Left Boat Logo Graphic -->
  <g transform="translate(240, 520)">
    <circle cx="0" cy="0" r="160" fill="#002b54" stroke="url(#goldRibbon)" stroke-width="6"/>
    <!-- Stylized Boat -->
    <path d="M-90,30 C-50,80 50,80 90,30 C70,55 -70,55 -90,30 Z" fill="#fbbf24"/>
    <path d="M-10,30 L-10,-70 L40,-10 Z" fill="#38bdf8"/>
    <line x1="-10" y1="30" x2="-10" y2="-80" stroke="#f8fafc" stroke-width="4"/>
    <text x="0" y="115" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">VIP PARTY</text>
  </g>

  <!-- Main Headline -->
  <g transform="translate(600, 260)">
    <rect x="0" y="0" width="460" height="50" rx="25" fill="#dc2626"/>
    <text x="230" y="34" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle">★ ऐतिहासिक संकल्प महारैली ★</text>
  </g>

  <text x="600" y="420" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="84" font-weight="900" fill="#ffffff">निषाद आरक्षण संकल्प यात्रा</text>
  <text x="600" y="520" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="52" font-weight="900" fill="#fbbf24">"आरक्षण नहीं तो गठबंधन नहीं, वोट नहीं!"</text>
  
  <text x="600" y="610" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="32" font-weight="600" fill="#cbd5e1">बिहार के निषाद, मल्लाह, बिंद, बेलदार और अति-पिछड़े समाज का हक लेकर रहेंगे।</text>
  <text x="600" y="670" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="500" fill="#93c5fd">नेतृत्व: 'सन ऑफ मल्लाह' श्री मुकेश सहनी (राष्ट्रीय अध्यक्ष, वीआईपी)</text>

  <!-- Call to action boxes -->
  <g transform="translate(600, 740)">
    <rect x="0" y="0" width="340" height="90" rx="16" fill="#f59e0b"/>
    <text x="170" y="55" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="900" fill="#001426" text-anchor="middle">एकजुट हों, अधिकार पाएं</text>
  </g>

  <g transform="translate(980, 740)">
    <rect x="0" y="0" width="360" height="90" rx="16" fill="#002b54" stroke="#38bdf8" stroke-width="2"/>
    <text x="180" y="55" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="24" font-weight="800" fill="#ffffff" text-anchor="middle">JOIN: vipparty.in</text>
  </g>

  <!-- Bottom Strip -->
  <rect x="0" y="960" width="1920" height="120" fill="#001020"/>
  <line x1="0" y1="960" x2="1920" y2="960" stroke="url(#goldRibbon)" stroke-width="4"/>
  <text x="80" y="1030" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="26" font-weight="700" fill="#f8fafc">विकासशील इंसान पार्टी - सामाजिक न्याय एवं स्वाभिमान</text>
  <text x="1840" y="1030" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="24" font-weight="700" fill="#fbbf24" text-anchor="end">HD DIGITAL BANNER (1920x1080)</text>
</svg>`);

// 6. VIP Symbol Boat Banner (1920x1080)
saveFile("vip-symbol-boat-banner.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="boatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001a33"/>
      <stop offset="50%" stop-color="#003366"/>
      <stop offset="100%" stop-color="#001020"/>
    </linearGradient>
    <linearGradient id="gold4" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#boatGrad)"/>

  <!-- Giant Glowing Boat Emblem Center -->
  <g transform="translate(960, 420)">
    <circle cx="0" cy="0" r="240" fill="#002244" stroke="url(#gold4)" stroke-width="8"/>
    <!-- Water Waves -->
    <path d="M-180,90 Q-90,60 0,90 Q90,120 180,90" fill="none" stroke="#38bdf8" stroke-width="8"/>
    <!-- Boat Hull -->
    <path d="M-140,40 C-80,110 80,110 140,40 C100,75 -100,75 -140,40 Z" fill="#fbbf24"/>
    <!-- Mast & Sail -->
    <line x1="-15" y1="40" x2="-15" y2="-120" stroke="#f8fafc" stroke-width="8"/>
    <path d="M-15,35 L-15,-110 L65,-15 Z" fill="#38bdf8"/>
    <polygon points="-15,-110 -65,-30 -15,-30" fill="#f8fafc" opacity="0.9"/>
  </g>

  <text x="960" y="760" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="68" font-weight="900" fill="#ffffff" text-anchor="middle">हमारा चुनाव चिह्न: नाव (BOAT)</text>
  <text x="960" y="830" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="34" font-weight="700" fill="#fbbf24" text-anchor="middle">विकास, विश्वास और सामाजिक स्वाभिमान का प्रतीक</text>
  <text x="960" y="890" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="26" font-weight="500" fill="#94a3b8" text-anchor="middle">विकासशील इंसान पार्टी (VIP) - बिहार के भविष्य का मजबूत संकल्प</text>

  <rect x="0" y="980" width="1920" height="100" fill="#000c18"/>
  <line x1="0" y1="980" x2="1920" y2="980" stroke="url(#gold4)" stroke-width="4"/>
  <text x="960" y="1040" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="24" font-weight="800" fill="#f8fafc" text-anchor="middle" letter-spacing="2">OFFICIAL ELECTION SYMBOL HIGH-RES BANNER</text>
</svg>`);

// 7. Jubba Scholarship Infographic (1080x1080)
saveFile("jubba-scholarship-infographic.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="schGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22"/>
      <stop offset="50%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#schGrad)"/>
  
  <rect x="50" y="50" width="980" height="980" rx="30" fill="none" stroke="#34d399" stroke-width="3"/>

  <g transform="translate(540, 140)">
    <rect x="-240" y="-30" width="480" height="60" rx="30" fill="#059669"/>
    <text x="0" y="10" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle">★ VIP जनकल्याणकारी योजना ★</text>
  </g>

  <text x="540" y="270" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="46" font-weight="900" fill="#fde047" text-anchor="middle">अमर शहीद जुब्बा सहनी</text>
  <text x="540" y="340" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle">मेधा छात्रवृत्ति योजना</text>

  <!-- Info Points Cards -->
  <g transform="translate(100, 420)">
    <rect x="0" y="0" width="880" height="110" rx="20" fill="#065f46" stroke="#10b981" stroke-width="2"/>
    <circle cx="60" cy="55" r="30" fill="#34d399"/>
    <text x="60" y="65" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="28" font-weight="900" fill="#022c22" text-anchor="middle">1</text>
    <text x="120" y="48" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="26" font-weight="800" fill="#ffffff">उच्च शिक्षा के लिए आर्थिक सहायता</text>
    <text x="120" y="85" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="20" font-weight="500" fill="#a7f3d0">10वीं, 12वीं एवं स्नातक के मेधावी छात्र-छात्राओं को विशेष प्रोत्साहन</text>
  </g>

  <g transform="translate(100, 560)">
    <rect x="0" y="0" width="880" height="110" rx="20" fill="#065f46" stroke="#10b981" stroke-width="2"/>
    <circle cx="60" cy="55" r="30" fill="#34d399"/>
    <text x="60" y="65" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="28" font-weight="900" fill="#022c22" text-anchor="middle">2</text>
    <text x="120" y="48" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="26" font-weight="800" fill="#ffffff">100% पारदर्शी ऑनलाइन आवेदन</text>
    <text x="120" y="85" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="20" font-weight="500" fill="#a7f3d0">सीधे आधिकारिक पोर्टल vipparty.in/scholarship से आवेदन करें</text>
  </g>

  <g transform="translate(100, 700)">
    <rect x="0" y="0" width="880" height="110" rx="20" fill="#065f46" stroke="#10b981" stroke-width="2"/>
    <circle cx="60" cy="55" r="30" fill="#34d399"/>
    <text x="60" y="65" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="28" font-weight="900" fill="#022c22" text-anchor="middle">3</text>
    <text x="120" y="48" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="26" font-weight="800" fill="#ffffff">बिहार के हर होनहार छात्र का भविष्य उज्ज्वल</text>
    <text x="120" y="85" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="20" font-weight="500" fill="#a7f3d0">गरीबी के कारण अब किसी युवा की पढ़ाई नहीं रुकेगी</text>
  </g>

  <!-- Bottom CTA -->
  <g transform="translate(540, 890)">
    <rect x="-220" y="-35" width="440" height="70" rx="35" fill="#fde047"/>
    <text x="0" y="10" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="26" font-weight="900" fill="#022c22" text-anchor="middle">आज ही ऑनलाइन आवेदन करें</text>
  </g>

  <text x="540" y="990" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="700" fill="#a7f3d0" text-anchor="middle">विकासशील इंसान पार्टी (VIP) छात्र कल्याण विंग</text>
</svg>`);

// 8. VIP Membership Campaign (1200x1200)
saveFile("vip-membership-campaign.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200">
  <defs>
    <linearGradient id="memGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001426"/>
      <stop offset="50%" stop-color="#003a6c"/>
      <stop offset="100%" stop-color="#001020"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1200" fill="url(#memGrad)"/>
  
  <g transform="translate(600, 160)">
    <rect x="-260" y="-35" width="520" height="70" rx="35" fill="#001e38" stroke="#f59e0b" stroke-width="2.5"/>
    <text x="0" y="10" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="26" font-weight="900" fill="#fbbf24" text-anchor="middle">★ सदस्यता महाभियान 2026-27 ★</text>
  </g>

  <text x="600" y="320" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle">VIP परिवार से जुड़ें</text>
  <text x="600" y="400" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="38" font-weight="700" fill="#fbbf24" text-anchor="middle">बदलाव के साक्षी नहीं, भागीदार बनें!</text>

  <!-- Digital ID Card Mockup -->
  <g transform="translate(300, 480)">
    <rect x="0" y="0" width="600" height="340" rx="24" fill="#002244" stroke="#38bdf8" stroke-width="3"/>
    <rect x="0" y="0" width="600" height="80" rx="24" fill="#001426"/>
    <text x="40" y="50" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="900" fill="#fbbf24">विकासशील इंसान पार्टी (VIP)</text>
    <text x="560" y="50" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="end">MEMBER CARD</text>
    
    <!-- Avatar placeholder -->
    <circle cx="100" cy="190" r="50" fill="#004b87" stroke="#fbbf24" stroke-width="3"/>
    <text x="100" y="200" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="36" font-weight="900" fill="#ffffff" text-anchor="middle">VIP</text>

    <text x="190" y="160" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="800" fill="#ffffff">डिजिटल सदस्यता पहचान पत्र</text>
    <text x="190" y="200" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="18" font-weight="500" fill="#93c5fd">तुरंत ऑनलाइन रजिस्ट्रेशन करें और अपना आईडी कार्ड पाएं</text>
    <text x="190" y="240" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="18" font-weight="700" fill="#fbbf24">ID: VIP-2026-ONLINE</text>
  </g>

  <!-- CTA Button -->
  <g transform="translate(600, 930)">
    <rect x="-240" y="-40" width="480" height="80" rx="40" fill="#f59e0b"/>
    <text x="0" y="12" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="30" font-weight="900" fill="#001426" text-anchor="middle">vipparty.in/member</text>
  </g>

  <text x="600" y="1080" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="600" fill="#cbd5e1" text-anchor="middle">मुफ्त डिजिटल सदस्यता कार्ड तुरंत डाउनलोड करें</text>
</svg>`);

// 9. Quote Mukesh Sahani (1080x1080)
saveFile("quote-mukesh-sahani.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="quote1Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001426"/>
      <stop offset="50%" stop-color="#003366"/>
      <stop offset="100%" stop-color="#001020"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#quote1Grad)"/>
  <rect x="40" y="40" width="1000" height="1000" rx="30" fill="none" stroke="#f59e0b" stroke-width="2.5"/>

  <!-- Giant Quote Mark -->
  <text x="120" y="260" font-family="Georgia, serif" font-size="200" font-weight="900" fill="#f59e0b" opacity="0.3">“</text>

  <g transform="translate(540, 140)">
    <rect x="-220" y="-30" width="440" height="60" rx="30" fill="#001e38" stroke="#38bdf8" stroke-width="2"/>
    <text x="0" y="10" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="900" fill="#38bdf8" text-anchor="middle">★ सामाजिक न्याय विचार ★</text>
  </g>

  <text x="540" y="380" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="46" font-weight="900" fill="#ffffff" text-anchor="middle" width="800">
    "जिसकी जितनी संख्या भारी,
  </text>
  <text x="540" y="450" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="46" font-weight="900" fill="#fbbf24" text-anchor="middle">
    उसकी उतनी हिस्सेदारी।"
  </text>

  <text x="540" y="580" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="500" fill="#cbd5e1" text-anchor="middle">
    जब तक हमारे निषाद और पिछड़े समाज को
  </text>
  <text x="540" y="630" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="500" fill="#cbd5e1" text-anchor="middle">
    उनका वाजिब संवैधानिक हक नहीं मिल जाता,
  </text>
  <text x="540" y="680" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="30" font-weight="700" fill="#38bdf8" text-anchor="middle">
    हमारा यह संघर्ष कभी नहीं रुकेगा।
  </text>

  <!-- Author Box -->
  <g transform="translate(540, 830)">
    <circle cx="-160" cy="0" r="45" fill="#f59e0b"/>
    <text x="-160" y="12" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="26" font-weight="900" fill="#001426" text-anchor="middle">VIP</text>
    <text x="-90" y="-8" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="start">श्री मुकेश सहनी</text>
    <text x="-90" y="28" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="20" font-weight="600" fill="#fbbf24" text-anchor="start">संस्थापक एवं राष्ट्रीय अध्यक्ष, वीआईपी</text>
  </g>

  <text x="540" y="990" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="700" fill="#64748b" text-anchor="middle">विकासशील इंसान पार्टी (VIP) - आधिकारिक सुविचार</text>
</svg>`);

// 10. Quote Ambedkar (1080x1080)
saveFile("quote-ambedkar-education.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="quote2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#quote2Grad)"/>
  <rect x="40" y="40" width="1000" height="1000" rx="30" fill="none" stroke="#818cf8" stroke-width="2"/>

  <text x="120" y="260" font-family="Georgia, serif" font-size="200" font-weight="900" fill="#818cf8" opacity="0.3">“</text>

  <g transform="translate(540, 140)">
    <rect x="-240" y="-30" width="480" height="60" rx="30" fill="#1e1b4b" stroke="#818cf8" stroke-width="2"/>
    <text x="0" y="10" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="900" fill="#c7d2fe" text-anchor="middle">★ प्रेरणादायी अमर विचार ★</text>
  </g>

  <text x="540" y="370" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle">
    "शिक्षा वह शेरनी का दूध है,
  </text>
  <text x="540" y="440" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="44" font-weight="900" fill="#fde047" text-anchor="middle">
    जो पिएगा वह दहाड़ेगा!"
  </text>

  <text x="540" y="560" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="500" fill="#cbd5e1" text-anchor="middle">
    शिक्षा ही समाज के पिछड़े और वंचित वर्गों
  </text>
  <text x="540" y="610" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="500" fill="#cbd5e1" text-anchor="middle">
    की मुक्ति और स्वाभिमान का एकमात्र अस्त्र है।
  </text>
  <text x="540" y="680" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="32" font-weight="800" fill="#818cf8" text-anchor="middle">
    शिक्षित बनो, संगठित रहो, संघर्ष करो।
  </text>

  <g transform="translate(540, 830)">
    <circle cx="-160" cy="0" r="45" fill="#4f46e5"/>
    <text x="-160" y="10" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">संविधान</text>
    <text x="-90" y="-8" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="30" font-weight="900" fill="#ffffff" text-anchor="start">बाबा साहेब डॉ. भीमराव अंबेडकर</text>
    <text x="-90" y="28" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="20" font-weight="600" fill="#a5b4fc" text-anchor="start">भारत रत्न व संविधान निर्माता</text>
  </g>

  <text x="540" y="990" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="700" fill="#64748b" text-anchor="middle">विकासशील इंसान पार्टी (VIP) - वैचारिक संकल्प</text>
</svg>`);

// 11. Quote Phoolan Devi (1080x1080)
saveFile("quote-phoolan-devi.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="quote3Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4c0519"/>
      <stop offset="50%" stop-color="#831843"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#quote3Grad)"/>
  <rect x="40" y="40" width="1000" height="1000" rx="30" fill="none" stroke="#f43f5e" stroke-width="2.5"/>

  <text x="120" y="260" font-family="Georgia, serif" font-size="200" font-weight="900" fill="#f43f5e" opacity="0.3">“</text>

  <g transform="translate(540, 140)">
    <rect x="-220" y="-30" width="440" height="60" rx="30" fill="#881337"/>
    <text x="0" y="10" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="900" fill="#fecdd3" text-anchor="middle">★ संघर्ष एवं स्वाभिमान ★</text>
  </g>

  <text x="540" y="370" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle">
    "हक और अधिकार मांगने से नहीं,
  </text>
  <text x="540" y="440" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="46" font-weight="900" fill="#fde047" text-anchor="middle">
    छीनने से मिलता है!"
  </text>

  <text x="540" y="560" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="500" fill="#fbcfe8" text-anchor="middle">
    अपने समाज के मान-सम्मान के लिए
  </text>
  <text x="540" y="610" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="500" fill="#fbcfe8" text-anchor="middle">
    कभी किसी जुल्म के आगे मत झुको।
  </text>
  <text x="540" y="680" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="32" font-weight="800" fill="#ffffff" text-anchor="middle">
    हिम्मत और संघर्ष ही सबसे बड़ी ताकत है।
  </text>

  <g transform="translate(540, 830)">
    <circle cx="-160" cy="0" r="45" fill="#be123c"/>
    <text x="-160" y="10" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">वीरांगना</text>
    <text x="-90" y="-8" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="start">वीरांगना फूलन देवी</text>
    <text x="-90" y="28" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="20" font-weight="600" fill="#fda4af" text-anchor="start">पूर्व सांसद एवं नारी स्वाभिमान की प्रतीक</text>
  </g>

  <text x="540" y="990" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="700" fill="#fda4af" text-anchor="middle">विकासशील इंसान पार्टी (VIP)</text>
</svg>`);

// 12. Quote Swabhimaan Sangharsh (1080x1080)
saveFile("quote-swabhimaan-sangharsh.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="quote4Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001426"/>
      <stop offset="50%" stop-color="#004b87"/>
      <stop offset="100%" stop-color="#001e38"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#quote4Grad)"/>
  <rect x="40" y="40" width="1000" height="1000" rx="30" fill="none" stroke="#38bdf8" stroke-width="2.5"/>

  <text x="120" y="260" font-family="Georgia, serif" font-size="200" font-weight="900" fill="#38bdf8" opacity="0.3">“</text>

  <g transform="translate(540, 140)">
    <rect x="-220" y="-30" width="440" height="60" rx="30" fill="#002b54" stroke="#f59e0b" stroke-width="2"/>
    <text x="0" y="10" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="900" fill="#fbbf24" text-anchor="middle">★ स्वाभिमान संकल्प ★</text>
  </g>

  <text x="540" y="370" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="46" font-weight="900" fill="#ffffff" text-anchor="middle">
    "स्वाभिमान के साथ
  </text>
  <text x="540" y="440" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="46" font-weight="900" fill="#fbbf24" text-anchor="middle">
    कोई समझौता नहीं होगा!"
  </text>

  <text x="540" y="560" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="500" fill="#cbd5e1" text-anchor="middle">
    बिहार के हर गरीब, मजदूर और निषाद भाई के
  </text>
  <text x="540" y="610" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="500" fill="#cbd5e1" text-anchor="middle">
    चेहरे पर मुस्कान और आत्मसम्मान लाना ही
  </text>
  <text x="540" y="680" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="32" font-weight="800" fill="#38bdf8" text-anchor="middle">
    विकासशील इंसान पार्टी का एकमात्र लक्ष्य है।
  </text>

  <g transform="translate(540, 830)">
    <circle cx="-160" cy="0" r="45" fill="#f59e0b"/>
    <text x="-160" y="12" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="26" font-weight="900" fill="#001426" text-anchor="middle">VIP</text>
    <text x="-90" y="-8" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="start">श्री मुकेश सहनी</text>
    <text x="-90" y="28" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="20" font-weight="600" fill="#fbbf24" text-anchor="start">'सन ऑफ मल्लाह', राष्ट्रीय अध्यक्ष</text>
  </g>

  <text x="540" y="990" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="700" fill="#94a3b8" text-anchor="middle">विकासशील इंसान पार्टी (VIP)</text>
</svg>`);

// 13. Mobile Wallpaper VIP Boat Dark (1080x1920)
saveFile("wallpaper-vip-boat-dark.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="wp1Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#000c18"/>
      <stop offset="35%" stop-color="#001e38"/>
      <stop offset="70%" stop-color="#003a6c"/>
      <stop offset="100%" stop-color="#000e1c"/>
    </linearGradient>
    <linearGradient id="wpGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <radialGradient id="radialGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1080" height="1920" fill="url(#wp1Grad)"/>
  <circle cx="540" cy="960" r="480" fill="url(#radialGlow)"/>

  <!-- Top Status Bar simulation / Clock Space -->
  <g transform="translate(540, 280)">
    <text x="0" y="0" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="110" font-weight="300" fill="#ffffff" text-anchor="middle" letter-spacing="4">09:41</text>
    <text x="0" y="60" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="500" fill="#93c5fd" text-anchor="middle">शुक्रवार, 16 अक्टूबर</text>
  </g>

  <!-- Central Emblem Boat -->
  <g transform="translate(540, 960)">
    <circle cx="0" cy="0" r="220" fill="#001e38" stroke="url(#wpGold)" stroke-width="6"/>
    <circle cx="0" cy="0" r="200" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 6"/>
    
    <!-- Water Waves -->
    <path d="M-150,75 Q-75,45 0,75 Q75,105 150,75" fill="none" stroke="#38bdf8" stroke-width="6"/>
    <!-- Boat Body -->
    <path d="M-120,30 C-70,90 70,90 120,30 C80,60 -80,60 -120,30 Z" fill="#fbbf24"/>
    <!-- Sail -->
    <line x1="-10" y1="30" x2="-10" y2="-90" stroke="#f8fafc" stroke-width="6"/>
    <path d="M-10,25 L-10,-80 L55,-10 Z" fill="#38bdf8"/>
    <polygon points="-10,-80 -55,-15 -10,-15" fill="#f8fafc" opacity="0.9"/>
  </g>

  <!-- Bottom Brand Text -->
  <text x="540" y="1420" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">VIP</text>
  <text x="540" y="1480" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="36" font-weight="800" fill="#fbbf24" text-anchor="middle">विकासशील इंसान पार्टी</text>
  <text x="540" y="1540" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="500" fill="#cbd5e1" text-anchor="middle">स्वाभिमान • समानता • समृद्धि</text>

  <!-- Bottom Home Indicator -->
  <rect x="440" y="1860" width="200" height="6" rx="3" fill="#ffffff" opacity="0.7"/>
</svg>`);

// 14. Wallpaper Mukesh Sahani (1080x1920)
saveFile("wallpaper-mukesh-sahani.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="wp2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001426"/>
      <stop offset="40%" stop-color="#002b54"/>
      <stop offset="80%" stop-color="#001830"/>
      <stop offset="100%" stop-color="#000a14"/>
    </linearGradient>
    <linearGradient id="gold5" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>

  <rect width="1080" height="1920" fill="url(#wp2Grad)"/>

  <!-- Clock Space -->
  <g transform="translate(540, 260)">
    <text x="0" y="0" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="100" font-weight="300" fill="#ffffff" text-anchor="middle">10:08</text>
    <text x="0" y="55" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="26" font-weight="500" fill="#93c5fd" text-anchor="middle">विकास की नई सुबह</text>
  </g>

  <!-- Leader Profile Shield -->
  <g transform="translate(540, 880)">
    <circle cx="0" cy="0" r="260" fill="#003a6c" stroke="url(#gold5)" stroke-width="6"/>
    <circle cx="0" cy="0" r="230" fill="#001a33"/>
    
    <!-- Torso -->
    <path d="M-150,220 C-150,140 -80,90 0,90 C80,90 150,140 150,220 Z" fill="#ffffff"/>
    <path d="M-110,220 L-60,110 L0,170 L60,110 L110,220 Z" fill="#004b87"/>
    <!-- Head -->
    <ellipse cx="0" cy="0" rx="90" ry="105" fill="#fbcfe8"/>
    <path d="M-90,-10 C-85,-90 -40,-120 0,-120 C40,-120 85,-90 90,-10 C70,-70 30,-90 0,-90 C-30,-90 -70,-70 -90,-10 Z" fill="#0f172a"/>
    <!-- Saffron Scarf -->
    <path d="M-130,220 C-90,160 -50,150 0,160 C50,150 90,160 130,220 L150,230 L-150,230 Z" fill="#f59e0b"/>
  </g>

  <g transform="translate(540, 1260)">
    <rect x="-180" y="-24" width="360" height="48" rx="24" fill="#f59e0b"/>
    <text x="0" y="8" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="900" fill="#001426" text-anchor="middle">सन ऑफ मल्लाह</text>
  </g>

  <text x="540" y="1400" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="54" font-weight="900" fill="#ffffff" text-anchor="middle">श्री मुकेश सहनी</text>
  <text x="540" y="1460" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="28" font-weight="700" fill="#fbbf24" text-anchor="middle">MUKESH SAHANI</text>

  <text x="540" y="1540" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="500" fill="#cbd5e1" text-anchor="middle">गरीबों और निषाद समाज की बुलंद आवाज</text>
  <text x="540" y="1600" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="22" font-weight="700" fill="#38bdf8" text-anchor="middle">VIP PARTY OFFICIAL 4K WALLPAPER</text>

  <rect x="440" y="1860" width="200" height="6" rx="3" fill="#ffffff" opacity="0.7"/>
</svg>`);

// 15. Wallpaper Bihar Sankalp (1080x1920)
saveFile("wallpaper-bihar-sankalp.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="wp3Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#021c38"/>
      <stop offset="50%" stop-color="#003566"/>
      <stop offset="100%" stop-color="#001426"/>
    </linearGradient>
  </defs>

  <rect width="1080" height="1920" fill="url(#wp3Grad)"/>

  <g transform="translate(540, 260)">
    <text x="0" y="0" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="100" font-weight="300" fill="#ffffff" text-anchor="middle">12:30</text>
    <text x="0" y="55" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="26" font-weight="500" fill="#fbbf24" text-anchor="middle">स्वाभिमानी बिहार संकल्प</text>
  </g>

  <!-- Central Map & Boat Illustration -->
  <g transform="translate(540, 880)">
    <circle cx="0" cy="0" r="240" fill="#002244" stroke="#f59e0b" stroke-width="4"/>
    <text x="0" y="-40" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="70" font-weight="900" fill="#ffffff" text-anchor="middle">बिहार</text>
    <text x="0" y="30" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="34" font-weight="700" fill="#38bdf8" text-anchor="middle">नव-निर्माण</text>
    <!-- Boat -->
    <path d="M-80,90 C-40,130 40,130 80,90 Z" fill="#f59e0b"/>
  </g>

  <text x="540" y="1320" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle">स्वाभिमानी बिहार</text>
  <text x="540" y="1390" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="36" font-weight="800" fill="#fbbf24" text-anchor="middle">समान अधिकार, सम्पूर्ण विकास</text>
  <text x="540" y="1460" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="24" font-weight="500" fill="#cbd5e1" text-anchor="middle">हर हाथ को काम, हर वर्ग को सम्मान</text>

  <text x="540" y="1600" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="24" font-weight="800" fill="#38bdf8" text-anchor="middle">VIKASSHEEL INSAAN PARTY</text>

  <rect x="440" y="1860" width="200" height="6" rx="3" fill="#ffffff" opacity="0.7"/>
</svg>`);

// 16. Wallpaper Jubba Sahani (1080x1920)
saveFile("wallpaper-jubba-sahani.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="wp4Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>

  <rect width="1080" height="1920" fill="url(#wp4Grad)"/>

  <g transform="translate(540, 260)">
    <text x="0" y="0" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="100" font-weight="300" fill="#ffffff" text-anchor="middle">06:00</text>
    <text x="0" y="55" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="26" font-weight="500" fill="#fde047" text-anchor="middle">अमर क्रांतिकारी स्मरण</text>
  </g>

  <!-- Central Shield -->
  <g transform="translate(540, 880)">
    <circle cx="0" cy="0" r="240" fill="#312e81" stroke="#f59e0b" stroke-width="5"/>
    <circle cx="0" cy="-30" r="90" fill="#fed7aa"/>
    <path d="M-130,180 C-130,110 -70,80 0,80 C70,80 130,110 130,180 Z" fill="#ffffff"/>
  </g>

  <g transform="translate(540, 1260)">
    <rect x="-180" y="-24" width="360" height="48" rx="24" fill="#dc2626"/>
    <text x="0" y="8" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">अमर बलिदानी</text>
  </g>

  <text x="540" y="1400" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle">अमर शहीद जुब्बा सहनी</text>
  <text x="540" y="1470" font-family="'Noto Sans Devanagari', Arial, sans-serif" font-size="28" font-weight="600" fill="#cbd5e1" text-anchor="middle">"देश और समाज के लिए बलिदान अमर है"</text>

  <text x="540" y="1580" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="22" font-weight="800" fill="#fbbf24" text-anchor="middle">VIP PARTY HEROIC TRIBUTE WALLPAPER</text>

  <rect x="440" y="1860" width="200" height="6" rx="3" fill="#ffffff" opacity="0.7"/>
</svg>`);

console.log("✅ All 16 Download graphics successfully created in both public directories!");
