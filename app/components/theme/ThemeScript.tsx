import { THEME_STORAGE_KEY } from "./ThemeProvider";

// Runs synchronously in <head>, before hydration, so the correct theme
// class is on <html> before first paint (no light/dark flash). Manual
// selection (localStorage) always wins over the system preference.
const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t;}catch(e){}})();`;

export default function ThemeScript() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />;
}
