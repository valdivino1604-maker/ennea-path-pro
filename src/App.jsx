import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';

import Landing from '@/pages/Landing';
import Register from '@/pages/Register';
import Test from '@/pages/Test';
import Results from '@/pages/Results';
import AdminLogin from '@/pages/AdminLogin';
import AdminSetup from '@/pages/AdminSetup';
import Admin from '@/pages/Admin';
import TeamMapping from '@/pages/TeamMapping';
import Compatibility from '@/pages/Compatibility';
import DevelopmentPlan from '@/pages/DevelopmentPlan';
import BehavioralHistory from '@/pages/BehavioralHistory';
import AILeadership from '@/pages/AILeadership';
import Reports from '@/pages/Reports';
import AdminGuard from '@/components/AdminGuard';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/test/:participantId" element={<Test />} />
            <Route path="/results/:resultId" element={<Results />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/setup" element={<AdminSetup />} />
            <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
            <Route path="/admin/team-mapping" element={<AdminGuard><TeamMapping /></AdminGuard>} />
            <Route path="/admin/compatibility" element={<AdminGuard><Compatibility /></AdminGuard>} />
            <Route path="/admin/development-plan" element={<AdminGuard><DevelopmentPlan /></AdminGuard>} />
            <Route path="/admin/behavioral-history" element={<AdminGuard><BehavioralHistory /></AdminGuard>} />
            <Route path="/admin/ai-leadership" element={<AdminGuard><AILeadership /></AdminGuard>} />
            <Route path="/admin/reports" element={<AdminGuard><Reports /></AdminGuard>} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
