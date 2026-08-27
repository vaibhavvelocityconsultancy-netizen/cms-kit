/**
 * Extracts all arbitrary Tailwind classes from HTML and generates
 * equivalent CSS rules. Standard Tailwind classes are ignored.
 */

type CssRule = { selector: string; declarations: string };

// Escape special chars for CSS class selector
function escapeClassName(cls: string): string {
  return cls
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/#/g, "\\#")
    .replace(/\./g, "\\.")
    .replace(/,/g, "\\,")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/%/g, "\\%");
}

// Extract all class names from all class="..." attributes in HTML
function extractClasses(html: string): Set<string> {
  const classes = new Set<string>();
  const classAttrRegex = /class=["']([^"']*)["']/g;
  let match: RegExpExecArray | null;

  while ((match = classAttrRegex.exec(html)) !== null) {
    match[1].split(/\s+/).forEach((cls) => {
      if (cls.trim()) classes.add(cls.trim());
    });
  }
  return classes;
}

// Extract the value inside [...] — handles nested parens like linear-gradient(...)
function extractValue(cls: string): string | null {
  const start = cls.indexOf("[");
  const end = cls.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return null;
  return cls.slice(start + 1, end);
}

function generateRule(cls: string): CssRule | null {
  const val = extractValue(cls);
  if (!val) return null;

  const selector = `.${escapeClassName(cls)}`;

  // bg-[...] — color or gradient or url
  if (/^bg-\[/.test(cls)) {
    if (val.startsWith("linear-gradient") || val.startsWith("radial-gradient") || val.startsWith("conic-gradient")) {
      return { selector, declarations: `background-image: ${val};` };
    }
    if (val.startsWith("url(")) {
      return { selector, declarations: `background-image: ${val};` };
    }
    return { selector, declarations: `background-color: ${val};` };
  }

  // text-[...] — color or font-size
  if (/^text-\[/.test(cls)) {
    // If it looks like a size (px, rem, em, %)
    if (/^\d/.test(val) || val.endsWith("px") || val.endsWith("rem") || val.endsWith("em") || val.endsWith("%")) {
      return { selector, declarations: `font-size: ${val};` };
    }
    return { selector, declarations: `color: ${val};` };
  }

  // border-[...]
  if (/^border-\[/.test(cls)) {
    return { selector, declarations: `border-color: ${val};` };
  }

  // Width / height / min / max
  if (/^w-\[/.test(cls))      return { selector, declarations: `width: ${val};` };
  if (/^h-\[/.test(cls))      return { selector, declarations: `height: ${val};` };
  if (/^min-h-\[/.test(cls))  return { selector, declarations: `min-height: ${val};` };
  if (/^min-w-\[/.test(cls))  return { selector, declarations: `min-width: ${val};` };
  if (/^max-h-\[/.test(cls))  return { selector, declarations: `max-height: ${val};` };
  if (/^max-w-\[/.test(cls))  return { selector, declarations: `max-width: ${val};` };

  // Border radius
  if (/^rounded-t-\[/.test(cls))  return { selector, declarations: `border-top-left-radius: ${val}; border-top-right-radius: ${val};` };
  if (/^rounded-b-\[/.test(cls))  return { selector, declarations: `border-bottom-left-radius: ${val}; border-bottom-right-radius: ${val};` };
  if (/^rounded-l-\[/.test(cls))  return { selector, declarations: `border-top-left-radius: ${val}; border-bottom-left-radius: ${val};` };
  if (/^rounded-r-\[/.test(cls))  return { selector, declarations: `border-top-right-radius: ${val}; border-bottom-right-radius: ${val};` };
  if (/^rounded-\[/.test(cls))    return { selector, declarations: `border-radius: ${val};` };

  // Margin
  if (/^mx-\[/.test(cls))  return { selector, declarations: `margin-left: ${val}; margin-right: ${val};` };
  if (/^my-\[/.test(cls))  return { selector, declarations: `margin-top: ${val}; margin-bottom: ${val};` };
  if (/^mt-\[/.test(cls))  return { selector, declarations: `margin-top: ${val};` };
  if (/^mr-\[/.test(cls))  return { selector, declarations: `margin-right: ${val};` };
  if (/^mb-\[/.test(cls))  return { selector, declarations: `margin-bottom: ${val};` };
  if (/^ml-\[/.test(cls))  return { selector, declarations: `margin-left: ${val};` };
  if (/^m-\[/.test(cls))   return { selector, declarations: `margin: ${val};` };

  // Padding
  if (/^px-\[/.test(cls))  return { selector, declarations: `padding-left: ${val}; padding-right: ${val};` };
  if (/^py-\[/.test(cls))  return { selector, declarations: `padding-top: ${val}; padding-bottom: ${val};` };
  if (/^pt-\[/.test(cls))  return { selector, declarations: `padding-top: ${val};` };
  if (/^pr-\[/.test(cls))  return { selector, declarations: `padding-right: ${val};` };
  if (/^pb-\[/.test(cls))  return { selector, declarations: `padding-bottom: ${val};` };
  if (/^pl-\[/.test(cls))  return { selector, declarations: `padding-left: ${val};` };
  if (/^p-\[/.test(cls))   return { selector, declarations: `padding: ${val};` };

  // Typography
  if (/^leading-\[/.test(cls))   return { selector, declarations: `line-height: ${val};` };
  if (/^tracking-\[/.test(cls))  return { selector, declarations: `letter-spacing: ${val};` };
  if (/^font-\[/.test(cls))      return { selector, declarations: `font-weight: ${val};` };

  // Grid
  if (/^grid-cols-\[/.test(cls))  return { selector, declarations: `grid-template-columns: ${val};` };
  if (/^grid-rows-\[/.test(cls))  return { selector, declarations: `grid-template-rows: ${val};` };

  // Gap
  if (/^gap-x-\[/.test(cls))  return { selector, declarations: `column-gap: ${val};` };
  if (/^gap-y-\[/.test(cls))  return { selector, declarations: `row-gap: ${val};` };
  if (/^gap-\[/.test(cls))    return { selector, declarations: `gap: ${val};` };

  // Top / right / bottom / left / inset
  if (/^top-\[/.test(cls))     return { selector, declarations: `top: ${val};` };
  if (/^right-\[/.test(cls))   return { selector, declarations: `right: ${val};` };
  if (/^bottom-\[/.test(cls))  return { selector, declarations: `bottom: ${val};` };
  if (/^left-\[/.test(cls))    return { selector, declarations: `left: ${val};` };
  if (/^inset-\[/.test(cls))   return { selector, declarations: `inset: ${val};` };

  return null;
}

/**
 * Main export.
 * Pass full page HTML → get back a CSS string with all arbitrary class rules.
 */
export function generateArbitraryCss(html: string): string {
  const classes = extractClasses(html);
  const rules: string[] = [];

  for (const cls of classes) {
    if (!cls.includes("[")) continue; // skip non-arbitrary classes fast
    const rule = generateRule(cls);
    if (rule) {
      rules.push(`${rule.selector} { ${rule.declarations} }`);
    }
  }

  return rules.join("\n");
}

/**
 * Merges user-written custom CSS with auto-generated arbitrary CSS.
 * Generated CSS is appended after a clear separator so it's easy to
 * identify and won't conflict with the user's own rules.
 */
export function mergePageCss(userCss: string, generatedCss: string): string {
  const trimmedUser = (userCss || "").trim();
  const trimmedGenerated = (generatedCss || "").trim();

  if (!trimmedGenerated) return trimmedUser;

  const block = `/* ── auto-generated arbitrary classes ── */\n${trimmedGenerated}`;

  if (!trimmedUser) return block;
  return `${trimmedUser}\n\n${block}`;
}