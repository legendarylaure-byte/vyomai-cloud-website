import { LegalPageLayout } from "./legal-page";

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your personal information."
      lastUpdated="July 18, 2026"
      ogDescription="Privacy Policy for VyomAi Cloud Pvt. Ltd - Your data privacy matters to us."
    >
      <h2>1. Introduction</h2>
      <p>
        VyomAi Cloud Pvt. Ltd ("Company," "we," "us," or "our") is committed to protecting your privacy. 
        This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
        visit our website at vyomai.cloud and use our AI-powered services (collectively, the "Services").
      </p>
      <p>
        By using our Services, you consent to the data practices described in this policy. If you do not agree 
        with this policy, please do not access the Services.
      </p>

      <h2>2. Information We Collect</h2>
      <h3>2.1 Personal Information</h3>
      <p>We may collect personally identifiable information that you voluntarily provide, including:</p>
      <ul>
        <li>Name, email address, and phone number</li>
        <li>Company name and job title</li>
        <li>Billing and payment information</li>
        <li>Account credentials (username and encrypted password)</li>
        <li>Communications you send to us (support requests, feedback)</li>
      </ul>

      <h3>2.2 Automatically Collected Information</h3>
      <p>When you access our Services, we automatically collect:</p>
      <ul>
        <li>Device information (browser type, operating system, device identifiers)</li>
        <li>Log data (IP address, access times, pages viewed, referring URLs)</li>
        <li>Usage data (features used, interactions, preferences)</li>
        <li>Location data (country and city level, derived from IP address)</li>
      </ul>

      <h3>2.3 AI Interaction Data</h3>
      <p>
        When you use our AI-powered features, we process the inputs you provide and the outputs generated. 
        This data is used to deliver the Services and may be used in aggregated, anonymized form to improve 
        our AI models. We do not use your specific business data to train models for other customers.
      </p>

      <h2>3. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, operate, and maintain our Services</li>
        <li>Process transactions and send related information (receipts, confirmations)</li>
        <li>Send administrative information (service updates, security alerts)</li>
        <li>Respond to your inquiries and provide customer support</li>
        <li>Improve and personalize our Services</li>
        <li>Analyze usage patterns to enhance functionality</li>
        <li>Detect, prevent, and address technical issues and fraud</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>4. Information Sharing</h2>
      <p>We do not sell your personal information. We may share your information only:</p>
      <ul>
        <li><strong>With service providers:</strong> Trusted third parties who assist in operating our Services (hosting, payment processing, analytics), bound by contractual obligations to protect your data</li>
        <li><strong>For legal reasons:</strong> When required by law, regulation, legal process, or governmental request</li>
        <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets, with notice to you</li>
        <li><strong>With your consent:</strong> For any other purpose with your explicit authorization</li>
      </ul>

      <h2>5. Data Security</h2>
      <p>
        We implement industry-standard security measures to protect your information, including:
      </p>
      <ul>
        <li>Encryption of data in transit (TLS/SSL) and at rest</li>
        <li>Regular security audits and vulnerability assessments</li>
        <li>Access controls and authentication mechanisms</li>
        <li>Employee training on data protection practices</li>
      </ul>
      <p>
        However, no method of electronic transmission or storage is 100% secure. While we strive to use 
        commercially acceptable means to protect your data, we cannot guarantee absolute security.
      </p>

      <h2>6. Cookies and Tracking</h2>
      <p>
        We use cookies and similar tracking technologies to enhance your experience. For full details, 
        please see our <a href="/cookies">Cookie Policy</a>. You can control cookie preferences through 
        your browser settings.
      </p>

      <h2>7. Data Retention</h2>
      <p>
        We retain your personal information only for as long as necessary to fulfill the purposes outlined 
        in this policy, unless a longer retention period is required by law. When you delete your account, 
        we will delete or anonymize your personal data within 30 days, except where we need to retain certain 
        information for legal or legitimate business purposes.
      </p>

      <h2>8. Your Rights</h2>
      <p>Depending on your location, you may have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your personal data</li>
        <li>Object to or restrict processing of your data</li>
        <li>Data portability — receive your data in a structured, machine-readable format</li>
        <li>Withdraw consent at any time</li>
      </ul>
      <p>
        To exercise these rights, please contact us at <a href="mailto:info@vyomai.cloud">info@vyomai.cloud</a>.
      </p>

      <h2>9. Children's Privacy</h2>
      <p>
        Our Services are not directed to individuals under 18. We do not knowingly collect personal information 
        from children. If we become aware that we have collected data from a child, we will take steps to 
        delete it promptly.
      </p>

      <h2>10. International Data Transfers</h2>
      <p>
        Your information may be processed in Nepal or other countries where our service providers operate. 
        By using our Services, you consent to the transfer of your information to these locations, which may 
        have different data protection laws than your jurisdiction.
      </p>

      <h2>11. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material changes by posting 
        the updated policy on our website and updating the "Last updated" date. We encourage you to review this 
        policy periodically.
      </p>

      <h2>12. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or our data practices, please contact us:
      </p>
      <ul>
        <li>Email: <a href="mailto:info@vyomai.cloud">info@vyomai.cloud</a></li>
        <li>Address: Tokha, Kathmandu, Nepal</li>
        <li>Website: <a href="https://vyomai.cloud">vyomai.cloud</a></li>
      </ul>
    </LegalPageLayout>
  );
}
