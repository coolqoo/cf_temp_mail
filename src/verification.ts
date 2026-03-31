/**
 * 验证码 & 验证链接提取模块
 *
 * 参考: https://github.com/ZeroPointSix/outlookEmailPlus/blob/main/outlook_web/services/verification_extractor.py
 * 移植为 TypeScript，适配 Cloudflare Workers 环境（无 DOM API）。
 */

// ─── 常量 ───────────────────────────────────────────────

/** 验证码关键词（中英文） */
const VERIFICATION_KEYWORDS = [
  '验证码',
  'code',
  '验证',
  'verification',
  'OTP',
  '动态码',
  '校验码',
  'verify code',
  'confirmation code',
  'security code',
  '验证码是',
  'your code',
  'code is',
  '激活码',
  '短信验证码',
];

/** 验证码模式：4-8 位大写字母/数字，至少包含一个数字 */
const VERIFICATION_CODE_RE = /\b[A-Z0-9]{4,8}\b/gi;

/** HTTP(S) 链接 */
const LINK_RE = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

/** 验证链接优先关键词 */
const LINK_KEYWORDS = [
  'verify',
  'confirmation',
  'confirm',
  'activate',
  'validation',
];

/** 验证上下文短语（出现在邮件正文中表明该邮件是验证邮件） */
const LINK_CONTEXT_PHRASES = [
  'verify your email',
  'verify your account',
  'verify your address',
  'confirm your email',
  'confirm your account',
  'confirm your address',
  'activate your email',
  'activate your account',
  'email verification',
  'account verification',
  '验证您的邮箱',
  '验证你的邮箱',
  '验证您的账户',
  '验证你的账户',
  '验证您的账号',
  '验证你的账号',
  '确认您的邮箱',
  '确认你的邮箱',
  '确认您的账户',
  '确认你的账户',
  '激活您的账户',
  '激活你的账户',
  '激活您的邮箱',
  '激活你的邮箱',
  '邮箱验证',
  '账号验证',
  '账户验证',
];

// ─── 结果类型 ─────────────────────────────────────────────

export interface VerificationInfo {
  verificationCode: string | null;
  verificationLink: string | null;
}

// ─── HTML → 纯文本 ────────────────────────────────────────

/** 简单 HTML 转纯文本（正则剥离，适合 Worker 无 DOM 环境） */
function htmlToText(html: string): string {
  // 移除 <style>、<script>、<head> 块
  let text = html.replace(/<(style|script|head)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  // <br> / <p> / <div> / <tr> → 换行
  text = text.replace(/<\s*(br|\/p|\/div|\/tr|\/li)[^>]*>/gi, '\n');
  // 剥离所有标签
  text = text.replace(/<[^>]+>/g, ' ');
  // 解码常见 HTML 实体
  text = decodeHtmlEntities(text);
  // 合并空白
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

/** 解码常见 HTML 实体 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#160;': ' ',
  };
  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replaceAll(entity, char);
  }
  // 数字实体 &#NNN; / &#xHHH;
  result = result.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return result;
}

// ─── 验证码提取 ────────────────────────────────────────────

/**
 * 智能提取：在验证码关键词附近（前后 50 字符）搜索验证码模式。
 * 命中此路径说明置信度高。
 */
function smartExtractCode(content: string): string | null {
  if (!content) return null;

  const contentLower = content.toLowerCase();

  for (const keyword of VERIFICATION_KEYWORDS) {
    const pos = contentLower.indexOf(keyword.toLowerCase());
    if (pos === -1) continue;

    const start = Math.max(0, pos - 50);
    const end = Math.min(content.length, pos + keyword.length + 50);
    const context = content.slice(start, end);

    const matches = context.matchAll(new RegExp(VERIFICATION_CODE_RE.source, 'gi'));
    for (const m of matches) {
      const value = m[0];
      // 必须包含至少一个数字
      if (/\d/.test(value)) {
        return value.toUpperCase();
      }
    }
  }

  return null;
}

/**
 * 保底提取：全文正则匹配 + 过滤常见误判。
 */
function fallbackExtractCode(content: string): string | null {
  if (!content) return null;

  const matches = content.matchAll(new RegExp(VERIFICATION_CODE_RE.source, 'gi'));

  for (const m of matches) {
    const value = m[0];

    // 必须包含至少一个数字
    if (!/\d/.test(value)) continue;

    // 纯数字 4 位时过滤年份和时间
    if (/^\d{4}$/.test(value)) {
      const num = parseInt(value, 10);
      if (num >= 1900 && num <= 2100) continue;
      const hour = parseInt(value.slice(0, 2), 10);
      const minute = parseInt(value.slice(2), 10);
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) continue;
    }

    return value.toUpperCase();
  }

  return null;
}

// ─── 链接提取 ─────────────────────────────────────────────

/** 提取所有 HTTP(S) 链接，去重保序 */
function extractLinks(content: string): string[] {
  if (!content) return [];

  const matches = content.matchAll(new RegExp(LINK_RE.source, 'gi'));
  const seen = new Set<string>();
  const result: string[] = [];

  for (const m of matches) {
    // 清理末尾标点
    const cleaned = m[0].replace(/[.,;:!?)\]>'\"]+$/, '');
    if (!seen.has(cleaned)) {
      seen.add(cleaned);
      result.push(cleaned);
    }
  }

  return result;
}

/**
 * 从链接列表中选出最可能的验证链接。
 * 优先选含 verify/confirm/activate 等关键词的链接。
 */
function pickVerificationLink(links: string[], fullText: string): string | null {
  if (!links.length) return null;

  // 优先：URL 本身含验证关键词
  for (const kw of LINK_KEYWORDS) {
    for (const link of links) {
      if (link.toLowerCase().includes(kw)) {
        return link;
      }
    }
  }

  // 其次：如果邮件正文含验证上下文短语，说明是验证邮件，取第一个链接
  const textLower = fullText.toLowerCase();
  for (const phrase of LINK_CONTEXT_PHRASES) {
    if (textLower.includes(phrase.toLowerCase())) {
      return links[0];
    }
  }

  return null;
}

// ─── 对外主函数 ────────────────────────────────────────────

/**
 * 从邮件内容提取验证码和验证链接。
 *
 * @param subject  邮件主题
 * @param textBody 纯文本正文（可为 null）
 * @param htmlBody HTML 正文（可为 null）
 */
export function extractVerificationInfo(
  subject: string | null,
  textBody: string | null,
  htmlBody: string | null,
): VerificationInfo {
  // 组合可用文本
  const subjectText = subject?.trim() ?? '';
  const plainText = textBody?.trim() ?? '';
  const htmlText = htmlBody ? htmlToText(htmlBody) : '';

  // 合并所有文本源用于验证码搜索
  const fullText = [subjectText, plainText, htmlText].filter(Boolean).join(' ');

  // 验证码：智能提取 → 保底提取
  const verificationCode = smartExtractCode(fullText) ?? fallbackExtractCode(fullText);

  // 链接：从所有文本源（包括原始 HTML，因为 href 可能在纯文本中丢失）提取
  const allContent = [subjectText, plainText, htmlBody ?? ''].filter(Boolean).join(' ');
  const allLinks = extractLinks(allContent);
  const verificationLink = pickVerificationLink(allLinks, fullText);

  return {
    verificationCode,
    verificationLink,
  };
}
