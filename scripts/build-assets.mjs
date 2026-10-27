// Generates the SVG cards used by README.md. Run: node scripts/build-assets.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = new URL("../assets/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const W = 880;
const C = {
  bg: "#0D1117",
  card: "#161B22",
  chip: "#1C2230",
  border: "#30363D",
  text: "#E6EDF3",
  body: "#C9D1D9",
  muted: "#8B949E",
  blue: "#58A6FF",
  green: "#7EE787",
  purple: "#BC8CFF",
};
const SANS = "-apple-system, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const MONO_CH = 0.62; // conservative monospace advance, in em
const SANS_CH = 0.53; // conservative average sans advance, in em

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const svg = (w, h, body, extraStyle = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<style>
  .sans { font-family: ${SANS}; }
  .mono { font-family: ${MONO}; }
  ${extraStyle}
</style>
<defs>
  <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.blue}"/>
    <stop offset="1" stop-color="${C.purple}"/>
  </linearGradient>
  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
    <path d="M24 0H0V24" fill="none" stroke="${C.border}" stroke-opacity="0.35" stroke-width="1"/>
  </pattern>
</defs>
${body}
</svg>
`;

const write = (name, content) => writeFileSync(new URL(name, OUT), content);

// Wraps text into lines that fit maxWidth, using an estimated advance per character.
function wrap(text, maxWidth, fontSize, ch = SANS_CH) {
  const max = Math.floor(maxWidth / (fontSize * ch));
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Lays out chips left to right, wrapping inside [x0, x0 + maxWidth]. Returns markup and height used.
function chips(items, x0, y0, maxWidth, { size = 12, gap = 8, rowGap = 10, color = C.body } = {}) {
  const h = size + 14;
  let x = x0;
  let y = y0;
  let out = "";
  for (const item of items) {
    const w = Math.ceil(item.length * size * MONO_CH) + 22;
    if (x + w > x0 + maxWidth && x > x0) {
      x = x0;
      y += h + rowGap;
    }
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${C.chip}" stroke="${C.border}"/>`;
    out += `<text x="${x + w / 2}" y="${y + h / 2}" class="mono" font-size="${size}" fill="${color}" text-anchor="middle" dominant-baseline="central">${esc(item)}</text>`;
    x += w + gap;
  }
  return { out, height: y - y0 + h };
}

const frame = (h, inner) =>
  `<rect x="0.5" y="0.5" width="${W - 1}" height="${h - 1}" rx="14" fill="${C.card}" stroke="${C.border}"/>${inner}`;

// Wraps text containing **bold** spans. Returns lines of words, each a list of [text, bold] runs,
// so punctuation right after a bold span stays attached to it.
function wrapRich(text, maxWidth, fontSize, ch = 0.5) {
  const words = [];
  let glue = false;
  text.split(/(\*\*[^*]+\*\*)/).forEach((part) => {
    if (!part) return;
    const bold = part.startsWith("**");
    const raw = part.replace(/\*\*/g, "");
    raw.split(" ").forEach((w, i) => {
      if (!w) return;
      if (i === 0 && glue && words.length) words.at(-1).push([w, bold]);
      else words.push([[w, bold]]);
    });
    glue = !raw.endsWith(" ");
  });
  const lines = [[]];
  let width = 0;
  for (const word of words) {
    const ww = word.reduce((n, [w, bold]) => n + w.length * fontSize * (bold ? ch + 0.04 : ch), fontSize * ch);
    if (width + ww > maxWidth && lines.at(-1).length) {
      lines.push([]);
      width = 0;
    }
    lines.at(-1).push(word);
    width += ww;
  }
  return lines;
}

// ---------- About ----------
const ABOUT = [
  "Owning and developing products from **architecture** to **production** for **8+ years**, across **legal-tech**, **healthcare**, **fintech**, **e-commerce**, and **AI**.",
  "I'm fluent in both **web** and **AI**. I build everything from **complex UIs** to integrated **REST APIs** with **React**, **Node**, and **Python**, and AI features from **document processing** and **image generation** to **prompt optimization**, using **LLMs** and **RAG**.",
  "I also own what surrounds the code: **system design**, **CI/CD**, and **cloud infrastructure** on **AWS** and **GCP**. I've led teams, set code and delivery standards, and I work directly with clients to turn what they need into features that ship.",
];
{
  const PAD = 36;
  const SIZE = 16;
  const LINE = 27;
  let inner = `<text x="${PAD}" y="44" class="mono" font-size="13"><tspan fill="${C.green}">➜</tspan><tspan fill="${C.blue}" dx="10">~</tspan><tspan fill="${C.body}" dx="10">cat about.md</tspan></text>`;
  let y = 84;
  ABOUT.forEach((para, i) => {
    for (const line of wrapRich(para, W - PAD * 2 - 24, SIZE)) {
      const spans = line
        .map((word) =>
          word
            .map(([w, bold]) =>
              bold
                ? `<tspan font-weight="700" fill="${C.text}">${esc(w)}</tspan>`
                : `<tspan fill="${C.body}">${esc(w)}</tspan>`
            )
            .join("")
        )
        .join(" ");
      inner += `<text x="${PAD + 24}" y="${y}" class="sans" font-size="${SIZE}" xml:space="preserve">${spans}</text>`;
      y += LINE;
    }
    if (i < ABOUT.length - 1) y += 14;
  });
  inner += `<rect x="${PAD}" y="66" width="3" height="${y - 66 - LINE + 10}" rx="1.5" fill="url(#accent)"/>`;
  const H = y + 8;
  write("about.svg", svg(W, H, frame(H, inner)));
}

// ---------- Header ----------
{
  const H = 250;
  const roles = [
    "Sr. Full Stack & AI Engineer",
    "React · Node · Python · AWS",
    "LLMs · RAG · Agents",
    "From architecture to production",
  ];
  const n = roles.length;
  const dur = n * 3;
  const roleText = roles
    .map(
      (r, i) =>
        `<text x="48" y="186" class="mono role r${i}" font-size="18" fill="${C.blue}">${esc(r)}</text>`
    )
    .join("");
  const roleStyle =
    // r0 stays visible where animations don't run.
    `.role { opacity: 0; animation: cycle ${dur}s infinite; }\n  .r0 { opacity: 1; }\n` +
    roles.map((_, i) => `  .r${i} { animation-delay: ${i * 3}s; }`).join("\n") +
    `\n  @keyframes cycle { 0% { opacity: 0; transform: translateY(6px); } 3% { opacity: 1; transform: translateY(0); } ${(100 / n) - 3}% { opacity: 1; } ${100 / n}% { opacity: 0; } 100% { opacity: 0; } }` +
    `\n  .cursor { animation: blink 1s steps(1) infinite; } @keyframes blink { 50% { opacity: 0; } }` +
    `\n  .glow { animation: pulse 6s ease-in-out infinite; } @keyframes pulse { 50% { opacity: 0.55; } }`;

  const body = `
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="${C.bg}" stroke="${C.border}"/>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="url(#grid)"/>
<radialGradient id="g1" cx="0.85" cy="0.1" r="0.6"><stop offset="0" stop-color="${C.purple}" stop-opacity="0.28"/><stop offset="1" stop-color="${C.purple}" stop-opacity="0"/></radialGradient>
<radialGradient id="g2" cx="0.1" cy="1" r="0.6"><stop offset="0" stop-color="${C.blue}" stop-opacity="0.22"/><stop offset="1" stop-color="${C.blue}" stop-opacity="0"/></radialGradient>
<rect class="glow" x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="url(#g1)"/>
<rect class="glow" x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="url(#g2)"/>
<path d="M1 44H${W - 1}" stroke="${C.border}"/>
<circle cx="26" cy="22" r="6" fill="#FF5F57"/><circle cx="46" cy="22" r="6" fill="#FEBC2E"/><circle cx="66" cy="22" r="6" fill="#28C840"/>
<text x="${W / 2}" y="27" class="mono" font-size="12" fill="${C.muted}" text-anchor="middle">~/eric-souza — zsh</text>
<text x="48" y="88" class="mono" font-size="15"><tspan fill="${C.green}">➜</tspan><tspan fill="${C.blue}" dx="10">~</tspan><tspan fill="${C.body}" dx="10">whoami</tspan></text>
<text x="46" y="142" class="sans" font-size="40" font-weight="700" fill="${C.text}">Eric de Oliveira Souza</text>
<text x="48" y="186" class="mono" font-size="18" fill="${C.muted}">&gt;</text>
<g transform="translate(20 0)">${roleText}</g>
<text x="48" y="218" class="mono" font-size="15"><tspan fill="${C.green}">➜</tspan><tspan fill="${C.blue}" dx="10">~</tspan><tspan class="cursor" fill="${C.blue}" dx="10">▍</tspan></text>
<text x="${W - 40}" y="218" class="mono" font-size="12" fill="${C.muted}" text-anchor="end">8+ years · legal-tech · healthcare · fintech · e-commerce · AI</text>`;
  write("header.svg", svg(W, H, body, roleStyle));
}

// ---------- Link buttons ----------
for (const [name, label] of [
  ["portfolio", "portfolio"],
  ["linkedin", "linkedin"],
  ["email", "email"],
  ["medium", "medium"],
]) {
  const text = `${label} ↗`;
  const w = Math.ceil(text.length * 13 * MONO_CH) + 36;
  const h = 36;
  const body = `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="18" fill="${C.card}" stroke="${C.border}"/>
<text x="${w / 2}" y="${h / 2}" class="mono" font-size="13" fill="${C.blue}" text-anchor="middle" dominant-baseline="central">${esc(text)}</text>`;
  write(`btn-${name}.svg`, svg(w, h, body));
}

// ---------- Skills ----------
{
  const groups = [
    ["frontend", ["JavaScript", "TypeScript", "React", "Next.js", "Material UI", "Bootstrap", "Redux", "Framer Motion", "HTML/CSS", "Styled Components", "Tailwind CSS", "TanStack Query"]],
    ["backend", ["Node.js", "NestJS", "Express", "Python", "FastAPI", "Flask", "RESTful APIs", "WebSockets"]],
    ["ai_engineering", ["AI Integrations", "LLMs", "OpenAI", "Amazon Bedrock", "LiteLLM", "RAG", "LangChain", "FastAPI", "Document Processing", "fal.ai", "nano-banana"]],
    ["ai_tools", ["Cursor", "Claude", "Claude Code", "ChatGPT", "Cursor Bugbot", "AI-Assisted Development"]],
    ["cloud_devops", ["AWS (S3, EC2, RDS, Lambda, CloudFront, ACM, IAM, Bedrock)", "GCP (Cloud Run, Cloud SQL, Pub/Sub, API Gateway)", "Azure (Blob)", "Terraform", "Docker", "Kubernetes", "GitHub Actions", "CI/CD", "Datadog"]],
    ["architecture", ["Microservices", "Service-Oriented Architecture", "Apache Kafka", "Event-Driven Systems", "System Design"]],
    ["data", ["PostgreSQL", "DynamoDB", "MongoDB", "SQLite", "Redis", "TypeORM", "Sequelize", "Mongoose", "Prisma", "dbt"]],
    ["testing_quality", ["Jest", "Vitest", "Code Review", "E2E Testing"]],
    ["tools_practices", ["Git", "GitHub", "Jira", "Linear", "Shortcut", "Google Analytics 4", "Agile", "Technical Documentation"]],
  ];
  const PAD = 32;
  const LABEL_W = 170;
  let y = 76;
  let inner = `<text x="${PAD}" y="44" class="mono" font-size="13" fill="${C.muted}"><tspan fill="${C.purple}">const</tspan> <tspan fill="${C.text}">stack</tspan> = {</text>`;
  groups.forEach(([label, items], i) => {
    const res = chips(items, PAD + LABEL_W, y, W - PAD * 2 - LABEL_W);
    inner += `<text x="${PAD + 20}" y="${y + 13}" class="mono" font-size="13" fill="${C.blue}" dominant-baseline="central">${label}<tspan fill="${C.muted}">:</tspan></text>`;
    inner += res.out;
    y += res.height;
    if (i < groups.length - 1) {
      y += 14;
      inner += `<path d="M${PAD + 20} ${y}H${W - PAD}" stroke="${C.border}" stroke-opacity="0.6" stroke-dasharray="2 4"/>`;
      y += 14;
    }
  });
  y += 24;
  inner += `<text x="${PAD}" y="${y + 6}" class="mono" font-size="13" fill="${C.muted}">};</text>`;
  const H = y + 34;
  write("skills.svg", svg(W, H, frame(H, inner)));
}

// ---------- Projects ----------
const projects = [
  {
    file: "project-job-copilot",
    kind: "LLM Agent · RAG",
    title: "Job Application Copilot",
    repo: "Eric-Souza/job-application-copilot",
    desc: "LangGraph agent that tailors a resume to a job posting. Every bullet cites resume evidence, and a person reviews the draft before it's final. Streams each step to a React UI.",
    tags: ["Python", "LangGraph", "FastAPI", "Gemini", "pgvector", "Postgres", "React", "TypeScript"],
  },
  {
    file: "project-profile-mcp",
    kind: "MCP · AI Tooling",
    title: "Profile MCP Server",
    repo: "Eric-Souza/profile-mcp-server",
    desc: "MCP server that gives AI assistants live access to my GitHub projects, Medium articles, and work experience, over stdio or HTTP. It also feeds the Job Application Copilot.",
    tags: ["TypeScript", "Node.js", "MCP SDK", "Zod", "Vitest"],
  },
  {
    file: "project-gemini-rag",
    kind: "RAG · Document AI",
    title: "Gemini RAG Doc Processing",
    repo: "Eric-Souza/gemini-rag-doc-processing",
    desc: "Upload documents and chat with them. Embeds with Google Gemini, retrieves with Chroma, and orchestrates answers with LangChain and LangGraph.",
    tags: ["Python", "FastAPI", "LangChain", "LangGraph", "Gemini", "Chroma", "React", "TypeScript"],
  },
  {
    file: "project-travel-planner",
    kind: "RAG · Local LLM · Mobile",
    title: "Travel Planner",
    repo: "Eric-Souza/travel-planner-api",
    desc: "Local-first AI travel planner. A FastAPI back end handles RAG over uploaded bookings and streams responses over SSE to an Expo / React Native app.",
    tags: ["Python", "FastAPI", "LangChain", "Ollama", "pgvector", "React Native", "TypeScript"],
  },
  {
    file: "project-dispatchbot",
    kind: "LLM Agent",
    title: "DispatchBot",
    repo: "Eric-Souza/job-dispatch-bot",
    desc: "SMS-style booking agent for home-services businesses. The LLM handles the conversation, and code validates every job server-side before it's stored.",
    tags: ["Python", "FastAPI", "OpenAI Responses API", "Next.js", "Tailwind CSS"],
  },
  {
    file: "project-lakeside",
    kind: "Healthcare · Full Stack",
    title: "Lakeside Session Review Console",
    repo: "Eric-Souza/therapy-session-review-test",
    desc: "Clinical review console where clinicians finalize session notes and supervisors oversee the practice. Appointments arrive via a signed vendor webhook.",
    tags: ["TypeScript", "NestJS", "TypeORM", "Postgres", "React", "Redux Toolkit", "Jest", "Vitest"],
  },
];

projects.forEach((p, i) => {
  const PAD = 36;
  const innerW = W - PAD * 2;
  let inner = "";
  inner += `<text x="${PAD}" y="42" class="mono" font-size="12" fill="${C.green}">${String(i + 1).padStart(2, "0")}<tspan fill="${C.muted}" dx="10">// ${esc(p.kind)}</tspan></text>`;
  inner += `<text x="${W - PAD}" y="42" class="mono" font-size="12" fill="${C.muted}" text-anchor="end">${esc(p.repo)} <tspan fill="${C.blue}">↗</tspan></text>`;
  inner += `<text x="${PAD}" y="80" class="sans" font-size="24" font-weight="700" fill="${C.text}">${esc(p.title)}</text>`;
  let y = 112;
  for (const line of wrap(p.desc, innerW, 15)) {
    inner += `<text x="${PAD}" y="${y}" class="sans" font-size="15" fill="${C.body}">${esc(line)}</text>`;
    y += 24;
  }
  y += 6;
  const res = chips(p.tags, PAD, y, innerW);
  inner += res.out;
  const H = y + res.height + 32;
  const body =
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="${C.card}" stroke="${C.border}"/>` +
    `<rect x="1" y="24" width="3" height="${H - 48}" rx="1.5" fill="url(#accent)"/>` +
    inner;
  write(`${p.file}.svg`, svg(W, H, body));
});

// ---------- Footer ----------
{
  const H = 64;
  const body = `<text x="${W / 2}" y="${H / 2}" class="mono" font-size="14" fill="${C.muted}" text-anchor="middle" dominant-baseline="central"><tspan fill="${C.green}">➜</tspan> open to interesting problems and great teams<tspan class="cursor" fill="${C.blue}"> ▍</tspan></text>`;
  write("footer.svg", svg(W, H, body, `.cursor { animation: blink 1s steps(1) infinite; } @keyframes blink { 50% { opacity: 0; } }`));
}

console.log("assets written");
