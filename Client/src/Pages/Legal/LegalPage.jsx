import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { HELP_EMAIL } from "../../config/contact";
import logo from "../../assets/sathee.svg";

const LAST_UPDATED = "21 October 2026";

const Mail = () => (
  <a href={`mailto:${HELP_EMAIL}`} className="font-medium text-blue-700 underline underline-offset-2">
    {HELP_EMAIL}
  </a>
);

const PAGES = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "Who we are",
        body: (
          <p>
            The SATHEE Kendra Portal is used to run SATHEE Kendras set up with our CSR partners. It is
            used only by staff, mentors and partners who have been invited by a Kendra admin. Questions
            about this policy can be sent to <Mail />.
          </p>
        ),
      },
      {
        heading: "Information we keep",
        body: (
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Accounts:</strong> name, email address, phone number, role, Kendra, available days
              (for mentors) and the time of the last login. Passwords are stored only in encrypted
              (hashed) form.
            </li>
            <li>
              <strong>Students:</strong> name, gender, category, course and subjects, contact details,
              parents&apos; names and phone numbers, address, Kendra and enrolment IDs, attendance and test
              marks.
            </li>
            <li>
              <strong>Kendra activity:</strong> mentor attendance (with an optional photo), leave
              requests, timetables, schedules, equipment records, announcements and their attachments,
              and support queries with replies.
            </li>
            <li>
              <strong>Notifications:</strong> if you turn them on, your browser&apos;s notification
              address so we can send alerts.
            </li>
          </ul>
        ),
      },
      {
        heading: "How we use it",
        body: (
          <p>
            Only to run the Kendras: recording attendance and progress, preparing reports, sharing
            announcements, answering queries and sending account emails (invitations and password-reset
            codes). We do not sell this information or use it for advertising.
          </p>
        ),
      },
      {
        heading: "Who can see it",
        body: (
          <p>
            Access depends on your role. Admins can see the Kendras they manage; partners and mentors see
            only what their role allows for their own Kendra. The portal runs on trusted service providers
            that store or deliver data on our behalf: Supabase (database and files), Render (server),
            Vercel (website), our email provider and your browser&apos;s notification service.
          </p>
        ),
      },
      {
        heading: "Stored on your device",
        body: (
          <p>
            Your browser keeps your sign-in for the current tab (it ends when the tab is closed), your
            email address if you tick &ldquo;Remember my email&rdquo;, your language choice and your
            notification preference. The portal does not store your password in the browser.
          </p>
        ),
      },
      {
        heading: "Keeping and removing information",
        body: (
          <p>
            Information is kept for as long as it is needed to run the Kendra programme. To see, correct or
            remove information about you or a student, contact your Kendra admin or write to <Mail />.
          </p>
        ),
      },
      {
        heading: "Changes",
        body: <p>We may update this policy. The date at the top shows the latest version.</p>,
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    sections: [
      {
        heading: "Who may use the portal",
        body: (
          <p>
            The SATHEE Kendra Portal is for people invited by a Kendra admin: staff, mentors and CSR
            partners of SATHEE Kendras. Accounts cannot be created by anyone else.
          </p>
        ),
      },
      {
        heading: "Your account",
        body: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Keep your password private and do not share your account.</li>
            <li>Sign out on shared computers.</li>
            <li>
              If you think someone else has used your account, reset your password and tell your Kendra
              admin.
            </li>
          </ul>
        ),
      },
      {
        heading: "Using the portal",
        body: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Use it only for the work of the SATHEE Kendras.</li>
            <li>Enter accurate attendance, marks and details.</li>
            <li>
              Treat student and staff information as confidential and do not copy or share it outside the
              programme.
            </li>
            <li>Do not upload anything unlawful, offensive or unrelated to the Kendra.</li>
          </ul>
        ),
      },
      {
        heading: "Access",
        body: (
          <p>
            Admins may change or remove access, for example when someone leaves a Kendra or if these terms
            are not followed.
          </p>
        ),
      },
      {
        heading: "Availability",
        body: (
          <p>
            We aim to keep the portal available and the data safe, but it may sometimes be unavailable for
            maintenance or because of problems with our service providers.
          </p>
        ),
      },
      {
        heading: "Contact",
        body: (
          <p>
            Questions about these terms: <Mail />.
          </p>
        ),
      },
    ],
  },
};

export default function LegalPage({ page = "privacy" }) {
  const { title, sections } = PAGES[page] || PAGES.privacy;

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SATHEE logo" className="h-9 w-9 rounded-full object-cover" />
            <span className="font-semibold text-slate-900">SATHEE Kendra Portal</span>
          </div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline">
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

          <div className="mt-8 space-y-7 leading-relaxed">
            {sections.map(({ heading, body }) => (
              <section key={heading}>
                <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
                <div className="mt-2 text-slate-700">{body}</div>
              </section>
            ))}
          </div>

          <p className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
            <Link to={page === "privacy" ? "/terms" : "/privacy"} className="text-blue-700 hover:underline">
              {page === "privacy" ? "Terms of Use" : "Privacy Policy"}
            </Link>
          </p>
        </article>
      </main>
    </div>
  );
}
