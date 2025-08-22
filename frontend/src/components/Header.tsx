// Header.tsx - Robust dynamic collapsing header with buffer + hysteresis
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import HeaderButton from "./HeaderButton";
import { useAuth } from "../contexts/useAuth";
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

// Profile Image Component with error handling
const ProfileImage: React.FC<{ user: User | null }> = ({ user }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    // console.log("Profile image failed to load:", e.currentTarget.src);
    // console.log("Error details:", e);
    setImageError(true);
  };

  const handleImageLoad = () => {
    // console.log("Profile image loaded successfully:", user?.picture);
  };

  if (!user?.picture || imageError) {
    return (
      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
        {user?.username?.charAt(0)?.toUpperCase() || "U"}
      </div>
    );
  }

  // console.log("Attempting to load profile image:", user.picture);

  return (
    <img
      src={user.picture}
      alt="Profile"
      className="h-10 w-10 rounded-full object-cover border-2 border-gray-300 hover:border-primary transition-colors"
      onError={handleImageError}
      onLoad={handleImageLoad}
      referrerPolicy="no-referrer"
    />
  );
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
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRefs = useRef<Record<string, HTMLElement | null>>({});
  const lastAppliedAvailableRef = useRef<number | null>(null);
  const prevHiddenRef = useRef<string[]>([]);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // console.log("=== HEADER RENDER ===");
  // console.log("isLoggedIn:", isLoggedIn);
  // console.log("isProfileMenuOpen:", isProfileMenuOpen);
  // console.log("isMobileMenuOpen:", isMobileMenuOpen);
  // console.log("location.pathname:", location.pathname);

  // Sync user data with AuthContext
  useEffect(() => {
    // console.log("=== Header: Syncing with AuthContext ===");

    if (isLoggedIn) {
      // Get user data from localStorage when logged in
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
          setIsGuest(false);
          // console.log("Header: Set user from localStorage:", userData);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    } else {
      // Clear user data when logged out
      setUser(null);
      setIsGuest(false);
      // console.log("Header: Cleared user data");
    }
  }, [isLoggedIn]);

  // Simplified closeAllMenus without useCallback to avoid dependency issues
  const closeAllMenus = () => {
    // console.log("=== closeAllMenus called ===");
    // console.log(
    //   "Current state - Profile:",
    //   isProfileMenuOpen,
    //   "Mobile:",
    //   isMobileMenuOpen
    // );
    if (isProfileMenuOpen || isMobileMenuOpen) {
      // console.log("Closing menus...");
      setIsProfileMenuOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    // console.log("=== handleLogout called ===");
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

  // LOCATION CHANGE EFFECT - Simplified version
  useEffect(() => {
    // console.log("=== LOCATION CHANGE EFFECT ===");
    // console.log("New location:", location.pathname);
    // console.log(
    //   "Previous location state - Profile:",
    //   isProfileMenuOpen,
    //   "Mobile:",
    //   isMobileMenuOpen
    // );

    // Only close menus if they're actually open
    if (isProfileMenuOpen || isMobileMenuOpen) {
      // console.log("Menus are open, scheduling close...");
      // Use setTimeout to ensure this happens after other events
      const timer = setTimeout(() => {
        // console.log("Timer executed - closing menus due to navigation");
        closeAllMenus();
      }, 50);

      return () => {
        // console.log("Cleaning up timer");
        clearTimeout(timer);
      };
    }
  }, [location.pathname]); // Remove closeAllMenus from dependencies

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
          const wasFirstNavHidden = !hamburgerAdded;
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

  // Click outside close - THE KEY FIX IS HERE
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node;

      // console.log("=== CLICK OUTSIDE HANDLER ===");
      // console.log("Click detected on:", targetNode);
      // console.log("Profile menu open:", isProfileMenuOpen);
      // console.log("Mobile menu open:", isMobileMenuOpen);

      // Check if click is on the profile button itself
      if (
        profileButtonRef.current &&
        profileButtonRef.current.contains(targetNode as Node)
      ) {
        // console.log("Clicked profile button - ignoring click outside logic");
        return; // Don't close if clicking the profile button
      }

      // Check if click is inside header container
      const isOutsideHeader =
        containerRef.current && !containerRef.current.contains(targetNode);

      // Check if click is inside mobile menu
      const isOutsideMobileMenu =
        mobileMenuRef.current && !mobileMenuRef.current.contains(targetNode);

      // Check if click is inside profile menu
      const isOutsideProfileMenu =
        profileMenuRef.current && !profileMenuRef.current.contains(targetNode);

      // console.log("Click outside checks:", {
      //   isOutsideHeader,
      //   isOutsideMobileMenu,
      //   isOutsideProfileMenu,
      // });

      // Close menus only if click is outside all relevant areas
      if (isOutsideHeader && isOutsideMobileMenu && isOutsideProfileMenu) {
        // console.log("Click is outside all menus - closing menus");
        closeAllMenus();
      } else {
        // console.log("Click is inside a menu area - not closing");
      }
    };

    // console.log("=== ATTACHING CLICK LISTENER ===");
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // console.log("=== REMOVING CLICK LISTENER ===");
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen, isMobileMenuOpen]); // Remove closeAllMenus from dependencies

  const toggleMobileMenu = () => {
    // console.log("=== toggleMobileMenu called ===");
    // console.log(
    //   "Current state - Mobile:",
    //   isMobileMenuOpen,
    //   "Profile:",
    //   isProfileMenuOpen
    // );
    setIsMobileMenuOpen((p) => {
      const newValue = !p;
      // console.log("Setting mobile menu to:", newValue);
      return newValue;
    });
    if (isProfileMenuOpen) {
      // console.log("Closing profile menu because mobile menu is toggling");
      setIsProfileMenuOpen(false);
    }
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
      // console.log(
      //   "Hamburger button hidden but mobile menu open - closing mobile menu"
      // );
      setIsMobileMenuOpen(false);
    }
  }, [hasHiddenNavItems, isMobileMenuOpen]);

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
                  ref={profileButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    // console.log("=== PROFILE BUTTON CLICKED ===");
                    // console.log(
                    //   "Current state - Profile:",
                    //   isProfileMenuOpen,
                    //   "Mobile:",
                    //   isMobileMenuOpen
                    // );
                    setIsProfileMenuOpen((prev) => {
                      const newValue = !prev;
                      // console.log("Toggling profile menu to:", newValue);
                      return newValue;
                    });
                  }}
                  className="focus:outline-none rounded-full overflow-hidden"
                  aria-label="User menu"
                  aria-expanded={isProfileMenuOpen}
                >
                  <ProfileImage user={user} />
                </button>
                {isProfileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                  >
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
                      onClick={(e) => {
                        e.stopPropagation();
                        // console.log("Profile link clicked - closing menu");
                        setIsProfileMenuOpen(false);
                      }}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // console.log("Logout button clicked");
                        handleLogout();
                      }}
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
            <Link
              key={`drop-${item.key}`}
              to={item.to}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                // console.log("Dropdown item clicked - closing all menus");
                closeAllMenus();
              }}
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
