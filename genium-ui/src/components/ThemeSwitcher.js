import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeSwitcher = () => {
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'system');

  React.useEffect(() => {
    const applyTheme = (theme) => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', systemTheme === 'dark');
      } else {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
      localStorage.setItem('theme', theme);
    };

    applyTheme(theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const themes = [
    { name: 'light', icon: <Sun className="w-5 h-5" /> },
    { name: 'dark', icon: <Moon className="w-5 h-5" /> },
    { name: 'system', icon: <Monitor className="w-5 h-5" /> },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-muted">
      {themes.map((t) => (
        <button
          key={t.name}
          onClick={() => setTheme(t.name)}
          className={`p-1.5 rounded-full ${
            theme === t.name
              ? 'bg-background text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label={`Switch to ${t.name} theme`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;