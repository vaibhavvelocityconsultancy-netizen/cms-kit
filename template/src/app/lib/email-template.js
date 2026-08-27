import { render } from "@react-email/components";
import CourseEnrolled from "@/emails/CourseEnrolled";
import CourseEnrolledAdmin from "@/emails/CourseEnrolledAdmin";
import OrderPlaced from "@/emails/OrderPlaced";
import OrderPlacedAdmin from "@/emails/OrderPlacedAdmin";
import ProductPurchased from "@/emails/ProductPurchased";
import ProductPurchasedAdmin from "@/emails/ProductPurchasedAdmin";
import FileShared from "@/emails/FileShared";

const EMAIL_TEMPLATES = {
  COURSE_ENROLLED: [
    {
      recipientType: "CUSTOMER",
      emailToKey: "email",
      subject: "You're enrolled in {{courseName}}",
      Component: CourseEnrolled,
    },
    {
      recipientType: "ADMIN",
      emailToKey: null,
      subject: "New enrollment: {{courseName}}",
      Component: CourseEnrolledAdmin,
    },
  ],
  ORDER_PLACED: [
    {
      recipientType: "CUSTOMER",
      emailToKey: "email",
      subject: "Your {{planName}} subscription is active",
      Component: OrderPlaced,
    },
    {
      recipientType: "ADMIN",
      emailToKey: null,
      subject: "New plan purchase: {{planName}}",
      Component: OrderPlacedAdmin,
    },
  ],
  PRODUCT_PURCHASED: [
    {
      recipientType: "CUSTOMER",
      emailToKey: "email",
      subject: "Order confirmed — #{{orderNumber}}",
      Component: ProductPurchased,
    },
    {
      recipientType: "ADMIN",
      emailToKey: null,
      subject: "New order: #{{orderNumber}}",
      Component: ProductPurchasedAdmin,
    },
  ],

  FILE_SHARED: [
    {
      recipientType: "CUSTOMER",
      emailToKey: "sharedWith",
      subject: "A file has been shared with you: {{title}}",
      Component: FileShared,
    },
  ],
};

function fillSubject(subject, data = {}) {
  return subject.replace(/{{(\w+)}}/g, (_, key) => data[key] ?? "");
}

export async function getEmailTemplates(triggerEvent, data = {}) {
  const templates = EMAIL_TEMPLATES[triggerEvent] ?? [];

  return Promise.all(
    templates.map(async (t) => ({
      recipientType: t.recipientType,
      emailTo: t.emailToKey
        ? (data?.[t.emailToKey] ?? "")
        : (process.env.ADMIN_EMAIL ?? ""),
      subject: fillSubject(t.subject, data),
      html: await render(<t.Component {...data} />),
    })),
  );
}
