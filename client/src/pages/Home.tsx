import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import AboutSection from '@/components/AboutSection';
// Bihar farms section kept in codebase but not rendered for now
// import BiharFarms from '@/components/BiharFarms';
import FlavoursSection from '@/components/FlavoursSection';
import ProcessTimeline from '@/components/ProcessTimeline';
import BenefitsSection from '@/components/BenefitsSection';
import NutritionSection from '@/components/NutritionSection';
import ProductsSection from '@/components/ProductsSection';
import StatsSection from '@/components/StatsSection';
import Recognition from '@/components/Recognition';
import CulturalSection from '@/components/CulturalSection';
import Interactive from '@/components/Interactive';
import PresenceSection from '@/components/PresenceSection';
// Gallery section kept in codebase but not rendered for now
// import GallerySection from '@/components/GallerySection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import LoadingAnimation from '@/components/LoadingAnimation';

export default function Home() {
  const [showLoading, setShowLoading] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const preloadCriticalAssets = async () => {
      try {
        // Here we simulate checking critical assets loading.
        // In a real scenario, you can preload critical images like:
        // const img = new Image(); img.src = "..."; await img.decode();
        
        // Simulating the loading of critical data/assets (e.g., Hero image, fonts)
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        
        if (isMounted) {
          setIsAppReady(true);
        }
      } catch (error) {
        if (isMounted) setIsAppReady(true); // Fallback on error
      }
    };

    // Ensure we don't wait forever
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setIsAppReady(true);
    }, 3500);

    // Start preloading immediately as the background renders
    preloadCriticalAssets();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Scroll to section on load/reveal if there's a hash in the URL
  useEffect(() => {
    if (!showLoading && window.location.hash) {
      const hash = window.location.hash;
      const timer = setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200); // 200ms ensures DOM has settled
      return () => clearTimeout(timer);
    }
  }, [showLoading]);

  return (
    <>
      <AnimatePresence>
        {showLoading && (
          <LoadingAnimation 
            isAppReady={isAppReady} 
            onComplete={() => setShowLoading(false)} 
          />
        )}
      </AnimatePresence>

      <motion.div
        className="min-h-screen bg-white"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={!showLoading ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ 
          pointerEvents: showLoading ? "none" : "auto", 
          height: showLoading ? "100vh" : "auto", 
          overflow: showLoading ? "hidden" : "auto" 
        }}
      >
        <Navbar />
        <main>
          <Hero />
          <AboutSection />
          {/* Bihar farms section temporarily hidden */}
          {/* <BiharFarms /> */}
          <FlavoursSection />
          <ProductsSection />
          <ProcessTimeline />
          <BenefitsSection />
          <NutritionSection />
          <StatsSection />
          <Recognition />
          <CulturalSection />
          <Interactive />
          <PresenceSection />
          {/* Gallery section temporarily hidden */}
          {/* <GallerySection /> */}
          <ContactSection />
        </main>
        <Footer />
      </motion.div>
    </>
  );
}
