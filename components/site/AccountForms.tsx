"use client";

import { useActionState } from "react";
import { loginAction, logoutAction, signupAction, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function AccountForms({ name, email }: { name?: string; email?: string }) {
  const [signupState, signup] = useActionState(signupAction, {} as FormState);
  const [loginState, login] = useActionState(loginAction, {} as FormState);
  if (name && email) {
    return (
      <div className="auth-card">
        <h1>حسابك</h1>
        <p>{name}</p>
        <p className="latin">{email}</p>
        <p className="help">التصفح لا يحتاج حسابًا. الحساب هنا لحفظ المفضلة فقط.</p>
        <form action={logoutAction}>
          <button className="btn btn-secondary" type="submit">
            تسجيل الخروج
          </button>
        </form>
      </div>
    );
  }
  return (
    <div className="container page" style={{ display: "grid", gap: 16 }}>
      <form className="auth-card" action={signup}>
        <h1>حساب خفيف</h1>
        <p>اسم وبريد وكلمة مرور. التصفح يبقى متاحًا من غيرها، والحساب يربط مفضلتك بك.</p>
        {signupState.error ? <p className="form-error">{signupState.error}</p> : null}
        <label className="field"><span>الاسم</span><input name="name" required /></label>
        <label className="field"><span>البريد</span><input className="latin" name="email" type="email" required /></label>
        <label className="field"><span>كلمة المرور</span><input className="latin" name="password" type="password" minLength={8} required /></label>
        <SubmitButton>إنشاء الحساب</SubmitButton>
      </form>
      <form className="auth-card" action={login}>
        <h2>دخول</h2>
        {loginState.error ? <p className="form-error">{loginState.error}</p> : null}
        <label className="field"><span>البريد</span><input className="latin" name="email" type="email" required /></label>
        <label className="field"><span>كلمة المرور</span><input className="latin" name="password" type="password" required /></label>
        <SubmitButton secondary>دخول</SubmitButton>
      </form>
    </div>
  );
}
