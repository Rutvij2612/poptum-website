import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { motion, AnimatePresence } from 'framer-motion';

import barbequeJpeg from '@assets/generated_images/barbeque.jpeg';
import creamOnionJpeg from '@assets/generated_images/cream_n_onion.jpeg';
import periPeriJpeg from '@assets/generated_images/peri_peri.jpeg';
import saltPepperJpeg from '@assets/generated_images/salt_n_pepper.jpeg';

type Particle = {
  id: number;
  origin: 'left' | 'right';
  startX: string;
  startY: string;
  x: string;
  y: string;
  scale: number;
  rotate: number;
  duration: number;
  delay: number;
};

export default function Hero() {
  const { t } = useLanguage();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    let particleId = 0;
    const interval = setInterval(() => {
      const isMobile = window.innerWidth < 768;
      
      const startX = isMobile ? '2vw' : '22vw';
      const startY = isMobile ? '22vh' : '35vh';

      const moveX = isMobile ? (Math.random() * 8 + 8) : (Math.random() * 20 + 20);
      const moveY = isMobile ? (Math.random() * 15 + 15) : (Math.random() * 35 + 25);

      // Left packet pop
      const leftP: Particle = {
        id: particleId++,
        origin: 'left',
        startX,
        startY,
        x: `${moveX}vw`,
        y: `-${moveY}vh`,
        scale: Math.random() * 0.5 + 0.8,
        rotate: Math.random() * 360,
        duration: Math.random() * 1.5 + 2.5,
        delay: Math.random() * 0.5,
      };

      // Right packet pop
      const rightP: Particle = {
        id: particleId++,
        origin: 'right',
        startX,
        startY,
        x: `-${moveX}vw`,
        y: `-${moveY}vh`,
        scale: Math.random() * 0.5 + 0.8,
        rotate: Math.random() * 360,
        duration: Math.random() * 1.5 + 2.5,
        delay: Math.random() * 0.5,
      };

      setParticles((prev) => [...prev, leftP, rightP]);

      // GC
      setTimeout(() => {
        setParticles((prev) => prev.filter(p => p.id !== leftP.id && p.id !== rightP.id));
      }, 5000);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const scrollToFlavours = () => {
    const element = document.querySelector('#flavours');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const downloadCatalogue = () => {
    window.open('/api/catalogue', '_blank');
  };

  return (
    <section
      id="home"
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-white"
      data-testid="hero-section"
    >
      {/* Soft abstract background shapes */}
      <motion.div
        className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full"
        style={{ background: '#FDF3E5', opacity: 0.6, filter: 'blur(40px)' }}
        initial={{ y: -10 }}
        animate={{ y: [ -10, 10 ] }}
        transition={{ duration: 18, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute right-[-6rem] top-32 h-80 w-80 rounded-full"
        style={{ background: '#FFE9D6', opacity: 0.5, filter: 'blur(50px)' }}
        initial={{ y: 8 }}
        animate={{ y: [ 8, -8 ] }}
        transition={{ duration: 22, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-6rem] h-72 w-72 rounded-full"
        style={{ background: '#FFF4EC', opacity: 0.7, filter: 'blur(45px)' }}
        initial={{ y: 0 }}
        animate={{ y: [ 0, -12 ] }}
        transition={{ duration: 26, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: 0.5 }}
      />

      {/* Particles Container */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        <AnimatePresence>
          {particles.map((p) => {
            const isLeft = p.origin === 'left';
            return (
              <motion.div
                key={p.id}
                className="absolute"
                style={{
                  left: isLeft ? p.startX : 'auto',
                  right: !isLeft ? p.startX : 'auto',
                  bottom: p.startY,
                  width: '32px',
                  height: '32px',
                  borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                  background: 'radial-gradient(circle at 30% 30%, #fffdfa 0%, #f4ebd8 60%, #e3d2b3 100%)',
                  boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.1), 2px 4px 8px rgba(0,0,0,0.15)',
                  transformOrigin: 'center center',
                }}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.2, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: p.x,
                  y: p.y,
                  scale: p.scale,
                  rotate: p.rotate,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: "easeOut",
                  times: [0, 0.1, 0.7, 1]
                }}
              >
                {/* Makhana eye/dot */}
                <div className="absolute top-[20%] left-[30%] w-1.5 h-1.5 bg-[#8b6b4d] rounded-full opacity-60" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Left Packets Cluster */}
      <div 
        className="absolute -bottom-4 md:-bottom-24 -left-32 md:-left-24 pointer-events-none w-max"
      >
        <motion.img
          src={creamOnionJpeg}
          alt="Cream and Onion"
          className="hidden md:block md:w-[22rem] md:h-[30rem] object-contain absolute bottom-0 left-0"
          style={{ mixBlendMode: 'multiply', transformOrigin: 'bottom left' }}
          initial={{ rotate: 5, y: 50, opacity: 0 }}
          animate={{ rotate: 8, y: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <motion.img
          src={barbequeJpeg}
          alt="Barbeque"
          className="w-48 h-64 md:w-[26rem] md:h-[35rem] object-contain relative"
          style={{ mixBlendMode: 'multiply', transformOrigin: 'bottom left' }}
          initial={{ rotate: 15, x: 20, y: 60, opacity: 0 }}
          animate={{ rotate: 22, x: 50, y: 10, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />
      </div>

      {/* Right Packets Cluster */}
      <div 
        className="absolute -bottom-4 md:-bottom-24 -right-32 md:-right-24 pointer-events-none flex justify-end items-end w-max"
      >
        <motion.img
          src={saltPepperJpeg}
          alt="Salt & Pepper"
          className="hidden md:block md:w-[22rem] md:h-[30rem] object-contain absolute bottom-0 right-0"
          style={{ mixBlendMode: 'multiply', transformOrigin: 'bottom right' }}
          initial={{ rotate: -5, y: 50, opacity: 0 }}
          animate={{ rotate: -8, y: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <motion.img
          src={periPeriJpeg}
          alt="Peri Peri"
          className="w-48 h-64 md:w-[26rem] md:h-[35rem] object-contain relative"
          style={{ mixBlendMode: 'multiply', transformOrigin: 'bottom right' }}
          initial={{ rotate: -15, x: -20, y: 60, opacity: 0 }}
          animate={{ rotate: -22, x: -50, y: 10, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />
      </div>

      <div className="relative z-40 max-w-4xl mx-auto px-4 text-center mt-[-8vh]">
        <div className="mb-8 flex justify-center drop-shadow-md">
          <img
            src="/poptum_logo.png"
            alt="Poptum"
            className="h-24 sm:h-32 lg:h-40 object-contain animate-fade-in-down drop-shadow-lg"
          />
        </div>

        <div className="mb-8 max-w-3xl mx-auto animate-fade-in space-y-1.5 drop-shadow-sm">
          <p
            className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground relative z-10 bg-white/40 inline-block px-3 py-1 rounded-full backdrop-blur-[2px]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t.hero.headingLine1}
          </p>
          <br/>
          <p className="text-base sm:text-lg text-foreground bg-white/60 inline-block px-4 py-1.5 rounded-full backdrop-blur-[4px] mt-2 shadow-sm border border-white/40">
            {t.hero.headingLine2}
          </p>
          <br/>
          {t.hero.headingLine3 && (
            <p className="text-sm sm:text-base text-muted-foreground/90 bg-white/40 inline-block px-3 py-1 rounded-full backdrop-blur-[2px] mt-2">
              {t.hero.headingLine3}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-scale-in">
          <Button
            size="lg"
            onClick={scrollToFlavours}
            className="min-w-[200px] bg-primary text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md"
            data-testid="button-explore-flavours"
          >
            {t.hero.exploreFlavours}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={downloadCatalogue}
            className="min-w-[200px] bg-white/70 backdrop-blur-md text-foreground border-border hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-sm"
            data-testid="button-download-catalogue"
          >
            {t.hero.downloadCatalogue}
          </Button>
        </div>
      </div>

      <button
        onClick={scrollToFlavours}
        className="group absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-foreground/50 z-40"
        data-testid="scroll-indicator"
      >
        <span className="text-[11px] tracking-[0.25em] uppercase group-hover:text-foreground/70 transition-colors font-medium">
          Scroll
        </span>
        <div className="h-9 w-px bg-foreground/20 overflow-hidden">
          <div className="h-full w-full bg-foreground/60 animate-bounce" />
        </div>
        <ChevronDown className="h-4 w-4 group-hover:text-foreground/70 transition-colors" />
      </button>
    </section>
  );
}
