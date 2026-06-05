import { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

export default function LoadingAnimation({ 
  onComplete, 
  isAppReady 
}: { 
  onComplete: () => void;
  isAppReady: boolean;
}) {
  const boxControls = useAnimation();
  const makhanaControls = useAnimation();
  const [isBlasting, setIsBlasting] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    let mounted = true;
    const runSequence = async () => {
      // 1. Box enters from bottom
      await boxControls.start({ 
        y: "35vh", 
        opacity: 1, 
        scale: 1, 
        transition: { type: 'spring', stiffness: 50, damping: 15, mass: 1 } 
      });
      
      if (!mounted) return;
      
      // 2. Box recoil (quick push down to prepare for firing)
      await boxControls.start({ 
        y: "42vh", 
        scale: 0.95, 
        transition: { duration: 0.25, ease: 'easeOut' } 
      });
      
      if (!mounted) return;

      // 3. Fire: Box bounces back slightly then drops, Makhana shoots up
      boxControls.start({ 
        y: "100vh", 
        opacity: 0, 
        transition: { duration: 0.8, ease: 'easeIn', delay: 0.1 } 
      });
      
      makhanaControls.start({ 
        y: "0vh", 
        scale: 1, 
        opacity: 1,
        transition: { type: "spring", stiffness: 60, damping: 12, mass: 1 } 
      });

      // Initial fast spin as it shoots up
      await makhanaControls.start({
        rotate: 720,
        transition: { duration: 0.6, ease: "easeOut" }
      });
      
      if (!mounted) return;
      
      // Continuous slow spin
      setIsSpinning(true);
      makhanaControls.start({
        rotate: [720, 1080],
        transition: { duration: 3, ease: "linear", repeat: Infinity }
      });
    };
    
    runSequence();

    return () => { mounted = false; };
  }, [boxControls, makhanaControls]);

  useEffect(() => {
    let active = true;
    if (isAppReady && isSpinning) {
      const triggerEndingSequence = async () => {
        // Accelerate spin before bursting
        await makhanaControls.start({
          rotate: 2160, // Spin fast towards a high absolute rotation
          scale: 1.1, // Slight pulse
          transition: { duration: 0.6, ease: "easeIn" }
        });
        
        if (!active) return;
        
        setIsBlasting(true);
        // Makhana blast effect
        makhanaControls.start({
          scale: 5,
          opacity: 0,
          transition: { duration: 0.4, ease: "easeIn" }
        });
        
        // Let the blast animation play before calling onComplete
        setTimeout(() => {
          if (active) onComplete();
        }, 400);
      };
      
      triggerEndingSequence();
    }
    return () => { active = false; };
  }, [isAppReady, isSpinning, makhanaControls, onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden pointer-events-none"
      animate={{ backgroundColor: isBlasting ? "rgba(255,255,255,0)" : "rgba(255,255,255,1)" }} // match app background
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        
        {/* Makhana */}
        <motion.img 
          src="/clean_makhana_transparent.png" 
          alt="Makhana"
          className="absolute w-20 h-20 md:w-28 md:h-28 object-contain z-10"
          initial={{ y: "40vh", scale: 0, opacity: 0 }}
          animate={makhanaControls}
        />

        {/* Blast Particles */}
        <AnimatePresence>
          {isBlasting && (
            <>
              {[...Array(24)].map((_, i) => {
                const angle = (i * 15 * Math.PI) / 180;
                // Scatter in all directions
                const distance = window.innerWidth > 768 ? 800 : 400;
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;
                
                return (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 md:w-5 md:h-5 rounded-full z-20 shadow-lg"
                    style={{ backgroundColor: i % 2 === 0 ? '#e25d24' : '#facc15' }} // Orange and yellow particles
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{ 
                      x: tx, 
                      y: ty, 
                      scale: 0, 
                      opacity: 0 
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* Box */}
        <motion.img 
          src="/barbeque_box_transparent.png" 
          alt="Box"
          className="absolute w-64 md:w-96 h-auto object-contain z-20 drop-shadow-2xl"
          initial={{ y: "80vh", opacity: 0, scale: 0.8 }}
          animate={boxControls}
        />
        
      </div>
    </motion.div>
  );
}
