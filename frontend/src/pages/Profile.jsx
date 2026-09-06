import React from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  CreditCard,
  ShieldCheck,
  Hash,
  LogOut,
} from 'lucide-react';


export default function Profile({
  user,
  onLogout,
}) {

  const metadata =
    user?.user_metadata || {};


  const fullName =
    metadata.full_name ||
    'Not provided';

  const username =
    metadata.username ||
    'Not provided';

  const email =
    user?.email ||
    'Not available';

  const phone =
    metadata.phone ||
    'Not provided';

  const dateOfBirth =
    metadata.date_of_birth ||
    'Not provided';

  const businessName =
    metadata.business_name ||
    'Not provided';

  const bankLast4 =
    metadata.bank_account_last4 ||
    '';


  // ==========================================================
  // CALCULATE AGE
  // ==========================================================

  let age = 'Not available';


  if (dateOfBirth) {

    const birthDate =
      new Date(dateOfBirth);

    const today =
      new Date();

    age =
      today.getFullYear() -
      birthDate.getFullYear();


    const monthDifference =
      today.getMonth() -
      birthDate.getMonth();


    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() <
          birthDate.getDate()
      )
    ) {
      age--;
    }


    age = `${age} years`;

  }


  return (

    <div className="profile-page">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="profile-header">

        <div className="profile-avatar">
          <User size={30} />
        </div>

        <div>

          <span className="profile-eyebrow">
            ACCOUNT
          </span>

          <h1>
            Profile
          </h1>

          <p>
            Manage your Recoup account and merchant details.
          </p>

        </div>

      </div>


      <div className="profile-grid">


        {/* ====================================================
            PERSONAL INFORMATION
        ==================================================== */}

        <section className="profile-card">

          <div className="profile-card-header">

            <div className="profile-card-icon">
              <User size={19} />
            </div>

            <div>

              <h2>
                Personal Information
              </h2>

              <p>
                Your account details
              </p>

            </div>

          </div>


          <div className="profile-details">


            <div className="profile-detail">

              <div className="profile-detail-label">

                <User size={16} />

                <span>
                  Full Name
                </span>

              </div>

              <strong>
                {fullName}
              </strong>

            </div>


            <div className="profile-detail">

              <div className="profile-detail-label">

                <Hash size={16} />

                <span>
                  Username
                </span>

              </div>

              <strong>
                {username !== 'Not provided'
                  ? `@${username}`
                  : username}
              </strong>

            </div>


            <div className="profile-detail">

              <div className="profile-detail-label">

                <Mail size={16} />

                <span>
                  Email
                </span>

              </div>

              <strong>
                {email}
              </strong>

            </div>


            <div className="profile-detail">

              <div className="profile-detail-label">

                <Phone size={16} />

                <span>
                  Phone
                </span>

              </div>

              <strong>
                {phone}
              </strong>

            </div>


            <div className="profile-detail">

              <div className="profile-detail-label">

                <Calendar size={16} />

                <span>
                  Date of Birth
                </span>

              </div>

              <strong>
                {dateOfBirth}
              </strong>

            </div>


            <div className="profile-detail">

              <div className="profile-detail-label">

                <Calendar size={16} />

                <span>
                  Age
                </span>

              </div>

              <strong>
                {age}
              </strong>

            </div>


          </div>

        </section>


        {/* ====================================================
            MERCHANT INFORMATION
        ==================================================== */}

        <section className="profile-card">

          <div className="profile-card-header">

            <div className="profile-card-icon">
              <Building2 size={19} />
            </div>

            <div>

              <h2>
                Merchant Information
              </h2>

              <p>
                Business account details
              </p>

            </div>

          </div>


          <div className="profile-details">


            <div className="profile-detail">

              <div className="profile-detail-label">

                <Building2 size={16} />

                <span>
                  Business Name
                </span>

              </div>

              <strong>
                {businessName}
              </strong>

            </div>


            <div className="profile-detail">

              <div className="profile-detail-label">

                <CreditCard size={16} />

                <span>
                  Bank Account
                </span>

              </div>

              <strong>
                {bankLast4
                  ? `XXXX XXXX ${bankLast4}`
                  : 'Not provided'}
              </strong>

            </div>


            <div className="profile-detail">

              <div className="profile-detail-label">

                <ShieldCheck size={16} />

                <span>
                  Account Status
                </span>

              </div>

              <span className="profile-status">
                ● Active
              </span>

            </div>


          </div>

        </section>


        {/* ====================================================
            SECURITY
        ==================================================== */}

        <section className="profile-card">

          <div className="profile-card-header">

            <div className="profile-card-icon">
              <ShieldCheck size={19} />
            </div>

            <div>

              <h2>
                Security
              </h2>

              <p>
                Authentication and account security
              </p>

            </div>

          </div>


          <div className="profile-details">


            <div className="profile-detail">

              <div className="profile-detail-label">

                <ShieldCheck size={16} />

                <span>
                  Authentication
                </span>

              </div>

              <strong>
                Supabase Auth
              </strong>

            </div>


            <div className="profile-detail">

              <div className="profile-detail-label">

                <Mail size={16} />

                <span>
                  Email Status
                </span>

              </div>

              <span className="profile-status">
                ● Authenticated
              </span>

            </div>


          </div>


          <div className="profile-security-note">

            <ShieldCheck size={16} />

            <span>
              Your account is secured using Supabase authentication.
            </span>

          </div>

        </section>


      </div>


      {/* ======================================================
          LOGOUT
      ====================================================== */}

      <div className="profile-actions">

        <button
          type="button"
          className="profile-logout-btn"
          onClick={onLogout}
        >

          <LogOut size={17} />

          Logout

        </button>

      </div>


    </div>
  );
}