import { LegalPageLayout } from "./legal-page";

export default function CookiePolicy() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      subtitle="Understanding how we use cookies to improve your experience."
      lastUpdated="July 18, 2026"
      ogDescription="Cookie Policy for VyomAi Cloud Pvt. Ltd - How we use cookies on our website."
    >
      <h2>1. What Are Cookies</h2>
      <p>
        Cookies are small text files that are placed on your device (computer, tablet, or mobile) when you visit 
        a website. They are widely used to make websites work efficiently, provide a better user experience, and 
        supply information to the website owners.
      </p>

      <h2>2. How We Use Cookies</h2>
      <p>We use cookies for the following purposes:</p>
      <ul>
        <li><strong>Essential cookies:</strong> Required for the website to function properly. These enable core 
        features such as security, session management, and accessibility. You cannot opt out of these cookies 
        as the website will not work without them.</li>
        <li><strong>Preference cookies:</strong> Remember your settings and choices (such as language preference, 
        theme selection) to provide a personalized experience.</li>
        <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with our website by 
        collecting and reporting information anonymously. This helps us improve our Services.</li>
        <li><strong>Authentication cookies:</strong> Remember you when you log in, so you don't have to re-enter 
        credentials on each page visit.</li>
      </ul>

      <h2>3. Specific Cookies We Use</h2>
      <p>Our website uses the following cookies:</p>
      <ul>
        <li><strong>Session cookies:</strong> Temporary cookies that exist only while you browse. They are deleted 
        when you close your browser.</li>
        <li><strong>Theme preference:</strong> Stores your light/dark mode preference using localStorage.</li>
        <li><strong>Session management:</strong> Secure session cookies for authentication and admin access, 
        managed by our server infrastructure.</li>
        <li><strong>Visitor tracking:</strong> Anonymous visit counting to understand traffic patterns.</li>
      </ul>

      <h2>4. Third-Party Cookies</h2>
      <p>We may use third-party services that set their own cookies, including:</p>
      <ul>
        <li><strong>Google Analytics:</strong> For website usage analysis. Google's privacy policy applies.</li>
        <li><strong>Google Fonts:</strong> For font delivery. Google may set cookies for font caching.</li>
        <li><strong>Social media platforms:</strong> When you interact with social media widgets (LinkedIn, 
        Facebook, Instagram), those platforms may set cookies.</li>
      </ul>

      <h2>5. Managing Cookies</h2>
      <p>You can control and manage cookies in several ways:</p>
      <ul>
        <li><strong>Browser settings:</strong> Most browsers allow you to block or delete cookies. Check your 
        browser's help section for instructions.</li>
        <li><strong>Opt-out links:</strong> For Google Analytics, you can install the 
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.</li>
        <li><strong>localStorage:</strong> You can clear localStorage through your browser's developer tools 
        or settings.</li>
      </ul>
      <p>
        Please note that disabling certain cookies may affect the functionality of our website and your 
        user experience.
      </p>

      <h2>6. Do Not Track Signals</h2>
      <p>
        Some browsers offer a "Do Not Track" (DNT) feature. There is currently no universally accepted standard 
        for how websites should respond to DNT signals. We currently do not alter our data collection practices 
        in response to DNT signals, but we will update this policy if a standard is adopted.
      </p>

      <h2>7. Updates to This Policy</h2>
      <p>
        We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or 
        our business practices. When we make material changes, we will update the "Last updated" date and, where 
        appropriate, notify you.
      </p>

      <h2>8. Contact Us</h2>
      <p>
        If you have questions about our use of cookies, please contact us:
      </p>
      <ul>
        <li>Email: <a href="mailto:info@vyomai.cloud">info@vyomai.cloud</a></li>
        <li>Address: Tokha, Kathmandu, Nepal</li>
        <li>Website: <a href="https://vyomai.cloud">vyomai.cloud</a></li>
      </ul>
    </LegalPageLayout>
  );
}
