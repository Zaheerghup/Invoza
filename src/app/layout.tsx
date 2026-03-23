import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppWrapper from "@/components/AppWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Invoza | Professional Accounting & FBR POS Integration Engine",
  description: "Invoza is a premium, powerful accounting and digital invoicing software explicitly built for Pakistani businesses. Dynamically sync, generate, and securely transmit massive transaction logs to the FBR Gateway flawlessly. Engineered by Zaheer.",
  metadataBase: new URL('https://invozaapp.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Invoza | Next-Gen Accounting Subsystem',
    description: 'Transform your business. Invoza handles FBR compliance natively with pristine performance and stunning interactive dashboards.',
    url: 'https://invozaapp.vercel.app',
    siteName: 'Invoza',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Invoza | Professional FBR Invoicing',
    description: 'The elegant gateway resolving FBR POS integration limits natively. Scale your business safely.',
    creator: '@invoza',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Invoza',
  operatingSystem: 'Any',
  applicationCategory: 'BusinessApplication',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '150',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'PKR',
  },
  author: {
    '@type': 'Person',
    name: 'Zaheer',
  },
  description: 'Invoza is a powerful Next.js accounting suite securely facilitating FBR integration algorithms automatically for sophisticated Pakistani enterprises.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AppWrapper>
          {children}
        </AppWrapper>
      </body>
    </html>
  );
}
