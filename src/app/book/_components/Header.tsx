"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "./ui";

const NAV = [
  { label: "Courses", href: "#courses" },
  { label: "Sample hole", href: "#sample" },
  { label: "FAQ", href: "#faq" },
];

export function Header() {
  return (
    <header className="bg-book-green text-book-cream">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2.5">
        <Link href="/" className="flex items-center gap-2.5 py-1.5">
          <Image src="/images/logo3d.png" alt="" width={30} height={30} className="rounded-lg" />
          <span className="font-book-display text-[20px] font-bold tracking-[0.12em] text-book-yellow">
            GOLF PLAYBOOK
          </span>
        </Link>
        <nav aria-label="On this page" className="flex flex-wrap items-center gap-x-5">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="py-2.5 text-[16px] font-medium text-book-cream hover:text-book-yellow"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </Container>
    </header>
  );
}
