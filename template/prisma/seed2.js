// prisma/seed.js

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const tenantId = 1;

const courses = [
  {
    title: "Next.js 15 Complete Guide",
    slug: "nextjs-15-complete-guide",
    instructor: "Sarah Johnson",
    level: "Intermediate",
    price: 4999,
    durationHours: 25,
    thumbnail: "https://picsum.photos/800/450?random=1",
    videoUrls: [
      "https://www.youtube.com/watch?v=ZVnjOPwW4ZA", // Next.js Intro
      "https://www.youtube.com/watch?v=843nec-IvW0", // Next.js App Router
      "https://www.youtube.com/watch?v=wm5gMKuwSYk", // Next.js Projects
      "https://www.youtube.com/watch?v=9P8mASSREYM", // Next.js Advanced
      "https://www.youtube.com/watch?v=1WmNXEVia8I", // Next.js Deployment
    ],
  },
  {
    title: "Node.js API Development",
    slug: "nodejs-api-development",
    instructor: "Mike Wilson",
    level: "Intermediate",
    price: 3499,
    durationHours: 18,
    thumbnail: "https://picsum.photos/800/450?random=2",
    videoUrls: [
      "https://www.youtube.com/watch?v=Oe421EPjeBE", // Node.js Intro
      "https://www.youtube.com/watch?v=G8uL0lFFoN0", // Node.js API Basics
      "https://www.youtube.com/watch?v=pKd0Rpw7O48", // Node.js Express
      "https://www.youtube.com/watch?v=fgTGADljAeg", // Node.js Authentication
      "https://www.youtube.com/watch?v=Z1ktxiqyiLA", // Node.js Deployment
    ],
  },
  {
    title: "TypeScript From Scratch",
    slug: "typescript-from-scratch",
    instructor: "Alex Carter",
    level: "Beginner",
    price: 2999,
    durationHours: 15,
    thumbnail: "https://picsum.photos/800/450?random=3",
    videoUrls: [
      "https://www.youtube.com/watch?v=WBPrJSw7yQA", // TypeScript Intro
      "https://www.youtube.com/watch?v=BwuLxPH8IDs", // TypeScript Basics
      "https://www.youtube.com/watch?v=gp5H0Vw39yw", // TypeScript Advanced
      "https://www.youtube.com/watch?v=2lGGYV8a1eA", // TypeScript with React
      "https://www.youtube.com/watch?v=1WmNXEVia8I", // TypeScript Deployment
    ],
  },
  {
    title: "MySQL & Prisma ORM",
    slug: "mysql-prisma-orm",
    instructor: "David Brown",
    level: "Intermediate",
    price: 3999,
    durationHours: 16,
    thumbnail: "https://picsum.photos/800/450?random=4",
    videoUrls: [
      "https://www.youtube.com/watch?v=qw--VYLpxG4", // MySQL Intro
      "https://www.youtube.com/watch?v=0WixS3cK16A", // Prisma Intro
      "https://www.youtube.com/watch?v=_txVU0UcYHI", // Prisma CRUD
      "https://www.youtube.com/watch?v=1GcGj5l12rE", // Prisma Relations
      "https://www.youtube.com/watch?v=7Kb1M3X5W_M", // Prisma Deployment
    ],
  },
  {
    title: "Full Stack MERN Bootcamp",
    slug: "full-stack-mern-bootcamp",
    instructor: "Emily White",
    level: "Advanced",
    price: 6999,
    durationHours: 40,
    thumbnail: "https://picsum.photos/800/450?random=5",
    videoUrls: [
      "https://www.youtube.com/watch?v=CvCiNeLnZ00", // MERN Intro
      "https://www.youtube.com/watch?v=97WCIazsRzQ", // MongoDB & Express
      "https://www.youtube.com/watch?v=7CqJlxBYj-M", // React Frontend
      "https://www.youtube.com/watch?v=ngc9gnGgUdA", // Node.js Backend
      "https://www.youtube.com/watch?v=FcxjCPeicvY", // MERN Deployment
    ],
  },
  {
    title: "Advanced JavaScript",
    slug: "advanced-javascript",
    instructor: "Chris Evans",
    level: "Advanced",
    price: 2499,
    durationHours: 12,
    thumbnail: "https://picsum.photos/800/450?random=6",
    videoUrls: [
      "https://www.youtube.com/watch?v=Nda34efbxhM", // JS Advanced Concepts
      "https://www.youtube.com/watch?v=RZWP2qfLHhk", // Closures & Scope
      "https://www.youtube.com/watch?v=8aGhZQkoFbQ", // Async/Await
      "https://www.youtube.com/watch?v=BIk1k2P1s6w", // Functional Programming
      "https://www.youtube.com/watch?v=DHjqpvDnNGE", // Design Patterns
    ],
  },
  {
    title: "Tailwind CSS Masterclass",
    slug: "tailwind-css-masterclass",
    instructor: "Sophia Green",
    level: "Beginner",
    price: 1999,
    durationHours: 10,
    thumbnail: "https://picsum.photos/800/450?random=7",
    videoUrls: [
      "https://www.youtube.com/watch?v=mFg-zOj2l8E", // Tailwind Intro
      "https://www.youtube.com/watch?v=rCcSqVr93_U", // Tailwind Basics
      "https://www.youtube.com/watch?v=UBOj6rSyR4o", // Tailwind Components
      "https://www.youtube.com/watch?v=3HIdpZlvIuQ", // Tailwind Advanced
      "https://www.youtube.com/watch?v=HPh_9qPD_OY", // Tailwind Projects
    ],
  },
];

async function main() {
  for (const item of courses) {
    const existingCourse = await prisma.course.findFirst({
      where: {
        slug: item.slug,
      },
    });

    if (existingCourse) {
      console.log(`⏭ Skipping ${item.title}`);
      continue;
    }

    const content = await prisma.courseContent.create({
      data: {
        title: item.title,
        slug: item.slug,
        shortDescription: `Master ${item.title} with hands-on projects.`,
        longDescription: `Complete professional training program for ${item.title}. Learn fundamentals, advanced concepts, real-world projects and deployment.`,
        thumbnail: item.thumbnail,
        instructor: item.instructor,
        level: item.level,
        tenantId,
        isPublished: true,
      },
    });

    const moduleTitles = [
      "Introduction",
      "Core Concepts",
      "Building a Project",
      "Advanced Techniques",
      "Deployment & Wrap Up",
    ];

    const moduleData = item.videoUrls.map((url, index) => ({
      title: moduleTitles[index] || `Module ${index + 1}`,
      videoType: "URL",
      videoUrl: url,
      durationMinutes: [30, 45, 60, 75, 40][index] || 45,
      sortOrder: index,
      courseContentId: content.id,
    }));

    await prisma.courseModule.createMany({
      data: moduleData,
    });

    const course = await prisma.course.create({
      data: {
        title: item.title,
        slug: item.slug,
        shortDescription: `Master ${item.title}`,
        instructor: item.instructor,
        thumbnail: item.thumbnail,
        level: item.level,
        durationHours: item.durationHours,
        billingCycle: "LIFETIME",
        price: item.price,
        isFeatured: false,
        isPublished: true,
        tenantId,
        courseContentId: content.id,
      },
    });

    await prisma.pricingFeature.createMany({
      data: [
        {
          title: "Lifetime Access",
          sortOrder: 0,
          courseId: course.id,
        },
        {
          title: "Source Code Included",
          sortOrder: 1,
          courseId: course.id,
        },
        {
          title: "Project Based Learning",
          sortOrder: 2,
          courseId: course.id,
        },
        {
          title: "Certificate of Completion",
          sortOrder: 3,
          courseId: course.id,
        },
        {
          title: "Community Support",
          sortOrder: 4,
          courseId: course.id,
        },
      ],
    });

    console.log(
      `✅ Created ${item.title} with ${item.videoUrls.length} videos`,
    );
  }

  console.log("🎉 Seeding completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
