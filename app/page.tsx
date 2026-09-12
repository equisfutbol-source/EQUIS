import { SplashIntro } from "@/components/landing/SplashIntro";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { EditorialHero } from "@/components/landing/EditorialHero";

export default function HomePage() {
  return (
    <SplashIntro>
      <HeaderNav />
      <main>
        <EditorialHero />
      </main>
    </SplashIntro>
  );
}
