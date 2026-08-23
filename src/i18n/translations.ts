export type Locale = 'zh-CN' | 'zh-TW' | 'en' | 'ja';
export const LOCALES: Locale[] = ['zh-CN', 'zh-TW', 'en', 'ja'];

type Dict = Record<string, Record<Locale, string>>;

const dict: Dict = {
  'nav.language': { 'zh-CN': '语言',   'zh-TW': '語言',   en: 'Lang',  ja: '言語' },
  'nav.theme':    { 'zh-CN': '主题',   'zh-TW': '主題',   en: 'Theme',  ja: 'テーマ' },
  'nav.effects':  { 'zh-CN': '特效',   'zh-TW': '特效',   en: 'FX',     ja: 'エフェクト' },

  'server.cpu': { 'zh-CN': 'CPU', 'zh-TW': 'CPU', en: 'CPU', ja: 'CPU' },

  'statusPage.title':      { 'zh-CN': '系统状态', 'zh-TW': '系統狀態', en: 'System Status', ja: 'システム状態' },
  'statusPage.server':     { 'zh-CN': '服务器',   'zh-TW': '伺服器',   en: 'Server',        ja: 'サーバー' },
  'statusPage.disk':       { 'zh-CN': '磁盘',     'zh-TW': '磁碟',     en: 'Disk',          ja: 'ディスク' },
  'statusPage.load':       { 'zh-CN': '负载',     'zh-TW': '負載',     en: 'Load',          ja: '負荷' },
  'statusPage.network':    { 'zh-CN': '网络',     'zh-TW': '網路',     en: 'Network',       ja: 'ネットワーク' },
  'statusPage.uptime':     { 'zh-CN': '运行时间', 'zh-TW': '運行時間', en: 'Uptime',         ja: '稼働時間' },
  'statusPage.memory':     { 'zh-CN': '内存',     'zh-TW': '記憶體',   en: 'Memory',         ja: 'メモリ' },
  'statusPage.docker':     { 'zh-CN': 'Docker',  'zh-TW': 'Docker',   en: 'Docker',         ja: 'Docker' },
  'statusPage.api':        { 'zh-CN': 'API 服务', 'zh-TW': 'API 服務', en: 'API Services',   ja: 'APIサービス' },
  'statusPage.stopped':    { 'zh-CN': '已停止',   'zh-TW': '已停止',   en: 'stopped',        ja: '停止中' },
  'statusPage.unavailable':{ 'zh-CN': '不可用',   'zh-TW': '不可用',   en: 'unavailable',    ja: '利用不可' },
  'statusPage.noContainers': { 'zh-CN': '无容器数据', 'zh-TW': '無容器資料', en: 'No container data', ja: 'コンテナデータなし' },
  'statusPage.noServices':   { 'zh-CN': '无服务数据', 'zh-TW': '無服務資料', en: 'No service data',   ja: 'サービスデータなし' },
  'statusPage.apiUnavailable':{ 'zh-CN': 'API 不可用', 'zh-TW': 'API 不可用', en: 'API unavailable',  ja: 'API利用不可' },

  '404.message': { 'zh-CN': '404 Not Found', 'zh-TW': '404 Not Found', en: '404 Not Found', ja: '404 Not Found' },
  '404.back':    { 'zh-CN': '← 返回状态页',  'zh-TW': '← 返回狀態頁', en: '← Back to Status', ja: '← ステータスに戻る' },

  'backToTop': { 'zh-CN': '回到顶部', 'zh-TW': '回到頂部', en: 'Back to top', ja: 'トップに戻る' },
};

export function t(key: string, locale: Locale): string {
  return dict[key]?.[locale] ?? key;
}

// Locale labels for the language switcher
export const localeLabels: Record<Locale, string> = {
  'zh-CN': '简中',
  'zh-TW': '繁中',
  en: 'EN',
  ja: '日本語',
};
