import { GET as getMarkdown } from "../../api/public/llms/[slug]/route";

export const dynamic = "force-dynamic";

export async function GET(request, context) {
  return getMarkdown(request, context);
}
