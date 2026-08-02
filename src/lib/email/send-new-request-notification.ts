import { render } from "@react-email/render";
import { Resend } from "resend";
import { NewRequestEmail } from "@/emails/new-request-email";
import type { ServiceRequestDetail } from "@/types";

export async function sendNewRequestNotification(input: {
  request: ServiceRequestDetail;
  detailUrl: string;
  submitterName?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  const from =
    process.env.RESEND_FROM_EMAIL ??
    "Crystal B2B <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("Chýba RESEND_API_KEY.");
  }
  if (!to) {
    throw new Error("Chýba ADMIN_NOTIFICATION_EMAIL.");
  }

  const html = await render(
    NewRequestEmail({
      request: input.request,
      detailUrl: input.detailUrl,
      submitterName: input.submitterName,
    }),
  );

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: `Nová požiadavka ${input.request.reference_code} · ${input.request.organization?.name ?? "Partner"}`,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
