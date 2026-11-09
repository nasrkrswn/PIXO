"use client";

import { useState } from "react";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { CartDrawer } from "@/components/storefront/cart-drawer";

export function StorefrontExperience({ children }: { children: React.ReactNode }) {
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);

  function enterStore() {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => setEntered(true), 650);
  }

  if (!entered) {
    return (
      <main
        className={`intro-screen intro-minimal${leaving ? " intro-leaving" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="اضغط للدخول إلى متجر PIXO"
        onClick={enterStore}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            enterStore();
          }
        }}
      >
        <div className="intro-logo-wrap">
          <h1 className="intro-logo" aria-label="PIXO" data-text="PIXO">PIXO</h1>
        </div>
      </main>
    );
  }

  return <><StorefrontHeader />{children}<CartDrawer /></>;
}
