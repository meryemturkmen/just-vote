import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const URL = "https://just-vote.lovable.app/terms";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Just Vote" },
      { name: "description", content: "The rules for using Just Vote." },
      { property: "og:title", content: "Terms of Use — Just Vote" },
      { property: "og:description", content: "The rules for using Just Vote." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: () => (
    <LegalPage title="Terms of Use" updated="6 Nov 2026">
      <p>By using Just Vote you agree to these terms. Short version: be nice, post your own stuff, don't be weird.</p>
      <h2>1. Who can use it</h2>
      <p>You must be at least 16 to create an account. Guests can vote without one.</p>
      <h2>2. Your content</h2>
      <ul>
        <li>Only upload photos you have the right to use.</li>
        <li>No photos showing other people's faces without their permission.</li>
        <li>No nudity, hate, harassment, violence, spam, ads or illegal stuff.</li>
      </ul>
      <p>You keep ownership of your content. You give us a non-exclusive, free licence to show it in the app and in share previews while it's online.</p>
      <h2>3. Moderation</h2>
      <p>Anyone can report a question. We may remove content or accounts that break these rules, without notice.</p>
      <h2>4. Points</h2>
      <p>Points are just for fun, have no cash value and can't be transferred. We may adjust them if they're gamed.</p>
      <h2>5. Votes are opinions</h2>
      <p>Results are what strangers think, not advice. Your purchase decisions are yours.</p>
      <h2>6. Availability & liability</h2>
      <p>We provide the app as is and may change or stop it. We're liable without limit for intent and gross negligence and for injury to life, body or health; otherwise only for breach of essential obligations, limited to foreseeable damage, as allowed by law.</p>
      <h2>7. Ending</h2>
      <p>You can delete your account anytime in Profile. German law applies; mandatory consumer protection in your country stays untouched.</p>
    </LegalPage>
  ),
});
