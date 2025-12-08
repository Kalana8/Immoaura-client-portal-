import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4 py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-[#243E8F]">Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">1. Who we are</h2>
              <p className="text-[#282120]">
                Immoaura ("we", "us") provides real estate media services such as property video, 2D floor plans and 3D floor plans. These Terms & Conditions apply to all orders placed via our website and client portal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">2. Services</h2>
              <p className="text-[#282120] mb-2">We offer:</p>
              <ul className="list-disc pl-6 space-y-1 text-[#282120]">
                <li>Property video production (camera and drone);</li>
                <li>2D floor plan creation;</li>
                <li>3D floor plan and visualisation services.</li>
              </ul>
              <p className="text-[#282120] mt-2">
                Details of each service, including deliverables and pricing, are described on the relevant service pages on our website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">3. Non-construction / non-certified plans</h2>
              <p className="text-[#282120]">
                Our 2D and 3D floor plans are created for visualisation and marketing purposes only. They are not certified by an architect or engineer and must not be used as official construction drawings, permit documents or structural calculations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">4. Ordering process</h2>
              <p className="text-[#282120] mb-2">Orders are placed through our online client portal:</p>
              <ol className="list-decimal pl-6 space-y-1 text-[#282120]">
                <li>You create an account and submit a new order.</li>
                <li>We review the order and confirm availability and price.</li>
                <li>Once confirmed, the order receives a planned date and estimated delivery time.</li>
                <li>We execute the work and upload the deliverables to your account.</li>
              </ol>
              <p className="text-[#282120] mt-2">
                We reserve the right to refuse or cancel an order, for example in case of incomplete information, safety risks or technical limitations. In such cases we will inform you and, if applicable, refund any payments already made.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">5. Prices and payment</h2>
              <p className="text-[#282120] mb-2">
                All prices are shown in euros (€) and are exclusive of applicable VAT unless stated otherwise.
              </p>
              <p className="text-[#282120] mb-2 font-semibold">Payment terms:</p>
              <ul className="list-disc pl-6 space-y-1 text-[#282120]">
                <li>Invoices are linked to each order and must be paid by the due date stated on the invoice.</li>
                <li>We may require full or partial prepayment for certain services.</li>
                <li>If payment is late, we reserve the right to suspend delivery and charge statutory late payment interest and reasonable collection costs, in line with Belgian law.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">6. Delivery times</h2>
              <p className="text-[#282120]">
                Delivery times indicated on the website (for example 48–72 hours) are estimates and not strict guarantees. We will make reasonable efforts to deliver within the indicated timeframe. Delays can occur due to weather, technical issues or missing information from the client. We are not liable for indirect loss caused by reasonable delays.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">7. Client responsibilities</h2>
              <p className="text-[#282120] mb-2">You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-1 text-[#282120]">
                <li>Providing accurate and complete information about the property and project;</li>
                <li>Arranging safe and timely access to the property for on-site shoots;</li>
                <li>Ensuring that any required permissions for filming and drone use are obtained (for example from the owner or building management);</li>
                <li>Checking all deliverables and informing us promptly of any errors.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">8. Revisions</h2>
              <p className="text-[#282120]">
                Each package includes a limited number of revision rounds (as indicated per service). Revisions must be requested within 7 days after first delivery. Additional revision rounds or major changes may be charged at our current hourly or fixed rates.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">9. Use of drone</h2>
              <p className="text-[#282120]">
                Drone operations are subject to weather conditions and local regulations. If drone use is not possible due to safety, legal or weather reasons, we will adapt the shoot accordingly. We may offer alternative footage or partial refund of the drone portion at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">10. Intellectual property and usage rights</h2>
              <p className="text-[#282120] mb-2">
                We retain the copyright to all photos, videos and floor plans we create, unless otherwise agreed in writing.
              </p>
              <p className="text-[#282120] mb-2">
                We grant you a non-exclusive licence to use the delivered materials for marketing and presentation of the specific property or project concerned (for example on real estate portals, your website and social media).
              </p>
              <p className="text-[#282120]">
                You may not resell or license the materials to third parties without our written permission, except to promote the property itself.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">11. Cancellations and rescheduling</h2>
              <p className="text-[#282120] mb-2">If you need to cancel or reschedule a booked shoot:</p>
              <ul className="list-disc pl-6 space-y-1 text-[#282120]">
                <li>More than 48 hours before the appointment: free rescheduling.</li>
                <li>Within 48 hours: we may charge a cancellation or call-out fee to cover reserved time and travel.</li>
              </ul>
              <p className="text-[#282120] mt-2">
                If we must cancel (for example due to illness or extreme weather), we will reschedule as soon as reasonably possible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">12. Liability</h2>
              <p className="text-[#282120] mb-2">
                We are liable only for direct damages caused by our wilful misconduct or gross negligence. We are not liable for indirect or consequential damages such as loss of income, loss of data, loss of opportunities, or claims from third parties.
              </p>
              <p className="text-[#282120]">
                Our total liability per order is limited to the amount invoiced for that order.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">13. Force majeure</h2>
              <p className="text-[#282120]">
                We are not liable for delays or failure to perform due to events beyond our reasonable control (force majeure), including but not limited to extreme weather, power failures, strikes, government measures, pandemics or technical failures of third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">14. Changes to services and Terms</h2>
              <p className="text-[#282120]">
                We may update our services, prices and these Terms & Conditions from time to time. The version in force at the time of your order applies to that order. The latest version will always be available on our website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">15. Governing law and jurisdiction</h2>
              <p className="text-[#282120]">
                These Terms & Conditions are governed by Belgian law. Any disputes will be submitted to the competent courts in Belgium, unless mandatory consumer law provides otherwise.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#243E8F] mb-3">16. Contact</h2>
              <p className="text-[#282120]">
                For questions about these Terms & Conditions, you can contact us at:
              </p>
              <p className="text-[#243E8F] font-medium">
                Email: <a href="mailto:info@immoaura.be" className="hover:underline">info@immoaura.be</a>
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terms;

