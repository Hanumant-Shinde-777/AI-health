import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes/AppRoutes'

// Opt in to React Router v7 behavior now (silences the dev-time future-flag warning)
const App = () => <RouterProvider router={router} future={{ v7_startTransition: true }} />

export default App
