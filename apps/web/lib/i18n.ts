export const locales = ['en', 'fr-FR', 'ar-DZ'] as const;
export type Locale = (typeof locales)[number];

export const messages = {
  en: {
    navigation: 'Navigation', home: 'Home', controlTower: 'Control Tower', myWork: 'My work',
    search: 'Search ATHAR ONE', quickCreate: 'Create', notifications: 'Notifications',
    greeting: 'Good morning', overview: 'Here is what needs your attention.',
    approvals: 'Approvals', blockers: 'Blockers', dueToday: 'Due today', viewQueue: 'View queue',
    tenant: 'Workspace', unit: 'Business unit', allUnits: 'All units', settings: 'Settings',
    healthy: 'Systems healthy', noAlerts: 'No critical platform alerts.', command: 'Command menu',
  },
  'fr-FR': {
    navigation: 'Navigation', home: 'Accueil', controlTower: 'Tour de contrôle', myWork: 'Mon travail',
    search: 'Rechercher dans ATHAR ONE', quickCreate: 'Créer', notifications: 'Notifications',
    greeting: 'Bonjour', overview: 'Voici ce qui demande votre attention.',
    approvals: 'Approbations', blockers: 'Blocages', dueToday: "À faire aujourd’hui", viewQueue: 'Voir la file',
    tenant: 'Espace', unit: 'Unité', allUnits: 'Toutes les unités', settings: 'Paramètres',
    healthy: 'Systèmes opérationnels', noAlerts: 'Aucune alerte critique.', command: 'Palette de commandes',
  },
  'ar-DZ': {
    navigation: 'التنقل', home: 'الرئيسية', controlTower: 'مركز القيادة', myWork: 'عملي',
    search: 'البحث في أثر ون', quickCreate: 'إنشاء', notifications: 'الإشعارات',
    greeting: 'صباح الخير', overview: 'هذه العناصر تحتاج إلى انتباهك.',
    approvals: 'الموافقات', blockers: 'العوائق', dueToday: 'مستحق اليوم', viewQueue: 'عرض القائمة',
    tenant: 'مساحة العمل', unit: 'وحدة الأعمال', allUnits: 'كل الوحدات', settings: 'الإعدادات',
    healthy: 'الأنظمة تعمل بشكل جيد', noAlerts: 'لا توجد تنبيهات حرجة.', command: 'لوحة الأوامر',
  },
} as const;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function direction(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar-DZ' ? 'rtl' : 'ltr';
}
