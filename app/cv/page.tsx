import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "One-page CV: Aruzhan Maratova",
  description:
    "Education, cybersecurity projects, engineering experience and achievements of Aruzhan Maratova.",
};

export default function CVPage() {
  return (
    <main className="cv-page">
      <nav className="cv-toolbar" aria-label="CV actions">
        <Link href="/">Back to my desk</Link>
        <a href="/aruzhan-maratova-cv.pdf" download>
          Download PDF
        </a>
      </nav>
      <article className="cv-sheet">
        <header>
          <p className="eyebrow">Cybersecurity, software and robotics</p>
          <h1>Aruzhan Maratova</h1>
          <p className="cv-intro">
            I study cybersecurity, build web tools and teach robotics. I’m
            interested in penetration testing, security research and
            understanding how systems work.
          </p>
          <div className="cv-contact">
            <span>Aktobe, Kazakhstan</span>
            <a href="https://github.com/herachxx">GitHub: herachxx</a>
            <a href="https://www.linkedin.com/in/aruzhan-maratova/">LinkedIn</a>
          </div>
        </header>
        <div className="cv-grid">
          <div>
            <section aria-labelledby="experience-title">
              <h2 id="experience-title">Experience</h2>
              <h3>MEDX Research &amp; Education</h3>
              <small>Head Web &amp; Tech, then CTO, July 2026 to present</small>
              <p>
                Website redesign, responsive UI and GitHub workflows. Technical
                planning for authentication, databases, learning content and
                deployment.
              </p>
              <h3>NSRI: Director of Technology</h3>
              <small>2026</small>
              <p>
                Research-event websites, responsive interfaces, Supabase
                messaging, chapter permissions and DNS/domain work.
              </p>
              <h3>JAS URPAQ: Full-stack &amp; systems</h3>
              <small>June 2026 to present</small>
              <p>
                Frontend and SQL structure; prepared a physical Ubuntu Server
                PC. Worked on SSH, DNS, deployment planning and client network
                troubleshooting.
              </p>
              <h3>VOX (Suerte): Founder &amp; co-developer</h3>
              <small>2026</small>
              <p>
                Voice-controlled browser tool for clinical workflows. Customer
                interviews, a rehabilitation-centre pilot, product iteration and
                backend/security planning with the team.
              </p>
              <h3>Aqbobek IT Camp: Robotics instructor</h3>
              <small>July to September 2026</small>
              <p>
                Taught three groups, ages 6 to 15, using LEGO EV3, SPIKE Prime,
                WeDo, Scratch and Tinkercad. Supported up to 29 students.
              </p>
            </section>
            <section aria-labelledby="projects-title">
              <h2 id="projects-title">Selected projects</h2>
              <p>
                <strong>
                  <a href="https://github.com/herachxx/ico-2027">
                    ICO writeups
                  </a>
                </strong>
                . Ten qualifying challenges across web security, reverse
                engineering, forensics, cryptography and binary exploitation.
              </p>
              <p>
                <strong>
                  <a href="https://github.com/herachxx/the-glass-box">
                    The Glass Box
                  </a>
                </strong>
                . Educational Python password manager with readable
                cryptographic steps and vault integrity checks. Not for
                production use.
              </p>
              <p>
                <strong>
                  <a href="https://github.com/herachxx/cipher">CIPH3R</a> and{" "}
                  <a href="https://github.com/herachxx/ip-toolkit">
                    IP Toolkit
                  </a>
                </strong>
                . Browser and Python tools for IP/domain investigation, DNS,
                WHOIS and network diagnostics.
              </p>
              <p>
                <strong>ARAL WATCH, Team AXIS</strong>. CubeSat 1U
                environmental-monitoring prototype. Systems engineering,
                requirements and documentation.
              </p>
            </section>
          </div>
          <div>
            <section aria-labelledby="education-title">
              <h2 id="education-title">Education</h2>
              <h3>Aqbobek Lyceum</h3>
              <small>Expected graduation: May 2027</small>
              <p>
                Informatics and mathematics track.
                <br />
                Aktobe, Kazakhstan.
              </p>
            </section>
            <section aria-labelledby="achievements-title">
              <h2 id="achievements-title">Selected achievements</h2>
              <h3>ICO national selection: 9th of 40</h3>
              <p>
                Kazakhstan final for ICO 2027, held at KazHackStan in September
                2026.
              </p>
              <h3>World Space Olympiad: 2nd</h3>
              <p>
                Final, Team AXIS, ARAL WATCH.
                <br />
                February 2026.
              </p>
              <h3>AisHack: Suerte</h3>
              <p>
                Innovation and Technology recognition, browser-extension
                category, 2026.
              </p>
              <p>
                <strong>Akbota:</strong> 1st, regional science competition,
                November 2025.
              </p>
              <p>
                <strong>Bebras:</strong> 2nd, regional informatics olympiad,
                November 2025.
              </p>
            </section>
            <section aria-labelledby="skills-title">
              <h2 id="skills-title">Tools &amp; interests</h2>
              <p>
                Python, JavaScript, HTML/CSS, SQL, Git, Linux/Ubuntu, SSH, DNS,
                Supabase, Arduino and LEGO robotics.
              </p>
              <p>
                Web security practice with Burp Suite and sqlmap, including SQL
                injection, XSS and path traversal.
              </p>
              <p>
                Shells: Windows Command Prompt and PowerShell; Linux bash and
                zsh.
              </p>
            </section>
            <section aria-labelledby="languages-title">
              <h2 id="languages-title">Languages</h2>
              <p>
                Kazakh: native
                <br />
                Russian: fluent
                <br />
                English: IELTS Academic 6.5
                <br />
                <small>Test: July 2026, CEFR B2</small>
              </p>
            </section>
          </div>
        </div>
        <footer className="cv-bottom">Updated November 2026</footer>
      </article>
    </main>
  );
}
