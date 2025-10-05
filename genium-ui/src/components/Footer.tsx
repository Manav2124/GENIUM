"use client";
import { Button } from "@/components/ui/button"
import "./Footer.css" // Import the new CSS file
import React from "react"

interface FooterProps {
  logo: React.ReactNode
  brandName: string
  socialLinks: Array<{
    icon: React.ReactNode
    href: string
    label: string
  }>
  mainLinks: Array<{
    href: string
    label: string
  }>
  legalLinks: Array<{
    href: string
    label: string
  }>
  copyright: {
    text: string
    license?: string
  }
}

export function Footer({
  logo,
  brandName,
  socialLinks,
  mainLinks,
  legalLinks,
  copyright,
}: FooterProps) {
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-top">
        </div>

        <div className="footer-links-section two-columns">
          {/* Learn Section */}
          <div className="footer-links-column">
            <h3>Learn</h3>
            <ul>
              {mainLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Section */}
          <div className="footer-links-column">
            <h3>Help</h3>
            <ul>
              {legalLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-back-to-top" onClick={handleBackToTop}>
            Back to top
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-up"
            >
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          </div>
          <p>&copy; 2025 GENIUM. All rights reserved.</p>
          <div className="footer-social-links">
            <a href="#" target="_blank" aria-label="Twitter">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-twitter"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17-18 11.6 2.2.1 4.4-.6 6-2 1.1-1.1 1.8-2.5 2-4 .2-.2.4-.5.6-.8-.7 1.2-2.2 1.9-3.8 2-.7 0-1.4-.1-2-.4 1.8 2.1 4.8 3.2 7.8 3.2 9 0 13-6 13-12.4 0-.5 0-1-.1-1.5 1.2-.8 2.3-1.7 3.2-2.9z" />
              </svg>
            </a>
            <a href="#" target="_blank" aria-label="YouTube">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-youtube"
              >
                <path d="M2.5 17.5c0-1.5.5-2.5 1.5-3.5s2-1.5 3.5-1.5h9c1.5 0 2.5.5 3.5 1.5s1.5 2 1.5 3.5c0 1.5-.5 2.5-1.5 3.5s-2 1.5-3.5 1.5h-9c-1.5 0-2.5-.5-3.5-1.5s-1.5-2-1.5-3.5z" />
                <path d="m10 15 5 2.5-5 2.5v-5z" />
              </svg>
            </a>
            <a href="#" target="_blank" aria-label="GitHub">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-github"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.44-.78-3.5.25-1.1.1-2.3-.38-3.4 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.48 1.1-.63 2.3-.38 3.4-.5.97-.85 2.15-.78 3.5 0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}