import AppRouter from './router/AppRouter';
import PhotoLightbox from './components/common/Lightbox';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      <AppRouter />
      <PhotoLightbox />
    </div>
  );
}

export default App;
