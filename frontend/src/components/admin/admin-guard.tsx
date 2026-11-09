"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { adminUser, loading } = useAuth();
  if (loading) return <main className="admin-gate"><LoaderCircle className="spin" size={25} /><span>&#x62C;&#x627;&#x631;&#x64D; &#x627;&#x644;&#x62A;&#x62D;&#x642;&#x642; &#x645;&#x646; &#x62C;&#x644;&#x633;&#x629; &#x627;&#x644;&#x623;&#x62F;&#x645;&#x646;...</span></main>;
  if (!adminUser) return <AdminLogin />;
  return children;
}

function AdminLogin() {
  const { loginAdmin, error, clearError } = useAuth();
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try { await loginAdmin(String(form.get("email") ?? ""), String(form.get("password") ?? "")); }
    catch { /* The auth provider supplies the visible error. */ }
    finally { setBusy(false); }
  }

  return <main className="admin-gate admin-login-gate"><section className="admin-login-card">
    <span className="gate-icon"><ShieldCheck size={25} /></span>
    <span className="eyebrow">PIXO ADMIN</span>
    <h1>&#x62F;&#x62E;&#x648;&#x644; &#x645;&#x62F;&#x64A;&#x631; &#x627;&#x644;&#x645;&#x62A;&#x62C;&#x631;</h1>
    <p>&#x647;&#x630;&#x647; &#x645;&#x633;&#x627;&#x62D;&#x629; &#x625;&#x62F;&#x627;&#x631;&#x64A;&#x629; &#x645;&#x646;&#x641;&#x635;&#x644;&#x629; &#x639;&#x646; &#x62D;&#x633;&#x627;&#x628;&#x627;&#x62A; &#x627;&#x644;&#x639;&#x645;&#x644;&#x627;&#x621;.</p>
    <form className="admin-login-form" onSubmit={submit} onChange={clearError}>
      <label className="field-label">&#x628;&#x631;&#x64A;&#x62F; &#x627;&#x644;&#x623;&#x62F;&#x645;&#x646;<input name="email" type="email" defaultValue="admin@pixo.local" autoComplete="username" required dir="ltr" /></label>
      <label className="field-label">&#x643;&#x644;&#x645;&#x629; &#x627;&#x644;&#x645;&#x631;&#x648;&#x631;<input name="password" type="password" required autoComplete="current-password" dir="ltr" placeholder="&#x623;&#x62F;&#x62E;&#x644; &#x623;&#x64A; &#x642;&#x64A;&#x645;&#x629; &#x644;&#x644;&#x648;&#x636;&#x639; &#x627;&#x644;&#x62A;&#x62C;&#x631;&#x64A;&#x628;&#x64A;" /></label>
      {error && <p className="form-message form-error" role="alert">{error}</p>}
      <button className="button button-primary auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <LockKeyhole size={16} />}{busy ? "\u062c\u0627\u0631\u064d \u0627\u0644\u062f\u062e\u0648\u0644..." : "\u062f\u062e\u0648\u0644 \u0644\u0648\u062d\u0629 \u0627\u0644\u0623\u062f\u0645\u0646"}</button>
    </form>
    <div className="demo-login-hint"><b>&#x62D;&#x633;&#x627;&#x628; &#x627;&#x644;&#x645;&#x639;&#x627;&#x64A;&#x646;&#x629; &#x627;&#x644;&#x645;&#x62D;&#x644;&#x64A;</b><span dir="ltr">admin@pixo.local</span><small>&#x643;&#x644;&#x645;&#x629; &#x627;&#x644;&#x645;&#x631;&#x648;&#x631;: &#x623;&#x64A; &#x642;&#x64A;&#x645;&#x629; &#x63A;&#x64A;&#x631; &#x641;&#x627;&#x631;&#x63A;&#x629;</small></div>
    <Link href="/" className="admin-back-to-store">&#x627;&#x644;&#x639;&#x648;&#x62F;&#x629; &#x625;&#x644;&#x649; &#x645;&#x62A;&#x62C;&#x631; PIXO</Link>
  </section></main>;
}
