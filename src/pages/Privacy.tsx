import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4 py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-[#243E8F]">Privacy & GDPR</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">1. Who is responsible for your data</h2>
              <p className="text-[#282120]">
                Immoaura is the data controller for the personal data collected via this website, our contact forms and the client portal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">2. What data we collect</h2>
              <p className="text-[#282120] mb-2">We may collect the following types of data:</p>
              <ul className="list-disc pl-6 space-y-1 text-[#282120]">
                <li>Contact details (name, email address, phone number, address, company details, VAT number);</li>
                <li>Account details (username, password – stored in encrypted form);</li>
                <li>Order information (services ordered, property details, project files you upload);</li>
                <li>Communication data (emails, messages, feedback);</li>
                <li>Technical data (IP address, browser type, pages visited, cookies – mainly for security and analytics).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">3. Why we process your data (legal bases)</h2>
              <p className="text-[#282120] mb-2">We process your data for the following purposes and legal bases:</p>
              <ul className="list-disc pl-6 space-y-2 text-[#282120]">
                <li>
                  <span className="font-semibold">To create and manage your account and orders</span>
                  <br />
                  <span className="text-muted-foreground">– Legal basis: performance of a contract.</span>
                </li>
                <li>
                  <span className="font-semibold">To communicate with you about quotes, projects and support</span>
                  <br />
                  <span className="text-muted-foreground">– Legal basis: performance of a contract and legitimate interest.</span>
                </li>
                <li>
                  <span className="font-semibold">To send invoices and handle payments</span>
                  <br />
                  <span className="text-muted-foreground">– Legal basis: performance of a contract and legal obligation.</span>
                </li>
                <li>
                  <span className="font-semibold">To improve our services and website (for example via anonymised analytics)</span>
                  <br />
                  <span className="text-muted-foreground">– Legal basis: legitimate interest.</span>
                </li>
                <li>
                  <span className="font-semibold">To send you marketing emails if you explicitly subscribe</span>
                  <br />
                  <span className="text-muted-foreground">– Legal basis: consent (you can withdraw at any time).</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">4. How long we keep your data</h2>
              <p className="text-[#282120]">
                We keep your account and order data for as long as you have an active account and for a reasonable period afterwards to comply with legal accounting obligations (usually up to 7 years for invoices). If you close your account, we may archive certain data where required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">5. Sharing of data with third parties</h2>
              <p className="text-[#282120] mb-2">We only share your data with:</p>
              <ul className="list-disc pl-6 space-y-1 text-[#282120]">
                <li>Service providers who help us operate the website, client portal, email and payment processing (for example hosting companies, email providers, analytics tools);</li>
                <li>Professional advisers (accountants, legal advisers) where necessary;</li>
                <li>Authorities when required by law.</li>
              </ul>
              <p className="text-[#282120] mt-2">
                All processors who handle personal data on our behalf are bound by data processing agreements and must keep your data secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">6. International transfers</h2>
              <p className="text-[#282120]">
                If any of our service providers are located outside the European Economic Area (EEA), we only transfer data where appropriate safeguards are in place (for example Standard Contractual Clauses or an adequacy decision).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">7. Cookies and tracking</h2>
              <p className="text-[#282120] mb-2">Our website uses cookies to:</p>
              <ul className="list-disc pl-6 space-y-1 text-[#282120]">
                <li>remember your preferences and login status;</li>
                <li>perform basic analytics on website usage;</li>
                <li>enable embedded content (for example video).</li>
              </ul>
              <p className="text-[#282120] mt-2">
                On your first visit we show a cookie banner where you can accept or manage non-essential cookies. For more information see our Cookies section/page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">8. Your rights (GDPR)</h2>
              <p className="text-[#282120] mb-2">
                You have the following rights under the GDPR, subject to certain conditions:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-[#282120]">
                <li><span className="font-semibold">Right of access</span> – to request a copy of your personal data;</li>
                <li><span className="font-semibold">Right to rectification</span> – to correct inaccurate data;</li>
                <li><span className="font-semibold">Right to erasure</span> – to request deletion of your data where we have no legal reason to keep it;</li>
                <li><span className="font-semibold">Right to restriction of processing</span>;</li>
                <li><span className="font-semibold">Right to data portability</span>;</li>
                <li><span className="font-semibold">Right to object</span> to certain processing (for example direct marketing);</li>
                <li><span className="font-semibold">Right to withdraw consent</span> where processing is based on consent.</li>
              </ul>
              <p className="text-[#282120] mt-2">
                To exercise your rights, contact us at <a href="mailto:info@immoaura.be" className="text-[#243E8F] hover:underline font-medium">info@immoaura.be</a>. We may ask you to verify your identity before responding.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">9. Marketing emails</h2>
              <p className="text-[#282120]">
                If you subscribe to our newsletter or marketing updates, we will use your email address to send you occasional updates. You can unsubscribe at any time by clicking the unsubscribe link in the email or contacting us directly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">10. Security</h2>
              <p className="text-[#282120]">
                We take appropriate technical and organisational measures to protect your personal data against loss, misuse, unauthorised access and disclosure. This includes encryption of passwords, restricted access controls and secure hosting.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">11. Changes to this Privacy Policy</h2>
              <p className="text-[#282120]">
                We may update this Privacy & GDPR page from time to time. The latest version will always be available on our website and will show the date of last update.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">12. Contact and complaints</h2>
              <p className="text-[#282120] mb-2">
                If you have questions or concerns about how we handle your data, you can contact us at:
              </p>
              <p className="text-[#243E8F] font-medium mb-2">
                Email: <a href="mailto:info@immoaura.be" className="hover:underline">info@immoaura.be</a>
              </p>
              <p className="text-[#282120]">
                You also have the right to lodge a complaint with your local data protection authority in the EU, for example the Belgian Data Protection Authority (Gegevensbeschermingsautoriteit).
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Privacy;

