import type { APIRoute } from 'astro';
import { locales, type Locale } from '../../../lib/i18n';
import { rewardCalendar } from '../../../lib/event-rewards';
export const getStaticPaths = () => locales.map((locale) => ({ params: { locale } }));
export const GET: APIRoute = ({ params }) => new Response(rewardCalendar(params.locale as Locale), {
  headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="silver-palace-event-deadlines.ics"' },
});
