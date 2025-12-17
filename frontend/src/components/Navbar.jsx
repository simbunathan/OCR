import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          📷 OCR Scanner
        </Link>
        <div className="nav-menu">
          {user ? (
            <>
              <span className="nav-user">👤 {user.username}</span>
              <Link to="/" className="nav-link">Scanner</Link>
              <Link to="/history" className="nav-link">History</Link>
              <button onClick={handleLogout} className="btn btn-danger">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
Navbar.propTypes = {
    user: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
    email: PropTypes.string
  }),
  setUser: PropTypes.func.isRequired
};
export default Navbar;