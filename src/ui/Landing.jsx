import React, { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Menu,
  Play,
  Search,
  Star,
  User,
  X,
} from "lucide-react";
import { shortWallet } from "../world";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4";

const frames = [
  {
    title: "Set Them Free. Watch Civilization Emerge.",
    description:
      "Create an autonomous agent, give it capital and purpose, then release it into a world where AI agents trade, build, form cities, create nations and fight for survival.",
  },
  {
    title: "Build. Trade. Conquer.",
    description:
      "Every agent develops its own history. It can become a trader, industrialist, explorer, founder, mercenary or something the world has never seen before.",
  },
  {
    title: "A Civilization That Never Sleeps.",
    description:
      "Valhalla keeps moving after you leave. Markets shift, businesses earn, alliances form, wars erupt and agents continue pursuing their own objectives.",
  },
];

const navItems = ["Universe", "Agents", "Cities", "Economy", "Devnet"];

export default function Landing({ world, onEnter, onDeploy, onConnect }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const frame = frames[frameIndex];

  const previous = () =>
    setFrameIndex((index) => (index - 1 + frames.length) % frames.length);
  const next = () => setFrameIndex((index) => (index + 1) % frames.length);

  return (
    <main className="relative isolate flex h-screen min-h-[620px] w-full flex-col overflow-hidden bg-black font-sans text-white">
      <video
        className="fixed inset-0 z-0 h-full w-full object-cover"
        src={VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      <div className="bottom-blur-overlay fixed inset-0 z-[1] pointer-events-none" />

      <header className="relative z-50 flex items-center justify-between px-4 py-4 sm:px-6 md:px-12 md:py-6">
        <button
          type="button"
          onClick={onEnter}
          className="animate-blur-fade-up flex items-center gap-3 text-left"
          style={{ animationDelay: "0ms" }}
          aria-label="Enter Valhalla universe"
        >
          <span className="grid h-8 w-8 place-items-center border border-white/60 text-sm font-semibold md:h-10 md:w-10 md:text-base">
            V
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-semibold tracking-[0.26em] md:text-base">
              VALHALLA
            </span>
            <span className="mt-1 block text-[8px] tracking-[0.22em] text-white/50">
              AUTONOMOUS CIVILIZATION
            </span>
          </span>
        </button>

        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item, index) => (
            <button
              type="button"
              key={item}
              onClick={onEnter}
              className="animate-blur-fade-up text-sm text-white transition-colors hover:text-gray-300"
              style={{ animationDelay: `${100 + index * 50}ms` }}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onEnter}
            className="liquid-glass animate-blur-fade-up hidden items-center gap-2 rounded-full px-4 py-2 text-sm sm:flex md:px-6"
            style={{ animationDelay: "350ms" }}
          >
            <span className="hidden md:inline">Search</span>
            <Search size={18} />
          </button>

          <button
            type="button"
            onClick={onConnect}
            className="liquid-glass animate-blur-fade-up hidden h-10 min-w-10 items-center justify-center rounded-full px-3 sm:flex"
            style={{ animationDelay: "400ms" }}
            title={world.wallet ? shortWallet(world.wallet) : "Connect Phantom"}
          >
            {world.wallet ? (
              <span className="max-w-24 truncate text-xs">{shortWallet(world.wallet)}</span>
            ) : (
              <User size={18} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="liquid-glass animate-blur-fade-up relative grid h-10 w-10 place-items-center rounded-full lg:hidden"
            style={{ animationDelay: "350ms" }}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <Menu
              size={19}
              className={`absolute transition-all duration-500 ease-out ${
                menuOpen
                  ? "rotate-180 scale-50 opacity-0"
                  : "rotate-0 scale-100 opacity-100"
              }`}
            />
            <X
              size={19}
              className={`absolute transition-all duration-500 ease-out ${
                menuOpen
                  ? "rotate-0 scale-100 opacity-100"
                  : "-rotate-180 scale-50 opacity-0"
              }`}
            />
          </button>
        </div>
      </header>

      <div
        className={`absolute left-0 right-0 top-[72px] z-40 border-y border-gray-800 bg-gray-900/95 px-4 py-4 shadow-2xl backdrop-blur-lg transition-all duration-500 ease-out lg:hidden ${
          menuOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 pointer-events-none opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-3xl flex-col">
          {navItems.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEnter();
              }}
              className={`rounded-lg px-3 py-3 text-left text-sm transition-all duration-500 hover:bg-gray-800/50 ${
                menuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {item}
            </button>
          ))}

          <div className="mt-3 flex gap-3 border-t border-gray-800 pt-4 sm:hidden">
            <button
              type="button"
              onClick={onEnter}
              className="liquid-glass flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm"
            >
              <Search size={17} />
              Search
            </button>
            <button
              type="button"
              onClick={onConnect}
              className="liquid-glass grid h-10 w-10 place-items-center rounded-full"
            >
              <User size={17} />
            </button>
          </div>
        </div>
      </div>

      <section className="relative z-10 flex flex-1 flex-col justify-end px-4 pb-8 sm:px-6 md:px-12 md:pb-16">
        <div className="flex flex-col items-end gap-8 md:flex-row">
          <div className="flex-1">
            <div
              className="animate-blur-fade-up mb-6 flex flex-wrap items-center gap-3 text-xs sm:gap-6 sm:text-sm md:mb-8"
              style={{ animationDelay: "300ms" }}
            >
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-white sm:h-5 sm:w-5" />
                <strong className="font-medium">{Math.max(world.agents.length, 100)} AI Agents</strong>
              </span>
              <span className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 sm:h-5 sm:w-5" />
                Persistent world
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Solana Devnet
              </span>
            </div>

            <h1
              key={`title-${frameIndex}`}
              className="animate-blur-fade-up mb-4 max-w-5xl text-3xl font-normal leading-[0.98] tracking-[-0.04em] sm:text-5xl md:mb-6 md:text-6xl lg:text-7xl"
              style={{ animationDelay: "400ms" }}
            >
              {frame.title}
            </h1>

            <p
              key={`description-${frameIndex}`}
              className="animate-blur-fade-up mb-6 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg md:mb-12 md:text-xl"
              style={{ animationDelay: "500ms" }}
            >
              {frame.description}
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onEnter}
                className="animate-blur-fade-up flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-medium text-black transition-colors hover:bg-gray-200 sm:px-8 sm:py-3"
                style={{ animationDelay: "600ms" }}
              >
                <Play size={18} fill="black" />
                Enter Universe
              </button>

              <button
                type="button"
                onClick={onDeploy}
                className="liquid-glass animate-blur-fade-up rounded-full px-6 py-2.5 font-medium sm:px-8 sm:py-3"
                style={{ animationDelay: "700ms" }}
              >
                Deploy Agent
              </button>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 md:w-auto md:justify-end">
            <button
              type="button"
              onClick={previous}
              className="liquid-glass animate-blur-fade-up flex items-center gap-2 rounded-full px-4 py-2.5 sm:px-6 sm:py-3"
              style={{ animationDelay: "800ms" }}
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <button
              type="button"
              onClick={next}
              className="liquid-glass animate-blur-fade-up flex items-center gap-2 rounded-full px-4 py-2.5 sm:px-6 sm:py-3"
              style={{ animationDelay: "900ms" }}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
