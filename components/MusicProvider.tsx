"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import "./music.css";

const MINECRAFT_PLAYLIST = "06tCWiOWTnuTfoKwHB8Byl";
const PERSONAL_PLAYLIST = "1RrFeMWP9Z8kGIWu5WFnGQ";
const API_SCRIPT_ID = "aruzhan-spotify-iframe-api";

type PlaybackState = "loading" | "paused" | "playing" | "buffering" | "unavailable";
type PlaybackEvent = { data?: { isPaused?: boolean; isBuffering?: boolean; duration?: number; position?: number; playingURI?: string } };
type SpotifyController = {
  addListener: (event: "ready" | "playback_started" | "playback_update", callback: (event: PlaybackEvent) => void) => void;
  play: () => void | Promise<void>;
  pause: () => void;
  destroy: () => void;
};
type SpotifyApi = {
  createController: (element: HTMLElement, options: { url: string; width: number; height: number }, callback: (controller: SpotifyController) => void) => void;
};
type SpotifyWindow = Window & {
  onSpotifyIframeApiReady?: (api: SpotifyApi) => void;
  aruzhanSpotifyApi?: SpotifyApi;
};

let apiPromise: Promise<SpotifyApi> | null = null;

function loadSpotifyApi(): Promise<SpotifyApi> {
  const spotifyWindow = window as SpotifyWindow;
  if (spotifyWindow.aruzhanSpotifyApi) return Promise.resolve(spotifyWindow.aruzhanSpotifyApi);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<SpotifyApi>((resolve, reject) => {
    const previousCallback = spotifyWindow.onSpotifyIframeApiReady;
    let script = document.getElementById(API_SCRIPT_ID) as HTMLScriptElement | null;
    if (script?.dataset.failed === "true") { script.remove(); script = null; }
    const existingScript = Boolean(script);
    script ??= document.createElement("script");
    const apiScript = script;
    let settled = false;
    const cleanup = () => { window.clearTimeout(timeout); apiScript.removeEventListener("error", fail); };
    const fail = () => {
      if (settled) return;
      settled = true; cleanup(); apiScript.dataset.failed = "true";
      reject(new Error("Spotify could not be loaded."));
    };
    const timeout = window.setTimeout(fail, 15000);
    spotifyWindow.onSpotifyIframeApiReady = api => {
      spotifyWindow.aruzhanSpotifyApi = api;
      if (previousCallback) { try { previousCallback(api); } catch { /* A separate embed must not prevent this one from loading. */ } }
      if (settled) return;
      settled = true; cleanup(); resolve(api);
    };
    apiScript.addEventListener("error", fail, { once: true });
    if (!existingScript) {
      apiScript.id = API_SCRIPT_ID;
      apiScript.src = "https://open.spotify.com/embed/iframe-api/v1";
      apiScript.async = true;
      document.head.appendChild(apiScript);
    }
  }).catch(error => { apiPromise = null; throw error; });
  return apiPromise;
}

type EmbedCallbacks = {
  onReady?: (controller: SpotifyController) => void;
  onStarted?: (controller: SpotifyController) => void;
  onUpdate?: (controller: SpotifyController, state: "paused" | "playing" | "buffering") => void;
  onError?: () => void;
  onDispose?: (controller: SpotifyController) => void;
};

function useSpotifyEmbed(playlist: string, height: number, title: string, callbacks: EmbedCallbacks) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyController | null>(null);
  const callbackRef = useRef(callbacks);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { callbackRef.current = callbacks; }, [callbacks]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let alive = true;
    let controller: SpotifyController | null = null;
    let readyTimer: number | undefined;
    const placeholder = document.createElement("div");
    host.appendChild(placeholder);
    const failed = () => { if (alive) { setError(true); callbackRef.current.onError?.(); } };
    loadSpotifyApi().then(api => {
      if (!alive) return;
      readyTimer = window.setTimeout(failed, 15000);
      api.createController(placeholder, { url: `https://open.spotify.com/playlist/${playlist}`, width: 320, height }, created => {
        if (!alive) { try { created.destroy(); } catch {} return; }
        controller = created; controllerRef.current = created;
        const iframe = host.querySelector("iframe");
        if (iframe) { iframe.title = title; iframe.loading = "eager"; }
        created.addListener("ready", () => {
          if (!alive) return;
          window.clearTimeout(readyTimer); setError(false); setReady(true);
          callbackRef.current.onReady?.(created);
        });
        created.addListener("playback_started", () => { if (alive) callbackRef.current.onStarted?.(created); });
        created.addListener("playback_update", event => {
          if (!alive || typeof event.data?.isPaused !== "boolean") return;
          const state = event.data.isPaused ? "paused" : event.data.isBuffering ? "buffering" : "playing";
          callbackRef.current.onUpdate?.(created, state);
        });
      });
    }).catch(failed);
    return () => {
      alive = false; window.clearTimeout(readyTimer);
      if (controller) {
        callbackRef.current.onDispose?.(controller);
        try { controller.destroy(); } catch {}
      }
      controllerRef.current = null;
      placeholder.remove();
    };
  }, [playlist, height, title, attempt]);

  const retry = useCallback(() => { setReady(false); setError(false); setAttempt(value => value + 1); }, []);
  return { hostRef, controllerRef, ready, error, retry };
}

type MusicContextValue = {
  active: boolean;
  availability: "loading" | "ready" | "unavailable";
  toggle: () => void;
  personalPlayback: (controller: SpotifyController, state: "paused" | "playing" | "buffering", confirmedStart?: boolean) => void;
  personalDisposed: (controller: SpotifyController) => void;
};
const MusicContext = createContext<MusicContextValue | null>(null);

function pauseController(controller: SpotifyController | null) { try { controller?.pause(); } catch {} }

export default function MusicProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [backgroundState, setBackgroundState] = useState<PlaybackState>("loading");
  const [personalState, setPersonalState] = useState<"paused" | "playing" | "buffering">("paused");
  const [expanded, setExpanded] = useState(false);
  const personalControllerRef = useRef<SpotifyController | null>(null);
  const autoplayAttempted = useRef(false);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const markBackgroundPlaying = useCallback(() => {
    pauseController(personalControllerRef.current);
    setPersonalState("paused"); setBackgroundState("playing");
  }, []);
  const { hostRef: backgroundHostRef, controllerRef: backgroundControllerRef, ready: backgroundReady, error: backgroundError, retry: retryBackground } = useSpotifyEmbed(MINECRAFT_PLAYLIST, 152, "Minecraft music on Spotify", {
    onReady: controller => {
      setBackgroundState("paused");
      if (!autoplayAttempted.current) {
        autoplayAttempted.current = true;
        try { Promise.resolve(controller.play()).catch(() => { /* The Play button remains available when autoplay is blocked. */ }); } catch {}
      }
    },
    onStarted: markBackgroundPlaying,
    onUpdate: (_, state) => setBackgroundState(state),
    onError: () => setBackgroundState("unavailable"),
  });

  const personalPlayback = useCallback((controller: SpotifyController, state: "paused" | "playing" | "buffering", confirmedStart = false) => {
    personalControllerRef.current = controller;
    if (confirmedStart) pauseController(backgroundControllerRef.current);
    setPersonalState(state);
  }, [backgroundControllerRef]);
  const personalDisposed = useCallback((controller: SpotifyController) => {
    if (personalControllerRef.current === controller) { personalControllerRef.current = null; setPersonalState("paused"); }
  }, []);
  const personalActive = personalState !== "paused";
  const active = personalActive || backgroundState === "playing" || backgroundState === "buffering";
  const toggle = useCallback(() => {
    if (personalActive) { pauseController(personalControllerRef.current); return; }
    if (backgroundState === "playing" || backgroundState === "buffering") { pauseController(backgroundControllerRef.current); return; }
    if (!backgroundReady || !backgroundControllerRef.current || backgroundError) { setExpanded(true); return; }
    try { Promise.resolve(backgroundControllerRef.current.play()).catch(() => setExpanded(true)); } catch { setExpanded(true); }
  }, [personalActive, backgroundState, backgroundReady, backgroundControllerRef, backgroundError]);
  const availability: MusicContextValue["availability"] = backgroundError ? "unavailable" : backgroundReady ? "ready" : "loading";
  const context = useMemo<MusicContextValue>(() => ({ active, availability, toggle, personalPlayback, personalDisposed }), [active, availability, toggle, personalPlayback, personalDisposed]);
  const status = personalActive ? (personalState === "buffering" ? "Loading audio" : "My playlist is playing")
    : backgroundState === "playing" ? "Playing" : backgroundState === "buffering" ? "Loading audio"
    : backgroundState === "loading" ? "Loading Spotify" : backgroundState === "unavailable" ? "Spotify unavailable" : "Press play to listen";

  return <MusicContext.Provider value={context}>
    {children}
    <aside className={`music-dock${pathname?.startsWith("/cv") ? " music-dock--document" : ""}`} aria-label="Music player">
      <div className="music-controls">
        <div className="music-caption"><strong>Minecraft music</strong><span aria-live="polite">{status}</span></div>
        <button type="button" className="music-play" onClick={toggle} aria-label={active ? "Pause music" : "Play Minecraft music"}>{active ? "Pause" : "Play"}</button>
        <button type="button" className="music-expand" ref={expandButtonRef} onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls="minecraft-spotify-player">Player</button>
      </div>
      <div id="minecraft-spotify-player" className={`music-popover${expanded ? " music-popover--open" : ""}`} aria-hidden={!expanded} inert={!expanded} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); setExpanded(false); expandButtonRef.current?.focus(); } }}>
        <div className="music-popover-heading"><span>Minecraft playlist</span><button type="button" onClick={() => setExpanded(false)}>Close</button></div>
        <div className={`music-spotify-host music-spotify-host--compact${backgroundError ? " music-spotify-host--failed" : ""}`} ref={backgroundHostRef} />
        {!backgroundReady && !backgroundError && <p className="music-load-note" role="status">Loading Spotify</p>}
        {backgroundError && <div className="music-load-error"><p>Spotify couldn’t load here.</p><button type="button" onClick={() => { setBackgroundState("loading"); retryBackground(); }}>Try again</button></div>}
        <a className="music-spotify-link" href={`https://open.spotify.com/playlist/${MINECRAFT_PLAYLIST}`} target="_blank" rel="noreferrer">Open in Spotify</a>
      </div>
    </aside>
  </MusicContext.Provider>;
}

export function MusicToggle({ className = "" }: { className?: string }) {
  const music = useContext(MusicContext);
  if (!music) return null;
  if (!music.active && music.availability === "unavailable") return <a className={`music-inline-toggle ${className}`} href={`https://open.spotify.com/playlist/${MINECRAFT_PLAYLIST}`} target="_blank" rel="noreferrer">Open music</a>;
  if (!music.active && music.availability === "loading") return <button className={`music-inline-toggle ${className}`} type="button" disabled aria-label="Music is loading">Loading</button>;
  return <button className={`music-inline-toggle ${className}`} type="button" onClick={music.toggle}>{music.active ? "Pause music" : "Play music"}</button>;
}

export function PersonalPlaylist({ className = "" }: { className?: string }) {
  const music = useContext(MusicContext);
  const { hostRef, ready, error, retry } = useSpotifyEmbed(PERSONAL_PLAYLIST, 352, "Aruzhan’s personal Spotify playlist", {
    onStarted: controller => music?.personalPlayback(controller, "playing", true),
    onUpdate: (controller, state) => music?.personalPlayback(controller, state),
    onDispose: controller => music?.personalDisposed(controller),
  });
  return <div className={`music-personal ${className}`}>
    <div ref={hostRef} className={`music-spotify-host music-spotify-host--personal${error ? " music-spotify-host--failed" : ""}`} />
    {!ready && !error && <p className="music-load-note" role="status">Loading my playlist</p>}
    {error && <div className="music-load-error"><p>Spotify couldn’t load here.</p><button type="button" onClick={retry}>Try again</button></div>}
    <a className="music-spotify-link" href={`https://open.spotify.com/playlist/${PERSONAL_PLAYLIST}`} target="_blank" rel="noreferrer">Open my playlist in Spotify</a>
  </div>;
}
