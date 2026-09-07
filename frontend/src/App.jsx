import React, { useCallback, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import MockCheckout from './pages/MockCheckout';
import './App.css';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import RecoveryModal from './components/RecoveryModal';

// Pages
import CompleteProfile from './pages/CompleteProfile';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Overview from './pages/Overview';
import Recovery from './pages/Recovery';
import AgentDecisions from './pages/AgentDecisions';
import AuditTrail from './pages/AuditTrail';
import Profile from './pages/Profile';

// Auth
import {
  getSession,
  onAuthStateChange,
  signOut,
} from './services/auth';


// ============================================================
// BACKEND URL
// ============================================================

const API_BASE_URL = 'https://recoup-api-953t.onrender.com';


// ============================================================
// LOADING SCREEN
// ============================================================

function LoadingScreen() {
  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-card">

        <div className="auth-loading-logo">
          R
        </div>

        <div className="auth-loading-spinner" />

        <p>Loading Recoup...</p>

      </div>
    </div>
  );
}


// ============================================================
// MAIN APP
// ============================================================

function App() {

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);


  // ==========================================================
  // AUTH INITIALIZATION
  // ==========================================================

  useEffect(() => {

    let mounted = true;

    const initializeAuth = async () => {

      try {

        const currentSession = await getSession();

        if (mounted) {
          setSession(currentSession);
        }

      } catch (error) {

        console.error(
          'Recoup authentication error:',
          error
        );

        if (mounted) {
          setSession(null);
        }

      } finally {

        if (mounted) {
          setAuthLoading(false);
        }

      }
    };


    initializeAuth();


    const authListener =
      onAuthStateChange(
        (_event, newSession) => {

          if (!mounted) {
            return;
          }

          setSession(newSession);
          setAuthLoading(false);

        }
      );


    return () => {

      mounted = false;

      try {

        authListener?.data?.subscription?.unsubscribe?.();

      } catch (error) {

        console.error(
          'Auth listener cleanup error:',
          error
        );

      }

    };

  }, []);


  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (authLoading) {
    return <LoadingScreen />;
  }


  // ==========================================================
  // ROUTES
  // ==========================================================

  return (
    <BrowserRouter>

      <Routes>

        {/* ==================================================
            PUBLIC HOME
        ================================================== */}

        <Route
          path="/"
          element={
            session ? (
              <Navigate
                to="/overview"
                replace
              />
            ) : (
              <Home />
            )
          }
        />


        {/* ==================================================
            LOGIN
        ================================================== */}

        <Route
          path="/login"
          element={
            session ? (
              <Navigate
                to="/overview"
                replace
              />
            ) : (
              <Login />
            )
          }
        />


        {/* ==================================================
            SIGNUP
        ================================================== */}

        <Route
          path="/signup"
          element={
            session ? (
              <Navigate
                to="/overview"
                replace
              />
            ) : (
              <Signup />
            )
          }
        />


        {/* ==================================================
            DEMO CHECKOUT

            IMPORTANT:
            This MUST come before path="/*"
        ================================================== */}

        <Route
          path="/checkout"
          element={
            session ? (
              <MockCheckout />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />


        {/* ==================================================
            PROTECTED DASHBOARD
        ================================================== */}
        <Route
  path="/complete-profile"
  element={
    session ? (
      <CompleteProfile
  user={session.user}
  onProfileUpdated={setSession}
/>
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>

        <Route
          path="/*"
          element={
            session ? (
              <Dashboard
                session={session}
                setSession={setSession}
              />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard({
  session,
  setSession,
}) {

  const navigate = useNavigate();
  const location = useLocation();
    // ==========================================================
  // GOOGLE / NEW USER PROFILE CHECK
  // ==========================================================

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const metadata = session.user.user_metadata || {};

    const profileComplete =
      Boolean(metadata.full_name) &&
      Boolean(metadata.username) &&
      Boolean(metadata.phone) &&
      Boolean(metadata.date_of_birth) &&
      Boolean(metadata.business_name) &&
      Boolean(metadata.bank_account_last4);

    if (
      !profileComplete &&
      location.pathname !== '/complete-profile'
    ) {
      navigate('/complete-profile', {
        replace: true,
      });
    }
  }, [session, location.pathname, navigate]);


  // ==========================================================
  // DATA
  // ==========================================================

  const [payments, setPayments] = useState([]);

  const [evaluation, setEvaluation] = useState([]);

  const [auditRecords, setAuditRecords] = useState([]);

  const [summary, setSummary] = useState(null);


  // ==========================================================
  // UI
  // ==========================================================

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [apiError, setApiError] =
    useState('');

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);


  // ==========================================================
  // ACTIVE TAB
  // ==========================================================

  let activeTab = 'overview';

  if (location.pathname.startsWith('/recovery')) {
    activeTab = 'recovery';
  }

  if (location.pathname.startsWith('/agent-decisions')) {
    activeTab = 'decisions';
  }

  if (location.pathname.startsWith('/audit-trail')) {
    activeTab = 'audit';
  }

  if (location.pathname.startsWith('/profile')) {
    activeTab = 'profile';
  }


  // ==========================================================
  // LOAD DASHBOARD DATA
  // ==========================================================

  const loadData = useCallback(
    async (initial = false) => {

      try {

        if (initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setApiError('');


        const [
          paymentsResponse,
          evaluationResponse,
          auditResponse,
          summaryResponse,
        ] = await Promise.all([

          fetch(
            `${API_BASE_URL}/api/payments`
          ),

          fetch(
            `${API_BASE_URL}/api/evaluation`
          ),

          fetch(
            `${API_BASE_URL}/api/audit`
          ),

          fetch(
            `${API_BASE_URL}/api/summary`
          ),

        ]);


        if (!paymentsResponse.ok) {
          throw new Error(
            'Payments API unavailable'
          );
        }

        if (!evaluationResponse.ok) {
          throw new Error(
            'Evaluation API unavailable'
          );
        }

        if (!auditResponse.ok) {
          throw new Error(
            'Audit API unavailable'
          );
        }

        if (!summaryResponse.ok) {
          throw new Error(
            'Summary API unavailable'
          );
        }


        const paymentsData =
          await paymentsResponse.json();

        const evaluationData =
          await evaluationResponse.json();

        const auditData =
          await auditResponse.json();

        const summaryData =
          await summaryResponse.json();


        // ----------------------------------------------------
        // Payments
        // ----------------------------------------------------

        setPayments(
          Array.isArray(
            paymentsData?.payments
          )
            ? paymentsData.payments
            : []
        );


        // ----------------------------------------------------
        // Evaluation
        // ----------------------------------------------------

        setEvaluation(
          Array.isArray(
            evaluationData?.evaluation
          )
            ? evaluationData.evaluation
            : []
        );


        // ----------------------------------------------------
        // Audit
        // ----------------------------------------------------

        setAuditRecords(
          Array.isArray(
            auditData?.audit
          )
            ? auditData.audit
            : []
        );


        // ----------------------------------------------------
        // Summary
        // ----------------------------------------------------

        setSummary(
          summaryData || null
        );

      } catch (error) {

        console.error(
          'Recoup API error:',
          error
        );

        setApiError(
          error?.message ||
          'Could not connect to backend.'
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    },
    []
  );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadData(true);

  }, [loadData]);


  // ==========================================================
  // SIDEBAR NAVIGATION
  // ==========================================================

  const handleTabChange = (tab) => {

    setMobileSidebarOpen(false);


    if (tab === 'overview') {
      navigate('/overview');
      return;
    }


    if (tab === 'recovery') {
      navigate('/recovery');
      return;
    }


    if (tab === 'decisions') {
      navigate('/agent-decisions');
      return;
    }


    if (tab === 'audit') {
      navigate('/audit-trail');
      return;
    }


    if (tab === 'profile') {
      navigate('/profile');
      return;
    }


    navigate('/overview');

  };


  // ==========================================================
  // PAYMENT SELECTION
  // ==========================================================

  const handleSelectPayment = (payment) => {

    setSelectedPayment(payment);

  };


  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const handleCloseModal = () => {

    setSelectedPayment(null);

  };


  // ==========================================================
  // RECOVERY COMPLETE
  // ==========================================================

  const handleRecoveryComplete = async (result) => {

    console.log(
      'Recovery result:',
      result
    );

    setSelectedPayment(null);

    await loadData(false);

  };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = async () => {

    try {

      await signOut();

      setSession(null);

      setSelectedPayment(null);

      navigate(
        '/',
        {
          replace: true,
        }
      );

    } catch (error) {

      console.error(
        'Logout error:',
        error
      );

    }

  };


  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = () => {

    loadData(false);

  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return <LoadingScreen />;
  }


  // ==========================================================
  // DASHBOARD
  // ==========================================================

  return (
    <div className="app">


      {/* ====================================================
          SIDEBAR
      ==================================================== */}

      <Sidebar

        activeTab={activeTab}

        setActiveTab={handleTabChange}

        mobileOpen={mobileSidebarOpen}

        setMobileOpen={setMobileSidebarOpen}

        onOpenSearch={() => {}}

        onProfile={() => {
          navigate('/profile');
        }}

        onLogout={handleLogout}

      />


      {/* ====================================================
          MAIN
      ==================================================== */}

      <div className="main-wrapper">


        {/* ==================================================
            HEADER
        ================================================== */}

        <Header

          activeTab={activeTab}

          onRefresh={handleRefresh}

          refreshing={refreshing}

        />


        {/* ==================================================
            API ERROR
        ================================================== */}

        {apiError && (

          <div className="api-error-banner">

            <span>
              Backend: {apiError}
            </span>

            <button
              type="button"
              onClick={handleRefresh}
            >
              Retry
            </button>

          </div>

        )}


        {/* ==================================================
            CONTENT
        ================================================== */}

        <main className="main-content">

          <Routes>


            {/* =================================================
                OVERVIEW
            ================================================= */}

            <Route
              path="/overview"
              element={
                <Overview

                  summary={summary}

                  payments={payments}

                  evaluation={evaluation}

                  audit={auditRecords}

                  auditRecords={auditRecords}

                />
              }
            />


            {/* =================================================
                RECOVERY
            ================================================= */}

            <Route
              path="/recovery"
              element={
                <Recovery

                  payments={payments}

                  onSelectPayment={
                    handleSelectPayment
                  }

                />
              }
            />


            {/* =================================================
                AGENT DECISIONS
            ================================================= */}

            <Route
              path="/agent-decisions"
              element={
                <AgentDecisions

                  evaluation={evaluation}

                  payments={payments}

                  audit={auditRecords}

                  auditRecords={auditRecords}

                />
              }
            />


            {/* =================================================
                AUDIT TRAIL
            ================================================= */}

            <Route
              path="/audit-trail"
              element={
                <AuditTrail

                  audit={auditRecords}

                  auditRecords={auditRecords}

                  onSelectAudit={() => {}}

                />
              }
            />


            {/* =================================================
                PROFILE
            ================================================= */}

            <Route
              path="/profile"
              element={
                <Profile

                  user={session?.user}

                  session={session}

                  onLogout={handleLogout}

                />
              }
            />


            {/* =================================================
                FALLBACK
            ================================================= */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/overview"
                  replace
                />
              }
            />


          </Routes>

        </main>

      </div>


      {/* ====================================================
          RECOVERY MODAL
      ==================================================== */}

      {selectedPayment && (

        <RecoveryModal

          payment={selectedPayment}

          onClose={handleCloseModal}

          onComplete={
            handleRecoveryComplete
          }

        />

      )}

    </div>
  );
}


// ============================================================
// ONLY DEFAULT EXPORT IN THIS FILE
// ============================================================

export default App;