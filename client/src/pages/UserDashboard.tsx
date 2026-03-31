import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import AboutSection from '@/components/AboutSection';
import BiharFarms from '@/components/BiharFarms';
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
import GallerySection from '@/components/GallerySection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

export default function UserDashboard() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <AboutSection />
        <BiharFarms />
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
        <GallerySection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}