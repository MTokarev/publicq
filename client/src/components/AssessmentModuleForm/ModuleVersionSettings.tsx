import { AssessmentModuleCreateDto } from "../../models/assessment-modules-create";
import FormGroup from "../Shared/FormGroup";

interface Props {
  form: AssessmentModuleCreateDto;
  onChange: (update: Partial<AssessmentModuleCreateDto>) => void;
  touched?: {[key: string]: boolean};
  getFieldError?: (fieldName: string) => string | null;
  onFieldTouch?: (fieldName: string) => void;
}

export const ModuleVersionSettings = ({ form, onChange, touched, getFieldError, onFieldTouch }: Props) => (
  <div style={styles.container}>
    <FormGroup label="Passing Score (%)">
      <input
        type="number"
        min={0}
        max={100}
        value={form.passingScorePercentage}
        onChange={(e) => onChange({ passingScorePercentage: Number(e.target.value) })}
        style={{
          ...styles.input,
          borderColor: touched?.passingScorePercentage && getFieldError?.('passingScorePercentage') ? '#ef4444' : '#d1d5db',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = touched?.passingScorePercentage && getFieldError?.('passingScorePercentage') ? '#ef4444' : '#3b82f6';
        }}
        onBlur={(e) => {
          onFieldTouch?.('passingScorePercentage');
          e.currentTarget.style.borderColor = touched?.passingScorePercentage && getFieldError?.('passingScorePercentage') ? '#ef4444' : '#d1d5db';
        }}
      />
      {touched?.passingScorePercentage && getFieldError?.('passingScorePercentage') && (
        <div style={styles.fieldError}>{getFieldError('passingScorePercentage')}</div>
      )}
    </FormGroup>

    <FormGroup label="Duration (minutes)">
      <input
        type="number"
        min={1}
        value={form.durationInMinutes}
        onChange={(e) => onChange({ durationInMinutes: Number(e.target.value) })}
        style={{
          ...styles.input,
          borderColor: touched?.durationInMinutes && getFieldError?.('durationInMinutes') ? '#ef4444' : '#d1d5db',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = touched?.durationInMinutes && getFieldError?.('durationInMinutes') ? '#ef4444' : '#3b82f6';
        }}
        onBlur={(e) => {
          onFieldTouch?.('durationInMinutes');
          e.currentTarget.style.borderColor = touched?.durationInMinutes && getFieldError?.('durationInMinutes') ? '#ef4444' : '#d1d5db';
        }}
      />
      {touched?.durationInMinutes && getFieldError?.('durationInMinutes') && (
        <div style={styles.fieldError}>{getFieldError('durationInMinutes')}</div>
      )}
    </FormGroup>
  </div>
);

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.25rem',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s ease-in-out',
  },
  fieldError: {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '4px',
    fontWeight: '400',
  },
} as const;


