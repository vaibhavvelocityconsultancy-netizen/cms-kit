"use client";

import Link from "next/link";
import { useFooter } from "@/src/hooks/useFooter";

interface MenuItem {
  id: string;
  label: string;
  type: "page" | "custom";
  pageId?: string;
  slug?: string;
  url?: string;
  parentId?: string | null;
  children: MenuItem[];
}

interface MenuData {
  id: string;
  name: string;
  location: "primary" | "footer" | "none";
  items: MenuItem[];
}

interface NavbarProps {
  menu: MenuData | null;
  siteName?: string;
}

function buildTree(items: any[]) {
  const map = new Map();

  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  const roots: any[] = [];

  items.forEach((item) => {
    if (item.parentId) {
      map.get(item.parentId)?.children.push(map.get(item.id));
    } else {
      roots.push(map.get(item.id));
    }
  });

  return roots;
}

export function Navbar({ menu, siteName = "My Website" }: NavbarProps) {
  if (!menu || menu.items.length === 0) {
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <Link href="/" className="navbar-brand">
            {siteName}
          </Link>
        </div>
        <style jsx>{`
          .navbar {
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            padding: 1rem 2rem;
          }
          .navbar-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .navbar-brand {
            font-weight: 700;
            font-size: 1.25rem;
            color: #111827;
            text-decoration: none;
          }
        `}</style>
      </nav>
    );
  }

  function renderMenuItems(items: any[]) {
    return items.map((item) => {
      const href =
        item.type === "page" && item.slug
          ? `/${item.slug}`
          : item.url || "#";

      return (
        <li key={item.id} className="navbar-item">
          <Link href={href} className="navbar-link">
            {item.label}
          </Link>

          {item.children?.length > 0 && (
            <ul className="submenu">{renderMenuItems(item.children)}</ul>
          )}
        </li>
      );
    });
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-brand">
          {siteName}
        </Link>
        <ul className="navbar-menu">
          {renderMenuItems(buildTree(menu.items))}
        </ul>
      </div>
      <style jsx>{`
        .navbar {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 2rem;
        }
        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .submenu {
          list-style: none;
          margin: 0.5rem 0 0 1rem;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .navbar-brand {
          font-weight: 700;
          font-size: 1.25rem;
          color: #111827;
          text-decoration: none;
        }
        .navbar-menu {
          display: flex;
          gap: 2rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .navbar-item {
          margin: 0;
        }
        .navbar-link {
          color: #4b5563;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .navbar-link:hover {
          color: #111827;
        }
      `}</style>
    </nav>
  );
}

// Footer component for footer menu location
export function Footer({ menu }: { menu: MenuData | null }) {
  const { settings } = useFooter();
  const currentYear = new Date().getFullYear();
  const columns = menu ? buildTree(menu.items) : [];
  const brandTitle = settings.footerBrandTitle || "My Website";

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-layout">
          <div className="footer-brand">
            {settings.footerLogo && (
              <Link href="/">
                <img
                  src={settings.footerLogo}
                  alt={brandTitle}
                  className="footer-logo"
                />
              </Link>
            )}
            <Link href="/" className="footer-brand-name">
              {brandTitle}
            </Link>
            {settings.footerDescription && (
              <p className="footer-brand-desc">{settings.footerDescription}</p>
            )}
          </div>
          <div className="footer-contact">
            <h4 className="footer-column-title">Contact</h4>
            {settings.footerAddress && (
              <p className="footer-contact-text">{settings.footerAddress}</p>
            )}
            {settings.footerEmail && (
              <a href={`mailto:${settings.footerEmail}`} className="footer-contact-link">
                {settings.footerEmail}
              </a>
            )}
            {settings.socialLinks.length > 0 && (
              <div className="footer-social">
                {settings.socialLinks
                  .filter((link) => link.url)
                  .map((link) => (
                    <a
                      key={`${link.platform}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="footer-social-link"
                      aria-label={link.platform}
                    >
                      {link.icon ? (
                        <img
                          src={link.icon}
                          className="footer-social-icon"
                          alt={link.platform}
                        />
                      ) : (
                        <span>{link.platform}</span>
                      )}
                    </a>
                  ))}
              </div>
            )}
          </div>
        {columns.length > 0 && (
          <div className="footer-columns">
            {columns.map((column) => (
              <div key={column.id} className="footer-column">
                <h4 className="footer-column-title">{column.label}</h4>
                <ul className="footer-menu">
                  {column.children?.map((item: any) => {
                    const href =
                      item.type === "page" && item.slug
                        ? `/${item.slug}`
                        : item.url || "#";

                    return (
                      <li key={item.id} className="footer-item">
                        <Link href={href} className="footer-link">
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
        </div>
        <p className="footer-copyright">
          {settings.footerCopyright ||
            `Â© ${currentYear} ${brandTitle}. All rights reserved.`}
        </p>
      </div>
      <style jsx>{`
        .footer {
          background: #111827;
          color: #9ca3af;
          padding: 2rem;
          margin-top: auto;
        }
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .footer-layout {
          display: grid;
          grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr) minmax(260px, 2fr);
          gap: 3rem;
          margin-bottom: 2rem;
          text-align: left;
        }
        .footer-logo {
          max-width: 180px;
          max-height: 72px;
          width: auto;
          height: auto;
          object-fit: contain;
          margin-bottom: 1rem;
        }
        .footer-brand-name {
          color: #ffffff;
          text-decoration: none;
          font-weight: 700;
        }
        .footer-brand-desc,
        .footer-contact-text {
          color: #9ca3af;
          font-size: 0.875rem;
          line-height: 1.6;
          margin: 0.5rem 0 0;
          white-space: pre-line;
        }
        .footer-contact {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .footer-contact-link {
          color: #d1d5db;
          text-decoration: none;
          font-size: 0.875rem;
        }
        .footer-contact-link:hover {
          color: #ffffff;
        }
        .footer-social {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .footer-social-link {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: #1f2937;
          border: 1px solid #374151;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #d1d5db;
          text-decoration: none;
          overflow: hidden;
        }
        .footer-social-icon {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }
        .footer-columns {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 2rem;
        }
        .footer-column-title {
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .footer-menu {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .footer-item {
          margin: 0;
        }
        .footer-link {
          color: #9ca3af;
          text-decoration: none;
          font-size: 0.875rem;
          transition: color 0.2s;
        }
        .footer-link:hover {
          color: #ffffff;
        }
        .footer-copyright {
          font-size: 0.875rem;
          margin: 0;
          text-align: center;
        }
        @media (max-width: 900px) {
          .footer-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}

