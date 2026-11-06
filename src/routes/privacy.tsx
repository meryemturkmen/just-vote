import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const URL = "https://just-vote.lovable.app/privacy";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Just Vote" },
      { name: "description", content: "What data Just Vote collects, why, and how to delete it." },
      { property: "og:title", content: "Privacy Policy — Just Vote" },
      { property: "og:description", content: "What data Just Vote collects, why, and how to delete it." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: () => (
    <LegalPage title="Privacy Policy" updated="6 Nov 2026">
      <p><b>TL;DR:</b> we only keep what the app needs to work, we don't sell your data, and you can nuke your account anytime.</p>
      <h2>Who's responsible</h2>
      <p>The operator named in our <Link to="/imprint">Imprint</Link> is the controller under the GDPR.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Account:</b> email, display name, chosen categories (only if you sign up).</li>
        <li><b>Content:</b> photos and details you post, your votes, tags and comments, reports.</li>
        <li><b>Guests:</b> a random ID stored in your browser so you can vote once per question.</li>
        <li><b>Points:</b> a log of points earned and spent.</li>
        <li><b>Technical:</b> server logs (IP, browser) needed for security, kept briefly.</li>
      </ul>
      <h2>Why (legal basis)</h2>
      <p>To run the service you signed up for (Art. 6(1)(b) GDPR), to keep it safe and stop abuse (Art. 6(1)(f)), and with your consent for optional storage (Art. 6(1)(a)).</p>
      <h2>Cookies & local storage</h2>
      <p>We use only essential browser storage: your login session, guest voting ID, and settings like "seen the intro". No ad or tracking cookies. Your choice is saved in the consent banner.</p>
      <h2>How long</h2>
      <p>Questions and photos are deleted automatically 30 days after voting closes. Account data stays until you delete your account.</p>
      <h2>Who processes it</h2>
      <p>Hosting, database, file storage and login run on our cloud provider under a data processing agreement. Google is involved only if you choose "Continue with Google".</p>
      <h2>Your rights</h2>
      <p>Access, correction, deletion, restriction, portability, objection, and withdrawing consent anytime. You can also complain to a data protection authority. Delete everything yourself via Profile → "Delete my account and all my data", or contact us via the Imprint.</p>
      <h2>Age</h2>
      <p>Just Vote is for people aged 16+.</p>
    </LegalPage>
  ),
});
