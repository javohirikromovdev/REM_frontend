import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { CatalogPage } from './pages/CatalogPage'
import { PropertyDetailPage } from './pages/PropertyDetailPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { NotFoundPage } from './pages/StatusPages'
import { CabinetLayout, FavoritesPage, MyInquiriesPage, MyPropertiesPage, ProfilePage } from './pages/cabinet/CabinetPages'
import { PropertyFormPage } from './pages/cabinet/PropertyFormPage'
import { AdminCategoriesPage, AdminLayout, AdminPropertiesPage, AdminUsersPage } from './pages/admin/AdminPages'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Mehmon uchun ochiq sahifalar */}
        <Route index element={<HomePage />} />
        <Route path="properties" element={<CatalogPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Login talab qilinadigan sahifalar */}
        <Route path="favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
        <Route path="cabinet" element={<ProtectedRoute><CabinetLayout /></ProtectedRoute>}>
          <Route index element={<ProfilePage />} />
          <Route path="properties" element={<MyPropertiesPage />} />
          <Route path="properties/new" element={<PropertyFormPage />} />
          <Route path="properties/:id/edit" element={<PropertyFormPage />} />
          <Route path="inquiries" element={<MyInquiriesPage />} />
        </Route>

        {/* Faqat ADMIN */}
        <Route path="admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminPropertiesPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
