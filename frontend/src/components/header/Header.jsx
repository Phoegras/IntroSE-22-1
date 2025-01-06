import React, { useState, useEffect } from "react";
import "./header.css";
import { Link, useNavigate } from "react-router-dom";
import { IoMdLogOut } from "react-icons/io";
import toast from "react-hot-toast";
import { UserData } from "../../context/UserContext";
import { FaBell } from "react-icons/fa";  // Import Bell Icon
import axios from "axios";
import { MdMail } from "react-icons/md"; // Import Mail Icon from React Icons

import {faSearch} from "@fortawesome/free-solid-svg-icons";
import {faBell, faSearch, faTimes, faBars} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { server } from "../../main";
const Header = ({ isAuth }) => {
  const { user, setIsAuth, setUser } = UserData();
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };



  const navigate = useNavigate();

  const logoutHandler = () => {
    localStorage.clear();
    setUser([]);
    setIsAuth(false);
    toast.success("Logged Out");
    navigate("/login");
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);  
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    let filteredResults = []; 
  
    try { 
      const { data } = await axios.get('http://localhost:3001/api/course/all');
      if (data.courses && typeof data.courses === "object") {
        const coursesArray = Object.values(data.courses);
  
        const filteredResults = coursesArray.filter((course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) 
        );
  
        setSearchResults(filteredResults);
  
        navigate(`/search?q=${searchTerm}`, { state: { results: filteredResults } });
      } else {
        toast.error("Invalid data format: courses is not an object.");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to fetch courses. Try again!");
    }
  };

  const getNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
    
      const response = await axios.get('http://localhost:3001/api/notification/me', {
        headers: { 'token': token },
      });

      if (response.data.notifications) {
        setNotifications(response.data.notifications);
      } else {
        toast.error("Failed to fetch notifications.");
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error("Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuth) {
      getNotifications();
    }
  }, [isAuth]);

  // Hàm xử lý khi nhấn vào thông báo
  const handleNotificationClick = () => {
    navigate('/notification'); // Dẫn đến trang /notification khi nhấn vào thông báo
  };

  return (
    <header className="header">
      <Link to="/" className="logo">LMS </Link>
      <div className="mobile-adjustment">
      <Link to="/" className="logo">E-Learning</Link>

      <button className="menu-toggle" onClick={toggleMenu}>
        <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
      </button>
      </div>
      <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
        {user?.mainrole === "admin" && <Link to="/admin/dashboard">Dashboard</Link>}
        <Link to="/">Home</Link>
        <Link to="/courses">Courses</Link>
        <Link to="/about">About</Link>
        {isAuth ? (
          <>
            <Link to={"/account"}>Account</Link>
            <a onClick={logoutHandler}>Logout</a>
          </>
        ) : (
          <Link to="/login" className="login-link">Login</Link>
        )}
      </nav>

      <div className={`header-actions ${menuOpen ? "open" : ""}`}>
        
        <div className="search-bar">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              type="text"
              placeholder="Search for courses..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button type="submit">
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </form>
        </div>

      
      </div>

      <div className="noti">
          <FaBell onClick={toggleDropdown} className="notification-icon" />
          {showDropdown && (
            <div className="notification-dropdown">
              {loading ? (
                <div>Loading...</div>
              ) : notifications.length === 0 ? (
                <div>No notifications</div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    className="item"
                    onClick={handleNotificationClick} // Khi nhấn vào thông báo
                  >
                     <MdMail className="iconM" /> 
                    {notification.subject}
                  </div>
                ))
              )}
            </div>
          )}
          <div className="dropdown">
            <span className="dropdown-button" onClick={toggleDropdown}>
              {user?.profile?.firstName || "User"} ▾
            </span>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <Link to="/account" className="dropdown-item">Account</Link>
                <Link to="/messages" className="dropdown-item">Messages</Link>
                <span onClick={logoutHandler} className="dropdown-item">Logout</span>
              </div>
            )}
          </div>
          </>
        ) : (
          <Link to="/login" className="login-link">Login</Link>
        )}
      </div>

   
    </header>
  );
};

export default Header;
