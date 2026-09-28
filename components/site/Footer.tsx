import type { Category, SiteSettings } from "@/lib/types";

export function Footer({ settings, categories }: { settings: SiteSettings; categories: Category[] }) {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h2>{settings.siteName}</h2>
          <p>{settings.description}</p>
        </div>
        <div>
          <h2>التصنيفات</h2>
          <ul>
            {categories.slice(0, 6).map((category) => (
              <li key={category.id}>
                <a href={`/categories/${category.slug}`}>{category.name}</a>
              </li>
            ))}
            <li>
              <a href="/categories">كل التصنيفات</a>
            </li>
          </ul>
        </div>
        <div>
          <h2>تواصل</h2>
          <ul>
            {settings.contactEmail ? (
              <li>
                <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              </li>
            ) : null}
            {settings.instagram ? (
              <li>
                <a href={settings.instagram} rel="noopener noreferrer" target="_blank">
                  إنستغرام
                </a>
              </li>
            ) : null}
            {settings.socialLinks.map((link) => (
              <li key={link.url}>
                <a href={link.url} rel="noopener noreferrer" target="_blank">
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href="/explore">استكشف القصص</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="container legal">{settings.siteName} — مكان مريح تكتشف فيه قصتك القادمة.</div>
    </footer>
  );
}
