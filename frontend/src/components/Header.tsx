// Header.tsx - Robust dynamic collapsing header with buffer + hysteresis
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import HeaderButton from "./HeaderButton";
import { useAuth } from "../contexts/AuthContext";
import {
  BsSun,
  BsCalendar2Week,
  BsController,
  BsEnvelope,
  BsQuestionCircle,
  MdOutlineLogin,
  FiMenu,
  FiX,
} from "./icons";
import logo from "../assets/logo.png";

type User = {
  id: string;
  username: string;
  email: string;
  isGuest: boolean;
  picture?: string;
};

const NAV_ITEMS = [
  {
    key: "daily",
    text: "Daily",
    icon: <BsSun className="h-5 w-5" />,
    to: "/game/daily",
  },
  {
    key: "weekly",
    text: "Weekly",
    icon: <BsCalendar2Week className="h-5 w-5" />,
    to: "/game/weekly",
  },
  {
    key: "freeplay",
    text: "Free Play",
    icon: <BsController className="h-5 w-5" />,
    to: "/play",
  },
  {
    key: "contact",
    text: "Contact",
    icon: <BsEnvelope className="h-5 w-5" />,
    to: "/contact",
  },
  {
    key: "help",
    text: "Help",
    icon: <BsQuestionCircle className="h-5 w-5" />,
    to: "/help",
  },
  {
    key: "login",
    text: "Login",
    icon: <MdOutlineLogin className="h-5 w-5" />,
    to: "/login",
  },
];

// NOTE: Added "profile" to collapse order
const COLLAPSE_ORDER = [
  "subtitle",
  "contact",
  "help",
  "login",
  "freeplay",
  "weekly",
  "daily",
  "profile",
];

const COLLAPSE_BUFFER = 44;
const EXPAND_HYSTERESIS = 28;

const Header: React.FC = () => {
  const { isLoggedIn, logout: authLogout } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);

  const location = useLocation();
  const navigate = useNavigate();

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRefs = useRef<Record<string, HTMLElement | null>>({});
  const lastAppliedAvailableRef = useRef<number | null>(null);
  const prevHiddenRef = useRef<string[]>([]);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  // load user info from localStorage
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        const guestStatus = userData.isGuest === 1 || userData.isGuest === true;
        setIsGuest(guestStatus);
        setUser(userData);
      } catch {
        setIsGuest(false);
        setUser(null);
      }
    } else {
      setIsGuest(false);
      setUser(null);
    }
  }, [isLoggedIn]);

  const closeAllMenus = () => {
    if (isProfileMenuOpen || isMobileMenuOpen) {
      setIsProfileMenuOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    authLogout();
    closeAllMenus();
    navigate("/");
  };

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  useEffect(() => {
    closeAllMenus();
  }, [location.pathname]);

  // Main collapsing logic
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let rafId = 0;
    const computeHiddenMinimal = (availableWidth: number) => {
      const navKeys = NAV_ITEMS.filter(
        (i) => !(i.key === "login" && isLoggedIn)
      ).map((i) => i.key);

      if (isLoggedIn && !isGuest) navKeys.push("profile");

      const titleW = measureRefs.current["title"]?.offsetWidth || 0;
      const subtitleW = measureRefs.current["subtitle"]?.offsetWidth || 0;
      // const profileW = measureRefs.current["profile"]?.offsetWidth || 0;
      const hamburgerW = measureRefs.current["hamburger"]?.offsetWidth || 0;

      const itemWidths: Record<string, number> = {};
      for (const k of navKeys) {
        itemWidths[k] = measureRefs.current[k]?.offsetWidth || 0;
      }

      let subtitleVisible = true;
      const visibleSet = new Set(navKeys);
      const hidden: string[] = [];
      const navCount = visibleSet.size;
      const perNavGap = 8;
      const groupsGapEstimate = 40;
      let totalNeeded =
        titleW +
        (subtitleVisible ? subtitleW : 0) +
        Array.from(visibleSet).reduce((s, k) => s + (itemWidths[k] || 0), 0) +
        (navCount > 0 ? perNavGap * navCount : 0) +
        groupsGapEstimate +
        COLLAPSE_BUFFER;

      let hamburgerAdded = false;
      const collapseCandidates = COLLAPSE_ORDER.filter((c) => {
        if (c === "subtitle") return true;
        return navKeys.includes(c);
      });

      for (const item of collapseCandidates) {
        if (totalNeeded <= availableWidth - COLLAPSE_BUFFER) break;
        if (item === "subtitle" && subtitleVisible) {
          subtitleVisible = false;
          hidden.push("subtitle");
          totalNeeded -= subtitleW;
          continue;
        }
        if (item === "freeplay" && visibleSet.has("freeplay")) {
          const itemsToCollapse = ["freeplay", "weekly", "daily"];
          let wasFirstNavHidden = !hamburgerAdded;
          for (const key of itemsToCollapse) {
            if (visibleSet.has(key)) {
              visibleSet.delete(key);
              hidden.push(key);
              totalNeeded -= itemWidths[key] || 0;
              totalNeeded -= perNavGap;
            }
          }
          if (wasFirstNavHidden && hidden.length > 0) {
            hamburgerAdded = true;
            totalNeeded += hamburgerW;
          }
          continue;
        }
        if (visibleSet.has(item)) {
          visibleSet.delete(item);
          hidden.push(item);
          totalNeeded -= itemWidths[item] || 0;
          totalNeeded -= perNavGap;
          if (!hamburgerAdded) {
            hamburgerAdded = true;
            totalNeeded += hamburgerW;
          }
        }
      }
      return hidden;
    };

    const calc = () => {
      rafId = 0;
      const available = container.clientWidth;
      const minimalHidden = computeHiddenMinimal(available);
      const prevHidden = prevHiddenRef.current || [];
      if (arraysEqual(minimalHidden, prevHidden)) return;
      if (minimalHidden.length > prevHidden.length) {
        prevHiddenRef.current = minimalHidden;
        lastAppliedAvailableRef.current = available;
        setHiddenItems(minimalHidden);
        return;
      }
      const lastAppliedAvailable = lastAppliedAvailableRef.current;
      if (lastAppliedAvailable == null) {
        prevHiddenRef.current = minimalHidden;
        lastAppliedAvailableRef.current = available;
        setHiddenItems(minimalHidden);
        return;
      }
      if (available >= lastAppliedAvailable + EXPAND_HYSTERESIS) {
        prevHiddenRef.current = minimalHidden;
        lastAppliedAvailableRef.current = available;
        setHiddenItems(minimalHidden);
        return;
      }
    };

    const ro = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(calc);
    });
    ro.observe(container);
    window.addEventListener("resize", calc);
    rafId = requestAnimationFrame(calc);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calc);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isLoggedIn, isGuest]);

  // Click outside close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      const isOutsideHeader =
        containerRef.current && !containerRef.current.contains(targetNode);
      const isOutsideMobileMenu =
        mobileMenuRef.current && !mobileMenuRef.current.contains(targetNode);
      if (isOutsideHeader && isOutsideMobileMenu) closeAllMenus();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((p) => !p);
    setIsProfileMenuOpen(false);
  };

  const isHidden = (key: string) => hiddenItems.includes(key);

  const visibleNav = NAV_ITEMS.filter(
    (i) => !(i.key === "login" && isLoggedIn) && !isHidden(i.key)
  );

  // Build dropdown items: if profile hidden, add Profile/Logout here
  const dropdownNav = [
    ...NAV_ITEMS.filter((i) => !(i.key === "login" && isLoggedIn)),
    ...(isLoggedIn && !isGuest && isHidden("profile")
      ? [
          {
            key: "profile-link",
            text: "Profile",
            icon: null,
            to: "/profile",
          },
          {
            key: "logout",
            text: "Logout",
            icon: null,
            to: "#logout",
          },
        ]
      : []),
  ];

  const hasHiddenNavItems = hiddenItems.some((k) => k !== "subtitle");

  useEffect(() => {
    // If the hamburger button is no longer visible (because there are no hidden nav items)
    // and the mobile menu is currently open, we should close it.
    if (!hasHiddenNavItems && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [hasHiddenNavItems, isMobileMenuOpen]); // Re-run when the button's visibility or menu's state changes

  return (
    <div className="relative">
      <header className="bg-white shadow-md relative z-20">
        {/* Measurement container */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: -99999,
            top: -99999,
            opacity: 0,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <div
            ref={(el) => {
              measureRefs.current["title"] = el;
            }}
            className="text-3xl font-semibold inline-block"
          >
            PokeGridso
          </div>
          <div
            ref={(el) => {
              measureRefs.current["subtitle"] = el;
            }}
            className="text-xs inline-block ml-4"
          >
            <div>The Ultimate</div>
            <div>Pokemon Test</div>
          </div>
          {NAV_ITEMS.map((item) => (
            <div
              key={`meas-${item.key}`}
              ref={(el) => {
                measureRefs.current[item.key] = el;
              }}
              style={{ display: "inline-block", marginLeft: 8 }}
            >
              <HeaderButton icon={item.icon} text={item.text} />
            </div>
          ))}
          <div
            ref={(el) => {
              measureRefs.current["profile"] = el;
            }}
            style={{ display: "inline-block", marginLeft: 12 }}
          >
            <div style={{ height: 40, width: 40, display: "inline-block" }} />
          </div>
          <div
            ref={(el) => {
              measureRefs.current["hamburger"] = el;
            }}
            style={{ display: "inline-block", marginLeft: 8 }}
          >
            <button className="p-2">
              <FiMenu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Visible header */}
        <div
          ref={containerRef}
          className="flex items-center px-4 py-3 sm:px-6 sm:py-4 flex-nowrap"
        >
          {/* Left */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <Link to="/">
              <img src={logo} alt="PokeGridso Logo" className="h-10 w-auto" />
            </Link>
            <div className="flex items-center">
              <Link
                to="/"
                className="title text-3xl font-semibold text-gray-800 hover:underline leading-tight flex-shrink-0 whitespace-nowrap"
              >
                PokeGridso
              </Link>
              {!isHidden("subtitle") && (
                <div className="subtitle ml-4 text-xs text-gray-600 leading-tight flex-shrink-0">
                  <div>The Ultimate</div>
                  <div>Pokemon Test</div>
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="ml-auto flex items-center space-x-2">
            <nav className="flex items-center space-x-2">
              {visibleNav.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  <HeaderButton icon={item.icon} text={item.text} />
                </Link>
              ))}
            </nav>
            {isLoggedIn && !isGuest && !isHidden("profile") && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setIsProfileMenuOpen((p) => !p)}
                  className="focus:outline-none rounded-full overflow-hidden"
                  aria-label="User menu"
                  aria-expanded={isProfileMenuOpen}
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt="Profile"
                      className="h-10 w-10 rounded-full object-cover border-2 border-gray-300 hover:border-primary transition-colors"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                      {user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={closeAllMenus}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* HAMBURGER BUTTON*/}
            {hasHiddenNavItems && (
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-colors"
                aria-expanded={isMobileMenuOpen}
                aria-label="More menu"
              >
                {isMobileMenuOpen ? (
                  <FiX className="h-6 w-6" />
                ) : (
                  <FiMenu className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CHANGE 3: Attach the new ref to the hamburger dropdown */}
      <div
        ref={mobileMenuRef}
        className={`absolute right-0 top-full w-64 bg-white shadow-lg rounded-md z-10 origin-top 
        overflow-hidden transition-all duration-300 ease-in-out
        ${
          isMobileMenuOpen
            ? "transform translate-y-0 opacity-100"
            : "transform -translate-y-2 opacity-0 pointer-events-none"
        }`}
      >
        <nav className="py-2">
          {dropdownNav.map((item) => (
            // This is correct: A simple Link with no onClick handler.
            <Link
              key={`drop-${item.key}`}
              to={item.to}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span className="mr-2">{item.icon}</span>
              <span>{item.text}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Header;
