import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Check, ArrowRight, ArrowLeft, Send } from 'lucide-react';

export interface IntakeFormContent {
  title?: string;
  subtitle?: string;
}

export function MultiStepIntakeForm(props: StudioComponentProps<IntakeFormContent>) {
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState('residential_villa');
  const [budgetRange, setBudgetRange] = useState('premium');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isRtl = props.direction === 'rtl';

  const defaultTitle = isRtl ? 'שאלון אפיון ותיאום פגישת ייעוץ' : 'Commission Intake & Architectural Brief';
  const defaultSubtitle = isRtl
    ? 'תהליך מובנה בן 3 שלבים להגדרת צורכי הפרויקט והבטחת התאמה מושלמת לסטנדרט הסטודיו.'
    : 'A structured three-stage protocol to define spatial scope, fiscal boundaries, and commission feasibility.';

  const title = props.content?.title || defaultTitle;
  const subtitle = props.content?.subtitle || defaultSubtitle;

  const projectTypes = isRtl
    ? [
        { id: 'residential_villa', label: 'וילה פרטית / מגורי יוקרה' },
        { id: 'penthouse', label: 'פנטהאוז / דירת יוקרה' },
        { id: 'commercial', label: 'משרדים / חלל מסחרי' },
        { id: 'renovation', label: 'שיפוץ אדריכלי מקיף' },
      ]
    : [
        { id: 'residential_villa', label: 'Private Villa / Coastal Estate' },
        { id: 'penthouse', label: 'Urban Penthouse / Residence' },
        { id: 'commercial', label: 'Atelier / Commercial Space' },
        { id: 'renovation', label: 'Structural Metamorphosis' },
      ];

  const budgetTiers = isRtl
    ? [
        { id: 'tier_1', label: '₪500,000 – ₪1,000,000' },
        { id: 'tier_2', label: '₪1,000,000 – ₪2,500,000' },
        { id: 'tier_3', label: '₪2,500,000 – ₪5,000,000' },
        { id: 'tier_4', label: 'מעל ₪5,000,000 (Custom)' },
      ]
    : [
        { id: 'tier_1', label: '$250k – $500k' },
        { id: 'tier_2', label: '$500k – $1.2M' },
        { id: 'tier_3', label: '$1.2M – $3M' },
        { id: 'tier_4', label: '$3M+ High Sovereign' },
      ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (props.onAction) {
      props.onAction('form_submit', { projectType, budgetRange, fullName, email, phone });
    }
  };

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: 'var(--studio-section-space) 24px',
          borderBottom: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-bg)',
        }}
      >
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(26px, 3.2vw, 38px)',
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: '0 0 8px 0',
              }}
            >
              {title}
            </h2>
            <p style={{ fontSize: '14.5px', color: 'var(--studio-muted)', margin: 0 }}>
              {subtitle}
            </p>
          </div>

          {/* Stepper Progress */}
          {!submitted && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                paddingBottom: '8px',
              }}
            >
              {[1, 2, 3].map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: s <= step ? 'var(--studio-accent)' : 'var(--studio-surface)',
                      border: '1px solid var(--studio-border)',
                      color: s <= step ? '#111' : 'var(--studio-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {s}
                  </div>
                  <span style={{ fontSize: '12px', color: s === step ? 'var(--studio-text)' : 'var(--studio-muted)', fontWeight: 600 }}>
                    {s === 1 ? (isRtl ? 'סוג הפרויקט' : 'Scope') : s === 2 ? (isRtl ? 'מסגרת תקציב' : 'Budget') : (isRtl ? 'פרטי קשר' : 'Details')}
                  </span>
                  {s < 3 && <span style={{ color: 'var(--studio-border)', margin: '0 8px' }}>—</span>}
                </div>
              ))}
            </div>
          )}

          {/* Form Card */}
          <div
            style={{
              padding: '36px',
              borderRadius: 'var(--studio-radius)',
              border: '1px solid var(--studio-border)',
              backgroundColor: 'var(--studio-surface)',
            }}
          >
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    border: '1px solid #2e7d32',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2e7d32',
                  }}
                >
                  <Check size={28} />
                </div>
                <h3 style={{ fontFamily: 'var(--studio-font-display)', fontSize: '22px', margin: 0, color: 'var(--studio-text)' }}>
                  {isRtl ? 'הפנייה נמסרה בהצלחה לצוות האדריכלים' : 'Commission Brief Successfully Received'}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--studio-muted)', maxWidth: '480px', margin: 0 }}>
                  {isRtl
                    ? 'אנו בוחנים כל פרויקט באופן אישי ומעמיק. שותף מהסטודיו יצור עמך קשר טלפוני תוך 24 שעות לתיאום פגישה מקדימה.'
                    : 'A principal partner will review your architectural parameters and initiate confidential correspondence within 24 hours.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Step 1: Project Type */}
                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--studio-text)', margin: 0 }}>
                      {isRtl ? 'בחר את אופי החלל המבוקש:' : 'Select Primary Commission Scope:'}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-2col">
                      {projectTypes.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setProjectType(t.id)}
                          style={{
                            padding: '16px',
                            borderRadius: 'var(--studio-radius)',
                            border: `1px solid ${projectType === t.id ? 'var(--studio-accent)' : 'var(--studio-border)'}`,
                            backgroundColor: projectType === t.id ? 'var(--studio-bg)' : 'transparent',
                            color: 'var(--studio-text)',
                            fontSize: '13.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{t.label}</span>
                          {projectType === t.id && <Check size={16} color="var(--studio-accent)" />}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end', paddingTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 24px',
                          minHeight: '44px',
                          borderRadius: 'var(--studio-radius)',
                          backgroundColor: 'var(--studio-accent)',
                          color: '#111',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <span>{isRtl ? 'המשך לשלב הבא' : 'Proceed to Budget'}</span>
                        {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Budget */}
                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--studio-text)', margin: 0 }}>
                      {isRtl ? 'הגדרת מסגרת התקציב המשוערת לפרויקט:' : 'Indicate Approximate Fiscal Envelope:'}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-2col">
                      {budgetTiers.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => setBudgetRange(b.id)}
                          style={{
                            padding: '16px',
                            borderRadius: 'var(--studio-radius)',
                            border: `1px solid ${budgetRange === b.id ? 'var(--studio-accent)' : 'var(--studio-border)'}`,
                            backgroundColor: budgetRange === b.id ? 'var(--studio-bg)' : 'transparent',
                            color: 'var(--studio-text)',
                            fontSize: '13.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{b.label}</span>
                          {budgetRange === b.id && <Check size={16} color="var(--studio-accent)" />}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 18px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--studio-border)',
                          borderRadius: 'var(--studio-radius)',
                          color: 'var(--studio-text)',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                        <span>{isRtl ? 'חזור' : 'Back'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 24px',
                          minHeight: '44px',
                          borderRadius: 'var(--studio-radius)',
                          backgroundColor: 'var(--studio-accent)',
                          color: '#111',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <span>{isRtl ? 'המשך לפרטים אישיים' : 'Proceed to Details'}</span>
                        {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Contact Details */}
                {step === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--studio-text)', margin: 0 }}>
                      {isRtl ? 'פרטי התקשרות דיסקרטיים:' : 'Confidential Contact Information:'}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-2col">
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--studio-muted)', marginBottom: '4px' }}>
                          {isRtl ? 'שם מלא' : 'Full Name'}
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: '44px',
                            padding: '8px 12px',
                            backgroundColor: 'var(--studio-bg)',
                            border: '1px solid var(--studio-border)',
                            borderRadius: 'var(--studio-radius)',
                            color: 'var(--studio-text)',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--studio-muted)', marginBottom: '4px' }}>
                          {isRtl ? 'טלפון ישיר' : 'Phone'}
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: '44px',
                            padding: '8px 12px',
                            backgroundColor: 'var(--studio-bg)',
                            border: '1px solid var(--studio-border)',
                            borderRadius: 'var(--studio-radius)',
                            color: 'var(--studio-text)',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--studio-muted)', marginBottom: '4px' }}>
                        {isRtl ? 'דואר אלקטרוני' : 'Email Address'}
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '44px',
                          padding: '8px 12px',
                          backgroundColor: 'var(--studio-bg)',
                          border: '1px solid var(--studio-border)',
                          borderRadius: 'var(--studio-radius)',
                          color: 'var(--studio-text)',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--studio-muted)', marginBottom: '4px' }}>
                        {isRtl ? 'דגשים נוספים או מיקום הנכס (אופציונלי)' : 'Site Location or Brief Notes (Optional)'}
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: 'var(--studio-bg)',
                          border: '1px solid var(--studio-border)',
                          borderRadius: 'var(--studio-radius)',
                          color: 'var(--studio-text)',
                          fontSize: '13px',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 18px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--studio-border)',
                          borderRadius: 'var(--studio-radius)',
                          color: 'var(--studio-text)',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                        <span>{isRtl ? 'חזור' : 'Back'}</span>
                      </button>

                      <button
                        type="submit"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 28px',
                          minHeight: '44px',
                          borderRadius: 'var(--studio-radius)',
                          backgroundColor: 'var(--studio-accent)',
                          color: '#111',
                          border: 'none',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Send size={15} />
                        <span>{isRtl ? 'שליחת שאלון האפיון' : 'Submit Architectural Brief'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
