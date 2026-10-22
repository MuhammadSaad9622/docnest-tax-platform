import { NavLink, useNavigate } from 'react-router-dom'
import { MdDashboard, MdPeople, MdPersonAdd, MdAccountTree,
         MdUpload, MdHistory, MdSettings, MdMenu, MdClose, MdLogout, MdGroup, MdFolder } from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import { can } from '../../utils/permissions'
import './Sidebar.css'

const buildNavSections = (user) => {
  const role = user?.role

  // CLIENT role — completely different navigation
  if (role === 'CLIENT') {
    return [
      {
        label: 'MY PORTAL',
        items: [
          { to: '/portal', icon: <MdFolder />, label: 'My Documents', end: true },
        ],
      },
    ]
  }

  // Staff roles
  const sections = [
    {
      label: 'GENERAL',
      items: [
        { to: '/dashboard',    icon: <MdDashboard />,  label: 'Dashboard', end: true },
        { to: '/clients',      icon: <MdPeople />,     label: 'Clients', end: true },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        { to: '/clients/add',  icon: <MdPersonAdd />,  label: 'Add Client' },
        { to: '/family/1',     icon: <MdAccountTree />, label: 'Family Tree' },
      ],
    },
  ]

  if (can(user, 'importExcel')) {
    sections[1].items.push({ to: '/import',   icon: <MdUpload />, label: 'Excel Import' })
  }

  if (can(user, 'viewAllActivity')) {
    sections[1].items.push({ to: '/activity', icon: <MdHistory />, label: 'Activity Logs' })
  }

  if (can(user, 'manageSettings')) {
    sections[1].items.push({ to: '/settings', icon: <MdSettings />, label: 'Settings' })
  }

  if (can(user, 'manageUsers')) {
    sections[1].items.push({ to: '/settings?tab=users', icon: <MdGroup />, label: 'User Management' })
  }

  return sections
}

export default function Sidebar({ mobileOpen, onToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navSections = buildNavSections(user)

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <>
      {/* Mobile hamburger */}
      <button className="sidebar-hamburger" onClick={onToggle} aria-label="Open menu">
        <MdMenu size={22} />
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && <div className="sidebar-overlay" onClick={onToggle} />}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        {/* Logo */}
        <div className="sidebar__logo">
          <div className="sidebar__logo-mark">D</div>
          <span className="sidebar__logo-text">DocNest</span>
          <button className="sidebar__close-btn" onClick={onToggle} aria-label="Close menu">
            <MdClose size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {navSections.map((section) => (
            <div key={section.label} className="sidebar__section">
              <p className="sidebar__section-label">{section.label}</p>
              <ul className="sidebar__nav-list">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end || false}
                      className={({ isActive }) =>
                        `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
                      }
                      onClick={() => { if (mobileOpen) onToggle?.() }}
                    >
                      <span className="sidebar__nav-icon">{item.icon}</span>
                      <span className="sidebar__nav-label">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="sidebar__user">
          <div className="sidebar__user-avatar">{initials}</div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">{user?.fullName || 'User'}</span>
            <span className="sidebar__user-role">{user?.role || 'Employee'}</span>
          </div>
          <button className="sidebar__logout-btn" onClick={handleLogout} title="Logout">
            <MdLogout size={18} />
          </button>
        </div>
      </aside>
    </>
  )
}
