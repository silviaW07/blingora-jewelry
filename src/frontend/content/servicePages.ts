export type ServicePageConfig = {
  slug: 'shipping' | 'payment' | 'buyer-show' | 'why-choose-us'
  title: string
  description: string
  iconSrc: string
  heroEyebrow: string
  heroTitle: string
  heroDescription: string
  sectionTitle: string
  sectionBody: string
}

export const SERVICE_PAGE_CONFIGS: ServicePageConfig[] = [
  {
    slug: 'shipping',
    title: 'Shipping',
    description: 'Fast global shipping with traceable milestones and clear delivery expectations.',
    iconSrc: '/service-icons/shipping.svg',
    heroEyebrow: 'Global logistics',
    heroTitle: 'Shipping support that keeps every order on track',
    heroDescription:
      'From sample orders to repeat wholesale replenishment, we coordinate packaging, routing, and milestone updates so buyers can track delivery with confidence.',
    sectionTitle: 'What this page covers',
    sectionBody:
      'Explain your shipping zones, dispatch timing, packaging standards, available logistics partners, customs notes, and the way customers can request support when a parcel is delayed.',
  },
  {
    slug: 'payment',
    title: 'Payment',
    description: 'Protected settlement flow with verified processing and transparent order records.',
    iconSrc: '/service-icons/payment.svg',
    heroEyebrow: 'Secure checkout',
    heroTitle: 'Payment guidance for safe and transparent purchasing',
    heroDescription:
      'Show customers how payments are secured, which methods are supported, what the review timeline looks like, and how billing records are confirmed after an order is placed.',
    sectionTitle: 'Recommended content',
    sectionBody:
      'Use this page to introduce available payment methods, invoicing rules, refund windows, settlement checkpoints, and the security commitments that protect every transaction.',
  },
  {
    slug: 'buyer-show',
    title: '买家秀',
    description: 'Real purchase stories, use cases, and product showcases from actual buyers.',
    iconSrc: '/service-icons/buyer-show.svg',
    heroEyebrow: 'Customer stories',
    heroTitle: 'Buyer showcases that build confidence before checkout',
    heroDescription:
      'Collect authentic customer feedback, product photos, styling results, or sourcing cases here so new visitors can quickly understand quality, presentation, and real-world use.',
    sectionTitle: 'Best use for this page',
    sectionBody:
      'Add testimonial text, gallery images, before-and-after comparisons, buyer quotes, or usage scenarios that prove how products perform after delivery.',
  },
  {
    slug: 'why-choose-us',
    title: 'Why choose us',
    description: 'A clear summary of service strengths, sourcing standards, and long-term value.',
    iconSrc: '/service-icons/why-choose-us.svg',
    heroEyebrow: 'Brand promise',
    heroTitle: 'Why buyers choose this storefront repeatedly',
    heroDescription:
      'Use this page to summarize your sourcing advantages, product curation standards, service response speed, and the reasons buyers stay for long-term cooperation.',
    sectionTitle: 'Suggested sections',
    sectionBody:
      'Highlight curated supply chain strengths, quality control, fulfillment collaboration, communication efficiency, after-sales support, and any brand values that make your store different.',
  },
]

export const SERVICE_PAGE_CONFIG_MAP = Object.fromEntries(
  SERVICE_PAGE_CONFIGS.map((item) => [item.slug, item]),
) as Record<ServicePageConfig['slug'], ServicePageConfig>
