export interface ProjectItem {
  accent: 'blue' | 'tech';
  title: string;
  category: string;
  categoryNote: string;
  imageBase: string;
  alt: string;
  summary: string;
  tags: string[];
  overview: string;
  direction: string;
  features: string[];
  services: string[];
}

export const PORTFOLIO_PROJECTS: ProjectItem[] = [
  {
    accent: 'blue',
    title: 'Property Experiences',
    category: 'Web Development — Real Estate Website',
    categoryNote: 'Category: Real Estate Web Experience',
    imageBase: '/assets/images/portfolio_real_estate_1794591173336',
    alt: 'Contemporary architectural luxury residence overlooking the coast in natural twilight',
    summary:
      'An editorial real estate web experience built to frame coastal architectural residences with clarity, spatial breathing room, and effortless inquiry navigation.',
    tags: ['Real Estate', 'Architecture UI', 'Web Development', 'Responsive Layout'],
    overview:
      'Designed as a dedicated digital showcase for architectural properties, giving prospective buyers an uncluttered space to explore residences, floor specifications, and private viewing inquiries across desktop and mobile.',
    direction:
      'Twilight architectural photography anchors a dark-navy editorial layout paired with restrained typography, warm dusk highlights, and crisp hairline dividers that keep focus on form and surroundings.',
    features: [
      'Full-bleed architectural property galleries with crisp detail views',
      'Structured residence specifications and location overview sections',
      'Responsive viewing request flow integrated seamlessly below listings',
    ],
    services: [
      'Web Development',
      'UI/UX Architecture',
      'Responsive Frontend Engineering',
    ],
  },
  {
    accent: 'blue',
    title: 'Automotive Digital Experience',
    category: 'Web Design — Automotive Website',
    categoryNote: 'Category: Automotive Web Experience',
    imageBase: '/assets/images/portfolio_automotive_detailing_1794591174512',
    alt: 'Glossy deep-navy sports coupe under overhead linear lighting inside a dark detailing studio',
    summary:
      'A dark-studio automotive web concept engineered around dramatic overhead lighting, high-contrast finishes, and direct service booking.',
    tags: ['Automotive', 'Dark UI', 'Web Design', 'Interactive Showcase'],
    overview:
      'Built to present automotive craftsmanship, detailing packages, and vehicle showcases in a focused digital environment that mirrors the precision of a dedicated studio bay.',
    direction:
      'Deep navy-black surfaces echo overhead linear lighting inside the studio, pairing sharp display typography and subtle electric-blue accents with clean technical framing.',
    features: [
      'Studio-framed vehicle showcase with high-contrast visual hierarchy',
      'Clear service tier and finish comparison structure',
      'Direct booking and consultation handoff paths across devices',
    ],
    services: [
      'Web Design',
      'Creative Direction',
      'Interactive UI Systems',
    ],
  },
  {
    accent: 'blue',
    title: 'Commerce Without Limits',
    category: 'E-Commerce — E-Commerce Store',
    categoryNote: 'Category: Direct-to-Consumer Storefront',
    imageBase: '/assets/images/portfolio_ecommerce_studio_1794591174576',
    alt: 'Art-directed studio product photography of matte-black headphones, brushed aluminum speaker, and dark ceramic vessel',
    summary:
      'A modern direct-to-consumer e-commerce storefront crafted around tactile hardware photography, clear product storytelling, and friction-free checkout.',
    tags: ['Shopify UI', 'Storefront', 'E-Commerce', 'Checkout UX'],
    overview:
      'Structured to elevate consumer hardware and lifestyle objects through an uncluttered catalog experience, intuitive variant selection, and dependable mobile shopping flows.',
    direction:
      'Matte stone surfaces, brushed aluminum highlights, and controlled studio shadows inform a calm, product-led storefront aesthetic free of visual clutter.',
    features: [
      'Modular collection architecture built for scalable product catalogs',
      'Clear variant selectors, pricing clarity, and tactile product cards',
      'Streamlined cart and mobile-ready checkout navigation',
    ],
    services: [
      'E-commerce Solutions',
      'Storefront UI/UX Design',
      'Web Development',
    ],
  },
  {
    accent: 'tech',
    title: 'Connected Business Systems',
    category: 'AI & Automation — Workflow Automation',
    categoryNote: 'Category: Intelligent Operations & Systems',
    imageBase: '/assets/images/portfolio_automation_workspace_1794591176046',
    alt: 'Modern technology operations workstation with dual monitors running live workflow automation and telemetry',
    summary:
      'An operational automation system designed to connect internal tools, reduce repetitive manual handoffs, and give teams clear visibility over recurring workflows.',
    tags: ['Workflows', 'Systems', 'AI & Automation', 'Integrations'],
    overview:
      'Architected around multi-screen operational control, unifying lead intake, task routing, and automated notifications into a reliable workflow layer for daily operations.',
    direction:
      'Dark-mode operator ergonomics guide every interface decision—muted navy panels, crisp monospace status labels, and restrained electric-blue signals built for sustained readability.',
    features: [
      'Automated lead qualification and cross-tool task synchronization',
      'Clear operational status views and exception alert routing',
      'Modular workflow triggers designed to scale alongside business tools',
    ],
    services: [
      'AI & Automation',
      'Systems Architecture',
      'Operational Workflow Design',
    ],
  },
  {
    accent: 'blue',
    title: 'Identity in Every Detail',
    category: 'Branding — Visual Identity System',
    categoryNote: 'Category: Brand Identity & Print Collateral',
    imageBase: '/assets/images/portfolio_brand_identity_1794591175730',
    alt: 'Editorial flat-lay photoshoot of navy-blue brand identity stationery, packaging box, embossed folder, and business cards',
    summary:
      'A comprehensive brand identity system translating structural geometry, navy materiality, and typographic precision across physical stationery and digital touchpoints.',
    tags: ['Visual Identity', 'Guidelines', 'Branding', 'Collateral'],
    overview:
      'Developed to give businesses a unified visual foundation across packaging, print collateral, stationery, and digital platforms through clear, repeatable brand standards.',
    direction:
      'Tactile deep-navy stocks, embossed geometric emblems, and disciplined grid proportions create quiet authority across physical packaging and screen interfaces alike.',
    features: [
      'Cohesive geometric emblem and custom wordmark construction',
      'Stationery, packaging box, folder, and business card templates',
      'Documented typography, color, and spacing guidelines',
    ],
    services: [
      'Creative & Branding',
      'Visual Identity Design',
      'Brand Guidelines',
    ],
  },
  {
    accent: 'blue',
    title: 'Intelligent Digital Products',
    category: 'UI/UX Design — SaaS Product Interface',
    categoryNote: 'Category: SaaS Product & Interface System',
    imageBase: '/assets/images/portfolio_digital_product_1794591175822',
    alt: 'Dark minimalist design studio desk with a large monitor displaying a dark-navy SaaS analytics product interface',
    summary:
      'A dark-mode SaaS product interface and component system built to organize complex analytics, team workflows, and settings into an intuitive daily workspace.',
    tags: ['SaaS Interface', 'Product UI', 'UI/UX Design', 'Design Systems'],
    overview:
      'Crafted to simplify information-dense software products by clarifying navigation hierarchy, reducing visual noise, and standardizing reusable interface patterns.',
    direction:
      'Clean architectural grids, low-glare navy surfaces, and purposeful electric-blue active states help users scan complex views comfortably over extended sessions.',
    features: [
      'Scalable component library and consistent dark-mode token architecture',
      'Structured workspace navigation with clear visual prioritization',
      'Accessible keyboard-friendly controls and responsive viewports',
    ],
    services: [
      'UI/UX Design',
      'Design Systems',
      'Product Interface Prototyping',
    ],
  },
];
