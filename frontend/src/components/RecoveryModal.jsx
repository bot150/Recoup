import React, { useEffect, useState } from 'react';

import {
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Info,
} from 'lucide-react';

import {
  formatIndianCurrency,
  formatProbability,
} from '../services/formatters';


// ============================================================
// BACKEND
// ============================================================

const API_BASE_URL = 'http://127.0.0.1:8000';


// ============================================================
// RECOVERY MODAL
// ============================================================

export default function RecoveryModal({
  payment,
  onClose,
  onComplete,
}) {

  const [currentStep, setCurrentStep] =
    useState(1);

  const [isExecuting, setIsExecuting] =
    useState(true);

  const [result, setResult] =
    useState(null);

  const [error, setError] =
    useState(null);


  // ==========================================================
  // EXECUTE RECOVERY
  // ==========================================================

  useEffect(() => {

    if (!payment?.payment_id) {
      return;
    }


    let mounted = true;

    // --------------------------------------------------------
    // Step progression
    // --------------------------------------------------------

    const step2Timer = setTimeout(() => {

      if (mounted) {
        setCurrentStep(2);
      }

    }, 700);


    const step3Timer = setTimeout(() => {

      if (mounted) {
        setCurrentStep(3);
      }

    }, 1400);


    const step4Timer = setTimeout(() => {

      if (mounted) {
        setCurrentStep(4);
      }

    }, 2100);


    const step5Timer = setTimeout(() => {

      if (mounted) {
        setCurrentStep(5);
      }

    }, 2800);


    // --------------------------------------------------------
    // REAL BACKEND CALL
    // --------------------------------------------------------

    const executeRecovery = async () => {

      try {

        console.log(
          '[Recoup] Executing recovery:',
          payment.payment_id
        );


        const response = await fetch(
          `${API_BASE_URL}/api/recover/${payment.payment_id}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );


        if (!response.ok) {

          throw new Error(
            `Recovery API returned ${response.status}`
          );

        }


        const data =
          await response.json();


        console.log(
          '[Recoup] Recovery response:',
          data
        );


        if (!mounted) {
          return;
        }


        // ----------------------------------------------------
        // Backend result
        // ----------------------------------------------------

        const backendResult =
          data?.result || data;


        setResult({
          recovered:
            backendResult?.outcome === 'RECOVERED' ||
            backendResult?.recovered_amount > 0,

          amount:
            Number(
              backendResult?.recovered_amount || 0
            ),

          action:
            backendResult?.action ||
            'STOP',

          timing:
            backendResult?.timing_hours != null
              ? `+${backendResult.timing_hours}h`
              : 'N/A',

          probability:
            Number(
              backendResult?.probability || 0
            ),

          policyAllowed:
            backendResult?.policy_allowed !== false,

          policyReason:
            backendResult?.policy_reason ||
            'Policy validation completed.',

          secondActionAvailable:
            backendResult?.outcome !== 'RECOVERED' &&
            Number(
              backendResult?.attempt_number || 1
            ) < 2,

          outcome:
            backendResult?.outcome ||
            'UNKNOWN',

          attemptNumber:
            Number(
              backendResult?.attempt_number || 1
            ),

          isLive: true,
        });


        setCurrentStep(5);
        setIsExecuting(false);


      } catch (err) {

        console.error(
          '[Recoup] Recovery execution failed:',
          err
        );


        if (!mounted) {
          return;
        }


        setError(
          err?.message ||
          'Recovery execution failed.'
        );

        setCurrentStep(5);
        setIsExecuting(false);

      }

    };


    executeRecovery();


    // --------------------------------------------------------
    // Cleanup
    // --------------------------------------------------------

    return () => {

      mounted = false;

      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(step4Timer);
      clearTimeout(step5Timer);

    };

  }, [payment]);


  // ==========================================================
  // NO PAYMENT
  // ==========================================================

  if (!payment) {
    return null;
  }


  // ==========================================================
  // STEPS
  // ==========================================================

  const stepsList = [

    {
      num: 1,
      label: 'Predicting recovery probability',
    },

    {
      num: 2,
      label: 'Evaluating action + timing combinations',
    },

    {
      num: 3,
      label: 'Checking policy guardrails',
    },

    {
      num: 4,
      label: 'Executing recovery action',
    },

    {
      num: 5,
      label: 'Recording audit',
    },

  ];


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      className="modal-overlay"
      onClick={onClose}
    >

      <div
        className="recovery-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="modal-header">

          <div className="modal-title-group">

            <span className="modal-eyebrow">
              RECOUP AGENT WORKFLOW
            </span>

            <h2>
              Executing Recovery for{' '}
              {payment.payment_id}
            </h2>

          </div>


          <button
            className="close-modal-btn"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            <X size={18} />
          </button>

        </div>


        {/* ==================================================
            LIVE NOTICE
        ================================================== */}

        <div className="demo-notice-banner">

          <Info size={14} />

          <span>
            Live Recoup Agent — ML decision,
            policy validation and audit logging
          </span>

        </div>


        {/* ==================================================
            STEP PROGRESS
        ================================================== */}

        <div className="execution-steps-container">

          {stepsList.map((step) => {

            const isDone =
              !isExecuting ||
              currentStep > step.num;

            const isCurrent =
              isExecuting &&
              currentStep === step.num;


            return (

              <div
                key={step.num}
                className={
                  `step-progress-row ${
                    isDone
                      ? 'done'
                      : isCurrent
                        ? 'running'
                        : 'pending'
                  }`
                }
              >

                <div className="step-indicator-cell">

                  {isDone ? (

                    <CheckCircle2
                      size={18}
                      className="check-icon"
                    />

                  ) : isCurrent ? (

                    <Loader2
                      size={18}
                      className="spin-icon"
                    />

                  ) : (

                    <span className="step-num-dot">
                      {step.num}
                    </span>

                  )}

                </div>


                <div className="step-label-cell">

                  <strong>
                    Step {step.num}:
                  </strong>{' '}

                  {step.label}

                </div>


                <div className="step-status-cell">

                  {isDone ? (

                    <span className="badge-complete">
                      ✓ Complete
                    </span>

                  ) : isCurrent ? (

                    <span className="badge-running">
                      Processing...
                    </span>

                  ) : (

                    <span className="badge-queued">
                      Queued
                    </span>

                  )}

                </div>

              </div>

            );

          })}

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div
            className="execution-result-card failure"
            style={{
              marginTop: '18px',
            }}
          >

            <div className="result-header">

              <div className="result-status-title">

                <AlertCircle
                  size={24}
                  className="amber-icon"
                />

                <div>

                  <h3>
                    RECOVERY EXECUTION FAILED
                  </h3>

                  <span className="result-subtext">
                    The backend could not complete
                    this recovery action.
                  </span>

                </div>

              </div>

            </div>


            <div className="second-action-notice">

              <Info size={14} />

              <span>
                {error}
              </span>

            </div>

          </div>

        )}


        {/* ==================================================
            SUCCESS / RESULT
        ================================================== */}

        {!isExecuting &&
          result &&
          !error && (

          <div
            className={
              `execution-result-card ${
                result.recovered
                  ? 'success'
                  : 'failure'
              }`
            }
          >

            {/* ------------------------------------------------
                RESULT HEADER
            ------------------------------------------------ */}

            <div className="result-header">

              <div className="result-status-title">

                {result.recovered ? (

                  <CheckCircle2
                    size={24}
                    className="green-icon"
                  />

                ) : (

                  <AlertCircle
                    size={24}
                    className="amber-icon"
                  />

                )}


                <div>

                  <h3>

                    {result.recovered
                      ? 'RECOVERY COMPLETED'
                      : 'RECOVERY NOT COMPLETED'}

                  </h3>


                  <span className="result-subtext">

                    {result.recovered

                      ? 'Payment successfully recovered'

                      : 'No amount recovered on this attempt'}

                  </span>

                </div>

              </div>


              {result.recovered && (

                <div className="recovered-amount-display">

                  {formatIndianCurrency(
                    result.amount,
                    false
                  )}

                </div>

              )}

            </div>


            {/* ------------------------------------------------
                RESULT DETAILS
            ------------------------------------------------ */}

            <div className="result-details-grid">


              <div className="result-detail-box">

                <span className="detail-label">
                  Action Executed
                </span>

                <strong className="detail-val">
                  {result.action}
                </strong>

              </div>


              <div className="result-detail-box">

                <span className="detail-label">
                  Timing Horizon
                </span>

                <strong className="detail-val">
                  {result.timing}
                </strong>

              </div>


              <div className="result-detail-box">

                <span className="detail-label">
                  Recovery Probability
                </span>

                <strong className="detail-val">

                  {formatProbability(
                    result.probability
                  )}

                </strong>

              </div>


              <div className="result-detail-box">

                <span className="detail-label">
                  Policy Guardrail
                </span>

                <strong className="detail-val green">

                  <ShieldCheck
                    size={14}
                  />

                  {result.policyAllowed
                    ? 'Allowed'
                    : 'Blocked'}

                </strong>

              </div>

            </div>


            {/* ------------------------------------------------
                SECOND ACTION
            ------------------------------------------------ */}

            {!result.recovered &&
              result.secondActionAvailable && (

              <div className="second-action-notice">

                <Sparkles
                  size={14}
                />

                <span>
                  Second bounded action available.
                  Recoup will re-evaluate after
                  the 6h cooldown.
                </span>

              </div>

            )}

          </div>

        )}


        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="modal-footer">

          <button
            className="btn-secondary"
            onClick={onClose}
            type="button"
          >
            {isExecuting
              ? 'Cancel'
              : 'Close'}
          </button>


          {!isExecuting && (

            <button
              className="btn-primary"
              onClick={() => {

                if (onComplete) {
                  onComplete(result);
                } else {
                  onClose();
                }

              }}
              type="button"
            >
              Done
            </button>

          )}

        </div>

      </div>

    </div>

  );
}