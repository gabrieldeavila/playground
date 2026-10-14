import { fontFamilyOf, googleFontsHref, type PresetFont } from '../domain/presets';
import { useStylesheet } from '../hooks/useStylesheet';

/** Each font's name written in that font (Google Fonts load in the browser; font files show in the default face). */
export function PresetFonts({ fonts }: { fonts: PresetFont[] }) {
  useStylesheet(googleFontsHref(fonts));
  return (
    <ul className="flex flex-col gap-1">
      {fonts.map((font) => {
        const family = fontFamilyOf(font);
        return (
          <li key={family} className="text-lg text-zinc-200" style={{ fontFamily: `"${family}", sans-serif` }}>
            {family}
          </li>
        );
      })}
    </ul>
  );
}
