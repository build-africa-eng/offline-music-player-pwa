import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-muted-foreground hover:text-primary transition-all"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
    </button>
  );
}

export default ThemeToggle;