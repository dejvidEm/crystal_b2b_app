import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fetchRequestDetail } from "@/lib/queries/requests";
import { sendNewRequestNotification } from "@/lib/email/send-new-request-notification";

const bodySchema = z.object({
  requestId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatné ID požiadavky." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Nie ste prihlásený." }, { status: 401 });
    }

    const detail = await fetchRequestDetail(supabase, parsed.data.requestId);
    if (!detail) {
      return NextResponse.json(
        { error: "Požiadavka nebola nájdená." },
        { status: 404 },
      );
    }

    // Only the creating partner (or admin) may trigger the notification.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, full_name, organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Profil nebol nájdený." },
        { status: 403 },
      );
    }

    const isAdmin = profile.role === "admin";
    const isOwner =
      detail.created_by === user.id ||
      (profile.role === "partner" &&
        profile.organization_id === detail.organization_id);

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Bez oprávnenia." }, { status: 403 });
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    ).replace(/\/$/, "");
    const detailUrl = `${appUrl}/orders/${detail.id}`;

    const data = await sendNewRequestNotification({
      request: detail,
      detailUrl,
      submitterName: profile.full_name,
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("new-request notification failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nepodarilo sa odoslať e-mailovú notifikáciu.",
      },
      { status: 500 },
    );
  }
}
