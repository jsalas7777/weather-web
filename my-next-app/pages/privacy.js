export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-sm leading-relaxed text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p>Effective date: August 7, 2025</p>

      <p className="mt-4">
        This Privacy Policy describes how GlobalWeather ("we", "our", or "us") collects, uses, and protects your personal information when you use our mobile application or website.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. Information We Collect</h2>
      <ul className="list-disc ml-5">
        <li><strong>Location Data:</strong> With your permission, we collect precise location data to provide localized weather forecasts.</li>
        <li><strong>Device Information:</strong> We may collect information such as device model, operating system, and IP address for analytics and app functionality.</li>
        <li><strong>Usage Data:</strong> We collect anonymous usage data to improve app performance and user experience.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">2. How We Use Your Information</h2>
      <ul className="list-disc ml-5">
        <li>To provide accurate local weather data</li>
        <li>To improve app performance and reliability</li>
        <li>To analyze usage trends and improve features</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">3. Sharing of Information</h2>
      <p>
        We do not sell your personal information. We may share anonymized data with trusted third-party analytics providers. Location data is used strictly for in-app functionality and is not shared with advertisers.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">4. Data Security</h2>
      <p>
        We take appropriate security measures to protect your data from unauthorized access, alteration, disclosure, or destruction.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">5. Your Choices</h2>
      <ul className="list-disc ml-5">
        <li>You can disable location access through your device settings.</li>
        <li>You may request deletion of any stored data by contacting us.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">6. Children’s Privacy</h2>
      <p>
        Our app is not intended for children under the age of 13. We do not knowingly collect personal data from children.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">7. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy occasionally. We will notify users of significant changes through the app or website.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">8. Contact Us</h2>
      <p>
        If you have any questions or concerns, contact us at <a href="mailto:support@globalweather.app" className="text-blue-600 underline">support@globalweather.app</a>.
      </p>
    </div>
  );
}
