import { useLanguage } from "@/lib/language-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

export default function TermsAndConditions() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Terms and Conditions",
      lastUpdated: "Last updated: July 2026",
      introduction: "Welcome to Poptum! Poptum is a brand operated by Moforce Exim. These Terms and Conditions govern your access to and use of our website, services, and the purchasing of our premium roasted foxnut snacks. By accessing the site, registering an account, or placing an order, you agree to be bound by these terms.",
      sections: [
        {
          title: "1. Account Registration and Security",
          paragraphs: [
            "• Account Creation: To access certain features, including order logs and checkout pre-filling where implemented, you may register a customer account. You agree to provide accurate, current, and complete details.",
            "• Credentials Protection: You are responsible for maintaining the confidentiality of your username and password. We encrypt passwords securely using industry practices (bcrypt hashing), but you are responsible for preventing unauthorized access to your account. You agree to notify us immediately of any security breach or unauthorized use."
          ]
        },
        {
          title: "2. Snack Catalog, Pricing, and Bulk Discounts",
          paragraphs: [
            "• Snacking Products: We market premium roasted foxnuts (Makhana) in various flavor varieties as presented on our catalog pages.",
            "• Pricing and Currency: Product prices and currency display may vary according to the selected country/market and the prices shown at the time of checkout.",
            "• Bulk Discounts: We may offer promotional discounts and shipping configurations, which are computed in your shopping cart before checkout."
          ]
        },
        {
          title: "3. Order Placements and Tax Calculations",
          paragraphs: [
            "• Tax Calculations: Applicable taxes may be calculated according to the relevant tax rules and the applicable product/market requirements at checkout.",
            "• Order Expiry: Pending payment sessions and orders may expire after the configured payment window and may be marked as cancelled or failed. Order and transaction records may be retained for legitimate business, accounting, tax, legal, and operational purposes."
          ]
        },
        {
          title: "4. Payments and Order Processing",
          paragraphs: [
            "• Payments in India: Online checkouts within India are processed via Razorpay. Razorpay processes the payment information entered into its secure checkout, while Poptum receives relevant payment references and payment status required to verify and process the order.",
            "• Payments in Germany: The website currently does not provide an integrated online payment gateway for Germany/European checkouts. Customers may submit an order request, after which the Poptum team may contact them regarding payment and order arrangements. Orders should only be dispatched after applicable payment arrangements have been confirmed.",
            "• Billing Documents: Where applicable, the system may generate PDF invoices or order-related billing documents using information provided during the order/payment process, and such documents may be sent to the email address provided for the relevant order."
          ]
        },
        {
          title: "5. Shipping and Delivery",
          paragraphs: [
            "• Shipping Terms: Shipping and delivery options are presented at the time of checkout. Delivery estimates are indicative only and do not constitute guaranteed delivery dates. We strive to process and ship orders promptly, but we are not responsible for delays caused by carrier services, customs clearance, or other third-party logistics disruptions."
          ]
        },
        {
          title: "6. Intellectual Property Rights",
          paragraphs: [
            "All content present on this website—including but not limited to brand logos (POPTUM), product graphics, text, slogans, design systems, and animations—is the intellectual property of Moforce Exim or our partners and is protected by copyright and trademark laws. You may not reproduce or use our brand assets without explicit written consent."
          ]
        },
        {
          title: "7. Changes to These Terms",
          paragraphs: [
            "We reserve the right to update or modify these Terms and Conditions at any time. Any changes will be published directly on this website and will take effect immediately upon posting. We encourage you to review these terms periodically."
          ]
        },
        {
          title: "8. Limitation of Liability and Disputes",
          paragraphs: [
            "• Limitation: To the extent permitted by applicable law, Poptum, Moforce Exim, and Tirhuthwala Innovations Pvt. Ltd. shall not be liable for any indirect, incidental, or consequential damages arising from your use of this website, order fulfillment delays, or payment gateway service disruptions.",
            "• Dispute Resolution: Unless otherwise agreed or required by applicable consumer protection laws, any disputes arising under these terms may be submitted to the competent courts of the operator's business location."
          ]
        }
      ]
    },
    de: {
      title: "Allgemeine Geschäftsbedingungen",
      lastUpdated: "Zuletzt aktualisiert: Juli 2026",
      introduction: "Willkommen bei Poptum! Poptum ist eine Marke, die von Moforce Exim betrieben wird. Diese Allgemeinen Geschäftsbedingungen (AGB) regeln Ihren Zugriff auf unsere Website, unsere Dienstleistungen und den Kauf unserer erstklassigen gerösteten Fuchsnuss-Snacks (Makhana). Durch das Aufrufen der Website, die Registrierung eines Kontos oder eine Bestellung erklären Sie sich mit diesen Bedingungen einverstanden.",
      sections: [
        {
          title: "1. Kontoregistrierung und Sicherheit",
          paragraphs: [
            "• Kontoerstellung: Um bestimmte Funktionen zu nutzen (wie z.B. das Bestellprotokoll oder die automatische Ausfüllung von Adressdaten), können Sie ein Kundenkonto registrieren. Sie verpflichten sich, genaue, aktuelle und vollständige Angaben zu machen.",
            "• Schutz der Zugangsdaten: Sie sind für die Geheimhaltung Ihres Benutzernamens und Passworts verantwortlich. Wir verschlüsseln Passwörter sicher unter Verwendung branchenüblicher Praktiken (Bcrypt-Hashing), aber die Verantwortung für die Verhinderung unbefugter Zugriffe liegt bei Ihnen. Sie stimmen zu, uns unverzüglich über Sicherheitsverletzungen zu informieren."
          ]
        },
        {
          title: "2. Snack-Katalog, Preise und Rabatte",
          paragraphs: [
            "• Snack-Produkte: Wir vertreiben erstklassig geröstete Fuchsnüsse (Makhana) in verschiedenen Geschmacksrichtungen, wie auf unseren Katalogseiten dargestellt.",
            "• Preise und Währung: Produktpreise und die Währungsanzeige können je nach ausgewähltem Land/Markt und den zum Zeitpunkt der Kasse angezeigten Preisen variieren.",
            "• Mengenrabatte: Wir bieten gegebenenfalls Werberabatte und Versandkonfigurationen an, die im Warenkorb vor der Kasse berechnet werden."
          ]
        },
        {
          title: "3. Bestellungen und Steuerberechnungen",
          paragraphs: [
            "• Steuerberechnungen: Anfallende Steuern können gemäß den relevanten Steuervorschriften und den geltenden Produkt-/Marktanforderungen an der Kasse berechnet werden.",
            "• Ablauf ausstehender Bestellungen: Ausstehende Zahlungssitzungen und Bestellungen können nach Ablauf des konfigurierten Zahlungsfensters verfallen und als storniert oder fehlgeschlagen markiert werden. Bestell- und Transaktionsdaten können für legitime geschäftliche, buchhalterische, steuerliche, rechtliche und betriebliche Zwecke aufbewahrt werden."
          ]
        },
        {
          title: "4. Zahlungen und Bestellungsabwicklung",
          paragraphs: [
            "• Zahlungen in Indien: Online-Bestellungen innerhalb Indiens werden über das Razorpay-Zahlungstor abgewickelt. Razorpay verarbeitet die im Rahmen des Kassenbereichs eingegebenen Zahlungsinformationen, während Poptum nur relevante Transaktionsreferenzen und den Zahlungsstatus erhält, die zur Überprüfung und Bearbeitung von Bestellungen erforderlich sind.",
            "• Zahlungen in Deutschland: Die Website bietet derzeit kein integriertes Online-Zahlungssystem für deutsche/europäische Bestellungen an. Kunden können eine Bestellanfrage senden, woraufhin das Poptum-Team sie bezüglich der Zahlungs- und Bestellmodalitäten kontaktieren kann. Lieferungen sollten erst nach Bestätigung der entsprechenden Zahlungsvereinbarungen versandt werden.",
            "• Rechnungsdokumente: Soweit anwendbar, kann das System PDF-Rechnungen oder bestellbezogene Abrechnungsdokumente unter Verwendung der während des Bestell-/Zahlungsvorgangs bereitgestellten Informationen generieren. Solche Dokumente können an die für die jeweilige Bestellung angegebene E-Mail-Adresse gesendet werden."
          ]
        },
        {
          title: "5. Versand und Lieferung",
          paragraphs: [
            "• Versandbedingungen: Versand- und Lieferoptionen werden zum Zeitpunkt der Kasse angezeigt. Lieferzeiten sind unverbindliche Schätzungen und stellen keine garantierten Liefertermine dar. Wir bemühen uns um eine zügige Bearbeitung und den Versand von Bestellungen, sind jedoch nicht verantwortlich für Verzögerungen durch Paketdienste, Zollabfertigungen oder sonstige logistische Störungen Dritter."
          ]
        },
        {
          title: "6. Geistiges Eigentum",
          paragraphs: [
            "Alle auf dieser Website enthaltenen Inhalte — einschließlich Logos (POPTUM), Produktgrafiken, Texte, Slogans, Designsysteme und Animationen — sind das geistige Eigentum von Moforce Exim oder unseren Partnern und sind urheber- und markenrechtlich geschützt. Eine Vervielfältigung oder Verwendung ohne vorherige schriftliche Zustimmung ist untersagt."
          ]
        },
        {
          title: "7. Änderungen dieser Bedingungen",
          paragraphs: [
            "Wir behalten uns das Recht vor, diese Allgemeinen Geschäftsbedingungen jederzeit zu aktualisieren oder zu ändern. Änderungen werden direkt auf dieser Website veröffentlicht und treten sofort mit der Veröffentlichung in Kraft. Wir empfehlen Ihnen, diese Bedingungen regelmäßig zu lesen."
          ]
        },
        {
          title: "8. Haftungsbeschränkung und Gerichtsstand",
          paragraphs: [
            "• Haftungsbeschränkung: Soweit nach geltendem Recht zulässig, haften Poptum, Moforce Exim und Tirhuthwala Innovations Pvt. Ltd. nicht für indirekte, zufällige oder Folgeschäden, die aus der Nutzung der Website, Lieferverzögerungen oder Ausfällen von Zahlungssystemen resultieren.",
            "• Gerichtsstand: Sofern nicht anders vereinbart oder durch geltende Verbraucherschutzgesetze vorgeschrieben, können Streitigkeiten aus diesen Bedingungen den zuständigen Gerichten am Geschäftssitz des Betreibers vorgelegt werden."
          ]
        }
      ]
    }
  };

  const activeContent = language === "de" ? content.de : content.en;

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-16 px-4 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="border-b pb-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 font-heading">
              {activeContent.title}
            </h1>
            <p className="mt-2 text-sm text-gray-500 font-sans">
              {activeContent.lastUpdated}
            </p>
          </div>

          <p className="text-base leading-relaxed font-sans text-gray-600">
            {activeContent.introduction}
          </p>

          <div className="space-y-8 mt-8">
            {activeContent.sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h2 className="text-xl font-bold text-gray-950 font-heading">
                  {section.title}
                </h2>
                <div className="space-y-2">
                  {section.paragraphs.map((p, pIdx) => (
                    <p
                      key={pIdx}
                      className="text-sm leading-relaxed text-gray-600 font-sans"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
