export interface LandingSource {
  id: string;
  name: string;
  categoryAr: string;
  categoryEn: string;
  url: string;
  descAr: string;
  descEn: string;
  tagAr: string;
  tagEn: string;
  features: string[];
}

export const LANDING_PAGE_SOURCES: LandingSource[] = [
  {
    id: 'mobbin',
    name: 'Mobbin — Healthcare & Medical Apps',
    categoryAr: 'أرشيف واجهات وتطبيقات حقيقية (iOS & Web)',
    categoryEn: 'Real iOS & Web UI Archive',
    url: 'https://mobbin.com/browse/ios/apps?category=medical',
    descAr: 'أضخم مكتبة عالمية توثق الواجهات الحقيقية وتدفقات التسجيل لأشهر تطبيقات الصحة والطب في العالم (مثل One Medical, Apple Health, Zocdoc, Mayo Clinic).',
    descEn: 'The world’s largest archive of real iOS and web screens from leading healthcare & medical apps.',
    tagAr: 'موصى به بشدة ⭐',
    tagEn: 'Highly Recommended ⭐',
    features: ['Real production screens', 'Onboarding & signup flows', 'Medical & MedTech category'],
  },
  {
    id: 'land-book',
    name: 'Land-book — Curated Landing Pages',
    categoryAr: 'معرض صفحات هبوط منتجات رقمية وSaaS',
    categoryEn: 'Product & SaaS Landing Pages',
    url: 'https://land-book.com/',
    descAr: 'موقع يجمع أفضل صفحات الهبوط العالمية المنسقة بعناية للشركات الناشئة ومنصات الرعاية الصحية بتصميمات عصرية ونسب تحويل عالية.',
    descEn: 'Hand-picked showcase of the finest modern web landing pages and digital health products.',
    tagAr: 'أفضل إلهام للمنتجات',
    tagEn: 'Top Product Showcase',
    features: ['Curated daily', 'Category filters', 'Modern web layout styles'],
  },
  {
    id: 'dribbble-medical',
    name: 'Dribbble — Healthcare & MedTech Landing Pages',
    categoryAr: 'مفاهيم وتصاميم إبداعية بصرية',
    categoryEn: 'Creative Visual Concepts',
    url: 'https://dribbble.com/search/medical-landing-page',
    descAr: 'آلاف المفاهيم الإبداعية والتصاميم المبتكرة لصفحات الهبوط الطبية ولوحات متابعة المرضى ثلاثية الأبعاد وعناصر الجرافيك الحديثة.',
    descEn: 'Creative concepts and visual designs for healthcare platforms, 3D elements, and modern clinic portals.',
    tagAr: 'إبداع بصري ملفت',
    tagEn: 'Visual Creativity',
    features: ['3D assets & illustrations', 'Color palettes & gradients', 'Bento grid concepts'],
  },
  {
    id: 'godly',
    name: 'Godly — Ultra-Modern Web Aesthetics',
    categoryAr: 'تصاميم ويب فائقة العصرية والجمال',
    categoryEn: 'Aesthetic Web Design',
    url: 'https://godly.website/',
    descAr: 'معرض لأحدث اتجاهات التصميم العالمية الحديثة (Dark mode، Gradient mesh، Micro-interactions، والطباعة الجريئة) الملفتة للنظر.',
    descEn: 'Curated gallery of the most visually stunning, modern dark & light mode web designs and animations.',
    tagAr: 'عصري فائق الجمال',
    tagEn: 'Ultra-Modern Aesthetic',
    features: ['Dark mode inspiration', 'Smooth micro-interactions', 'Typography excellence'],
  },
  {
    id: 'onepagelove',
    name: 'One Page Love — Health & Wellness',
    categoryAr: 'صفحات هبوط ذات الصفحة الواحدة',
    categoryEn: 'Single Page Landing Pages',
    url: 'https://onepagelove.com/gallery/health',
    descAr: 'معرض متخصص لصفحات الهبوط ذات الصفحة الواحدة التي تركز على سهولة التصفح، سرعة التحويل، وبساطة عملية التسجيل للمرضى والزوار.',
    descEn: 'Showcase of beautiful single-page websites dedicated to health, clinics, wellness, and quick registration.',
    tagAr: 'صفحة واحدة سريعة',
    tagEn: 'Fast Single-Page',
    features: ['High conversion layout', 'Clean CTA sections', 'Mobile responsive'],
  },
  {
    id: 'awwwards-health',
    name: 'Awwwards — Medical & Health Winners',
    categoryAr: 'مواقع طبية عالمية حائزة على جوائز',
    categoryEn: 'Award-Winning Websites',
    url: 'https://www.awwwards.com/websites/health/',
    descAr: 'مواقع وتطبيقات صحية حازت على أعلى جوائز التصميم العالمية بفضل تجربة المستخدم المبتكرة والهدوء البصري والجمالية العالية.',
    descEn: 'Award-winning health and pharmaceutical websites judged by global design industry leaders.',
    tagAr: 'جوائز وتجارب عالمية',
    tagEn: 'Global Award Winners',
    features: ['Interactive storytelling', 'Premium UI/UX standards', 'Benchmark design quality'],
  },
  {
    id: 'saaslandingpage',
    name: 'SaaS Landing Page — Health & Tech',
    categoryAr: 'أفضل صفحات هبوط الـ SaaS العالمية',
    categoryEn: 'SaaS Landing Page Directory',
    url: 'https://saaslandingpage.com/',
    descAr: 'أرشيف منظم يقسم كل صفحة هبوط إلى أقسامها الأساسية (الهيرو Hero، المميزات Bento Grid، التسجيل Login، الأسئلة الشائعة FAQs).',
    descEn: 'Organized directory breaking down landing pages into structural components (Hero, Features, Pricing, Proof).',
    tagAr: 'هيكلة احترافية',
    tagEn: 'Structural Blueprint',
    features: ['Component breakdown', 'Copywriting examples', 'Feature showcase patterns'],
  },
  {
    id: 'apple-hig',
    name: 'Apple Human Interface Guidelines — Health',
    categoryAr: 'المعايير السريرية وتجربة المستخدم الصحية',
    categoryEn: 'Clinical Design Standards',
    url: 'https://developer.apple.com/design/human-interface-guidelines/',
    descAr: 'معايير آبل لتصميم الواجهات الطبية: وضوح الخطوط، التباين اللوني، البساطة لعدم إرباك المرضى وكبار السن، ودقة عرض الجداول.',
    descEn: 'Apple official guidelines for medical and health data readability, accessibility, and high contrast.',
    tagAr: 'معايير إكلينيكية',
    tagEn: 'Clinical Usability',
    features: ['Accessibility compliance', 'High-contrast typography', 'Elderly-friendly UX'],
  },
];

export const DESIGN_BEST_PRACTICES = [
  {
    titleAr: 'الهيرو التفاعلي مع دعوة واضحة (Hero Section)',
    titleEn: 'Interactive Hero with High-Contrast CTA',
    descAr: 'عنوان مباشر يوضح الفائدة الفورية للمريض، مع زر رئيسي مشرق لربط الحساب وزر ثانوي للدخول كزائر لتجربة النظام فوراً دون أي حاجز.',
    descEn: 'Clear headline explaining immediate patient benefit with high-contrast primary CTA and instant guest trial.',
  },
  {
    titleAr: 'شبكة المميزات العصرية (Bento Grid)',
    titleEn: 'Bento Grid Feature Showcase',
    descAr: 'عرض المميزات (مثل مجلدات درايف لكل فرد، مسح الروشتات، المزامنة في شيت، التنبيهات) في بطاقات متباينة بدلاً من نصوص مملة.',
    descEn: 'Showcase key capabilities (Drive per relative, AI prescription scan, Sheets sync) in dynamic cards.',
  },
  {
    titleAr: 'المعاينة الحية والتجربة الفورية (Live Interactive Demo)',
    titleEn: 'Live Interactive Demo',
    descAr: 'عرض بطاقات تفاعلية حية لأفراد العائلة (الأب، الأم، المريض) ليلمس الزائر تجربة النظام قبل أن يسجل حسابه.',
    descEn: 'Interactive cards for family members so visitors experience the system before signing up.',
  },
  {
    titleAr: 'دعم الوضعين الفاتح والداكن (Light & Dark Mode)',
    titleEn: 'Seamless Light & Dark Mode',
    descAr: 'الوضع الداكن يريح العين في الاستخدام الليلي، والوضع الفاتح يعطي نقاءً وسهولة قراءة أثناء النهار وفي الطباعة.',
    descEn: 'Dark mode reduces eye strain at night while light mode provides high contrast for daytime and printing.',
  },
];
