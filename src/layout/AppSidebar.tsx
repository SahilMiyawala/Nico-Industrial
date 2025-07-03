import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import { GridIcon, HorizontaLDots, ChevronDownIcon } from "../icons";
import { BarChart3 } from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { LuUsers } from "react-icons/lu";
import { LiaClipboardListSolid } from "react-icons/lia";
import { CiCalendar } from "react-icons/ci";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { MdOutlineFollowTheSigns, MdOutlineBusiness, MdContacts, MdOutlinePerson } from "react-icons/md";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  requiredRole?: string; // Add this to specify required role
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  // Get user role from localStorage
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Get role from localStorage when component mounts
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const navItems: NavItem[] = [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/",
    },
    {
      icon: <LuUsers />,
      name: "Inquiry",
      path: "/inquiry",
    },
    {
      icon: <MdOutlineFollowTheSigns />,
      name: "General Follow Up",
      path: "/general-follow-up",
    },
    // {
    //   icon: <BarChart3 />,
    //   name: "Analytics",
    //   path: "/analytics",
    // },
    {
      icon: <CiCalendar />,
      name: "Consumer",
      path: "/consumer",
    },
    {
      icon: <AiOutlineQuestionCircle />,
      name: "Consultant",
      path: "/consultant",
    },
    {
      icon: <MdOutlineBusiness />,
      name: "Brand",
      path: "/brand",
    },
    {
      icon: <LiaClipboardListSolid />,
      name: "Product",
      path: "/product",
    },
    {
      icon: <MdContacts />,
      name: "Role",
      path: "/role",
      requiredRole: "Admin", // Only show for admin
    },
    {
      icon: <MdOutlinePerson />,
      name: "Users",
      path: "/users",
      requiredRole: "Admin", // Only show for admin
    },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!item.requiredRole) return true; // Show if no role required
    if (!userRole) return false; // Hide if no user role
    return userRole === item.requiredRole; // Show only if roles match
  });

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  useEffect(() => {
    let submenuMatched = false;
    filteredNavItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: "main", index });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, filteredNavItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `main-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (prevOpenSubmenu && prevOpenSubmenu.index === index) {
        return null;
      }
      return { type: "main", index };
    });
  };

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button onClick={() => handleSubmenuToggle(index)} className={`menu-item group text-white ${openSubmenu?.index === index ? "menu-item-active" : "menu-item-inactive"} cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}>
              <span className={`menu-item-icon-size ${openSubmenu?.index === index ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>{nav.icon}</span>
              {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
              {(isExpanded || isHovered || isMobileOpen) && <ChevronDownIcon className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""}`} />}
            </button>
          ) : (
            nav.path && (
              <Link to={nav.path} className={`menu-item text-white hover:text-black group ${isActive(nav.path) ? "menu-item-active border-1 border-black bg-white !text-black dark:!text-white" : "menu-item-inactive"}`}>
                <span className={`menu-item-icon-size  text-white dark:text-white ${isActive(nav.path) ? "menu-item-icon-active !text-black dark:!text-white" : "menu-item-icon-inactive"}`}>{nav.icon}</span>
                {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`main-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height: openSubmenu?.index === index ? `${subMenuHeight[`main-${index}`]}px` : "0px",
              }}>
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link to={subItem.path} className={`menu-dropdown-item ${isActive(subItem.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}>
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && <span className={`ml-auto ${isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"} menu-dropdown-badge`}>new</span>}
                        {subItem.pro && <span className={`ml-auto ${isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"} menu-dropdown-badge`}>pro</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col pt-5 lg:mt-0 top-0 px-5 left-0 border-r-1 border-gray-400 dark:bg-gray-900 dark:border-gray-800 bg-[#38487c] text-gray-900 h-screen transition-all duration-300 ease-in-out z-50
        ${isExpanded || isMobileOpen ? "w-[260px]" : isHovered ? "w-[260px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <div className={`flex dark:text-white text-white ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img src="logo.png" alt="BrandImage" />
              {/* <p>NICO INDUSTRIAL SOLUTION</p> */}
            </>
          ) : (
            <p className="py-5">NIS</p>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div className="">
              <h2 className={`mb-4 text-xs dark:text-white text-white uppercase flex leading-[20px] ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>{isExpanded || isHovered || isMobileOpen ? "" : <HorizontaLDots className="size-6" />}</h2>
              {renderMenuItems(filteredNavItems)}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
