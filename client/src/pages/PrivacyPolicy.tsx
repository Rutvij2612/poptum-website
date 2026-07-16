import { useLanguage } from "@/lib/language-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: July 2026",
      introduction: "At Poptum, we are committed to protecting your privacy. Poptum is a brand operated by Moforce Exim (Rajkot, India) and Tirhuthwala Innovations Pvt. Ltd. (Bihar, India). This Privacy Policy describes how we collect, use, store, and share your data when you use our website, register an account, or place an order.",
      sections: [
        {
          title: "1. Data We Collect and How We Collect It",
          paragraphs: [
            "We collect information directly from you when you interact with our website. The categories of data collected include:",
            "• Account Registration: When you sign up, we collect your First Name, Last Name, Email address, Phone number, Username, and Password (which is securely hashed). We also collect your default Country configuration (India or Germany). We do NOT offer Google Sign-In to customers and do not use Google OAuth2 for customer authentication.",
            "• Order & Shipping: When you submit an order, we collect order and shipping details: Full Name, Email, Phone number, Shipping Address, City, Postal Code, State, and Country. This data is collected to process payments, compute appropriate local taxes (Indian GST or German VAT), and fulfill order delivery. The application does not collect or store full credit card numbers or bank account details.",
            "• Customer Feedback: When you submit a review or rating (1-5 stars) or contact us through our contact forms, we collect the submitted feedback rating and any message content you provide.",
            "• Authentication Data: We use secure JSON Web Tokens (JWT) stored in your browser's localStorage to verify your session and role (user or admin) when logged in."
          ]
        },
        {
          title: "2. How We Use Your Data",
          paragraphs: [
            "We use the collected information for the following specific purposes:",
            "• Account Management: To authenticate your login credentials, enable access to your personal order dashboard, and manage your user account.",
            "• Order Fulfillment: To process your snacking orders, calculate bulk discounts, compute state-specific Indian GST or European VAT, and coordinate shipment of products.",
            "• Transactional Communications: To send automated order confirmation emails containing PDF invoices, payment receipts, or password reset instructions when requested.",
            "• Operations Management: To allow site administrators to view order logs, manage shipping statuses (Ordered, Processing, Shipped, Delivered, Cancelled), and review overall customer rating statistics."
          ]
        },
        {
          title: "3. Service Providers & Third-Party Sharing",
          paragraphs: [
            "We share your data only with third-party service providers necessary to operate our website and fulfill our services. Specifically:",
            "• Email Delivery (Google OAuth2 / Gmail API): The backend of our website uses Google OAuth2 and the Gmail API over secure HTTPS credentials purely for transactional email delivery (order confirmations, PDF invoices, password resets) to you and our administrators. Google OAuth2 is not used for customer login or customer-facing authentication.",
            "• Payment Gateways (Razorpay): For checkout transactions placed in India, Razorpay processes the payment information entered into its secure checkout. Poptum stores only relevant transaction references and payment status required to verify and process orders, and does not store customers' full card or UPI credentials. For checkouts in Germany, no online payment gateway is integrated; orders are processed as manual requests and payment is arranged offline.",
            "• Cloud Database (Supabase / PostgreSQL): Your user records, order histories, and rating logs are securely stored in a PostgreSQL database hosted by Supabase.",
            "We do not sell, rent, or trade your personal data to any third party for marketing or advertising purposes."
          ]
        },
        {
          title: "4. Cookies and Browser Local Storage",
          paragraphs: [
            "• Cookies: This website does not set or use any cookies.",
            "• Local Storage: We use your browser's localStorage for website functionality, such as storing session state (JWT authentication token and user permissions), language preference, cart persistence, and locally cached checkout information. This data remains on your local device/browser until cleared or removed."
          ]
        },
        {
          title: "5. Analytics and Tracking Tools",
          paragraphs: [
            "We do not utilize any third-party tracking pixels, analytics suites (such as Google Analytics or Facebook Pixel), or user behavior recorders on this website. Your browsing behavior is not tracked or analyzed."
          ]
        },
        {
          title: "6. Data Retention, Security, and Your Rights",
          paragraphs: [
            "• Data Security: We implement security measures such as bcrypt password hashing, JWT-based authentication controls, HTTPS encrypted network communication, server-side validation, and access controls. While we use these security practices, no method of transmission over the Internet or electronic storage is completely secure, and we cannot guarantee absolute security.",
            "• Data Retention: We store account registration details as long as your account remains active. Pending payment sessions and orders may expire after the configured payment window and may be marked as cancelled or failed. Order and transaction records may be retained for legitimate business, accounting, tax, legal, and operational purposes.",
            "• Your Rights: Where applicable under relevant data-protection laws, users may have rights such as access, correction, deletion, restriction, data portability, or objection, depending on the applicable law and circumstances. If you wish to request deletion or modification of your data, please contact our support team."
          ]
        },
        {
          title: "7. Contact Information",
          paragraphs: [
            "If you have any questions about this Privacy Policy or your data rights, please contact the Poptum team at info.poptum@gmail.com, or reach out to Moforce Exim at C-3-6, Radha Park, B/H White House, Kalavad Road, Rajkot 360005 (India)."
          ]
        }
      ]
    },
    de: {
      title: "Datenschutzerklärung",
      lastUpdated: "Zuletzt aktualisiert: Juli 2026",
      introduction: "Wir bei Poptum verpflichten uns dem Schutz Ihrer Privatsphäre. Poptum ist eine Marke, die von Moforce Exim (Rajkot, Indien) und Tirhuthwala Innovations Pvt. Ltd. (Bihar, Indien) betrieben wird. Diese Datenschutzerklärung beschreibt, wie wir Ihre Daten erheben, verwenden, speichern und weitergeben, wenn Sie unsere Website nutzen, ein Konto registrieren oder eine Bestellung aufgeben.",
      sections: [
        {
          title: "1. Erhebung und Art der Daten",
          paragraphs: [
            "Wir erheben Daten direkt von Ihnen, wenn Sie mit unserer Website interagieren. Die erhobenen Datenkategorien umfassen:",
            "• Kontoregistrierung: Bei der Registrierung erheben wir Ihren Vornamen, Nachnamen, Ihre E-Mail-Adresse, Ihre Telefonnummer, Ihren Benutzernamen und Ihr Passwort (das sicher per Hash verschlüsselt wird). Zudem speichern wir Ihre standardmäßige Ländereinstellung (Indien oder Deutschland). Wir bieten Kunden KEINE Google-Anmeldung (Google Sign-In) an und nutzen Google OAuth2 nicht zur Kundenauthentifizierung.",
            "• Bestellung & Versand: Wenn Sie eine Bestellung aufgeben, erheben wir Bestell- und Versanddaten: Vollständiger Name, E-Mail-Adresse, Telefonnummer, Lieferadresse, Stadt, Postleitzahl, Bundesland und Land. Diese Daten werden erhoben, um Zahlungen abzuwickeln, die anfallenden lokalen Steuern (indische GST oder deutsche MwSt.) zu berechnen und die Bestellung auszuliefern. Die Anwendung erfasst oder speichert keine vollständigen Kreditkartennummern oder Bankkontodaten.",
            "• Kundenfeedback: Wenn Sie eine Bewertung oder Sternebewertung (1-5 Sterne) abgeben oder uns über unsere Kontaktformulare kontaktieren, erfassen wir die übermittelte Bewertung sowie den von Ihnen eingegebenen Nachrichtentext.",
            "• Authentifizierungsdaten: Wir verwenden sichere JSON Web Tokens (JWT), die im localStorage Ihres Browsers gespeichert werden, um Ihre Sitzung und Rolle (Benutzer oder Administrator) nach der Anmeldung zu verifizieren."
          ]
        },
        {
          title: "2. Nutzung Ihrer Daten",
          paragraphs: [
            "Wir verwenden die erhobenen Daten ausschließlich für die folgenden Zwecke:",
            "• Kontoverwaltung: Um Ihre Anmeldedaten zu authentifizieren, den Zugang zu Ihrem persönlichen Bestell-Dashboard zu ermöglichen und Ihr Benutzerkonto zu verwalten.",
            "• Bestellabwicklung: Um Ihre Bestellungen zu bearbeiten, Mengenrabatte zu berechnen, die bundeslandspezifische indische GST oder deutsche Mehrwertsteuer zu berechnen und den Versand zu koordinieren.",
            "• Transaktionskommunikation: Um automatisierte Bestellbestätigungen per E-Mail zu versenden, die PDF-Rechnungen, Zahlungsbelege oder Anweisungen zum Zurücksetzen des Passworts enthalten.",
            "• Betriebsverwaltung: Um es unseren Systemadministratoren zu ermöglichen, Bestellprotokolle einzusehen, den Versandstatus (Bestellt, In Bearbeitung, Versandt, Geliefert, Storniert) zu verwalten und Kundenbewertungsstatistiken auszuwerten."
          ]
        },
        {
          title: "3. Dienstleister & Weitergabe an Dritte",
          paragraphs: [
            "Wir geben Ihre Daten nur an Dritte weiter, wenn dies für den Betrieb unserer Website und die Erbringung unserer Dienstleistungen zwingend erforderlich ist. Konkret:",
            "• E-Mail-Zustellung (Google OAuth2 / Gmail API): Das Backend unserer Website verwendet Google OAuth2 und die Gmail-API über sichere HTTPS-Verbindungen ausschließlich für die Zustellung von Transaktions-E-Mails (Bestellbestätigungen, PDF-Rechnungen, Passwort-Resets) an Sie und unsere Administratoren. Google OAuth2 wird nicht für Kunden-Logins oder kundenseitige Authentifizierungen verwendet.",
            "• Zahlungsabwickler (Razorpay): Bei Bestellungen in Indien verarbeitet Razorpay die im Rahmen des Kassenbereichs eingegebenen Zahlungsinformationen. Poptum speichert nur relevante Transaktionsreferenzen und den Zahlungsstatus, die zur Überprüfung und Bearbeitung von Bestellungen erforderlich sind, und speichert keine vollständigen Karten- oder UPI-Daten der Kunden. Für Bestellungen in Deutschland ist kein Online-Zahlungssystem integriert; diese werden als manuelle Anfragen erfasst und die Zahlung wird offline koordiniert.",
            "• Cloud-Datenbank (Supabase / PostgreSQL): Ihre Benutzerdaten, Bestellhistorien und Bewertungsprotokolle werden sicher in einer von Supabase gehosteten PostgreSQL-Datenbank gespeichert.",
            "Wir verkaufen, vermieten oder handeln nicht mit Ihren personenbezogenen Daten für Marketing- oder Werbezwecke."
          ]
        },
        {
          title: "4. Cookies und lokaler Browser-Speicher (LocalStorage)",
          paragraphs: [
            "• Cookies: Diese Website setzt oder verwendet keine Cookies.",
            "• Lokaler Speicher: Wir nutzen den localStorage Ihres Browsers für die Funktionalität der Website, wie die Speicherung des Sitzungsstatus (JWT-Sitzungskennung und Benutzerberechtigungen), der Sprachpräferenz, des Warenkorb-Inhalts und der lokal zwischengespeicherten Bestellinformationen. Diese Daten verbleiben auf Ihrem lokalen Gerät/Browser, bis sie gelöscht oder entfernt werden."
          ]
        },
        {
          title: "5. Analysen und Tracking-Tools",
          paragraphs: [
            "Wir verwenden auf dieser Website keine Tracking-Pixel von Drittanbietern, keine Analyse-Suiten (wie Google Analytics oder Facebook-Pixel) und keine Tools zur Aufzeichnung des Nutzerverhaltens. Ihr Surfverhalten wird nicht erfasst oder analysiert."
          ]
        },
        {
          title: "6. Datenspeicherung, Sicherheit und Ihre Rechte",
          paragraphs: [
            "• Datensicherheit: Wir setzen Sicherheitsmaßnahmen wie Bcrypt-Passworthashs, JWT-basierte Authentifizierungssteuerungen, HTTPS-verschlüsselte Netzwerkkommunikation, serverseitige Validierungen und Zugriffskontrollen ein. Obwohl wir diese Sicherheitspraktiken anwenden, ist keine Methode der Übertragung über das Internet oder der elektronischen Speicherung absolut sicher, und wir können keine absolute Sicherheit garantieren.",
            "• Datenspeicherung: Wir speichern Kontodaten, solange Ihr Konto aktiv bleibt. Ausstehende Zahlungssitzungen und Bestellungen können nach Ablauf des konfigurierten Zahlungsfensters verfallen und als storniert oder fehlgeschlagen markiert werden. Bestell- und Transaktionsdaten können für legitime geschäftliche, buchhalterische, steuerliche, rechtliche und betriebliche Zwecke aufbewahrt werden.",
            "• Ihre Rechte: Soweit nach den geltenden Datenschutzgesetzen anwendbar, können Nutzer Rechte wie Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit oder Widerspruch haben, je nach anwendbarem Recht und den jeweiligen Umständen. Wenn Sie eine Löschung oder Änderung Ihrer Daten beantragen möchten, wenden Sie sich bitte an unser Support-Team."
          ]
        },
        {
          title: "7. Kontaktinformationen",
          paragraphs: [
            "Wenn Sie Fragen zu dieser Datenschutzerklärung oder Ihren Datenrechten haben, kontaktieren Sie das Poptum-Team bitte unter info.poptum@gmail.com oder wenden Sie sich an Moforce Exim unter C-3-6, Radha Park, B/H White House, Kalavad Road, Rajkot 360005 (Indien)."
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
