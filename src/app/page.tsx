"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ContentLibrarySection } from "@/components/landing/ContentLibrarySection";
import { CreatorSection } from "@/components/landing/CreatorSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { Footer } from "@/components/landing/Footer";
import { SearchModal } from "@/components/landing/SearchModal";
import { AuthModal } from "@/components/landing/AuthModal";
import { FEATURED_VIDEO_ID } from "@/lib/constants";

export default function LandingPage() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode:
      | "signin"
      | "signup"
      | "verify"
      | "forgot"
      | "reset";
    token?: string;
    email?: string;
  }>({
    isOpen: false,
    mode: "signin",
  });
  const [openedViaParam, setOpenedViaParam] = useState(false);

  // Deep-link support: /?auth=signin|signup|verify|forgot|reset opens the central
  // auth flow. Guards route logged-out users here to reach that single flow.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    const token = params.get("token") ?? undefined;
    const email = params.get("email") ?? undefined;
    if (auth === "signin" || auth === "signup" || auth === "verify" || auth === "forgot" || auth === "reset") {
      setAuthModal({ isOpen: true, mode: auth, token, email });
      setOpenedViaParam(true);
    }
    // Legacy deep-link support: /?watch=<videoId> from old shared links now
    // redirects to the dedicated /watch/<videoId> page.
    const watch = params.get("watch");
    if (watch) {
      router.replace(`/watch/${watch}`);
    }
    // Only interpret the incoming URL once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAuth = (mode: "signin" | "signup") => {
    setOpenedViaParam(false);
    setAuthModal({ isOpen: true, mode });
  };

  const handleCloseAuth = () => {
    const wasParam = openedViaParam;
    setAuthModal((prev) => ({ ...prev, isOpen: false }));
    // Clear deep-link params (without navigating) so a refresh does not re-open
    // the modal and the subsequent role redirect stays race-free.
    if (wasParam && typeof window !== "undefined") {
      window.history.replaceState(null, "", "/");
    }
  };

  const handleStartWatching = () => {
    // Open the dedicated watch page for the verified PUBLISHED + READY video.
    router.push(`/watch/${FEATURED_VIDEO_ID}`);
  };

  const handleExploreContent = () => {
    const el = document.getElementById("content-library");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBrowseAll = () => {
    setIsSearchOpen(true);
  };

  const handleLaunchCreatorStudio = () => {
    handleOpenAuth("signup");
  };

  const handleContactSupport = () => {
    window.location.href = "mailto:support@evostream.tv?subject=Support%20Inquiry%20-%20EVO%20Platform";
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation Header */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <main className="flex-grow">
        {/* Section 1: Hero + Navbar + Floating Stats (Screenshot 1) */}
        <HeroSection
          onStartWatching={handleStartWatching}
          onExplore={handleExploreContent}
        />

        {/* Section 2: Platform Features (Screenshot 2) */}
        <FeaturesSection />

        {/* Section 3: Content Library (Screenshot 3) */}
        <ContentLibrarySection
          onSelectVideo={(id) => router.push(`/watch/${id}`)}
          onBrowseAll={handleBrowseAll}
        />

        {/* Section 4: For Content Creators (Screenshot 4) */}
        <CreatorSection onLaunchCreatorStudio={handleLaunchCreatorStudio} />

        {/* Section 5: Frequently Asked Questions (Screenshot 5) */}
        <FaqSection onContactSupport={handleContactSupport} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(id) => router.push(`/watch/${id}`)}
      />

      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        initialToken={authModal.token}
        initialEmail={authModal.email}
        onClose={handleCloseAuth}
      />
    </div>
  );
}
