import { IconMoon, IconSun } from './icons';
import { setTheme, useTheme } from './palette';

/** Switches between dark mode (the default) and light mode; the choice is kept on this device. */
export function ThemeButton() {
  const light = useTheme() === 'light';
  const words = light ? 'Switch to dark mode' : 'Switch to light mode';
  return <button className="icon" aria-label={words} title={words} onClick={() => setTheme(light ? 'dark' : 'light')}>{light ? <IconMoon /> : <IconSun />}</button>;
}
