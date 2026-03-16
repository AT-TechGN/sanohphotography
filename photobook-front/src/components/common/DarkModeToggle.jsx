import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

// Appliquer le dark mode immédiatement au chargement (avant render React)
// Evite le flash blanc au chargement en mode sombre
const getInitialDark = () => {
  try {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch { return false; }
};

const DarkModeToggle = () => {
  const [dark, setDark] = useState(getInitialDark);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(dark));
  }, [dark]);

  return (
    <button
      onClick={() => setDark(d => !d)}
      className="p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={dark ? 'Mode clair' : 'Mode sombre'}
    >
      {dark
        ? <SunIcon  className="w-5 h-5 text-amber-400" />
        : <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      }
    </button>
  );
};

export default DarkModeToggle;
