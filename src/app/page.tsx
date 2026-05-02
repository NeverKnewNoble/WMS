import Hero from "../components/ui_components/home/hero";
import Features from "../components/ui_components/home/features";
import Footer from "../components/ui_components/home/footer";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-zinc-950 font-sans">
      <Hero />
      <Features />
      <Footer />
    </main>
  );
}
