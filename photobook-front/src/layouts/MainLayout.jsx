import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Notification from '../components/common/Notification';

const MainLayout = ({ hideNavbar = false, hideFooter = false }) => {
  return (
    <div className="flex flex-col min-h-screen pb-16 md:pb-0">
      {!hideNavbar && <Navbar />}
      <Notification />
      <main className="flex-grow">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default MainLayout;
