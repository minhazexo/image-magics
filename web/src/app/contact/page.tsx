import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/layout/contact-form";

export const metadata: Metadata = buildMetadata({
  title: "Contact — ImageTools",
  description: "Get in touch with the ImageTools team for feedback, feature requests and support.",
  path: "/contact",
  keywords: ["contact", "support", "feedback"],
});

export default function ContactPage() {
  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
      <p className="mt-3 text-muted-foreground">
        Questions, feedback or a feature request? Because ImageTools is local-first, we cannot see your
        images — so please don&apos;t include files in your message.
      </p>
      <ContactForm />
    </div>
  );
}