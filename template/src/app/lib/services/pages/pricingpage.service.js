import { prisma } from "../../prisma";
import { requireAuth } from "../../withPermission";

export async function getPricingPageSettings() {
  const settings = await prisma.pricingPageSettings.findFirst({
    include: {
      form: {
        select: {
          id: true,
          title: true,
          slug: true,
          layout: true,
          twoColumnHeading: true,
          twoColumnParagraph: true,
          status: true,
        },
      },
    },
  });

  return settings;
}

export async function updatePricingPageSettings(input) {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const formId =
    input.formId === null || input.formId === undefined
      ? null
      : Number(input.formId);

  // If a form is selected, make sure it belongs to this tenant
  if (formId !== null) {
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        tenantId,
      },
    });

    if (!form) {
      throw new Error("Form not found");
    }
  }

  return prisma.pricingPageSettings.upsert({
    where: {
      tenantId,
    },
    update: {
      formId,
    },
    create: {
      tenantId,
      formId,
    },
    include: {
      form: {
        select: {
          id: true,
          title: true,
          slug: true,
          layout: true,
          twoColumnHeading: true,
          twoColumnParagraph: true,
          status: true,
        },
      },
    },
  });
}
