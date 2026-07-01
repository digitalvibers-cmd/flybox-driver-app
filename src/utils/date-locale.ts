// Global date localization for the app.
//
// Importing this module for its side effect sets Serbian (latinica) as the
// default locale for every `date-fns` call (format, formatDistanceToNow, …),
// so dates, weekday and month names render in Serbian app-wide without having
// to pass `{ locale }` at each call site.
import { setDefaultOptions } from 'date-fns';
import { srLatn } from 'date-fns/locale';

setDefaultOptions({ locale: srLatn });

// `react-native-calendar-strip` uses moment.js internally; it localizes via a
// `locale={{ name, config }}` prop (moment.updateLocale). This mirrors the
// date-fns Serbian latinica names so the calendar header/day labels match.
export const calendarStripLocale = {
    name: 'sr-latn',
    config: {
        months: 'Januar_Februar_Mart_April_Maj_Jun_Jul_Avgust_Septembar_Oktobar_Novembar_Decembar'.split('_'),
        monthsShort: 'Jan_Feb_Mar_Apr_Maj_Jun_Jul_Avg_Sep_Okt_Nov_Dec'.split('_'),
        weekdays: 'Nedelja_Ponedeljak_Utorak_Sreda_Četvrtak_Petak_Subota'.split('_'),
        weekdaysShort: 'Ned_Pon_Uto_Sre_Čet_Pet_Sub'.split('_'),
        weekdaysMin: 'Ne_Po_Ut_Sr_Če_Pe_Su'.split('_'),
        week: { dow: 1 }, // week starts on Monday
    },
};
