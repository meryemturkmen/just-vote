import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const URL = "https://just-vote.lovable.app/imprint";

export const Route = createFileRoute("/imprint")({
  head: () => ({
    meta: [
      { title: "Imprint (Impressum) — Just Vote" },
      { name: "description", content: "Legal information about the operator of Just Vote." },
      { property: "og:title", content: "Imprint (Impressum) — Just Vote" },
      { property: "og:description", content: "Legal information about the operator of Just Vote." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: () => (
    <LegalPage title="Imprint" updated="6 Nov 2026">
      <h2>Information according to § 5 DDG</h2>
      <p>[Full name / company]<br />[Street and number]<br />[Postcode, City]<br />[Country]</p>
      <h2>Contact</h2>
      <p>Email: [email address]<br />Phone: [phone number]</p>
      <h2>Responsible for content (§ 18 Abs. 2 MStV)</h2>
      <p>[Full name, address as above]</p>
      <h2>EU dispute resolution</h2>
      <p>We are not willing or obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>
    </LegalPage>
  ),
});
