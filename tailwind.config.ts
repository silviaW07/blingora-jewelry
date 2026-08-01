import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "!./**/*.md",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Tailwind 默认类 → 项目字体变量映射
        // font-sans: 正文字体 (--font-body)
        // font-serif: 标题字体 (--font-header)
        // font-mono: 代码字体 (--font-mono)
        sans: [
          "var(--font-body)",
          "Outfit",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Noto Sans SC",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        serif: [
          "var(--font-header)",
          "Outfit",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Noto Sans SC",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        display: [
          "var(--font-display)",
          "Outfit",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Noto Sans SC",
          "sans-serif",
        ],
        // 语义化别名 (推荐使用)
        header: [
          "var(--font-header)",
          "Outfit",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Noto Sans SC",
          "sans-serif",
        ],
        body: [
          "var(--font-body)",
          "Outfit",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Noto Sans SC",
          "sans-serif",
        ],
      },
      borderRadius: {
        none: "var(--radius-none)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        DEFAULT: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      colors: {
        background: "var(--color-background, var(--background))",
        foreground: "var(--color-foreground, var(--foreground))",

        // Semantic Colors
        primary: {
          DEFAULT: "var(--color-primary, var(--primary))",
          foreground: "var(--color-primary-foreground, var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "var(--color-secondary, var(--secondary))",
          foreground: "var(--color-secondary-foreground, var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "var(--color-muted, var(--muted))",
          foreground: "var(--color-muted-foreground, var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "var(--color-accent, var(--accent))",
          foreground: "var(--color-accent-foreground, var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "var(--color-destructive, var(--destructive))",
          foreground: "var(--color-destructive-foreground, var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "var(--color-success, var(--success))",
          foreground: "var(--color-success-foreground, var(--success-foreground))",
        },
        warning: {
          DEFAULT: "var(--color-warning, var(--warning))",
          foreground: "var(--color-warning-foreground, var(--warning-foreground))",
        },
        info: {
          DEFAULT: "var(--color-info, var(--info))",
          foreground: "var(--color-info-foreground, var(--info-foreground))",
        },

        // UI Components
        card: {
          DEFAULT: "var(--color-card, var(--card))",
          foreground: "var(--color-card-foreground, var(--card-foreground))",
        },
        popover: {
          DEFAULT: "var(--color-popover, var(--popover))",
          foreground: "var(--color-popover-foreground, var(--popover-foreground))",
        },
        input: "var(--color-input, var(--input))",
        ring: "var(--color-ring, var(--ring))",
        border: "var(--color-border, var(--border))",
        chart: {
          1: "var(--color-chart-1, var(--chart-1))",
          2: "var(--color-chart-2, var(--chart-2))",
          3: "var(--color-chart-3, var(--chart-3))",
          4: "var(--color-chart-4, var(--chart-4))",
          5: "var(--color-chart-5, var(--chart-5))",
        },

        // Sidebar Specific
        sidebar: {
          DEFAULT: "var(--color-sidebar-background, var(--sidebar-background))",
          background: "var(--color-sidebar-background, var(--sidebar-background))",
          foreground: "var(--color-sidebar-foreground, var(--sidebar-foreground))",
          primary: "var(--color-sidebar-primary, var(--sidebar-primary))",
          "primary-foreground": "var(--color-sidebar-primary-foreground, var(--sidebar-primary-foreground))",
          accent: "var(--color-sidebar-accent, var(--sidebar-accent))",
          "accent-foreground": "var(--color-sidebar-accent-foreground, var(--sidebar-accent-foreground))",
          border: "var(--color-sidebar-border, var(--sidebar-border))",
          ring: "var(--color-sidebar-ring, var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "shake-x": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shake-x": "shake-x 0.45s ease-in-out",
      },
      text: {
        // Typography System
        display: ["var(--font-size-display)", {
          lineHeight: "var(--line-height-tight)",
          letterSpacing: "var(--letter-spacing-tight)",
          fontWeight: "var(--font-weight-bold)",
          fontFamily: "var(--font-display)", // Auto-bind font family
        }],
        h1: ["var(--font-size-h1)", {
          lineHeight: "var(--line-height-tight)",
          letterSpacing: "var(--letter-spacing-tight)",
          fontWeight: "var(--font-weight-bold)",
          fontFamily: "var(--font-header)",
        }],
        h2: ["var(--font-size-h2)", {
          lineHeight: "var(--line-height-normal)",
          letterSpacing: "var(--letter-spacing-normal)",
          fontWeight: "var(--font-weight-semibold)",
          fontFamily: "var(--font-header)",
        }],
        h3: ["var(--font-size-h3)", {
          lineHeight: "var(--line-height-normal)",
          fontWeight: "var(--font-weight-semibold)",
          fontFamily: "var(--font-header)",
        }],
        h4: ["var(--font-size-h4)", {
          lineHeight: "var(--line-height-relaxed)",
          fontWeight: "var(--font-weight-medium)",
          fontFamily: "var(--font-header)",
        }],
        base: ["var(--font-size-base)", {
          lineHeight: "var(--line-height-loose)",
          letterSpacing: "var(--letter-spacing-base)",
          fontWeight: "var(--font-weight-normal)",
          fontFamily: "var(--font-body)",
        }],
        "sm-body": ["var(--font-size-sm-body)", {
          lineHeight: "var(--line-height-loose)",
          fontWeight: "var(--font-weight-normal)",
          fontFamily: "var(--font-body)",
        }],
        caption: ["var(--font-size-caption)", {
          lineHeight: "var(--line-height-relaxed)",
          letterSpacing: "var(--letter-spacing-wide)",
          fontWeight: "var(--font-weight-semibold)",
          fontFamily: "var(--font-body)",
        }],
      },
      
    },
    screens: {
      "sm": "640px",
      "md": "768px",
      "lg": "1024px",
    },
  },
  plugins: [],
};

export default config;
