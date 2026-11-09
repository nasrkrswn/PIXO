"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function AccountForm() {
  const router = useRouter();
  const { user, loading, error, login, register, logout, clearError } = useAuth();
  const [registering, setRegistering] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      if (registering) {
        await register({ name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")), phone: String(form.get("phone") || "") || undefined });
      } else {
        await login(String(form.get("email")), String(form.get("password")));
      }
      router.push("/");
    } catch {
      // The auth context holds the API error for display.
    } finally { setBusy(false); }
  }

  async function signOut() {
    await logout().catch(() => undefined);
    router.refresh();
  }

  return <main className="account-page store-container"><Link href="/" className="text-link"><ArrowRight size={16} /> العودة للمتجر</Link><section className="account-card">
    <span className="account-avatar"><UserRound size={28} /></span>
    {loading ? <div className="auth-loading"><LoaderCircle className="spin" size={20} /> جارٍ التحقق من جلستك</div> : user ? <><span className="eyebrow">حسابك في PIXO</span><h1>أهلاً {user.name}</h1><p>{user.email}</p><span className={`role-label${user.role === "ADMIN" ? " role-admin" : ""}`}>{user.role === "ADMIN" ? "مدير المتجر" : user.role === "DRIVER" ? "مندوب التوصيل" : "عميل PIXO"}</span><div className="account-actions"><Link href={user.role === "ADMIN" ? "/admin" : "/cart"} className="button button-primary">{user.role === "ADMIN" ? "لوحة التاجر" : "عربة التسوق"}</Link><Link href="/orders" className="button button-quiet">&#x637;&#x644;&#x628;&#x627;&#x62A;&#x64A;</Link><button className="button button-quiet" onClick={signOut}>تسجيل الخروج</button></div></> : <>
      <span className="eyebrow">حساب PIXO</span><h1>{registering ? "انضم لعائلة PIXO" : "أهلاً بيك من جديد"}</h1><p>{registering ? "أنشئ حسابك وابدأ رحلة تسوق أسهل." : "سجّل الدخول لمتابعة طلباتك وإدارة حسابك."}</p>
      <form className="auth-form" onSubmit={submit} onChange={clearError}>
        {registering && <label className="field-label">الاسم بالكامل<input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="اسمك" /></label>}
        <label className="field-label">البريد الإلكتروني<input name="email" type="email" required maxLength={320} autoComplete="email" dir="ltr" placeholder="name@example.com" /></label>
        {registering && <label className="field-label">رقم الهاتف <small>اختياري</small><input name="phone" type="tel" autoComplete="tel" placeholder="01xxxxxxxxx" dir="ltr" /></label>}
        <label className="field-label">كلمة المرور<input name="password" type="password" required minLength={registering ? 8 : 1} maxLength={72} autoComplete={registering ? "new-password" : "current-password"} placeholder={registering ? "١٢ حرفاً على الأقل" : "أدخل كلمة المرور"} dir="ltr" /></label>
        {error && <p className="form-message form-error" role="alert">{error}</p>}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <LockKeyhole size={16} />}{busy ? "جارٍ المعالجة" : registering ? "إنشاء الحساب" : "تسجيل الدخول"}</button>
      </form>
      
      <button className="auth-toggle" onClick={() => { clearError(); setRegistering((value) => !value); }}>{registering ? "عندك حساب؟ سجّل الدخول" : "مستخدم جديد؟ أنشئ حساباً"}</button>
      <Link href="/admin" className="admin-entry-link">&#x62F;&#x62E;&#x648;&#x644; &#x628;&#x648;&#x627;&#x628;&#x629; &#x627;&#x644;&#x625;&#x62F;&#x627;&#x631;&#x629;</Link><small className="auth-security">وضع تجريبي محلي: لا يتم التحقق من كلمة المرور ولا تُرسل بياناتك إلى خادم.</small>
    </>}
  </section></main>;
}
