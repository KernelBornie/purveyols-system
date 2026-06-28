import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, Alert,
  FormControlLabel, Switch, Dialog, DialogTitle,
  DialogContent, DialogActions, Skeleton, IconButton, Tooltip,
  TextField, FormGroup, Checkbox, Divider, List, ListItem,
  ListItemText, ListItemSecondaryAction, InputAdornment
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FilterListIcon from '@mui/icons-material/FilterList';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import api from '../../api/axios';
import WorkerSearch from '../../components/WorkerSearch';
import PaymentModal from '../../components/PaymentModal';
import { useAuth } from '../../context/AuthContext';

// ─── Simple Error Boundary ──────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Paper sx={{ p: 3, m: 2 }}>
          <Typography variant="h5" color="error">Something went wrong</Typography>
          <Typography variant="body2" color="textSecondary">
            {this.state.error?.message || 'Unknown error'}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Reload Page
          </Button>
        </Paper>
      );
    }
    return this.props.children;
  }
}

const cache = {};
const CACHE_TTL = 5 * 60 * 1000;

const getCached = (key) => {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    delete cache[key];
    return null;
  }
  return entry.data;
};

const setCached = (key, data) => {
  cache[key] = { data, timestamp: Date.now() };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const TENDER_COLORS = ['#e0e0e0', '#ff9800', '#4caf50', '#2196f3', '#9c27b0'];

const AccountantDashboard = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ 
    workers: 0, 
    projects: 0, 
    totalReleased: 0, 
    fundingRequests: 0, 
    pendingFunding: 0,
    approvedFunding: 0,
    pendingWorkers: 0,
    totalPendingAmount: 0,
    pendingProcurement: 0,
    pendingSubcontracts: 0,
    visitors: 0,
    todayVisitors: 0,
    advertisedProjects: 0,
    biddedProjects: 0,
    tendersDraft: 0,
    tendersSubmitted: 0,
    tendersApproved: 0,
    tendersVerified: 0,
    tendersAwarded: 0,
  });
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [procurementOrders, setProcurementOrders] = useState([]);
  const [subcontracts, setSubcontracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [topWorkers, setTopWorkers] = useState([]);
  const [paymentTrends, setPaymentTrends] = useState([]);
  const [projectSpending, setProjectSpending] = useState([]);
  const [approvalRatio, setApprovalRatio] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [showCharts, setShowCharts] = useState(true);
  const [showTenderCharts, setShowTenderCharts] = useState(true);
  const [message, setMessage] = useState(null);

  // ─── Tender-specific chart data ──────────────────────────────────
  const [tenderStatusData, setTenderStatusData] = useState([]);
  const [tenderTimelineData, setTenderTimelineData] = useState([]);
  const [advertisedVsBiddedData, setAdvertisedVsBiddedData] = useState([]);

  const [tenders, setTenders] = useState([]);
  const [advertisedProjects, setAdvertisedProjects] = useState([]);
  const [bids, setBids] = useState([]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);

  const [payAllOpen, setPayAllOpen] = useState(false);
  const [payAllFilters, setPayAllFilters] = useState({
    workers: true,
    funding: true,
    procurement: true,
    subcontracts: true,
  });
  const [payAllItems, setPayAllItems] = useState([]);
  const [payAllTotal, setPayAllTotal] = useState(0);
  const [payAllProcessing, setPayAllProcessing] = useState(false);
  const [payAllStatus, setPayAllStatus] = useState(null);

  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundRequestId, setFundRequestId] = useState(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [fundAmount, setFundAmount] = useState(0);
  const [fundRequesterName, setFundRequesterName] = useState('');
  const [fundType, setFundType] = useState('funding');

  const [procurementFundOpen, setProcurementFundOpen] = useState(false);
  const [procurementToFund, setProcurementToFund] = useState(null);

  const [subcontractFundOpen, setSubcontractFundOpen] = useState(false);
  const [subcontractToFund, setSubcontractToFund] = useState(null);

  const initialLoadDone = useRef(false);

  const canApprove = ['admin', 'director', 'accountant'].includes(user?.role);
  const canFund = ['admin', 'accountant'].includes(user?.role);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/api/users/me', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.data) {
        updateUser(res.data);
        return res.data;
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
    return null;
  }, [updateUser]);

  // ─── Tender action handlers ──────────────────────────────────────
  const handleApproveTender = async (id) => {
    if (!window.confirm('Approve this tender?')) return;
    try {
      await api.put(`/api/tenders/${id}/approve`);
      setMessage({ type: 'success', text: 'Tender approved!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Approval failed' });
    }
  };

  const handleVerifyTender = async (id) => {
    if (!window.confirm('Verify this approved tender?')) return;
    try {
      await api.put(`/api/tenders/${id}/verify`);
      setMessage({ type: 'success', text: 'Tender verified!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Verification failed' });
    }
  };

  const handleAwardTender = async (id) => {
    const awardAmount = prompt('Enter award amount (or leave blank to use tender total):');
    const awardee = prompt('Enter awardee (or leave blank to use client name):');
    try {
      await api.put(`/api/tenders/${id}/award`, {
        awardAmount: awardAmount ? parseFloat(awardAmount) : undefined,
        awardee: awardee || undefined,
      });
      setMessage({ type: 'success', text: 'Tender awarded!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Award failed' });
    }
  };

  const handleCreateProjectFromTender = async (id) => {
    if (!window.confirm('Create a project from this awarded tender?')) return;
    try {
      await api.post(`/api/tenders/${id}/convert-to-project`);
      setMessage({ type: 'success', text: 'Project created successfully!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Project creation failed' });
    }
  };

  // ─── Funding Request handlers ────────────────────────────────────
  const handleForwardFunding = async (id) => {
    try {
      await api.put(`/api/funding-requests/${id}/forward`);
      setMessage({ type: 'success', text: 'Funding request forwarded to Director!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Forward failed' });
    }
  };

  const handleApproveFunding = async (id) => {
    try {
      await api.put(`/api/funding-requests/${id}/approve`);
      setMessage({ type: 'success', text: 'Funding request approved!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Approval failed' });
    }
  };

  const handleRejectFunding = async (id) => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await api.put(`/api/funding-requests/${id}/reject`, { reason });
      setMessage({ type: 'success', text: 'Funding request rejected.' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Rejection failed' });
    }
  };

  // ─── Procurement handlers ──────────────────────────────────────
  const handleFinalApproveProcurement = async (id) => {
    try {
      await api.put(`/api/procurement/${id}/final-approve`);
      setMessage({ type: 'success', text: 'Order final approved!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Final approval failed' });
    }
  };

  const handleFundProcurement = async (id, recipientPhone) => {
    try {
      await api.put(`/api/procurement/${id}/fund`, { recipientPhone });
      setMessage({ type: 'success', text: 'Procurement order funded!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Funding failed' });
    }
  };

  const handleFundSubcontract = async (id, vendorPhone) => {
    try {
      await api.put(`/api/subcontracts/${id}/fund`, { vendorPhone });
      setMessage({ type: 'success', text: 'Subcontract funded!' });
      refreshAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Funding failed' });
    }
  };

  // ─── Funding request modal handlers ────────────────────────────
  const handleFundClick = (request) => {
    const requester = request.requestedBy;
    setFundRequestId(request._id);
    setFundAmount(request.amount);
    setFundRequesterName(requester?.name || 'Unknown');
    setRecipientPhone(requester?.mobileMoneyNumber || requester?.phone || '');
    setFundType('funding');
    setFundModalOpen(true);
  };

  const handleFundConfirm = async () => {
    if (!recipientPhone || recipientPhone.trim() === '') {
      alert('Please enter the recipient\'s phone number.');
      return;
    }
    try {
      await api.put(`/api/funding-requests/${fundRequestId}/fund`, { recipientPhone });
      setFundModalOpen(false);
      refreshAll();
    } catch (err) {
      alert('Funding failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // ─── Pay All handlers ──────────────────────────────────────────
  const buildPayAllItems = useCallback(() => {
    const items = [];
    let total = 0;

    if (payAllFilters.workers) {
      const pendingWorkers = workers.filter(w => (w.balance || 0) > 0);
      pendingWorkers.forEach(w => {
        const phone = w.phone || '';
        items.push({
          type: 'Worker',
          name: w.name,
          amount: w.balance,
          phone: phone,
          id: w._id,
          category: 'worker',
          phoneEditable: true,
        });
        total += w.balance;
      });
    }

    if (payAllFilters.funding) {
      const approvedFunding = fundingRequests.filter(f => f.status === 'approved');
      approvedFunding.forEach(f => {
        const phone = f.requestedBy?.mobileMoneyNumber || f.requestedBy?.phone || '';
        items.push({
          type: 'Funding Request',
          name: f.requestedBy?.name || 'Unknown',
          amount: f.amount,
          phone: phone,
          id: f._id,
          category: 'funding',
          phoneEditable: true,
        });
        total += f.amount;
      });
    }

    if (payAllFilters.procurement) {
      const approvedProc = procurementOrders.filter(o => o.status === 'approved');
      approvedProc.forEach(o => {
        const phone = o.recipientPhone || o.createdBy?.phone || '';
        items.push({
          type: 'Procurement Order',
          name: o.orderNumber || o._id.slice(-6),
          amount: o.grandTotal || o.total || 0,
          phone: phone,
          id: o._id,
          category: 'procurement',
          phoneEditable: true,
        });
        total += (o.grandTotal || o.total || 0);
      });
    }

    if (payAllFilters.subcontracts) {
      const approvedSub = subcontracts.filter(s => s.status === 'approved');
      approvedSub.forEach(s => {
        const phone = s.vendorPhone || '';
        items.push({
          type: 'Subcontract',
          name: s.vendor || s.name || 'Unknown',
          amount: s.amount || 0,
          phone: phone,
          id: s._id,
          category: 'subcontract',
          phoneEditable: true,
        });
        total += (s.amount || 0);
      });
    }

    setPayAllItems(items);
    setPayAllTotal(total);
  }, [workers, fundingRequests, procurementOrders, subcontracts, payAllFilters]);

  const handlePayAllOpen = () => {
    setPayAllFilters({ workers: true, funding: true, procurement: true, subcontracts: true });
    setPayAllItems([]);
    setPayAllTotal(0);
    setPayAllStatus(null);
    setPayAllOpen(true);
  };

  useEffect(() => {
    if (payAllOpen) {
      buildPayAllItems();
    }
  }, [payAllOpen, payAllFilters, buildPayAllItems]);

  const updatePhoneNumber = (index, newPhone) => {
    const updated = [...payAllItems];
    updated[index].phone = newPhone;
    setPayAllItems(updated);
  };

  const skipItem = (index) => {
    const updated = payAllItems.filter((_, i) => i !== index);
    setPayAllItems(updated);
    const newTotal = updated.reduce((sum, item) => sum + item.amount, 0);
    setPayAllTotal(newTotal);
  };

  const handlePayAllConfirm = async () => {
    const validItems = payAllItems.filter(item => item.phone && item.phone.trim() !== '');
    const skippedItems = payAllItems.filter(item => !item.phone || item.phone.trim() === '');

    if (validItems.length === 0) {
      alert('No valid recipients with phone numbers. Please enter phone numbers or skip items.');
      return;
    }

    if (skippedItems.length > 0) {
      if (!window.confirm(`${skippedItems.length} item(s) will be skipped because they have no phone number. Continue with ${validItems.length} valid item(s)?`)) {
        return;
      }
    }

    setPayAllProcessing(true);
    setPayAllStatus(null);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const item of validItems) {
        try {
          if (item.category === 'worker') {
            await api.post('/api/payments', {
              workerId: item.id,
              amount: item.amount,
              recipientPhone: item.phone,
            });
          } else if (item.category === 'funding') {
            await api.put(`/api/funding-requests/${item.id}/fund`, { recipientPhone: item.phone });
          } else if (item.category === 'procurement') {
            await api.put(`/api/procurement/${item.id}/fund`, { recipientPhone: item.phone });
          } else if (item.category === 'subcontract') {
            await api.put(`/api/subcontracts/${item.id}/fund`, { recipientPhone: item.phone });
          }
          successCount++;
        } catch (err) {
          failCount++;
          console.error(`Payment failed for ${item.name}:`, err);
        }
      }

      setPayAllStatus({
        type: successCount > 0 && failCount === 0 ? 'success' : failCount > 0 ? 'warning' : 'error',
        message: `Processed ${successCount} successful, ${failCount} failed. ${skippedItems.length} skipped.`
      });
      refreshAll();
    } catch (err) {
      setPayAllStatus({ type: 'error', message: 'Failed to process payments: ' + err.message });
    } finally {
      setPayAllProcessing(false);
      setTimeout(() => {
        setPayAllOpen(false);
        setPayAllStatus(null);
      }, 3000);
    }
  };

  // ─── Worker select handlers ──────────────────────────────────────
  const handleWorkerSelect = useCallback((worker) => {
    setSelectedWorker(worker);
    setSearchOpen(false);
    setPaymentOpen(true);
  }, []);

  const handlePaymentClose = useCallback(() => {
    setPaymentOpen(false);
    setSelectedWorker(null);
    refreshAll();
  }, [refreshAll]);

  // ─── Main fetch ──────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async (force = false) => {
    const cacheKey = 'accountant_dashboard';
    if (!force) {
      const cached = getCached(cacheKey);
      if (cached) {
        console.log('✅ Loading from cache');
        setStats(cached.stats);
        setWorkers(cached.workers);
        setProjects(cached.projects);
        setFundingRequests(cached.fundingRequests);
        setProcurementOrders(cached.procurementOrders || []);
        setSubcontracts(cached.subcontracts || []);
        setPayments(cached.payments);
        setAttendance(cached.attendance);
        setTopWorkers(cached.topWorkers);
        setPaymentTrends(cached.paymentTrends);
        setProjectSpending(cached.projectSpending);
        setApprovalRatio(cached.approvalRatio);
        setReportData(cached.reportData);
        setTenders(cached.tenders || []);
        setAdvertisedProjects(cached.advertisedProjects || []);
        setBids(cached.bids || []);
        setTenderStatusData(cached.tenderStatusData || []);
        setTenderTimelineData(cached.tenderTimelineData || []);
        setAdvertisedVsBiddedData(cached.advertisedVsBiddedData || []);
        setLoading(false);
        return;
      }
    }

    console.log('🔄 Fetching fresh dashboard data...');
    setLoading(true);
    setMessage(null);

    // ─── Safe fetch wrapper ──────────────────────────────────────
    const safeFetch = async (url, fallback = []) => {
      try {
        const res = await api.get(url);
        console.log(`✅ ${url} fetched successfully`);
        return Array.isArray(res.data) ? res.data : (res.data?.data || res.data || fallback);
      } catch (err) {
        console.error(`❌ Failed to fetch ${url}:`, err.message);
        return fallback;
      }
    };

    try {
      const [
        workersData,
        attendanceData,
        paymentsData,
        projectsData,
        fundingData,
        procurementData,
        subcontractsData,
        visitorsData,
        tendersData,
        advertisedData,
        bidsData,
      ] = await Promise.all([
        safeFetch('/api/workers', []),
        safeFetch('/api/attendance', []),
        safeFetch('/api/payments', []),
        safeFetch('/api/projects', []),
        safeFetch('/api/funding-requests', []),
        safeFetch('/api/procurement', []),
        safeFetch('/api/subcontracts', []),
        safeFetch('/api/visitors', []),
        safeFetch('/api/tenders', []),
        safeFetch('/api/advertised-projects', []).then(data => data.projects || data || []),
        safeFetch('/api/bids', []),
      ]);

      console.log('✅ All data fetched');

      // ─── Process data ────────────────────────────────────────────
      const completedPayments = paymentsData.filter(p => p.status === 'completed');
      const totalVisitors = visitorsData.length;
      const todayVisitors = visitorsData.filter(v => new Date(v.checkIn).toDateString() === new Date().toDateString()).length;

      const workersWithBalance = workersData.map(w => {
        const workerAttendance = attendanceData.filter(a => a.worker === w._id || a.worker?._id === w._id);
        const totalEarned = workerAttendance.reduce((sum, a) => sum + (a.days * a.rate || a.rate), 0);
        const workerPayments = completedPayments.filter(p => p.worker === w._id || p.worker?._id === w._id);
        const totalPaid = workerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        return { ...w, balance: totalEarned - totalPaid };
      });

      const totalWorkers = workersWithBalance.length;
      const totalProjects = projectsData.length;
      const totalReleased = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalFunding = fundingData.length;
      const pendingFunding = fundingData.filter(f => f.status === 'pending' || f.status === 'approved').length;
      const approvedFunding = fundingData.filter(f => f.status === 'approved').length;
      const pendingWorkers = workersWithBalance.filter(w => w.balance > 0).length;
      const totalPendingAmount = workersWithBalance.reduce((sum, w) => sum + (w.balance || 0), 0) +
        fundingData.filter(f => f.status === 'approved').reduce((sum, f) => sum + f.amount, 0) +
        procurementData.filter(o => o.status === 'approved').reduce((sum, o) => sum + (o.grandTotal || o.total || 0), 0) +
        subcontractsData.filter(s => s.status === 'approved').reduce((sum, s) => sum + (s.amount || 0), 0);

      const pendingProcurement = procurementData.filter(o => o.status === 'approved').length;
      const pendingSubcontracts = subcontractsData.filter(s => s.status === 'approved').length;

      const tendersDraft = tendersData.filter(t => t.status === 'draft').length;
      const tendersSubmitted = tendersData.filter(t => t.status === 'submitted').length;
      const tendersApproved = tendersData.filter(t => t.status === 'approved').length;
      const tendersVerified = tendersData.filter(t => t.status === 'verified').length;
      const tendersAwarded = tendersData.filter(t => t.status === 'awarded').length;

      const advertisedProjectsCount = advertisedData.filter(p => p.status === 'open').length;
      const biddedProjectsCount = bidsData.length;

      // ─── Top workers ──────────────────────────────────────────────
      const workerEarnings = {};
      completedPayments.forEach(p => {
        const workerId = p.worker?._id || p.worker;
        if (workerId) {
          workerEarnings[workerId] = (workerEarnings[workerId] || 0) + p.amount;
        }
      });
      const top = Object.entries(workerEarnings)
        .map(([id, amount]) => {
          const worker = workersWithBalance.find(w => w._id === id);
          return { name: worker?.name || 'Unknown', amount };
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // ─── Charts ──────────────────────────────────────────────────
      const trends = {};
      const now = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        trends[key] = 0;
      }
      completedPayments.forEach(p => {
        if (p.createdAt) {
          const date = new Date(p.createdAt).toISOString().split('T')[0];
          if (trends[date] !== undefined) trends[date] += p.amount;
        }
      });
      const trendData = Object.entries(trends).map(([date, amount]) => ({ 
        date: date.slice(5),
        amount 
      }));

      const projectSpendingMap = {};
      completedPayments.forEach(p => {
        const projectId = p.project?._id || p.project;
        if (projectId) {
          const project = projectsData.find(pr => pr._id === projectId);
          const name = project?.name || 'Unknown Project';
          projectSpendingMap[name] = (projectSpendingMap[name] || 0) + p.amount;
        }
      });
      const spendingData = Object.entries(projectSpendingMap).map(([name, amount]) => ({ name, amount }));

      const pending = fundingData.filter(f => f.status === 'pending').length;
      const approved = fundingData.filter(f => f.status === 'approved').length;
      const rejected = fundingData.filter(f => f.status === 'rejected').length;
      const funded = fundingData.filter(f => f.status === 'funded').length;
      const ratio = [
        { name: 'Pending', value: pending },
        { name: 'Approved', value: approved },
        { name: 'Rejected', value: rejected },
        { name: 'Funded', value: funded },
      ].filter(item => item.value > 0);

      const report = {
        workersEnrolled: totalWorkers,
        projectsCreated: totalProjects,
        payments: completedPayments.length,
        totalAmountReleased: totalReleased,
      };

      const newStats = { 
        workers: totalWorkers, 
        projects: totalProjects, 
        totalReleased, 
        fundingRequests: totalFunding,
        pendingFunding: pendingFunding,
        approvedFunding: approvedFunding,
        pendingWorkers: pendingWorkers,
        totalPendingAmount: totalPendingAmount,
        pendingProcurement: pendingProcurement,
        pendingSubcontracts: pendingSubcontracts,
        visitors: totalVisitors,
        todayVisitors: todayVisitors,
        advertisedProjects: advertisedProjectsCount,
        biddedProjects: biddedProjectsCount,
        tendersDraft,
        tendersSubmitted,
        tendersApproved,
        tendersVerified,
        tendersAwarded,
      };

      // ─── Tender chart data ──────────────────────────────────────
      const statusCounts = {
        draft: tendersData.filter(t => t.status === 'draft').length,
        submitted: tendersData.filter(t => t.status === 'submitted').length,
        approved: tendersData.filter(t => t.status === 'approved').length,
        verified: tendersData.filter(t => t.status === 'verified').length,
        awarded: tendersData.filter(t => t.status === 'awarded').length,
      };
      const statusData = Object.entries(statusCounts)
        .filter(([_, v]) => v > 0)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

      // ─── Tender timeline (last 7 days) – using BarChart ────────
      const timelineMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        timelineMap[key] = { date: key.slice(5), submitted: 0, approved: 0, awarded: 0 };
      }
      tendersData.forEach(t => {
        if (t.createdAt) {
          const date = new Date(t.createdAt).toISOString().split('T')[0];
          if (timelineMap[date]) {
            if (t.status === 'submitted' || t.status === 'approved' || t.status === 'verified' || t.status === 'awarded') {
              timelineMap[date].submitted += 1;
            }
            if (t.status === 'approved' || t.status === 'verified' || t.status === 'awarded') {
              timelineMap[date].approved += 1;
            }
            if (t.status === 'awarded') {
              timelineMap[date].awarded += 1;
            }
          }
        }
      });
      const timelineData = Object.values(timelineMap);

      // ─── Advertised vs Bidded ─────────────────────────────────────
      const advBidData = [
        { name: 'Advertised', value: advertisedProjectsCount },
        { name: 'Bidded', value: biddedProjectsCount },
      ];

      setStats(newStats);
      setWorkers(workersWithBalance);
      setProjects(projectsData);
      setFundingRequests(fundingData);
      setProcurementOrders(procurementData);
      setSubcontracts(subcontractsData);
      setPayments(completedPayments);
      setAttendance(attendanceData);
      setTopWorkers(top);
      setPaymentTrends(trendData);
      setProjectSpending(spendingData);
      setApprovalRatio(ratio);
      setReportData(report);
      setTenders(tendersData);
      setAdvertisedProjects(advertisedData);
      setBids(bidsData);
      setTenderStatusData(statusData);
      setTenderTimelineData(timelineData);
      setAdvertisedVsBiddedData(advBidData);

      setCached(cacheKey, {
        stats: newStats,
        workers: workersWithBalance,
        projects: projectsData,
        fundingRequests: fundingData,
        procurementOrders: procurementData,
        subcontracts: subcontractsData,
        payments: completedPayments,
        attendance: attendanceData,
        topWorkers: top,
        paymentTrends: trendData,
        projectSpending: spendingData,
        approvalRatio: ratio,
        reportData: report,
        tenders: tendersData,
        advertisedProjects: advertisedData,
        bids: bidsData,
        tenderStatusData: statusData,
        tenderTimelineData: timelineData,
        advertisedVsBiddedData: advBidData,
      });

    } catch (err) {
      console.error('❌ Dashboard processing error:', err);
      setMessage({ type: 'error', text: 'Failed to process dashboard data. Check console.' });
    } finally {
      setLoading(false);
      console.log('✅ Dashboard loading finished');
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await fetchDashboardData(true);
      setMessage({ type: 'success', text: 'Data refreshed successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Refresh failed' });
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser, fetchDashboardData]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      console.log('🚀 Initial load: calling refreshAll');
      refreshAll();
    }
  }, [refreshAll]);

  // ─── Format currency ──────────────────────────────────────────────
  const formatCurrency = useCallback((amount) => {
    if (amount === null || amount === undefined) return 'K 0.00';
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  }, []);

  // ─── Computed values for pay all and stats ──────────────────────
  const pendingWorkers = useMemo(() => workers.filter(w => (w.balance || 0) > 0), [workers]);
  const pendingFundingCount = useMemo(() => fundingRequests.filter(f => f.status === 'pending' || f.status === 'approved').length, [fundingRequests]);
  const approvedFundingCount = useMemo(() => fundingRequests.filter(f => f.status === 'approved').length, [fundingRequests]);

  const workersByProject = useMemo(() => {
    const groups = {};
    workers.forEach(w => {
      const projectId = w.project?._id || w.project;
      if (projectId) {
        const project = projects.find(p => p._id === projectId);
        const key = projectId.toString();
        if (!groups[key]) {
          groups[key] = { projectName: project?.name || 'Unknown Project', workers: [] };
        }
        groups[key].workers.push(w);
      } else {
        if (!groups['unassigned']) {
          groups['unassigned'] = { projectName: 'Unassigned', workers: [] };
        }
        groups['unassigned'].workers.push(w);
      }
    });
    return groups;
  }, [workers, projects]);

  const pendingWorkersCount = pendingWorkers.length;
  const pendingFunding = fundingRequests.filter(f => f.status === 'approved').length;
  const pendingProcurement = procurementOrders.filter(o => o.status === 'approved').length;
  const pendingSubcontracts = subcontracts.filter(s => s.status === 'approved').length;

  // ─── Loading skeleton ────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Typography variant="h4"><Skeleton width={300} /></Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {[1,2,3,4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card><CardContent><Skeleton variant="text" /><Skeleton variant="text" width="60%" /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Accountant Dashboard</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControlLabel
              control={<Switch checked={showCharts} onChange={(e) => setShowCharts(e.target.checked)} />}
              label="Show Charts"
            />
            <FormControlLabel
              control={<Switch checked={showTenderCharts} onChange={(e) => setShowTenderCharts(e.target.checked)} />}
              label="Tender Charts"
            />
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={refreshAll}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
        </Box>

        {/* Quick Actions */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Quick Actions</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button component={Link} to="/projects" variant="contained" fullWidth>
                View Projects
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button component={Link} to="/workers" variant="contained" fullWidth>
                View Workers
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button component={Link} to="/funding" variant="contained" fullWidth>
                Funding Requests
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button component={Link} to="/procurement" variant="contained" fullWidth>
                Procurement Orders
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button component={Link} to="/tenders" variant="contained" fullWidth>
                Tenders & RFQs
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button component={Link} to="/advertised-projects" variant="contained" fullWidth>
                Advertised Projects
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <DeliveryNote />

        {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Button variant="contained" color="primary" onClick={() => setSearchOpen(true)}>
            Pay Worker (Airtel Money)
          </Button>
          <Button variant="contained" color="secondary" startIcon={<FilterListIcon />} onClick={handlePayAllOpen}>
            Pay All Pending
          </Button>
          {!user?.mobileMoneyNumber && (
            <Alert severity="warning" sx={{ ml: 2 }}>
              Accountant mobile money number not set.
              <Button size="small" color="inherit" href="/profile" sx={{ ml: 1 }}>
                Update Profile
              </Button>
            </Alert>
          )}
        </Box>

        <Typography variant="caption" display="block" sx={{ mb: 2 }}>
          Total pending: {formatCurrency(stats.totalPendingAmount)} ({pendingWorkersCount} workers, {pendingFunding} funding requests awaiting funding, {pendingProcurement} procurement orders, {pendingSubcontracts} subcontracts)
        </Typography>

        {/* ─── Stats Cards ───────────────────────────────────────────── */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Existing cards */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Workers</Typography>
                <Typography variant="h3">{stats.workers}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>{pendingWorkersCount} pending</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #2196f3' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Projects</Typography>
                <Typography variant="h4" color="#2196f3">{stats.projects}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Total Released</Typography>
                <Typography variant="h4" color="#4caf50">{formatCurrency(stats.totalReleased)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Funding Requests</Typography>
                <Typography variant="h4" color="#ff9800">{stats.fundingRequests}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {pendingFundingCount} awaiting funding ({approvedFundingCount} approved)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #9c27b0' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Visitors</Typography>
                <Typography variant="h4" color="#9c27b0">{stats.visitors}</Typography>
                <Typography variant="caption" color="textSecondary">{stats.todayVisitors} today</Typography>
              </CardContent>
            </Card>
          </Grid>
          {/* ─── New Tender Stats ──────────────────────────────────── */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #e91e63' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Advertised Projects</Typography>
                <Typography variant="h4" color="#e91e63">{stats.advertisedProjects}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #00bcd4' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Bidded Projects</Typography>
                <Typography variant="h4" color="#00bcd4">{stats.biddedProjects}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #ff5722' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Tenders (Draft)</Typography>
                <Typography variant="h4" color="#ff5722">{stats.tendersDraft}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Tenders (Submitted)</Typography>
                <Typography variant="h4" color="#ff9800">{stats.tendersSubmitted}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Tenders (Approved)</Typography>
                <Typography variant="h4" color="#4caf50">{stats.tendersApproved}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #2196f3' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Tenders (Verified)</Typography>
                <Typography variant="h4" color="#2196f3">{stats.tendersVerified}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #9c27b0' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Tenders (Awarded)</Typography>
                <Typography variant="h4" color="#9c27b0">{stats.tendersAwarded}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ─── Charts ────────────────────────────────────────────────── */}
        {showCharts && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {paymentTrends.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Payment Trends</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={paymentTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => `K${value.toLocaleString()}`} />
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="amount" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            )}
            {projectSpending.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Spending by Project</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={projectSpending}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `K${value.toLocaleString()}`} />
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            )}
            {approvalRatio.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Funding Approval Ratio</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={approvalRatio}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {approvalRatio.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value} requests`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            )}
            {topWorkers.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Top Workers (Earnings)</Typography>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Worker</TableCell><TableCell>Total Earned</TableCell></TableRow></TableHead>
                    <TableBody>
                      {topWorkers.map(w => (
                        <TableRow key={w.name}>
                          <TableCell>{w.name}</TableCell>
                          <TableCell>{formatCurrency(w.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        {/* ─── Tender Charts ────────────────────────────────────────── */}
        {showTenderCharts && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {tenderStatusData.length > 0 && (
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Tenders by Status</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={tenderStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {tenderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={TENDER_COLORS[index % TENDER_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value} tenders`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            )}
            {tenderTimelineData.length > 0 && (
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Tender Status Timeline (Last 7 Days)</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={tenderTimelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="submitted" fill="#ff9800" name="Submitted" />
                      <Bar dataKey="approved" fill="#4caf50" name="Approved" />
                      <Bar dataKey="awarded" fill="#9c27b0" name="Awarded" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            )}
            {advertisedVsBiddedData.length > 0 && (
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Advertised vs Bidded</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={advertisedVsBiddedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => `${value} projects`} />
                      <Legend />
                      <Bar dataKey="value" fill="#e91e63" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        {/* ─── Projects Table ────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Projects by Creator</Typography>
            <Button component={Link} to="/projects" size="small">View All</Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Budget</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.slice(0, 5).map(p => (
                <TableRow key={p._id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.location || '—'}</TableCell>
                  <TableCell><Chip label={p.status} size="small" color={p.status === 'active' ? 'success' : 'default'} /></TableCell>
                  <TableCell>{formatCurrency(p.budget)}</TableCell>
                  <TableCell>{p.createdBy?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Button component={Link} to={`/projects/${p._id}`} size="small" variant="outlined">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* ─── Workers by Project ────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Workers by Project</Typography>
            <Button component={Link} to="/workers" size="small">View All</Button>
          </Box>
          {Object.entries(workersByProject).length === 0 ? (
            <Typography variant="body2" color="textSecondary">No workers enrolled.</Typography>
          ) : (
            Object.entries(workersByProject).map(([key, group]) => (
              <Box key={key} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', pb: 1, mb: 1 }}>
                  {group.projectName} ({group.workers.length})
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>NRC</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Site</TableCell>
                      <TableCell>Enrolled By</TableCell>
                      <TableCell>Pending</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.workers.map(w => (
                      <TableRow key={w._id}>
                        <TableCell>{w.name}</TableCell>
                        <TableCell>{w.nrc}</TableCell>
                        <TableCell>{w.phone}</TableCell>
                        <TableCell>{w.site || '—'}</TableCell>
                        <TableCell>{w.enrolledBy?.name || 'N/A'}</TableCell>
                        <TableCell>{formatCurrency(w.balance || 0)}</TableCell>
                        <TableCell>
                          <Button component={Link} to={`/workers/${w._id}`} size="small" variant="outlined">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ))
          )}
        </Paper>

        {/* ─── Tenders Table ────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Recent Tenders</Typography>
            <Button component={Link} to="/tenders" size="small">View All</Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenders.slice(0, 5).map(t => (
                <TableRow key={t._id}>
                  <TableCell>{t.referenceNumber}</TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.client}</TableCell>
                  <TableCell>
                    <Chip 
                      label={t.status} 
                      size="small" 
                      color={
                        t.status === 'draft' ? 'default' :
                        t.status === 'submitted' ? 'warning' :
                        t.status === 'approved' ? 'success' :
                        t.status === 'verified' ? 'info' :
                        t.status === 'awarded' ? 'success' : 'default'
                      } 
                    />
                  </TableCell>
                  <TableCell>
                    <Button component={Link} to={`/tenders/${t._id}/view`} size="small" variant="outlined" sx={{ mr: 1 }}>
                      View
                    </Button>
                    {t.status === 'submitted' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleApproveTender(t._id)}
                        sx={{ mr: 1 }}
                      >
                        Approve
                      </Button>
                    )}
                    {t.status === 'approved' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="info"
                        onClick={() => handleVerifyTender(t._id)}
                        sx={{ mr: 1 }}
                      >
                        Verify
                      </Button>
                    )}
                    {t.status === 'verified' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={() => handleAwardTender(t._id)}
                        sx={{ mr: 1 }}
                      >
                        Award
                      </Button>
                    )}
                    {t.status === 'awarded' && !t.convertedToProject && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleCreateProjectFromTender(t._id)}
                        sx={{ mr: 1 }}
                      >
                        Create Project
                      </Button>
                    )}
                    {t.convertedToProject && (
                      <Chip label="✅ Project" size="small" color="success" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {tenders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="textSecondary">No tenders found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* ─── Funding Requests Table ────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Funding Requests</Typography>
            <Button component={Link} to="/funding" size="small">View All</Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Recipient Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fundingRequests.slice(0, 5).map(fr => {
                const phone = fr.requestedBy?.mobileMoneyNumber || fr.requestedBy?.phone || 'N/A';
                return (
                  <TableRow key={fr._id}>
                    <TableCell>{fr.project?.name || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(fr.amount)}</TableCell>
                    <TableCell>{phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={fr.status}
                        color={fr.status === 'funded' ? 'info' : fr.status === 'approved' ? 'success' : fr.status === 'rejected' ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{fr.requestedBy?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {fr.status === 'pending' && canApprove && (
                        <>
                          <Button
                            variant="contained"
                            color="info"
                            size="small"
                            onClick={() => handleForwardFunding(fr._id)}
                            sx={{ mr: 1 }}
                          >
                            Forward
                          </Button>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApproveFunding(fr._id)}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleRejectFunding(fr._id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {fr.status === 'approved' && canFund && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<AttachMoneyIcon />}
                          onClick={() => handleFundClick(fr)}
                          sx={{ mr: 1 }}
                        >
                          Fund
                        </Button>
                      )}
                      <Button component={Link} to={`/funding/${fr._id}`} size="small" variant="outlined">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>

        {/* ─── Procurement Orders Table ───────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Procurement Orders (Pending Funding)</Typography>
            <Button component={Link} to="/procurement" size="small">View All</Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {procurementOrders.slice(0, 5).map(o => (
                <TableRow key={o._id}>
                  <TableCell>{o.project?.name}</TableCell>
                  <TableCell>{o.items?.length || 0}</TableCell>
                  <TableCell><Chip label={o.status} color={o.status === 'funded' ? 'success' : o.status === 'procurement_approved' ? 'info' : 'warning'} size="small" /></TableCell>
                  <TableCell>{o.createdBy?.name}</TableCell>
                  <TableCell>
                    <Button component={Link} to={`/procurement/${o._id}`} size="small" variant="outlined" sx={{ mr: 1 }}>
                      View
                    </Button>
                    {o.status === 'procurement_approved' && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleFinalApproveProcurement(o._id)}
                        sx={{ mr: 1 }}
                      >
                        FINAL APPROVE
                      </Button>
                    )}
                    {o.status === 'approved' && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<AttachMoneyIcon />}
                        onClick={() => {
                          setProcurementToFund(o);
                          setProcurementFundOpen(true);
                        }}
                      >
                        Fund
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* ─── Subcontracts Table ────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Subcontracts</Typography>
            <Button component={Link} to="/subcontracts" size="small">View All</Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Contractor</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subcontracts.slice(0, 5).map(s => (
                <TableRow key={s._id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.project?.name || 'N/A'}</TableCell>
                  <TableCell>{s.contractor?.name || s.contractor || 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(s.amount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={s.status}
                      color={s.status === 'funded' ? 'success' : s.status === 'approved' ? 'info' : s.status === 'pending' ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button component={Link} to={`/subcontracts/${s._id}`} size="small" variant="outlined" sx={{ mr: 1 }}>
                      View
                    </Button>
                    {s.status === 'approved' && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<AttachMoneyIcon />}
                        onClick={() => {
                          setSubcontractToFund(s);
                          setSubcontractFundOpen(true);
                        }}
                      >
                        Fund
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {subcontracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="textSecondary">No subcontracts found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* ─── Weekly Report ─────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Weekly Report</Typography>
          {reportData ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">Workers Enrolled</Typography>
                <Typography variant="h5">{reportData.workersEnrolled}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">Projects Created</Typography>
                <Typography variant="h5">{reportData.projectsCreated}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">Payments Made</Typography>
                <Typography variant="h5">{reportData.payments}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">Total Released</Typography>
                <Typography variant="h5">{formatCurrency(reportData.totalAmountReleased)}</Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="textSecondary">No report data available.</Typography>
          )}
        </Paper>

        <WorkerSearch open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleWorkerSelect} />
        {selectedWorker && (
          <PaymentModal open={paymentOpen} onClose={handlePaymentClose} worker={selectedWorker} onSuccess={refreshAll} />
        )}

        {/* ─── Pay All Modal ─────────────────────────────────────────── */}
        <Dialog open={payAllOpen} onClose={() => !payAllProcessing && setPayAllOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Pay All Pending</DialogTitle>
          <DialogContent dividers>
            <Typography variant="subtitle1" gutterBottom>Select categories to include:</Typography>
            <FormGroup row sx={{ mb: 2 }}>
              <FormControlLabel
                control={<Checkbox checked={payAllFilters.workers} onChange={(e) => setPayAllFilters({ ...payAllFilters, workers: e.target.checked })} />}
                label={`Workers (${pendingWorkersCount})`}
              />
              <FormControlLabel
                control={<Checkbox checked={payAllFilters.funding} onChange={(e) => setPayAllFilters({ ...payAllFilters, funding: e.target.checked })} />}
                label={`Funding Requests (${pendingFunding})`}
              />
              <FormControlLabel
                control={<Checkbox checked={payAllFilters.procurement} onChange={(e) => setPayAllFilters({ ...payAllFilters, procurement: e.target.checked })} />}
                label={`Procurement Orders (${pendingProcurement})`}
              />
              <FormControlLabel
                control={<Checkbox checked={payAllFilters.subcontracts} onChange={(e) => setPayAllFilters({ ...payAllFilters, subcontracts: e.target.checked })} />}
                label={`Subcontracts (${pendingSubcontracts})`}
              />
            </FormGroup>

            <Divider sx={{ my: 2 }} />

            {payAllItems.length === 0 ? (
              <Typography variant="body2" color="textSecondary">No pending items match the selected filters.</Typography>
            ) : (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Summary – Total: {formatCurrency(payAllTotal)} ({payAllItems.length} items)
                  {payAllItems.some(item => !item.phone || item.phone.trim() === '') && (
                    <Chip label="Some phone numbers missing" color="warning" size="small" sx={{ ml: 1 }} />
                  )}
                </Typography>
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {payAllItems.map((item, idx) => {
                    const hasPhone = item.phone && item.phone.trim() !== '';
                    return (
                      <ListItem key={idx} divider>
                        <ListItemText
                          primary={`${item.name} (${item.type})`}
                          secondary={`Amount: ${formatCurrency(item.amount)}`}
                        />
                        <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            size="small"
                            placeholder="Phone number"
                            value={item.phone || ''}
                            onChange={(e) => updatePhoneNumber(idx, e.target.value)}
                            InputProps={{
                              startAdornment: hasPhone ? (
                                <InputAdornment position="start">
                                  <Chip label="✓" color="success" size="small" />
                                </InputAdornment>
                              ) : null,
                            }}
                            sx={{ width: 160 }}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<SkipNextIcon />}
                            onClick={() => skipItem(idx)}
                          >
                            Skip
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              </>
            )}

            {payAllStatus && (
              <Alert severity={payAllStatus.type} sx={{ mt: 2 }}>{payAllStatus.message}</Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPayAllOpen(false)} disabled={payAllProcessing}>Cancel</Button>
            <Button
              variant="contained"
              color="success"
              onClick={handlePayAllConfirm}
              disabled={payAllProcessing || payAllItems.length === 0}
              startIcon={<AttachMoneyIcon />}
            >
              {payAllProcessing ? 'Processing...' : `Pay All (${formatCurrency(payAllTotal)})`}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── Funding Request Modal ───────────────────────────────────── */}
        <Dialog open={fundModalOpen} onClose={() => setFundModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Fund Request</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              You are about to fund <strong>{fundRequesterName}</strong> for <strong>{formatCurrency(fundAmount)}</strong>.
            </Typography>
            <TextField
              label="Recipient Phone Number (Airtel Money)"
              fullWidth
              margin="normal"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="e.g., 0971234567"
              helperText="This is the phone number that will receive the funds."
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFundModalOpen(false)}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleFundConfirm}>
              Confirm & Send Money
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── Procurement Funding Modal ────────────────────────────────── */}
        <Dialog open={procurementFundOpen} onClose={() => setProcurementFundOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Fund Procurement Order</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              You are about to fund procurement order <strong>{procurementToFund?.orderNumber || procurementToFund?._id?.slice(-6)}</strong> for <strong>{formatCurrency(procurementToFund?.grandTotal || procurementToFund?.total || 0)}</strong>.
            </Typography>
            <TextField
              label="Recipient Phone Number (Airtel Money)"
              fullWidth
              margin="normal"
              value={procurementToFund?.recipientPhone || ''}
              onChange={(e) => setProcurementToFund({ ...procurementToFund, recipientPhone: e.target.value })}
              placeholder="e.g., 0971234567"
              helperText="This is the phone number that will receive the funds."
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProcurementFundOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                if (!procurementToFund?.recipientPhone) {
                  alert('Please enter the recipient\'s phone number.');
                  return;
                }
                await handleFundProcurement(procurementToFund._id, procurementToFund.recipientPhone);
                setProcurementFundOpen(false);
              }}
            >
              Confirm & Send Money
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── Subcontract Funding Modal ─────────────────────────────────── */}
        <Dialog open={subcontractFundOpen} onClose={() => setSubcontractFundOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Fund Subcontract</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              You are about to fund <strong>{subcontractToFund?.vendor}</strong> for <strong>{formatCurrency(subcontractToFund?.amount)}</strong>.
            </Typography>
            <TextField
              label="Vendor Phone (Airtel Money)"
              fullWidth
              margin="normal"
              value={subcontractToFund?.vendorPhone || ''}
              onChange={(e) => setSubcontractToFund({ ...subcontractToFund, vendorPhone: e.target.value })}
              placeholder="e.g., 0971234567"
              helperText="This is the phone number that will receive the funds."
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSubcontractFundOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                if (!subcontractToFund?.vendorPhone) {
                  alert('Please enter the vendor\'s phone number.');
                  return;
                }
                await handleFundSubcontract(subcontractToFund._id, subcontractToFund.vendorPhone);
                setSubcontractFundOpen(false);
              }}
            >
              Confirm & Send Money
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ErrorBoundary>
  );
};

export default AccountantDashboard;