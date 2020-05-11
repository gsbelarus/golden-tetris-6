interface ILocString {
  en?: string;
  ru?: string;
  be?: string;
};

const stringResources = {
  letsPlay: {
    en: 'Let\'s play!',
    ru: 'Начать игру!',
    be: 'Пачаць гульню!'
  },
  levelDown: {
    en: 'Level down',
    ru: 'Уровень -1',
    be: 'Узровень -1'
  },
  levelUp: {
    en: 'Level up',
    ru: 'Уровень +1',
    be: 'Узровень +1'
  },
  warningA: {
    en: 'In order to play ',
    ru: 'Для игры в ',
    be: 'Дзеля ігры ў '
  },
  warningB: {
    en: ' find in the contacts list and connect ',
    ru: ' найдите в списке контактов и подключите ',
    be: ' знайдзіце ў сьпісе кантактаў і падлучыце '
  },
};

export type Lang = keyof ILocString;

export const getLocString = (id: keyof typeof stringResources, lang?: Lang) => stringResources[id]?.[lang ?? 'en'];
