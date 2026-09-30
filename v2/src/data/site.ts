// All content comes from the supplied Website.zip catalogue and the
// current printocards.com pages. Nothing here is invented: where the
// source is silent (prices, lead times, MOQ) the site asks the visitor
// to enquire instead.

export const site = {
  name: 'Printo Cards & Technologies',
  short: 'Printo',
  url: 'https://printocards.com',
  title: 'PVC, ID & Smart Card Manufacturer in Calicut, Kerala | Printo Cards',
  description:
    'Printo Cards & Technologies makes PVC ID cards, NFC and RFID smart cards, hotel key cards, lanyards and supplies card printers from Calicut, Kerala. ISO 9001:2015 certified, 16+ years.',
};

export const contact = {
  whatsapp: '919207806661',
  whatsappDisplay: '+91 92078 06661',
  office: { display: '0495 406 0457', tel: '+914954060457' },
  mobiles: [
    { display: '+91 92078 06661', tel: '+919207806661' },
    { display: '+91 94955 32310', tel: '+919495532310' },
    { display: '+91 92078 06662', tel: '+919207806662' },
  ],
  emails: ['sales@printocards.com', 'printogroup@gmail.com'],
  officeAddress: {
    lines: ['C-19, 3rd Floor, Darussalam Complex', 'Mavoor Road, Calicut 673 004', 'Kerala, India'],
    street: 'C-19, 3rd Floor, Darussalam Complex, Mavoor Road',
    locality: 'Kozhikode',
    postalCode: '673004',
  },
  factoryAddress: {
    lines: ['CP25 A, Omanoor 673 645', 'Kerala, India'],
    street: 'CP25 A, Omanoor',
    locality: 'Omanoor',
    postalCode: '673645',
  },
};

export const waLink = (text: string) =>
  `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`;

export type Product = { name: string; image: string; spec: string };
export type Family = { id: string; name: string; image: string; summary: string; products: Product[] };

export const families: Family[] = [
  {
    id: 'card-printers',
    name: 'Card printers',
    image: '/images/zebra-zc-300.webp',
    summary: 'Evolis Primacy 2, Evolis Agilia, Evolis Zenius, Zebra ZC 300, IDP Solid 510D',
    products: [
      { name: 'Evolis Primacy 2', image: '/images/evolis-primacy-2.webp', spec: 'For regular ID and membership card printing' },
      { name: 'Evolis Agilia', image: '/images/evolis.webp', spec: 'Retransfer printing, edge to edge' },
      { name: 'Evolis Zenius', image: '/images/evolis-zenius.webp', spec: 'Compact, for small-volume runs' },
      { name: 'Zebra ZC 300', image: '/images/zebra-zc-300.webp', spec: 'For ID, access and personalised cards' },
      { name: 'IDP Solid 510D', image: '/images/solid-idp-510d.webp', spec: 'For everyday PVC card personalisation' },
    ],
  },
  {
    id: 'pvc-cards',
    name: 'PVC cards',
    image: '/images/pvc-id-cards.webp',
    summary: 'ID cards, Zebra and Pacto ID blanks, pre-printed, hospital OP, privilege, loyalty, membership, gift',
    products: [
      { name: 'PVC ID cards', image: '/images/pvc-id-cards.webp', spec: 'Glossy, matte, frosted or UV. Holder or lanyard attached' },
      { name: 'Zebra PVC blank cards', image: '/images/zebra-pvc-blank-cards.webp', spec: '86 × 54 mm, 30 mil, glossy. Box of 500' },
      { name: 'Pacto ID PVC blank cards', image: '/images/pacto-id-pvc-blank-cards.webp', spec: '86 × 54 mm, 30 mil, glossy. Boxes of 100, 250 or 500' },
      { name: 'Pre-printed cards', image: '/images/pre-printed-cards.webp', spec: 'Glossy or matte. OP, gift, loyalty and membership' },
      { name: 'Hospital OP cards', image: '/images/hospital-op-cards.webp', spec: 'Patient registration cards for hospitals and clinics' },
      { name: 'PVC privilege cards', image: '/images/pvc-privilege-card.webp', spec: 'Glossy, matte, frosted or UV' },
      { name: 'PVC loyalty cards', image: '/images/pvc-loyalty-card.webp', spec: 'Glossy, matte, frosted or UV' },
      { name: 'PVC membership cards', image: '/images/pvc-membership-card.webp', spec: 'Glossy, matte or frosted' },
      { name: 'PVC gift cards', image: '/images/pvc-gift-card.webp', spec: 'Glossy, matte, frosted or UV' },
    ],
  },
  {
    id: 'smart-cards',
    name: 'Smart cards',
    image: '/images/pvc-nfc-card.webp',
    summary: 'MIFARE and HF RFID, proximity, NFC, hotel key cards, wooden cards',
    products: [
      { name: 'MIFARE and HF RFID cards', image: '/images/pvc-mifare-card-hf-rfid-card.webp', spec: '13.56 MHz. Printed or blank' },
      { name: 'RFID proximity cards', image: '/images/pvc-rfid-proximity-card.webp', spec: 'TK4100, 125 kHz. Printed or blank' },
      { name: 'NFC cards', image: '/images/pvc-nfc-card.webp', spec: 'NTAG 213, 215 or 216. Printed or blank' },
      { name: 'Hotel key cards', image: '/images/pvc-hotel-key-cards.webp', spec: 'LF or HF, printed with your hotel branding' },
      { name: 'Wooden cards', image: '/images/wooden-cards.webp', spec: 'RFID, MIFARE or hotel key cards in wood' },
    ],
  },
  {
    id: 'card-accessories',
    name: 'Card accessories',
    image: '/images/multicolour-lanyards.webp',
    summary: 'Multicolour lanyards, card holders, yoyo reels',
    products: [
      { name: 'Multicolour lanyards', image: '/images/multicolour-lanyards.webp', spec: '12, 16, 20 or 25 mm. Dog, side-lever, J or plastic hook' },
      { name: 'Card holders', image: '/images/card-holders.webp', spec: 'Plastic, acrylic, polycarbonate or metal. Horizontal or vertical' },
      { name: 'Yoyo reels', image: '/images/yoyo.webp', spec: 'Round or oval, epoxy or UV. Five colours' },
    ],
  },
  {
    id: 'event-accessories',
    name: 'Event accessories',
    image: '/images/event-badge.webp',
    summary: 'Button badges, event badges, keychains, RFID silicone wristbands',
    products: [
      { name: 'Event badges', image: '/images/event-badge.webp', spec: 'PVC. 130 × 54, 130 × 84 or 86 × 54 mm' },
      { name: 'Button badges', image: '/images/button-badge.webp', spec: '58 or 44 mm. Round or rectangle' },
      { name: 'Multicolour keychains', image: '/images/multicolour-keychains.webp', spec: '12, 16, 20 or 25 mm. Four hook types' },
      { name: 'RFID silicone wristbands', image: '/images/rfid-silicon-wristband.webp', spec: 'With RFID or MIFARE tag' },
    ],
  },
];

export const productCount = families.reduce((n, f) => n + f.products.length, 0);

export const industries = [
  { name: 'Offices', tone: 'orange', image: '/images/multicolour-lanyards.webp', fit: 'cover', lead: 'Staff ID, access and visitor passes', uses: 'PVC ID cards, RFID access cards, lanyards, holders and yoyo reels' },
  { name: 'Hospitals', tone: 'black', image: '/images/hospital-op-cards.webp', fit: 'contain', lead: 'Patient registration and OP cards', uses: 'Pre-printed OP cards, staff ID cards and visitor badges' },
  { name: 'Hotels', tone: 'lime', image: '/images/pvc-hotel-key-cards.webp', fit: 'contain', lead: 'Room keys guests remember', uses: 'PVC and wooden key cards, LF and HF' },
  { name: 'Schools', tone: 'charcoal', image: '/images/pvc-id-cards.webp', fit: 'cover', lead: 'Student and staff ID', uses: 'PVC ID cards, lanyards, card holders and RFID cards' },
  { name: 'Gyms and clubs', tone: 'amber', image: '/images/pvc-rfid-proximity-card.webp', fit: 'contain', lead: 'Membership and entry', uses: 'Membership cards, proximity cards and RFID wristbands' },
  { name: 'Shops', tone: 'black', image: '/images/pvc-gift-card.webp', fit: 'contain', lead: 'Loyalty, gift and privilege', uses: 'Loyalty, gift and privilege cards, and keychains' },
  { name: 'Events', tone: 'orange', image: '/images/event-badge.webp', fit: 'contain', lead: 'Badges, passes and wristbands', uses: 'Event badges, button badges, RFID wristbands and lanyards' },
] as const;

export const faqs = [
  {
    q: 'Will your RFID cards work with our door locks or readers?',
    a: 'Send us the brand and model of your lock or reader. We will confirm the right chip, whether 125 kHz proximity, 13.56 MHz MIFARE or NFC, before you order.',
  },
  {
    q: 'What size are your cards?',
    a: 'Our PVC cards are 86 × 54 mm (CR80), the same size as a bank card. Blank cards for card printers are 30 mil, or 0.76 mm, thick.',
  },
  {
    q: 'Can each card carry its own name and photo?',
    a: 'Yes. ID cards are personalised to your requirements, with names, photos and ID numbers printed in full colour on one or both sides.',
  },
  {
    q: 'Which finishes can I choose?',
    a: 'Glossy, matte, frosted and UV, depending on the card type. Pre-printed cards come in glossy or matte.',
  },
  {
    q: 'Do you sell card printers and supplies?',
    a: 'Yes. We supply Evolis Primacy 2, Evolis Agilia, Evolis Zenius, Zebra ZC 300 and IDP Solid 510D printers, plus Zebra and Pacto ID blank cards and printer ribbons.',
  },
  {
    q: 'Where are you based?',
    a: 'Our office is at Darussalam Complex on Mavoor Road, Calicut, and our factory is at Omanoor, Kerala.',
  },
];

export const qualityChecks = [
  'Design and artwork',
  'Print registration',
  'Fusing',
  'Thickness, 0.76 mm',
  'Scratch-free surface',
  'Waterproof surface',
  'Tear resistance',
];

export const sectors = ['Corporate', 'Education', 'Health', 'Press', 'Retail', 'Government', 'Finance', 'Hotels'];
