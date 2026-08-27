import { load } from 'cheerio';

export function extractSearchableText(html) {
  const $ = load(html || '');
  $('script, style').remove();
  return $.text().replace(/\s+/g, ' ').trim();
}