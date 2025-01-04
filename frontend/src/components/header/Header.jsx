import React, { useState, useEffect } from "react";
import "./header.css";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";
import {faBell, faSearch, faTimes, faBars} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios"; 
import { server } from "../../main";
const Header = ({ isAuth }) => {
  const { user, setIsAuth, setUser } = UserData();
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const navigate = useNavigate();

  const logoutHandler = () => {
    localStorage.clear();
    setUser([]);
    setIsAuth(false);
    toast.success("Logged Out");
    navigate("/login");
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);  
  };
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    let filteredResults = []; 
  
    try { 

      const { data } = await axios.get(`${server}/api/course/all`);
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
      navigate(`/search?q=${searchTerm}`, { state: { results: filteredResults } });
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to fetch courses. Try again!");
    }
  };
  return (
    <header className="header">
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

        {isAuth ? (
          <>
          <div className="notification">
            <FontAwesomeIcon icon={faBell} />
          </div>

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
