import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import TicketForm from './pages/TicketForm';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TicketList />} />
        <Route path="/tickets/new" element={<TicketForm />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/tickets/:id/edit" element={<TicketForm />} />
<Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
