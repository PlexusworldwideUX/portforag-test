"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function ContactPage() {
  const [dark, setDark] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const d = !dark;
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
    localStorage.theme = d ? "dark" : "light";
  };

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio contact from ${name || "someone"}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:c.kenreigh@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-12 sm:px-6">
      <header className="sticky top-0 z-20 -mx-4 flex items-center justify-between gap-3 border-b border-black/10 bg-[#f5f5f7]/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-black/70 sm:-mx-6 sm:px-6">
        <Link href="/" className="min-h-11 content-center text-sm font-medium text-blue-600 dark:text-blue-400">
          Home
        </Link>
        <div className="text-center">
          <div className="text-[15px] font-semibold">Christopher Kenreigh</div>
          <div className="text-xs text-neutral-500">Product Design, Product Management, Product Strategy</div>
        </div>
        <button onClick={toggle} aria-label="Toggle dark mode" className="min-h-11 min-w-11 rounded-full text-lg">
          {dark ? "☀︎" : "☾"}
        </button>
      </header>

      <main className="pt-10 sm:pt-14">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Contact</h1>
        <p className="mt-3 text-lg text-neutral-500">Say hello — this opens your email client with the message filled in.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-11 w-full rounded-xl bg-white px-3 outline-none ring-1 ring-black/10 focus:ring-blue-500 dark:bg-neutral-900 dark:ring-white/10"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-11 w-full rounded-xl bg-white px-3 outline-none ring-1 ring-black/10 focus:ring-blue-500 dark:bg-neutral-900 dark:ring-white/10"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Message</span>
            <textarea
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl bg-white px-3 py-3 outline-none ring-1 ring-black/10 focus:ring-blue-500 dark:bg-neutral-900 dark:ring-white/10"
            />
          </label>
          <button type="submit" className="min-h-11 rounded-full bg-blue-600 px-6 font-medium text-white">
            Send message
          </button>
          {sent && <p className="text-sm text-neutral-500">If your mail app didn’t open, email c.kenreigh@gmail.com directly.</p>}
        </form>
      </main>
    </div>
  );
}
