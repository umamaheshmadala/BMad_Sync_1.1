import React, { createContext, useContext, useMemo, useState } from 'react';

type Locale = 'en' | 'es' | 'fr' | 'pt';

const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    sinceDays: 'sinceDays',
    tz: 'tz',
    fill: 'fill',
    locale: 'locale',
    reset: 'reset',
    exportCsv: 'export CSV',
    exportJson: 'export JSON',
    exportedCsv: 'Exported CSV',
    exportedJson: 'Exported JSON',
    csvExportError: 'CSV export error',
    jsonExportError: 'JSON export error',
    clickToSort: 'click headers to sort',
    filterText: 'filter text',
    enterReFetchEscClear: 'Enter = re-fetch, Esc = clear',
    businessIdOptional: 'businessId (optional)',
    groupByBusiness: 'group by business',
    tooltips: 'tooltips',
    visibleOnly: 'visible only',
    exportOnlyVisible: 'Export only current page after filtering',
    getTrends: 'GET trends',
    getFunnel: 'GET funnel',
    copyLastCurl: 'copy last cURL',
    timezonePreset: 'Timezone preset',
    customTimezone: 'Custom timezone',
    resetControls: 'Reset analytics controls',
    none: '— none —',
    csvJsonLocale: 'CSV/JSON locale',
    storefrontUpserted: 'Storefront upserted',
    storefrontError: 'Storefront error',
    signedUp: 'Signed up',
    loggedIn: 'Logged in',
    loginError: 'Login error',
    adCreated: 'Ad created',
    adsCreateError: 'Ads create error',
    titleRequired: 'title required',
    offerCreated: 'Offer created',
    offerCreateError: 'Offer create error',
    offerIdRequired: 'offerId required',
    couponsGenerated: 'Coupons generated',
    generateCouponsError: 'Generate coupons error',
    bearerRequired: 'Set a valid Bearer token (Auth tab)',
    couponIdRequired: 'coupon_id required',
    collectedToWallet: 'Collected to wallet',
    collectError: 'Collect error',
    uniqueAndBizRequired: 'unique_code and businessId required',
    redeemedSuccessfully: 'Redeemed successfully',
    redeemError: 'Redeem error',
    offersListError: 'offers list error',
    couponsPreviewError: 'coupons preview error',
    businessIdRequired: 'businessId required',
    ratelimitDiagnosticsError: 'Rate limit diagnostics error',
    noCountersToExport: 'No counters to export',
    badRequestAdjustSinceTz: 'Bad Request: adjust sinceDays or tz',
    trendsFetchError: 'Trends fetch error',
    trendsTimeout: 'Trends timeout',
    trendsError: 'Trends error',
    funnelFetchError: 'Funnel fetch error',
    funnelTimeout: 'Funnel timeout',
    funnelError: 'Funnel error',
    pricingUpdated: 'Pricing updated',
    pricingError: 'Pricing error',
    storefrontFetchError: 'Storefront fetch error',
    reviewSubmitted: 'Review submitted',
    reviewError: 'Review error',
    reviewsFetchError: 'Reviews fetch error',
    matchesFetchError: 'Matches fetch error',
    productsFetchError: 'Products fetch error',
    markedAllRead: 'Marked all read',
    markReadError: 'Mark read error',
    markedRead: 'Marked read',
    markItemReadError: 'Mark item read error',
    bearerBuilt: 'Bearer built',
    copiedCurl: 'Copied cURL',
    noReviewsToExport: 'No reviews to export',
    clear: 'clear',
    goToPage: 'go to page',
    goTo: 'Go to',
    loading: 'loading…',
    skipToMain: 'Skip to main content',
    copyId: 'copy id',
    copiedId: 'copied id',
    copyUser: 'copy user',
    copiedUser: 'copied user',
    copiedOfferId: 'copied offer id',
    getIssued: 'GET issued',
  },
  es: {
    sinceDays: 'días',
    tz: 'tz',
    fill: 'rellenar',
    locale: 'idioma',
    reset: 'restablecer',
    exportCsv: 'exportar CSV',
    exportJson: 'exportar JSON',
    exportedCsv: 'CSV exportado',
    exportedJson: 'JSON exportado',
    csvExportError: 'Error al exportar CSV',
    jsonExportError: 'Error al exportar JSON',
    clickToSort: 'clic en encabezados para ordenar',
    filterText: 'filtrar texto',
    enterReFetchEscClear: 'Enter = recargar, Esc = limpiar',
    businessIdOptional: 'businessId (opcional)',
    groupByBusiness: 'agrupar por negocio',
    tooltips: 'ayudas',
    visibleOnly: 'solo visibles',
    exportOnlyVisible: 'Exportar solo la página actual después del filtro',
    getTrends: 'OBTENER tendencias',
    getFunnel: 'OBTENER embudo',
    copyLastCurl: 'copiar último cURL',
    timezonePreset: 'Zona horaria predefinida',
    customTimezone: 'Zona horaria personalizada',
    resetControls: 'Restablecer controles de analíticas',
    none: '— ninguno —',
    csvJsonLocale: 'Idioma para CSV/JSON',
    clear: 'limpiar',
    goToPage: 'ir a página',
    goTo: 'Ir a',
    loading: 'cargando…',
    copyId: 'copiar id',
    copiedId: 'id copiado',
    copyUser: 'copiar usuario',
    copiedUser: 'usuario copiado',
    copiedOfferId: 'id de oferta copiado',
    getIssued: 'OBTENER emitidos',
  },
  fr: {
    sinceDays: 'jours',
    tz: 'tz',
    fill: 'remplir',
    locale: 'langue',
    reset: 'réinitialiser',
    exportCsv: 'exporter CSV',
    exportJson: 'exporter JSON',
    exportedCsv: 'CSV exporté',
    exportedJson: 'JSON exporté',
    csvExportError: 'Erreur d’export CSV',
    jsonExportError: 'Erreur d’export JSON',
    clickToSort: 'cliquer sur les en-têtes pour trier',
    filterText: 'filtrer le texte',
    enterReFetchEscClear: 'Entrée = recharger, Échap = effacer',
    businessIdOptional: 'businessId (optionnel)',
    groupByBusiness: 'grouper par entreprise',
    tooltips: 'infobulles',
    visibleOnly: 'visibles seulement',
    exportOnlyVisible: 'Exporter uniquement la page courante après filtrage',
    getTrends: 'OBTENIR tendances',
    getFunnel: 'OBTENIR entonnoir',
    copyLastCurl: 'copier le dernier cURL',
    timezonePreset: 'Fuseau horaire prédéfini',
    customTimezone: 'Fuseau horaire personnalisé',
    resetControls: 'Réinitialiser les contrôles analytiques',
    none: '— aucun —',
    csvJsonLocale: 'Langue pour CSV/JSON',
    clear: 'effacer',
    goToPage: 'aller à la page',
    goTo: 'Aller à',
    loading: 'chargement…',
    copyId: 'copier id',
    copiedId: 'id copié',
    copyUser: 'copier utilisateur',
    copiedUser: 'utilisateur copié',
    copiedOfferId: 'id d’offre copié',
    getIssued: 'OBTENIR émis',
  },
  pt: {
    sinceDays: 'dias',
    tz: 'tz',
    fill: 'preencher',
    locale: 'idioma',
    reset: 'redefinir',
    exportCsv: 'exportar CSV',
    exportJson: 'exportar JSON',
    exportedCsv: 'CSV exportado',
    exportedJson: 'JSON exportado',
    csvExportError: 'Erro ao exportar CSV',
    jsonExportError: 'Erro ao exportar JSON',
    clickToSort: 'clique nos cabeçalhos para ordenar',
    filterText: 'filtrar texto',
    enterReFetchEscClear: 'Enter = recarregar, Esc = limpar',
    businessIdOptional: 'businessId (opcional)',
    groupByBusiness: 'agrupar por empresa',
    tooltips: 'dicas',
    visibleOnly: 'apenas visíveis',
    exportOnlyVisible: 'Exportar apenas a página atual após o filtro',
    getTrends: 'OBTER tendências',
    getFunnel: 'OBTER funil',
    copyLastCurl: 'copiar último cURL',
    timezonePreset: 'Fuso horário predefinido',
    customTimezone: 'Fuso horário personalizado',
    resetControls: 'Redefinir controles de análises',
    none: '— nenhum —',
    csvJsonLocale: 'Idioma para CSV/JSON',
    clear: 'limpar',
    goToPage: 'ir para página',
    goTo: 'Ir para',
    loading: 'carregando…',
    copyId: 'copiar id',
    copiedId: 'id copiado',
    copyUser: 'copiar usuário',
    copiedUser: 'usuário copiado',
    copiedOfferId: 'id da oferta copiado',
    getIssued: 'OBTER emitidos',
  },
};

function detectActiveLocale(): Locale {
  try {
    const p = new URL(window.location.href).searchParams.get('locale');
    const stored = localStorage.getItem('sync_analytics_locale') || '';
    const l = (p || stored || 'en').split('-')[0].toLowerCase();
    return (['en','es','fr','pt'] as Locale[]).includes(l as Locale) ? (l as Locale) : 'en';
  } catch {
    return 'en';
  }
}

export function t(key: string): string {
  const loc = detectActiveLocale();
  return (dictionaries[loc] && dictionaries[loc][key]) || dictionaries.en[key] || key;
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectActiveLocale());
  const setLocale = (l: Locale) => {
    try {
      setLocaleState(l);
      localStorage.setItem('sync_analytics_locale', l);
      const u = new URL(window.location.href);
      if (l) u.searchParams.set('locale', l);
      else u.searchParams.delete('locale');
      window.history.replaceState(null, '', u.toString());
    } catch {}
  };
  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return React.createElement(LocaleContext.Provider, { value }, children as any);
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) return { locale: detectActiveLocale(), setLocale: () => {} } as any;
  return ctx;
}

export function formatNumber(n: number, locales?: string) {
  try { return new Intl.NumberFormat(locales || detectActiveLocale()).format(n); } catch { return String(n); }
}

export function formatDate(d: string | number | Date, locales?: string) {
  try { return new Intl.DateTimeFormat(locales || detectActiveLocale(), { year: 'numeric', month: '2-digit', day: '2-digit' } as any).format(new Date(d)); } catch { return String(d); }
}


