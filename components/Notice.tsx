const notices: Record<string, string> = {
  saved: "تم الحفظ.",
  deleted: "تم الحذف.",
  password: "تغيّرت كلمة المرور.",
  demo: "حُذف المحتوى التجريبي الذي لم يُعدَّل.",
  locked: "هذه الصورة مستخدمة، ولم تُحذف.",
  ready: "أهلًا بك. حسابك جاهز.",
};

export function Notice({ code }: { code?: string }) {
  const text = code ? notices[code] : "";
  if (!text) return null;
  return (
    <p className="notice" role="status">
      {text}
    </p>
  );
}
