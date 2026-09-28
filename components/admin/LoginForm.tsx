"use client";

import { useActionState } from "react";
import { adminLoginAction, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function LoginForm() {
  const [state, action] = useActionState(adminLoginAction, {} as FormState);
  return (
    <form className="auth-card" action={action}>
      <p className="kicker">يراع</p>
      <h1>دخول الإدارة</h1>
      <p className="help">هذه الصفحة للمسؤول فقط، وليست جزءًا من تصفح القصص.</p>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <label className="field">
        <span>البريد</span>
        <input className="latin" name="email" type="email" autoComplete="username" required />
      </label>
      <label className="field">
        <span>كلمة المرور</span>
        <input className="latin" name="password" type="password" autoComplete="current-password" required />
      </label>
      <SubmitButton>دخول</SubmitButton>
      <p style={{ marginTop: 16 }}>
        <a href="/">العودة إلى يراع</a>
      </p>
    </form>
  );
}
