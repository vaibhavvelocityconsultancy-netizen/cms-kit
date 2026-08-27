import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

const RESPONSIVE = ["sm", "md", "lg", "xl", "2xl"]
const INTERACTIVE = ["hover", "focus", "active", "disabled", "group-hover", "focus-within"]
const ALL_VARIANTS = [...RESPONSIVE, ...INTERACTIVE]

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/services/**/*.{ts,tsx}",
    "./src/ui/**/*.{ts,tsx}",
  ],
  safelist: [
    // ===== Literal one-off classes =====
    "container", "group", "peer", "sr-only", "not-sr-only",
    "list-none", "list-disc", "list-decimal",
    "underline", "line-through", "no-underline",
    "uppercase", "lowercase", "capitalize", "normal-case",
    "italic", "not-italic",
    "truncate", "overflow-hidden", "overflow-visible", "overflow-scroll",
    "overflow-x-auto", "overflow-y-auto", "overflow-x-hidden", "overflow-y-hidden",
    "object-cover", "object-contain", "object-fill", "object-center",
    "pointer-events-none", "pointer-events-auto",
    "select-none", "select-text", "select-all",
    "cursor-pointer", "cursor-default", "cursor-not-allowed",

    // ===== Spacing (padding/margin, incl. negative margins) =====
    { pattern: /^(p|px|py|pt|pb|pl|pr)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|px)$/, variants: RESPONSIVE },
    { pattern: /^-?(m|mx|my|mt|mb|ml|mr)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|px)$/, variants: RESPONSIVE },
    { pattern: /^space-(x|y)-(0|1|2|3|4|5|6|8|10|12|16)$/, variants: RESPONSIVE },

    // ===== Sizing =====
    { pattern: /^(w|h)-(0|1|2|3|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|full|screen|min|max|fit|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|1\/6|1\/12)$/, variants: RESPONSIVE },
    { pattern: /^(min-w|max-w)-(0|full|screen|min|max|fit|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|none|prose)$/, variants: RESPONSIVE },
    { pattern: /^(min-h|max-h)-(0|full|screen|min|max|fit|svh|dvh)$/, variants: RESPONSIVE },

    // ===== Typography =====
    { pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/, variants: RESPONSIVE },
    { pattern: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/, variants: RESPONSIVE },
    { pattern: /^leading-(none|tight|snug|normal|relaxed|loose|3|4|5|6|7|8|9|10)$/, variants: RESPONSIVE },
    { pattern: /^tracking-(tighter|tight|normal|wide|wider|widest)$/ },
    { pattern: /^text-(left|center|right|justify)$/, variants: RESPONSIVE },
    { pattern: /^align-(baseline|top|middle|bottom|text-top|text-bottom)$/ },
    { pattern: /^whitespace-(normal|nowrap|pre|pre-line|pre-wrap)$/ },
    { pattern: /^break-(normal|words|all)$/ },
    { pattern: /^line-clamp-(1|2|3|4|5|6|none)$/ },

    // ===== Flexbox / Grid =====
    { pattern: /^(flex|inline-flex|grid|inline-grid|block|inline-block|inline|table|hidden|contents)$/, variants: RESPONSIVE },
    { pattern: /^flex-(row|row-reverse|col|col-reverse|wrap|wrap-reverse|nowrap|1|auto|initial|none)$/, variants: RESPONSIVE },
    { pattern: /^(items|content|self)-(start|end|center|between|around|evenly|stretch|baseline)$/, variants: RESPONSIVE },
    { pattern: /^justify-(start|end|center|between|around|evenly|stretch)$/, variants: RESPONSIVE },
    { pattern: /^justify-items-(start|end|center|stretch)$/, variants: RESPONSIVE },
    { pattern: /^justify-self-(start|end|center|stretch|auto)$/, variants: RESPONSIVE },
    { pattern: /^gap-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24)$/, variants: RESPONSIVE },
    { pattern: /^gap-(x|y)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24)$/, variants: RESPONSIVE },
    { pattern: /^order-(1|2|3|4|5|6|7|8|9|10|11|12|first|last|none)$/, variants: RESPONSIVE },

    // Grid columns / rows / spans
    { pattern: /^grid-cols-(1|2|3|4|5|6|7|8|9|10|11|12|none)$/, variants: RESPONSIVE },
    { pattern: /^grid-rows-(1|2|3|4|5|6|none)$/, variants: RESPONSIVE },
    { pattern: /^col-span-(1|2|3|4|5|6|7|8|9|10|11|12|full)$/, variants: RESPONSIVE },
    { pattern: /^row-span-(1|2|3|4|5|6|full)$/, variants: RESPONSIVE },
    { pattern: /^col-start-(1|2|3|4|5|6|7|8|9|10|11|12|13|auto)$/, variants: RESPONSIVE },
    { pattern: /^row-start-(1|2|3|4|5|6|7|auto)$/, variants: RESPONSIVE },

    // ===== Colors (bg/text/border/ring/divide) =====
    { pattern: /^(bg|text|border|ring|divide|fill|stroke)-(white|black|transparent|current|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/, variants: [...RESPONSIVE, "hover", "focus", "active", "dark"] },
    { pattern: /^(bg|text|border)-(white|black|transparent|current)$/, variants: [...RESPONSIVE, "hover", "focus"] },
    { pattern: /^opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100)$/, variants: RESPONSIVE },

    // ===== Borders =====
    { pattern: /^border(-(0|2|4|8|t|b|l|r|x|y))?$/, variants: RESPONSIVE },
    { pattern: /^rounded(-(none|sm|md|lg|xl|2xl|3xl|full|t|b|l|r|tl|tr|bl|br))?$/, variants: RESPONSIVE },
    { pattern: /^divide-(x|y)(-(0|2|4|8))?$/, variants: RESPONSIVE },

    // ===== Position / Display / Z-index =====
    { pattern: /^(relative|absolute|fixed|sticky|static)$/, variants: RESPONSIVE },
    { pattern: /^(top|bottom|left|right|inset(-x|-y)?)-(0|0\.5|1|2|3|4|5|6|8|10|12|16|20|24|auto|1\/2|full)$/, variants: RESPONSIVE },
    { pattern: /^-(top|bottom|left|right)-(0|0\.5|1|2|3|4|5|6|8|10|12)$/, variants: RESPONSIVE },
    { pattern: /^z-(0|10|20|30|40|50|auto)$/, variants: RESPONSIVE },

    // ===== Effects / Transitions / Transforms =====
    { pattern: /^shadow(-(sm|md|lg|xl|2xl|inner|none))?$/, variants: [...RESPONSIVE, "hover"] },
    { pattern: /^transition(-(none|all|colors|opacity|shadow|transform))?$/ },
    { pattern: /^duration-(75|100|150|200|300|500|700|1000)$/ },
    { pattern: /^ease-(linear|in|out|in-out)$/ },
    { pattern: /^scale-(0|50|75|90|95|100|105|110|125|150)$/, variants: ["hover", "group-hover"] },
    { pattern: /^rotate-(0|1|2|3|6|12|45|90|180)$/, variants: ["hover"] },
    { pattern: /^translate-(x|y)-(0|1|2|3|4|5|6|8|10|12|1\/2|full)$/, variants: ["hover"] },
    { pattern: /^-translate-(x|y)-(0|1|2|3|4|5|6|8|10|12|1\/2|full)$/, variants: ["hover"] },

    // ===== Aspect ratio / object =====
    { pattern: /^aspect-(auto|square|video)$/ },

    // ===== Background helpers =====
    { pattern: /^bg-(gradient-to-(t|tr|r|br|b|bl|l|tl))$/ },
    { pattern: /^(from|via|to)-(white|black|gray|red|blue|green|yellow|purple|pink|indigo|orange)-(50|100|200|300|400|500|600|700|800|900)$/ },
    { pattern: /^bg-(cover|contain|auto)$/ },
    { pattern: /^bg-(center|top|bottom|left|right)$/ },
    { pattern: /^bg-no-repeat$/ },
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        success: "var(--success)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      height: {
        125: "31.25rem",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config