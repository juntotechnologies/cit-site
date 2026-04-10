export type ServiceImageLayout = "banner" | "two-col" | "three-col";

export interface ServiceImage {
  src: string;
  alt: string;
}

export interface ServiceSection {
  heading?: string;
  paragraphs?: string[];
  listItems?: string[];
}

export interface ServicePage {
  slug: string;
  title: string;
  shortDescription: string;
  published: boolean;
  images?: {
    layout: ServiceImageLayout;
    items: ServiceImage[];
  };
  sections: ServiceSection[];
}

export const services: ServicePage[] = [
  {
    slug: "custom-synthesis",
    title: "Custom Synthesis",
    shortDescription:
      "Novel molecules, rare compounds, and complex organic synthesis from grams to tons. Our PhD chemists design synthetic routes tailored to your specifications.",
    published: true,
    images: {
      layout: "three-col",
      items: [
        { src: "/assets/services/customsynthesis2.jpg", alt: "Custom Synthesis Lab" },
        { src: "/assets/services/customsynthesis3.jpg", alt: "Custom Synthesis Process" },
        { src: "/assets/services/customsynthesis4.png", alt: "Custom Synthesis Facility" },
      ],
    },
    sections: [
      {
        paragraphs: [
          "We offer our customers all types of chemicals ranging from bulk products to rare, complex and difficult to source chemicals in grams to tons quantities.",
          "Our team includes expert chemists who develop new synthetic pathways and optimize existing processes. Our expertise spans traditional organic chemistry through polypeptide synthesis, with specialization in organometallics, boron, sulfur, phosphorus, and mercury products.",
        ],
      },
      {
        heading: "Specialized Reaction Types",
        listItems: [
          "Alkylation",
          "Condensations",
          "Halogenations / Dehalogenations",
          "Diazotizations",
          "Nitrations",
          "Amidation",
          "Hydrolysis",
          "High vacuum distillations",
          "Esterification",
          "Low temperature reactions",
          "Reductions",
          "Sulfonations",
        ],
      },
      {
        heading: "Key Benefits",
        listItems: [
          "High caliber workforce (Ph.D. and M.S. level)",
          "Cost efficient",
          "Quick turn-around",
          "Grams to Kilograms scale",
          "Confidentiality",
        ],
      },
      {
        heading: "How to Submit a Request",
        paragraphs: [
          "We evaluate custom synthesis requests to determine competitive feasibility. Customers can provide the chemical name, CAS number, structure, or an existing synthetic route with experimental parameters and we will respond with a quote.",
        ],
      },
      {
        heading: "Facilities & Quality",
        paragraphs: [
          "Our operations include kilo-labs to large bulk manufacturing facilities in the USA and India, equipped with state-of-the-art analytical instruments for QC assurance. Our chemists hold advanced degrees in synthetic organic chemistry and analytical chemistry.",
        ],
      },
    ],
  },
  {
    slug: "custom-manufacturing",
    title: "Custom Manufacturing",
    shortDescription:
      "Scale-up from lab to production. We manufacture advanced organic intermediates at our US and India facilities with rigorous quality control.",
    published: true,
    images: {
      layout: "banner",
      items: [
        { src: "/assets/services/customsynthesis-mfg.jpg", alt: "Custom Manufacturing Facility" },
      ],
    },
    sections: [
      {
        paragraphs: [
          "We can develop and scale-up new processes or can follow your process under a confidentiality agreement. We usually refine processes given by you to suit large-scale productions with high yield and low costs.",
          "Our services emphasize intellectual property protection through non-disclosure agreements, supply security, and cost reduction benefits.",
        ],
      },
      {
        heading: "Process & Analytical Capabilities",
        listItems: [
          "Glass lined reactors (500–3,000 L); stainless steel reactors (1,000–5,000 L)",
          "High and low vacuum equipment, stainless steel centrifuges, rubber-lined basket centrifuges, sparkler and single-plate stainless steel filters",
          "Quality assurance using UV, IR, HPLC, GC, and GC-MS instruments, with access to NMR and literature search",
        ],
      },
      {
        heading: "Development Capabilities",
        listItems: [
          "Qualified technical team capable of advancing projects from development to production within required timeframes",
          "Environmental and safety considerations integrated before commercial production begins",
        ],
      },
      {
        heading: "Request a Quote",
        paragraphs: [
          "Please send us the chemical name and CAS number of the compound you want manufactured and we will get back to you with a quote within 24–48 hours.",
        ],
      },
    ],
  },
  {
    slug: "process-development",
    title: "Process Development",
    shortDescription:
      "Optimizing existing synthetic routes or developing new pathways for commercial viability, cost efficiency, and reproducibility.",
    published: true,
    images: {
      layout: "banner",
      items: [{ src: "/assets/services/processdev.jpg", alt: "Process Development Lab" }],
    },
    sections: [
      {
        paragraphs: [
          "CHEM-IS-TRY, Inc. offers services for the process development of organic molecules from milligrams to kilograms scale.",
          "Our process development lab works towards the design and synthesis of organic molecules through process innovation and technology development.",
          "Our scientists will select the optimal reaction route and optimize reaction conditions. Our expert role is to optimize processes in the laboratory and bring them up to pilot trials.",
          "Our responsibility as a process development lab includes the minimization of chemical waste in all projects, via recovery/recycling or modification of the synthetic route.",
        ],
      },
    ],
  },
  {
    slug: "contract-rd",
    title: "Contract R & D",
    shortDescription:
      "Partner with our experienced scientific team for research and development projects, from early-stage discovery to late-stage development.",
    published: true,
    images: {
      layout: "two-col",
      items: [
        { src: "/assets/services/contractrd-banner.jpg", alt: "Contract R&D" },
        { src: "/assets/services/contractrd-lab.jpg", alt: "Contract R&D Laboratory" },
      ],
    },
    sections: [
      {
        paragraphs: [
          "CHEM-IS-TRY, Inc. supports contract research and development for many different industries. Our team provides organic synthesis of compounds at the milligram to kilogram scale.",
          "We handle difficult chemical synthesis projects that require fast turnaround time. We can support your research staff in developing new chemical compounds and will safeguard your confidentiality and all intellectual property of research.",
          "Our technical team has experience with various chemical compounds including Specialty and Fine Chemicals, Agrochemicals, and Pharmaceutical Intermediates. Our contract synthesis expertise includes aliphatic, aromatic, and heterocyclic chemistry.",
        ],
      },
      {
        heading: "Additional Services",
        listItems: [
          "Novel route design",
          "Literature synthesis",
          "Basic building block chemistry",
          "Multi-step reaction schemes",
          "Process design & scale-up",
        ],
      },
    ],
  },
  {
    slug: "cgmp",
    title: "cGMP",
    shortDescription:
      "Documented, auditable manufacturing support for pharmaceutical, nutraceutical, and regulated industry customers.",
    published: false,
    sections: [
      {
        paragraphs: [
          "CHEM-IS-TRY, Inc. maintains cGMP (current Good Manufacturing Practice) compliant lab and manufacturing operations to support pharmaceutical, nutraceutical, and regulated industry customers requiring documented, auditable production.",
        ],
      },
      {
        heading: "cGMP Capabilities",
        listItems: [
          "FDA-aligned current Good Manufacturing Practice procedures",
          "Comprehensive batch records, SOPs, and change-control documentation",
          "Raw material qualification and certificate of analysis for all inputs",
          "In-process and finished-product QC testing (HPLC, GC, IR, UV, NMR access)",
          "Dedicated cGMP manufacturing suites separate from R&D operations",
          "Environmental monitoring and personnel qualification programs",
        ],
      },
      {
        heading: "Supported Product Classes",
        listItems: [
          "Active Pharmaceutical Ingredients (APIs) and intermediates",
          "USP/NF grade reference standards",
          "Nutraceutical and food-grade specialty chemicals",
          "Regulated agrochemical intermediates",
        ],
      },
      {
        heading: "Quality & Compliance",
        paragraphs: [
          "All cGMP production is supported by our quality assurance team. We work with customers to meet specific regulatory requirements and can provide full documentation packages for regulatory submissions. Our facilities in the USA and India operate under equivalent quality systems.",
        ],
      },
    ],
  },
  {
    slug: "bulk-chemicals",
    title: "Bulk Chemicals",
    shortDescription:
      "Large-quantity supply of catalog and custom compounds for industrial applications with competitive pricing and reliable delivery.",
    published: true,
    sections: [
      {
        paragraphs: [
          "CHEM-IS-TRY, Inc. supplies a wide range of chemicals in bulk quantities — from kilograms to metric ton scale — for industrial, pharmaceutical, and research applications. We combine our custom manufacturing expertise with established supply chains in the USA and India to offer competitive pricing and reliable delivery.",
        ],
      },
      {
        heading: "What We Offer",
        listItems: [
          "Organic and inorganic bulk chemicals",
          "USP / ACS grade bulk materials",
          "Custom packaging and labeling",
          "Certificate of Analysis with every lot",
          "Confidential supply agreements available",
        ],
      },
      {
        heading: "Requesting a Bulk Quote",
        paragraphs: [
          "To request pricing for bulk quantities, please use our Request for Quotation form or contact us directly at info@chem-is-try.com. Include the chemical name, CAS number, required quantity, and any purity or grade specifications.",
          "You can browse our full bulk chemicals listing in the Products catalog → Bulk Chemicals.",
        ],
      },
    ],
  },
];

export const publicServices = services.filter((service) => service.published);

export const publicServiceSlugs = publicServices.map((service) => service.slug);

export const servicesBySlug = Object.fromEntries(
  services.map((service) => [service.slug, service]),
) as Record<string, ServicePage>;
