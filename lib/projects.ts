export type Project = {
  id: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  role: string;
  details: string[];
  url?: string;
  image?: string;
  imageAlt?: string;
  status?: string;
};

export const projects: Project[] = [
  {
    id: "ico",
    title: "ICO CTF writeups",
    category: "Cybersecurity",
    year: "2026",
    summary:
      "Come have a look at my CTF notes. Ten challenges, the commands I ran and the steps that finally made things click.",
    role: "Competitor, writeup author",
    details: [
      "I solved all ten challenges in the ICO 2027 Kazakhstan online qualifier. There was a bit of everything: reverse engineering, forensics, web security, cryptography and binary exploitation.",
      "I kept the wrong turns in the writeups, too. If you like seeing how someone actually gets to a solution, that’s probably the most useful part. I finished fourth in the qualifier; the original scoreboard is in the repo.",
      "Then came the Kazakhstan national selection final at KazHackStan in September 2026, where I placed 9th of 40. The qualifier and the national final were separate rounds.",
    ],
    url: "https://github.com/herachxx/ico-2027/blob/main/ico_qualifying_round/ico_ctf_writeup.md",
    image: "/images/projects/ico-qualifier-scoreboard.png",
    imageAlt:
      "Original screenshot of the online qualifying-round scoreboard showing herachxx in fourth place. This is separate from the later national-final result of ninth out of forty.",
    status: "10 qualifying challenges documented",
  },
  {
    id: "glass-box",
    title: "The Glass Box",
    category: "Cybersecurity",
    year: "2026",
    summary:
      "I wanted to understand what an encrypted vault is actually doing. So I built a small Python password manager where you can follow the steps.",
    role: "Developer",
    details: [
      "The code is readable on purpose. I wrote the AES-CBC operations, the vault format and a SHA-256 round visualizer. For key derivation and message authentication, I used Python’s standard library.",
      "If you open the repo, you’ll find the crypto, file handling and CLI in separate parts. The vault checks its authentication tag before it tries to decrypt anything.",
      "Please keep your real passwords out of this one. It’s a learning project, and the security policy says exactly that.",
    ],
    url: "https://github.com/herachxx/the-glass-box",
    status: "Educational project, Python",
  },
  {
    id: "cipher",
    title: "CIPH3R & IP Toolkit",
    category: "Cybersecurity",
    year: "2026",
    summary:
      "A terminal version and a browser version of my IP and domain tools. You can probably guess which interface I prefer.",
    role: "Developer",
    details: [
      "IP Toolkit puts WHOIS, DNS lookups, common TCP-port probes, network tracing and timestamped logs together in Python. It’s the command-line side of the project.",
      "CIPH3R is the browser side. That meant adapting the tools to HTTP APIs for registration data, DNS and certificate-transparency records, because a browser can’t use raw sockets the way Python can.",
      "You’re welcome to read the source and try the tools. Just keep their limits in mind: they’re learning projects, the browser relies on external services, and its HTTP timing is different from an ICMP ping.",
    ],
    url: "https://github.com/herachxx/cipher",
    status: "Python, JavaScript, public source",
  },
  {
    id: "vox",
    title: "VOX / Suerte",
    category: "Product development",
    year: "2026",
    summary:
      "With team Suerte, I worked on a voice-controlled browser tool for repetitive tasks in clinical systems.",
    role: "Founder, product and technical development",
    details: [
      "My part included customer interviews, a pilot at a rehabilitation centre and figuring out what to change after people tried it. I also worked with the team on backend, architecture and security decisions.",
      "Trying it in the centre gave us plenty to work on: installation, connecting to the existing clinical system and getting dictation to behave. Those were the things we had to come back to.",
      "We completed the Terricon Valley GrowthHack incubator from June to August 2026. Suerte also received Innovation and Technology recognition in AisHack’s browser-extension category. I’ve linked our incubator certificate below.",
    ],
    url: "/documents/vox-incubator-certificate.pdf",
    status: "Team project, pilot and iteration",
  },
  {
    id: "aral-watch",
    title: "ARAL WATCH",
    category: "Hardware",
    year: "2026",
    summary:
      "Meet ARAL WATCH, the little CubeSat 1U prototype I worked on with Team AXIS.",
    role: "Systems engineering, requirements and documentation",
    details: [
      "We brought together environmental sensors, GPS, LoRa telemetry and local storage in a CubeSat 1U prototype. The idea was to collect environmental data and get it back out in a useful form.",
      "My part was systems engineering: working out the requirements, writing the documentation and keeping our engineering choices tied to what we wanted to measure.",
      "We took second place in the World Space Olympiad final in February 2026. And just to be clear about the scale of this: we built a prototype. We haven’t sent it into orbit.",
    ],
    status: "Team AXIS, 2nd place, World Space Olympiad final",
  },
  {
    id: "nsri",
    title: "NSRI",
    category: "Web & systems",
    year: "2026",
    summary:
      "This is my work on the web side of NSRI: event sites, community tools and the setup behind them.",
    role: "Director of Technology",
    details: [
      "I built responsive sites for events and outreach, worked on messaging with Supabase storage, and handled domains and deployment. The linked repo is one of those event sites, if you’d like to look around the code.",
      "I also worked through chapter-permission issues and helped coordinate technical work. I started as an ambassador and later became Director of Technology.",
      "My contribution here was web development and community technology. The repository shows an actual piece of that work.",
    ],
    url: "https://github.com/herachxx/NSRI-research-hackathon",
    status: "Community technology",
  },
  {
    id: "medx",
    title: "MEDX Research & Education",
    category: "Web & systems",
    year: "2026",
    summary:
      "I joined MEDX to work on its website, then took on the CTO role. Here’s what that involved.",
    role: "Head Web & Tech, then CTO",
    details: [
      "I started as Head Web & Tech in July 2026 and became CTO in August.",
      "I worked on the redesign, made the interfaces responsive, helped with our GitHub workflow and built a local tool for reviewing team activity.",
      "I also planned the next pieces: authentication, data storage, learning content and deployment. Those were plans for the platform’s next stages, so I’m keeping them separate from the work already built.",
    ],
    url: "https://github.com/herachxx/medx-research-landing-page",
    status: "Technical leadership, web development",
  },
  {
    id: "ubuntu",
    title: "JAS URPAQ",
    category: "Web & systems",
    year: "2026",
    summary:
      "This one involved frontend code, SQL and an actual PC I prepared to run Ubuntu Server.",
    role: "Full-stack developer, systems engineer",
    details: [
      "I worked on the frontend and SQL structure, then prepared the physical server machine. I like command-line work, so the systems side belongs here just as much as the website.",
      "There was SSH and DNS setup and deployment planning. Two LAN ports had no internet access, so router and client-network troubleshooting became part of the job, too.",
      "My contribution covered the application, local server preparation and the network setup needed before deployment.",
    ],
    status: "Ubuntu Server, SQL, networking",
  },
  {
    id: "teaching",
    title: "Teaching robotics",
    category: "Teaching",
    year: "2026",
    summary:
      "I also teach robots. Well, mostly the kids building them. I taught ages 6 to 15 at Aqbobek IT Camp.",
    role: "IT & robotics instructor, July to September",
    details: [
      "I worked with three groups, up to 29 students, using LEGO EV3, SPIKE Prime, WeDo 2.0, Scratch and Tinkercad.",
      "We built robots for line-following, sumo and obstacle tasks. I adjusted explanations for different ages and languages, and helped keep the classroom equipment working.",
      "If an explanation didn’t land, I had to find another way to say it. That was as much a part of teaching as the code and the robots.",
    ],
    url: "https://www.instagram.com/aqbobek_itcamp/",
    status: "3 groups, ages 6 to 15",
  },
];
