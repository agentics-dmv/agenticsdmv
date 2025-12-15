import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Focus from "@/components/Focus";
import Community from "@/components/Community";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <About />
        <Focus />
        <Community />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
