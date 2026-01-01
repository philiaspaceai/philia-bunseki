import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Batas Tanggal: 5 Januari 2026 (Malam tanggal 5 selesai, tanggal 6 sudah tidak muncul)
const END_DATE = new Date(2026, 0, 6); 
const STORAGE_KEY = 'jimaku_daikangei_v7_last_seen';

export const Daikangei: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showText, setShowText] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  
  useEffect(() => {
    const checkVisibility = () => {
      const now = new Date();
      
      // DEBUG LOGS
      console.log("--- DEBUG DAIKANGEI ---");
      console.log("Device Time:", now.toString());
      console.log("Cutoff Date:", END_DATE.toString());

      // 1. Cek Tanggal (Expired setelah 5 Jan 2026)
      if (now >= END_DATE) {
        console.log("Animation skipped: Date expired.");
        return;
      }

      // 2. Cek LocalStorage (Hanya 1x Sehari)
      const lastSeen = localStorage.getItem(STORAGE_KEY);
      const todayStr = now.toDateString();
      
      // LOGIC DIAKTIFKAN: Jika hari ini sudah lihat, jangan munculkan lagi
      if (lastSeen === todayStr) {
          console.log("Animation skipped: Already seen today.");
          return; 
      }

      // Reset state & show
      console.log("Starting animation...");
      setVisible(true);
      localStorage.setItem(STORAGE_KEY, todayStr);

      // Timeline Animasi (Total ~8 Detik)
      const t1 = setTimeout(() => setShowText(true), 3000); // Teks muncul di detik ke-3
      const t2 = setTimeout(() => setFadingOut(true), 7000); // Mulai fade out di detik ke-7
      const t3 = setTimeout(() => setVisible(false), 8000); // Hapus DOM di detik ke-8

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    };

    checkVisibility();
  }, []);

  if (!visible) return null;

  // Menggunakan createPortal ke document.body agar benar-benar melayang di atas segalanya (seperti Modal)
  return createPortal(
    <div 
      className={`fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none overflow-hidden transition-opacity duration-1000 ease-out bg-black/90 backdrop-blur-sm ${fadingOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ perspective: '1200px' }}
    >
      <style>{`
        @keyframes firework-pop {
          0% { transform: scale(0); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes float-text {
          0% { transform: scale(0.8) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        
        /* ANIMASI SILAU BERGERAK (SHIMMER) */
        @keyframes shimmer-move {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        /* ANIMASI GLOWING BERDENYUT & BERUBAH WARNA */
        @keyframes glow-pulse-rgb {
          0% { 
            filter: drop-shadow(0 0 10px rgba(234, 179, 8, 0.7)) drop-shadow(0 0 20px rgba(234, 88, 12, 0.4));
          }
          33% {
             filter: drop-shadow(0 0 15px rgba(250, 204, 21, 0.9)) drop-shadow(0 0 40px rgba(253, 224, 71, 0.6));
          }
          66% {
             filter: drop-shadow(0 0 15px rgba(244, 114, 182, 0.8)) drop-shadow(0 0 40px rgba(236, 72, 153, 0.6));
          }
          100% { 
            filter: drop-shadow(0 0 10px rgba(234, 179, 8, 0.7)) drop-shadow(0 0 20px rgba(234, 88, 12, 0.4));
          }
        }

        /* ANIMASI BADGE BORDER PULSE */
        @keyframes badge-pulse-border {
           0%, 100% { border-color: rgba(251, 191, 36, 0.3); box-shadow: 0 0 10px rgba(251, 191, 36, 0.1); }
           50% { border-color: rgba(251, 191, 36, 0.8); box-shadow: 0 0 20px rgba(251, 191, 36, 0.4); }
        }

        .firework-burst {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: firework-pop 1.2s ease-out forwards;
        }

        /* PREMIUM TEXT CLASS */
        .text-shimmer-glow {
          /* Gradient Emas ke Putih ke Emas */
          background: linear-gradient(
            to right,
            #fbbf24 10%, 
            #d97706 30%, 
            #ffffff 50%, /* Bagian Putih Silau */
            #d97706 70%, 
            #fbbf24 90%
          );
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;

          /* Gabungan Animasi: Gerakan Silau (3s) + Denyut Glow (4s) */
          animation: 
            shimmer-move 3s linear infinite,
            glow-pulse-rgb 4s ease-in-out infinite;
        }
      `}</style>

      {/* --- FIREWORKS (3D Petasan - LEBIH BANYAK!) --- */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
         {/* Gelombang 1 - Awal */}
         <Firework x="20%" y="30%" color="#ef4444" delay="0ms" />
         <Firework x="80%" y="20%" color="#eab308" delay="200ms" />
         <Firework x="50%" y="40%" color="#22c55e" delay="100ms" />
         <Firework x="10%" y="50%" color="#ec4899" delay="300ms" />
         <Firework x="90%" y="60%" color="#3b82f6" delay="150ms" />

         {/* Gelombang 2 - Tengah */}
         <Firework x="30%" y="70%" color="#06b6d4" delay="800ms" />
         <Firework x="70%" y="60%" color="#d946ef" delay="1000ms" />
         <Firework x="15%" y="60%" color="#f97316" delay="1200ms" />
         <Firework x="85%" y="50%" color="#8b5cf6" delay="1500ms" />
         <Firework x="50%" y="20%" color="#ec4899" delay="1800ms" />
         <Firework x="25%" y="25%" color="#fde047" delay="1600ms" />
         <Firework x="75%" y="75%" color="#a855f7" delay="1700ms" />

         {/* Gelombang 3 - Puncak (Saat teks muncul) */}
         <Firework x="40%" y="50%" color="#fde047" delay="2200ms" />
         <Firework x="60%" y="30%" color="#3b82f6" delay="2500ms" />
         <Firework x="5%" y="80%" color="#ef4444" delay="2800ms" />
         <Firework x="95%" y="15%" color="#22c55e" delay="2900ms" />
         <Firework x="50%" y="10%" color="#fbbf24" delay="3000ms" />
         <Firework x="20%" y="80%" color="#f472b6" delay="3100ms" />
         <Firework x="80%" y="80%" color="#22d3ee" delay="3200ms" />

         {/* Gelombang 4 - Akhir */}
         <Firework x="35%" y="35%" color="#fb923c" delay="3500ms" />
         <Firework x="65%" y="65%" color="#a3e635" delay="3600ms" />
         <Firework x="10%" y="10%" color="#e879f9" delay="3800ms" />
         <Firework x="90%" y="90%" color="#60a5fa" delay="4000ms" />
         <Firework x="50%" y="90%" color="#ef4444" delay="4200ms" />
         <Firework x="50%" y="50%" color="#ffffff" delay="4500ms" />
      </div>

      {/* --- CONFETTI --- */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {Array.from({ length: 120 }).map((_, i) => (
          <div 
            key={i}
            className="absolute w-3 h-3 rounded-sm shadow-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-30px',
              backgroundColor: ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ec4899', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 7)],
              animation: `confetti-fall ${2.5 + Math.random() * 2.5}s linear infinite`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: 0.9
            }}
          />
        ))}
      </div>

      {/* --- TEXT MESSAGE --- */}
      {showText && (
        <div className="relative z-50 text-center px-4 w-full" style={{ animation: 'float-text 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
          {/* Main Title - Premium Shimmer & Glow */}
          <h1 
            className="text-6xl md:text-9xl font-black mb-6 leading-tight tracking-tight flex flex-col items-center gap-2 text-shimmer-glow"
            style={{ 
                fontFamily: "'Noto Sans JP', sans-serif"
            }}
          >
            <span>あけまして</span>
            <span>おめでとう！</span>
          </h1>
          
          {/* Subtitle - Strong White with Outer Glow */}
          <h2 
            className="text-3xl md:text-6xl font-black mb-8 text-white tracking-wide"
            style={{ 
                fontFamily: "'Noto Sans JP', sans-serif",
                textShadow: '0 0 15px rgba(255,255,255,0.8), 0 0 30px rgba(59, 130, 246, 0.6)'
            }}
          >
            今年よろしくね！
          </h2>
          
          {/* Footer - Badge Style with Glowing Text */}
          <div className="mt-10 flex justify-center">
            <div 
                className="px-6 py-2 rounded-full bg-black/40 backdrop-blur-md border transition-all duration-300"
                style={{ animation: 'badge-pulse-border 3s infinite ease-in-out' }}
            >
                <span 
                    className="text-lg md:text-xl font-black text-shimmer-glow tracking-widest"
                    style={{ 
                        fontFamily: "'Noto Sans JP', sans-serif"
                    }}
                >
                    ここに来てくれてありがとう！
                </span>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

// Helper Component for Firework
const Firework = ({ x, y, color, delay }: { x: string, y: string, color: string, delay: string }) => {
  // Complex shadow for particle explosion effect
  const particleShadows = `
    0 -60px 0 -1px ${color}, 
    42px -42px 0 -1px ${color}, 
    60px 0 0 -1px ${color}, 
    42px 42px 0 -1px ${color}, 
    0 60px 0 -1px ${color}, 
    -42px 42px 0 -1px ${color}, 
    -60px 0 0 -1px ${color}, 
    -42px -42px 0 -1px ${color},
    
    0 -110px 0 -2px ${color}, 
    78px -78px 0 -2px ${color}, 
    110px 0 0 -2px ${color}, 
    78px 78px 0 -2px ${color}, 
    0 110px 0 -2px ${color}, 
    -78px 78px 0 -2px ${color}, 
    -110px 0 0 -2px ${color}, 
    -78px -78px 0 -2px ${color}, 
    -110px 0 0 -2px ${color}, 
    -78px -78px 0 -2px ${color}
  `;

  return (
    <div 
      className="absolute" 
      style={{ left: x, top: y }}
    >
      <div 
        className="firework-burst"
        style={{ 
           animationDelay: delay,
           backgroundColor: color,
           boxShadow: particleShadows
        }}
      />
    </div>
  );
};