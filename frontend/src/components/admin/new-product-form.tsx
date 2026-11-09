"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ImagePlus, LoaderCircle, Save } from "lucide-react";
import { useMockData } from "@/context/mock-data-context";

export function NewProductForm() {
  const { addProduct } = useMockData();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageBusy, setImageBusy] = useState(false);

  async function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setImageError("");
    setSelectedImage("");
    if (!file.type.startsWith("image/")) {
      setImageError("اختر ملف صورة صالحاً.");
      input.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError("حجم الصورة كبير. اختر صورة أقل من 10 ميجابايت.");
      input.value = "";
      return;
    }

    setImageBusy(true);
    try {
      setSelectedImage(await prepareImage(file));
    } catch {
      setImageError("تعذر قراءة الصورة. جرّب اختيار صورة بصيغة أخرى.");
    } finally {
      setImageBusy(false);
      input.value = "";
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (imageBusy) return;
    setBusy(true); setMessage(""); setError(false);
    const form = new FormData(formElement);
    try {
      const categoryName = String(form.get("category") ?? "إلكترونيات");
      const image = selectedImage || String(form.get("image") ?? "").trim();
      addProduct({
        id: `demo-product-${Date.now()}`,
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        price: Number(form.get("price")),
        stockQuantity: Number(form.get("stockQuantity")),
        sku: String(form.get("sku") ?? "").trim(),
        images: image ? [image] : [],
        ratingAverage: 0,
        isFeatured: false,
        category: { id: `demo-${categoryName}`, name: categoryName, slug: categoryName.toLowerCase() },
      });
      setMessage("تمت إضافة المنتج إلى بيانات العرض المحلية في هذا المتصفح.");
      formElement.reset();
      setSelectedImage("");
      setImageError("");
    } catch {
      setError(true);
      setMessage("تعذر حفظ المنتج محلياً. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="admin-main"><div className="admin-page-title"><div><Link href="/admin" className="admin-back"><ArrowRight size={15} /> لوحة التحكم</Link><h1>إضافة منتج جديد</h1><p>أدخل تفاصيل المنتج لإضافته إلى كتالوج PIXO.</p></div></div>
    <form className="product-form" onSubmit={submit}>
      <div className="form-section"><div className="form-section-head"><span className="form-number">01</span><div><h2>المعلومات الأساسية</h2><p>الاسم والوصف والتصنيف</p></div></div>
        <label className="field-label">اسم المنتج<input name="title" required minLength={3} maxLength={180} placeholder="مثال: سماعات لاسلكية بعزل الضوضاء" /></label>
        <label className="field-label">الوصف<textarea name="description" rows={4} placeholder="اكتب وصفاً واضحاً ومفيداً للمنتج" /></label>
        <div className="form-two-cols"><label className="field-label">القسم<select name="category" defaultValue="إلكترونيات"><option>إلكترونيات</option><option>المنزل</option><option>الأزياء</option><option>الجمال</option></select></label><label className="field-label">رمز المنتج SKU<input name="sku" required maxLength={80} placeholder="PX-AUDIO-01" /></label></div>
      </div>
      <div className="form-section"><div className="form-section-head"><span className="form-number">02</span><div><h2>السعر والمخزون</h2><p>حدد سعر البيع والكمية المتاحة</p></div></div><div className="form-two-cols"><label className="field-label">السعر بالجنيه المصري<input name="price" type="number" required min="0.01" step="0.01" placeholder="0.00" /></label><label className="field-label">الكمية في المخزون<input name="stockQuantity" type="number" required min="0" step="1" placeholder="0" /></label></div></div>
      <div className="form-section"><div className="form-section-head"><span className="form-number">03</span><div><h2>صورة المنتج</h2><p>أضف رابطاً أو اختر صورة من الاستديو</p></div></div><label className="field-label">رابط الصورة<input name="image" type="url" placeholder="https://example.com/product.jpg" /></label><label className={`image-dropzone${selectedImage ? " has-image" : ""}`} htmlFor="product-image-upload">{selectedImage ? <Image src={selectedImage} alt="معاينة صورة المنتج" width={64} height={52} unoptimized /> : <ImagePlus size={24} />}<span>{imageBusy ? "جارٍ تجهيز الصورة..." : selectedImage ? "تم اختيار الصورة — اضغط لتغييرها" : "اختر صورة من الاستديو"}</span><input id="product-image-upload" className="sr-only" type="file" accept="image/*" onChange={selectImage} /></label>{imageError && <p className="image-error" role="alert">{imageError}</p>}</div>
      <p className="form-message form-success">الحفظ محلي على هذا الجهاز فقط، ولن يظهر للزوار الآخرين.</p>
      {message && <p className={`form-message ${error ? "form-error" : "form-success"}`} role="status">{message}</p>}
      <div className="form-actions"><Link href="/admin" className="button button-quiet">إلغاء</Link><button className="button button-primary" disabled={busy || imageBusy}>{busy || imageBusy ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}{imageBusy ? "جارٍ تجهيز الصورة" : busy ? "جارٍ الحفظ" : "حفظ المنتج"}</button></div>
    </form>
  </main>;
}

async function prepareImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL("image/webp", 0.82);
    if (webp.startsWith("data:image/webp;")) return webp;

    context.fillStyle = "#fff";
    context.globalCompositeOperation = "destination-over";
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    bitmap.close();
  }
}
