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

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
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
    </div>
  );
}
