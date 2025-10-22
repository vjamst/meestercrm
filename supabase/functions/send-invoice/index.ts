import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const DEFAULT_FROM_EMAIL = Deno.env.get("DEFAULT_FROM_EMAIL") ?? "Facturatie <no-reply@example.com>";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase configuration for send-invoice function");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface SendInvoicePayload {
  invoiceId: string;
  to: string;
  subject?: string;
  message?: string;
  pdfBase64: string;
  filename?: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const payload = (await req.json()) as SendInvoicePayload;
    if (!payload.invoiceId || !payload.to || !payload.pdfBase64) {
      return new Response(JSON.stringify({ error: "invoiceId, to and pdfBase64 are required" }), { status: 400 });
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*, client:clients(*)")
      .eq("id", payload.invoiceId)
      .single();

    if (error || !invoice) {
      console.error("Invoice lookup failed", error);
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404 });
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY is not configured" }), { status: 500 });
    }

    const subject = payload.subject || `Factuur ${invoice.number}`;
    const html = buildEmailHtml({ invoice, message: payload.message });
    const text = buildEmailText({ invoice, message: payload.message });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: DEFAULT_FROM_EMAIL,
        to: [payload.to],
        subject,
        html,
        text,
        attachments: [
          {
            filename: payload.filename || `factuur-${invoice.number}.pdf`,
            content: payload.pdfBase64,
          },
        ],
      }),
    });

    if (!emailResponse.ok) {
      const errorBody = await emailResponse.text();
      console.error("Resend error", errorBody);
      return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 502 });
    }

    const providerResponse = await emailResponse.json();

    return new Response(JSON.stringify({ success: true, providerResponse }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
  }
});

function buildEmailHtml({
  invoice,
  message,
}: {
  invoice: any;
  message?: string;
}) {
  const greeting = message
    ? message.replace(/\n/g, "<br />")
    : `Beste ${invoice.client?.name || "klant"},<br /><br />In de bijlage vind je factuur ${invoice.number}.`;

  return `
    <div style="font-family: Inter, Arial, sans-serif; color:#0f172a;">
      <p>${greeting}</p>
      <p>
        <strong>Factuur:</strong> ${invoice.number}<br />
        <strong>Bedrag:</strong> ${formatCurrency(invoice.total_ex_vat)} exclusief btw<br />
        <strong>Vervaldatum:</strong> ${invoice.due_date ?? 'n.v.t.'}
      </p>
      <p>Met vriendelijke groet,<br />MeesterCRM</p>
    </div>
  `;
}

function buildEmailText({
  invoice,
  message,
}: {
  invoice: any;
  message?: string;
}) {
  const lines = [
    message ||
      `Beste ${invoice.client?.name || "klant"},\n\nIn de bijlage vind je factuur ${invoice.number}.`,
    `Factuur: ${invoice.number}`,
    `Bedrag: ${formatCurrency(invoice.total_ex_vat)} exclusief btw`,
    `Vervaldatum: ${invoice.due_date ?? 'n.v.t.'}`,
    '\nMet vriendelijke groet,\nMeesterCRM',
  ];
  return lines.join('\n');
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value ?? 0);
}
