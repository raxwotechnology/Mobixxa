import HeroSection from '@/components/HeroSection';
import FeatureCards from '@/components/FeatureCards';
import FeaturedSection from '@/components/FeaturedSection';
import CustomerReviews from '@/components/CustomerReviews';

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeatureCards />
      <FeaturedSection />
      <CustomerReviews />
    </>
  );
}
