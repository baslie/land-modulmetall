import handbud from "../assets/partners/handbud.png";
import roofer from "../assets/partners/roofer.svg";
import grandline from "../assets/partners/grand-line.svg";
import eurovent from "../assets/partners/eurovent.png";

export const partners = [
  { name: "Ханбуд", logo: handbud },
  { name: "Руфер", logo: roofer },
  { name: "Грандлайн", logo: grandline },
  { name: "Евровент", logo: eurovent },
] as const;

export const advantages = [
  {
    title: "Всё в\u00A0одном заказе",
    desc: "Черепица, водосток, мембрана и\u00A0крепёж в\u00A0одном договоре и\u00A0с\u00A0одной ответственностью.",
    icon: "package",
    featured: true,
  },
  {
    title: "Фиксация цены",
    desc: "Закрепляем стоимость на\u00A0момент расчёта, чтобы инфляция не\u00A0увеличила смету.",
    icon: "shield",
  },
  {
    title: "Точный раскрой",
    desc: "Считаем листы и\u00A0доборные элементы под\u00A0ваш проект без\u00A0лишних остатков.",
    icon: "cut",
  },
  {
    title: "Готовые комплекты на\u00A0складе",
    desc: "Основные позиции держим в\u00A0наличии, чтобы вы не\u00A0ждали долгую поставку.",
    icon: "warehouse",
  },
  {
    title: "Экспертная комплектация с\u00A02008\u00A0года",
    desc: "Подбираем совместимые материалы и\u00A0узлы, чтобы кровля служила дольше.",
    icon: "expert",
  },
] as const;
