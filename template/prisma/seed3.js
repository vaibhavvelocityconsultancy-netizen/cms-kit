// prisma/seed-posts.js
//
// Run alongside prisma/seed.js (courses). Creates blog posts whose content
// naturally mentions real page titles (Home, Services, Portfolio, About Us,
// Contact) and other post titles, so suggestInternalLinkTargets() has
// genuine title-in-content matches to surface — not fabricated links.

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

const tenantId = 1;

// post.id has no @default in the schema, so we generate one ourselves.
function newId() {
  return crypto.randomUUID();
}

const posts = [
  {
    title: "How I Structure a Full Stack Project From Scratch",
    slug: "how-i-structure-a-full-stack-project",
    excerpt: "A practical walkthrough of how I plan and organize a new web app before writing a single line of code.",
    content: `
      <h2>Starting with the right foundation</h2>
      <p>Before touching code, I map out what the client actually needs. If you want the
      full breakdown of what I offer, check out my Services page — it covers everything
      from web apps to e-commerce builds.</p>
      <p>Every project I take on ends up in my Portfolio once it ships, so you can see
      real examples of this process in action rather than just reading about it.</p>
      <h2>Planning the stack</h2>
      <p>I usually pair this with strong <strong>API Development</strong> practices from day one,
      which I cover in a separate post if you want to go deeper.</p>
      <p>Got a project in mind? Head to Contact and tell me about it.</p>
    `,
    status: "PUBLISHED",
  },
  {
    title: "API Development Best Practices I Actually Use",
    slug: "api-development-best-practices",
    excerpt: "The patterns I rely on for building APIs that don't fall apart six months later.",
    content: `
      <h2>Why API design matters early</h2>
      <p>Most of the API Development work I do follows the same core principles, regardless
      of the client. This ties closely into how I Structure a Full Stack Project From Scratch —
      the API layer is where that planning either pays off or falls apart.</p>
      <p>Curious what this looks like on a finished product? A few examples are in my Portfolio.</p>
      <h2>Common mistakes</h2>
      <p>Skipping proper error handling is the biggest one I see. If you're evaluating a
      developer for this kind of work, my Services page lists exactly what's included.</p>
    `,
    status: "PUBLISHED",
  },
  {
    title: "Why I Moved My Portfolio Site to Next.js",
    slug: "why-i-moved-my-portfolio-to-nextjs",
    excerpt: "The performance and DX reasons behind rebuilding my own site.",
    content: `
      <h2>The old setup wasn't cutting it</h2>
      <p>My Portfolio page needed to load faster and be easier to update. Next.js solved
      both problems immediately.</p>
      <p>This is the same stack I recommend across my Services offerings — it's not just
      a personal preference, it's what I ship for clients too.</p>
      <p>If you've read my post on How I Structure a Full Stack Project From Scratch,
      this migration followed that exact process.</p>
    `,
    status: "PUBLISHED",
  },
  {
    title: "What Clients Should Know Before Reaching Out",
    slug: "what-clients-should-know-before-reaching-out",
    excerpt: "A short guide to make our first conversation more productive.",
    content: `
      <h2>Before you fill out the form</h2>
      <p>Have a rough idea of scope and budget ready — it makes the Contact conversation
      much faster. If you're not sure what you need yet, browse Services first for
      a sense of what's possible.</p>
      <p>Want proof I can deliver? My Portfolio has case studies from past clients,
      and About Us has more on my background and how I work.</p>
    `,
    status: "PUBLISHED",
  },
  {
    title: "A Behind the Scenes Look at My Development Process",
    slug: "behind-the-scenes-development-process",
    excerpt: "From first call to final deployment — how a typical project actually runs.",
    content: `
      <h2>Discovery call</h2>
      <p>Every project starts the same way: a conversation through Contact, followed by
      scoping against my Services list.</p>
      <p>For the technical side, I follow the same approach outlined in How I Structure
      a Full Stack Project From Scratch, with API Development Best Practices I Actually Use
      guiding the backend work specifically.</p>
      <p>Want more background on me before we talk? About Us covers my experience in detail.</p>
    `,
    status: "PUBLISHED",
  },
];

async function main() {
  for (const item of posts) {
    const existing = await prisma.post.findFirst({
      where: { slug: item.slug, tenantId },
    });

    if (existing) {
      console.log(`⏭ Skipping ${item.title}`);
      continue;
    }

    await prisma.post.create({
      data: {
        id: newId(),
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        content: item.content,
        status: item.status,
        tenantId,
        publishedAt: new Date(),
        seoData: {
          metaTitle: item.title,
          metaDescription: item.excerpt,
        },
      },
    });

    console.log(`✅ Created post: ${item.title}`);
  }

  console.log("🎉 Post seeding completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });