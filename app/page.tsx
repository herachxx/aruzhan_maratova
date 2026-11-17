"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { projects, type Project } from "@/lib/projects";
import { MusicToggle, PersonalPlaylist } from "@/components/MusicProvider";
const DeskScene = dynamic(() => import("@/components/DeskScene"), {
  ssr: false,
  loading: () => <div className="scene-loading">Opening the desk</div>,
});
const Sudoku = dynamic(() => import("@/components/Sudoku"), {
  loading: () => <p>Getting the sudoku ready...</p>,
});
const sections = [
  "work",
  "photos",
  "about",
  "contact",
  "extras",
  "guitar",
  "cube",
  "music",
  "sudoku",
  "secret",
];
const notes = [82.41, 110, 146.83, 196, 246.94, 329.63];

function Guitar() {
  const audio = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(false),
    [plucked, setPlucked] = useState({ index: -1, count: 0 });
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  async function enable() {
    audio.current ||= new AudioContext();
    await audio.current.resume();
    setEnabled(true);
  }
  function play(index: number) {
    setPlucked((v) => ({ index, count: v.count + 1 }));
    if (!enabled || !audio.current) return;
    const ctx = audio.current,
      t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    gain.connect(ctx.destination);
    [1, 2, 3].forEach((harmonic, i) => {
      const osc = ctx.createOscillator(),
        vol = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = notes[index] * harmonic;
      vol.gain.value = 1 / (i + 1) ** 2;
      osc.connect(vol);
      vol.connect(gain);
      osc.start();
      osc.stop(t + 1.6);
    });
  }
  return (
    <div className="guitar-play">
      <p>
        I play guitar, too. Go on, try a string. I left the sound off until you
        ask for it.
      </p>
      <button className="solid-button" onClick={enable} disabled={enabled}>
        {enabled ? "Sound enabled" : "Enable sound"}
      </button>
      <div className="guitar-board" role="group" aria-label="Guitar strings">
        {["E2", "A2", "D3", "G3", "B3", "E4"].map((n, i) => (
          <button
            className={`guitar-string ${plucked.index === i ? "plucked" : ""}`}
            style={{ "--thickness": `${3 - i * 0.35}px` } as CSSProperties}
            key={n}
            onClick={() => play(i)}
            aria-label={`Play ${n}`}
          >
            <span>{n}</span>
            <i key={plucked.index === i ? plucked.count : 0} />
          </button>
        ))}
      </div>
      <p className="caption">
        Tap a string. Sound plays only after you enable it.
      </p>
    </div>
  );
}
function Cube() {
  const [turn, setTurn] = useState(0);
  return (
    <div className="cube-play">
      <p>
        Sometimes I just want something to turn around while I think. You can
        borrow this one.
      </p>
      <button
        className="cube-touch"
        onClick={() => setTurn((v) => v + 1)}
        aria-label="Turn the cube"
      >
        <span
          className="fidget-cube"
          style={{
            transform: `rotateX(${turn * 90 - 24}deg) rotateY(${turn * 90 + 35}deg)`,
          }}
        >
          {["front", "back", "left", "right", "top", "bottom"].map(
            (face, f) => (
              <span className={`cube-face ${face}`} key={face}>
                {Array.from({ length: 9 }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      background: [
                        "#e77336",
                        "#ede2bd",
                        "#759aaa",
                        "#496c54",
                        "#dcb85e",
                        "#b64f44",
                      ][(i + f * 2) % 6],
                    }}
                  />
                ))}
              </span>
            ),
          )}
        </span>
      </button>
      <div className="cube-actions">
        <button className="solid-button" onClick={() => setTurn((v) => v + 1)}>
          Turn cube
        </button>
        <button className="plain-button" onClick={() => setTurn(0)}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [night, setNight] = useState(true),
    [reset, setReset] = useState(0),
    [hover, setHover] = useState<string | null>(null),
    [detail, setDetail] = useState<string | null>(null),
    [selected, setSelected] = useState(projects[0].id),
    [motion, setMotion] = useState(true);
  const dialog = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null),
    pushed = useRef(0);
  const selectedProject =
    projects.find((p) => p.id === selected) || projects[0];
  const open = useCallback(
    (id: string) => {
      if (id === "cv") {
        router.push("/cv");
        return;
      }
      if (id === "light") {
        setNight((v) => !v);
        return;
      }
      if (!dialog.current?.open)
        opener.current = document.activeElement as HTMLElement;
      if (projects.some((p) => p.id === id)) {
        setSelected(id);
      }
      pushed.current += 1;
      history.pushState(
        { ...history.state, portfolioDepth: pushed.current },
        "",
        `#view/${id}`,
      );
      setDetail(projects.some((p) => p.id === id) ? "work" : id);
    },
    [router],
  );
  function close() {
    setDetail(null);
    dialog.current?.close();
    if (pushed.current) {
      const steps = pushed.current;
      pushed.current = 0;
      history.go(-steps);
    } else if (location.hash.startsWith("#view/"))
      history.replaceState(null, "", location.pathname);
    opener.current?.focus();
  }
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setMotion(!media.matches);
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    function read() {
      if (
        location.hash.startsWith("#view/") &&
        !history.state?.portfolioDepth
      ) {
        const hash = location.hash;
        history.replaceState(
          history.state,
          "",
          location.pathname + location.search,
        );
        history.pushState({ ...history.state, portfolioDepth: 1 }, "", hash);
      }
      pushed.current = Number(history.state?.portfolioDepth || 0);
      const key = location.hash.startsWith("#view/")
        ? location.hash.slice(6)
        : "";
      if (projects.some((p) => p.id === key)) {
        setSelected(key);
        setDetail("work");
      } else setDetail(sections.includes(key) ? key : null);
    }
    read();
    window.addEventListener("popstate", read);
    window.addEventListener("hashchange", read);
    return () => {
      window.removeEventListener("popstate", read);
      window.removeEventListener("hashchange", read);
    };
  }, []);
  useEffect(() => {
    if (detail) {
      dialog.current?.showModal();
      if (dialog.current) dialog.current.scrollTop = 0;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        const heading = dialog.current?.querySelector<HTMLElement>("h2");
        heading?.setAttribute("tabindex", "-1");
        heading?.focus({ preventScroll: true });
      });
    } else {
      dialog.current?.close();
      document.body.style.overflow = "";
      opener.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [detail]);
  function selectProject(id: string) {
    setSelected(id);
    history.replaceState(history.state, "", `#view/${id}`);
    document.querySelector(".project-reading")?.scrollTo(0, 0);
  }
  return (
    <main className={`workspace ${night ? "evening" : ""}`}>
      <Link className="skip-link" href="/cv">
        Skip to my CV
      </Link>
      <header className="workspace-header">
        <div className="identity">
          <h1>Aruzhan Maratova</h1>
          <span>Student in Aktobe, Kazakhstan</span>
        </div>
        <nav aria-label="Main navigation">
          <button onClick={() => open("work")}>Projects</button>
          <button onClick={() => open("about")}>About me</button>
          <Link className="cv-access" href="/cv">
            One-page CV
          </Link>
        </nav>
      </header>
      <section className="scene-shell" aria-label="My interactive workspace">
        <DeskScene
          onOpen={open}
          night={night}
          reducedMotion={!motion}
          resetKey={reset}
          onHover={setHover}
        />
        <div className="desk-introduction">
          <p>
            Hey, glad you’re here. I’m into cybersecurity, building software and
            teaching robotics.
          </p>
          <span>Make yourself at home. Click around the desk.</span>
        </div>
        <div
          className={`object-hint ${hover ? "visible" : ""}`}
          aria-live="polite"
        >
          {hover || "Explore the desk"}
        </div>
      </section>
      <aside className="scene-tools" aria-label="Workspace controls">
        <button aria-pressed={night} onClick={() => setNight((v) => !v)}>
          <span
            className={`physical-switch ${night ? "on" : ""}`}
            aria-hidden="true"
          />
          {night ? "Evening" : "Daylight"}
        </button>
        <button onClick={() => setReset((v) => v + 1)}>Tidy up</button>
      </aside>
      <div className="workspace-bottom">
        <p className="desk-instruction">
          You can move the photos around.
          <br />
          <span>Everything is also in the menu.</span>
        </p>
        <nav className="object-menu" aria-label="Explore my work">
          <button onClick={() => open("work")}>
            <span className="menu-paper" aria-hidden="true" />
            <span>Projects</span>
          </button>
          <button onClick={() => open("photos")}>
            <span className="menu-photo" aria-hidden="true" />
            <span>Photos</span>
          </button>
          <button onClick={() => open("about")}>
            <span className="menu-about" aria-hidden="true" />
            <span>About me</span>
          </button>
          <button onClick={() => open("extras")}>
            <span className="menu-cube" aria-hidden="true" />
            <span>Off the clock</span>
          </button>
          <button onClick={() => open("contact")}>
            <span className="menu-envelope" aria-hidden="true" />
            <span>Contact</span>
          </button>
        </nav>
        <a className="direct-cv" href="/aruzhan-maratova-cv.pdf" download>
          Download my CV
        </a>
      </div>
      <noscript>
        <div className="noscript-note">
          The interactive desk needs JavaScript. <a href="/cv">Read my CV</a> or{" "}
          <a href="https://github.com/herachxx">view my projects on GitHub</a>.
        </div>
      </noscript>
      <dialog
        ref={dialog}
        className={`reader ${detail === "work" ? "work-reader" : ""}`}
        aria-label={
          detail === "work"
            ? "My projects"
            : detail === "photos"
              ? "Photos and competitions"
              : detail === "contact"
                ? "Contact details"
                : "About me and my interests"
        }
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="reader-top">
          <span>
            {detail === "work"
              ? "Selected work"
              : detail === "photos"
                ? "Photos and competitions"
                : detail === "contact"
                  ? "Get in touch"
                  : detail === "about"
                    ? "About me"
                    : "Off the clock"}
          </span>
          <MusicToggle className="reader-music-toggle" />
          <button
            className="close-reader"
            aria-label="Close window"
            onClick={close}
          >
            Close <i aria-hidden="true" />
          </button>
        </div>
        {detail === "work" ? (
          <div className="project-browser">
            <aside className="project-index">
              <label htmlFor="project-choice">Choose a project</label>
              <select
                id="project-choice"
                value={selected}
                onChange={(e) => selectProject(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <div className="project-index-list">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    aria-pressed={selected === p.id}
                    onClick={() => selectProject(p.id)}
                  >
                    <span>{p.title}</span>
                    <small>{p.category}</small>
                  </button>
                ))}
              </div>
              <a
                className="index-github"
                href="https://github.com/herachxx"
                target="_blank"
                rel="noreferrer"
              >
                All repositories on GitHub
              </a>
            </aside>
            <ProjectReading project={selectedProject} />
          </div>
        ) : (
          <div className="reading-content">
            {detail === "about" && (
              <article>
                <div className="about-opening">
                  <div>
                    <p className="small-label">Hello</p>
                    <h2>Hey, I’m Aruzhan.</h2>
                    <p>
                      Some people call me herachik. I’m a student in Aktobe,
                      Kazakhstan, and I want to study cybersecurity and
                      information security at university.
                    </p>
                  </div>
                  <img
                    src="/images/aruzhan-at-work.jpg"
                    alt="Me working on my sticker-covered laptop"
                  />
                </div>
                <p>
                  I like poking around until I understand how something works.
                  Lately that’s meant CTFs, web security, software projects and
                  Linux systems. I’ve been getting deeper into SQL injection,
                  XSS and path traversal with Burp Suite and sqlmap.
                </p>
                <p>
                  Give me a terminal and I’m happy. CMD, PowerShell, Bash,
                  Zsh... I even have Termux on my phone. I also teach robotics,
                  work on electronics and occasionally end up with a CubeSat
                  prototype on the project list.
                </p>
                <div className="about-facts">
                  <div>
                    <span>School</span>
                    <strong>Aqbobek Lyceum</strong>
                  </div>
                  <div>
                    <span>Languages</span>
                    <strong>Kazakh, Russian, English</strong>
                  </div>
                  <div>
                    <span>Current focus</span>
                    <strong>Web security</strong>
                  </div>
                </div>
                <div className="reading-actions">
                  <Link className="solid-button" href="/cv">
                    Read my CV
                  </Link>
                  <button
                    className="plain-button"
                    onClick={() => open("extras")}
                  >
                    A few other things about me
                  </button>
                </div>
              </article>
            )}
            {detail === "photos" && (
              <article>
                <h2>A few photos, a lot of memories.</h2>
                <div className="photo-spread">
                  <figure>
                    <img
                      src="/images/kazhackstan.jpg"
                      alt="Me with my KazHackStan certificate and souvenirs"
                    />
                    <figcaption>KazHackStan, September 2026</figcaption>
                  </figure>
                  <div>
                    <p className="big-result">9th of 40</p>
                    <p>
                      ICO 2027 Kazakhstan National Selection Final in Astana.
                    </p>
                    <p>
                      That’s me after the national final. If you’d rather see
                      the challenges than the souvenirs, I wrote up all ten
                      solves from the online qualifier.
                    </p>
                    <a
                      className="underlined-link"
                      href="https://github.com/herachxx/ico-2027"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Read the writeups
                    </a>
                  </div>
                </div>
                <div className="recognition-list">
                  <p>
                    <strong>World Space Olympiad</strong>
                    <span>
                      Second place in the final with Team AXIS and our ARAL
                      WATCH prototype, February 2026.
                    </span>
                  </p>
                  <p>
                    <strong>AisHack</strong>
                    <span>
                      Innovation and Technology recognition for the Suerte
                      browser extension, 2026.
                    </span>
                  </p>
                  <p>
                    <strong>Akbota and Bebras</strong>
                    <span>
                      First and second place respectively in regional
                      competitions, November 2025.
                    </span>
                  </p>
                  <p>
                    <strong>KazRoboDrone</strong>
                    <span>
                      City qualifying-round wins in editions 2.0 and 3.0.
                    </span>
                  </p>
                </div>
              </article>
            )}
            {detail === "contact" && (
              <article className="contact-reading">
                <p className="small-label">Get in touch</p>
                <h2>Say hello.</h2>
                <p>
                  Tell me what you’re building, send me a playlist, or just say
                  hey. University and work conversations are welcome here, too.
                </p>
                <a
                  href="https://www.linkedin.com/in/aruzhan-maratova/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Find me on LinkedIn
                </a>
                <a
                  href="https://github.com/herachxx"
                  target="_blank"
                  rel="noreferrer"
                >
                  See my GitHub
                </a>
                <a href="/aruzhan-maratova-cv.pdf" download>
                  Download my CV
                </a>
              </article>
            )}
            {detail === "extras" && (
              <article>
                <p className="small-label">Off the clock</p>
                <h2>Okay, enough about work.</h2>
                <p>
                  Give me a pixel world and room to wander and I’m happy.
                  Terraria, Minecraft, Stardew Valley... I love that kind of
                  game. I’m also very easily tempted by sudoku, Block Blast or a
                  game of durak.
                </p>
                <div className="extras-choices">
                  <button onClick={() => open("guitar")}>
                    <span className="string-preview" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    <strong>Guitar</strong>
                    <span>Try the strings</span>
                  </button>
                  <button onClick={() => open("cube")}>
                    <span className="cube-preview" aria-hidden="true">
                      {Array.from({ length: 9 }, (_, i) => (
                        <i key={i} />
                      ))}
                    </span>
                    <strong>Rubik’s cubes</strong>
                    <span>Something to fidget with</span>
                  </button>
                  <button onClick={() => open("sudoku")}>
                    <span className="sudoku-preview" aria-hidden="true">
                      {[
                        5,
                        3,
                        "",
                        "",
                        7,
                        "",
                        "",
                        "",
                        "",
                        6,
                        "",
                        "",
                        1,
                        9,
                        5,
                        "",
                        "",
                        "",
                        "",
                        9,
                        8,
                        "",
                        "",
                        "",
                        "",
                        6,
                        "",
                        8,
                        "",
                        "",
                        "",
                        6,
                        "",
                        "",
                        "",
                        3,
                        4,
                        "",
                        "",
                        8,
                        "",
                        3,
                        "",
                        "",
                        1,
                        7,
                        "",
                        "",
                        "",
                        2,
                        "",
                        "",
                        "",
                        6,
                        "",
                        6,
                        "",
                        "",
                        "",
                        "",
                        2,
                        8,
                        "",
                        "",
                        "",
                        "",
                        4,
                        1,
                        9,
                        "",
                        "",
                        5,
                        "",
                        "",
                        "",
                        "",
                        8,
                        "",
                        "",
                        7,
                        9,
                      ].map((n, i) => (
                        <i key={i}>{n}</i>
                      ))}
                    </span>
                    <strong>Sudoku</strong>
                    <span>Stay for a puzzle?</span>
                  </button>
                </div>
                <div className="reading-actions">
                  <button
                    className="plain-button"
                    onClick={() => open("music")}
                  >
                    My music and playlist
                  </button>
                  <button
                    className="plain-button"
                    onClick={() => open("photos")}
                  >
                    Competition photos
                  </button>
                </div>
                <p>
                  I’m into electronics, lock picking and drones, and I want to
                  build a cyberdeck. I like making things with my hands as much
                  as working in a terminal.
                </p>
                <p className="caption">
                  Tea, headphones and low light are my kind of evening. Also,
                  pandas. Especially pandas wearing tiny hats. There’s a cat
                  hiding on this desk, too, if you feel like finding it.
                </p>
              </article>
            )}
            {detail === "music" && (
              <article className="music-reading">
                <p className="small-label">Music</p>
                <h2>Usually, headphones on.</h2>
                <p>
                  I really, really love music. Lil Peep, Alex G, Nirvana, some
                  metal... it depends on the day. Here’s the playlist if you
                  want to listen along.
                </p>
                <PersonalPlaylist />
                <div className="reading-actions">
                  <button
                    className="plain-button"
                    onClick={() => open("guitar")}
                  >
                    I play guitar, too
                  </button>
                  <button
                    className="plain-button"
                    onClick={() => open("extras")}
                  >
                    My other interests
                  </button>
                </div>
              </article>
            )}
            {detail === "sudoku" && (
              <article>
                <button className="back-link" onClick={() => open("extras")}>
                  Back to my interests
                </button>
                <h2>Fancy a sudoku?</h2>
                <Sudoku />
              </article>
            )}
            {detail === "guitar" && (
              <article>
                <button className="back-link" onClick={() => open("extras")}>
                  Back to my interests
                </button>
                <h2>Guitar.</h2>
                <Guitar />
              </article>
            )}
            {detail === "cube" && (
              <article>
                <button className="back-link" onClick={() => open("extras")}>
                  Back to my interests
                </button>
                <h2>One more turn.</h2>
                <Cube />
              </article>
            )}
            {detail === "secret" && (
              <article className="cat-reading">
                <h2>You found the cat.</h2>
                <img
                  src="/images/cat-break.jpg"
                  alt="A cat asleep over an old computer monitor"
                />
                <p>
                  There you are. I love this picture. That monitor looks like a
                  perfectly reasonable place for a nap.
                </p>
                <code>flag&#123;take_a_break&#125;</code>
              </article>
            )}
          </div>
        )}
      </dialog>
    </main>
  );
}

function ProjectReading({ project: p }: { project: Project }) {
  return (
    <article className="project-reading">
      <div className="project-context">
        <span>{p.category}</span>
        <span>{p.year}</span>
      </div>
      <h2>{p.title}</h2>
      <p className="project-summary">{p.summary}</p>
      <p className="project-role">{p.role}</p>
      {p.image && (
        <figure className="project-figure">
          <a href={p.image} target="_blank" rel="noreferrer">
            <img src={p.image} alt={p.imageAlt || p.title} />
          </a>
          <figcaption>
            This is the original screenshot. Click it if you’d like a closer
            look.
          </figcaption>
        </figure>
      )}
      <h3>What I worked on</h3>
      {p.details.map((d, i) => (
        <p key={i}>{d}</p>
      ))}
      {p.status && <p className="project-status">{p.status}</p>}
      <div className="reading-actions">
        {p.url && (
          <a
            className="solid-button"
            href={p.url}
            target="_blank"
            rel="noreferrer"
          >
            {p.id === "vox"
              ? "View incubator certificate"
              : p.id === "teaching"
                ? "Aqbobek IT Camp"
                : "Have a look at the source"}
          </a>
        )}
        <Link className="underlined-link" href="/cv">
          My full CV
        </Link>
      </div>
    </article>
  );
}
