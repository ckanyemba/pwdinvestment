import type { SiteResponse } from './types';

// Minimal site chrome used when the API is unreachable (e.g. a build without the server running),
// so the header/footer still render. Real values come from the API's `site` setting.
export const FALLBACK_SITE: SiteResponse = {
  site: {
    name: 'PMD Investment Academy',
    tagline: 'Financial Markets Education (Learn to trade Forex, Commodities, Crypto-currencies, Shares and many more)',
    address: ['58 Marshall Street', 'Office 412, The Business Place', 'Marshalltown', 'Johannesburg', '2107'],
    phone: '087 702 1911',
    fax: '',
    emails: { general: 'info@pmdinvestment.co.za', admin: 'admin@pmdinvestment.co.za' },
    social: {
      facebook: 'https://www.facebook.com/pmdinvestment/',
      twitter: 'https://twitter.com/pmdinvestment',
      linkedin: 'https://www.linkedin.com/company/pmd-investment-solutions',
    },
    contacts: [],
    map: { query: 'PMD Investment Solutions Pty Ltd, 58 Marshall Street, Marshalltown, Johannesburg', lat: -26.2081533, lng: 28.0354943 },
  },
  home: {
    slides: [],
    services: [],
    quote: '',
    quoteImage: null,
    industries: [],
    stats: [],
    whyUs: [],
    partners: [],
    liveAccountUrl: '',
  },
  nav: [],
};
