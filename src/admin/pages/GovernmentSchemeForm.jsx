import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSchemes, workerCategories, broaderEligibility, schemeTypes, createEmptyScheme } from '../../contexts/SchemesContext';
import { ArrowLeft, Plus, Minus, Image, X, GripVertical } from 'lucide-react';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import Card from '../../components/ui/Card';
import '../styles/GovernmentSchemes.css';

export default function AdminSchemeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { getUser } = useAuth();
  const { t } = useLanguage();
  const { getSchemeById, addScheme, updateScheme } = useSchemes();
  const admin = getUser();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(() => {
    if (isEdit) {
      const existing = getSchemeById(id);
      return existing || createEmptyScheme(admin?.id, admin?.communityId);
    }
    return createEmptyScheme(admin?.id, admin?.communityId);
  });

  const update = (field) => (value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleCategory = (catId) => {
    setForm(prev => ({
      ...prev,
      targetCategories: prev.targetCategories.includes(catId)
        ? prev.targetCategories.filter(c => c !== catId)
        : [...prev.targetCategories, catId],
    }));
  };

  const toggleCriteria = (critId) => {
    setForm(prev => ({
      ...prev,
      eligibilityCriteria: prev.eligibilityCriteria.includes(critId)
        ? prev.eligibilityCriteria.filter(c => c !== critId)
        : [...prev.eligibilityCriteria, critId],
    }));
  };

  /* ── Documents ── */
  const addDocument = () => {
    setForm(prev => ({
      ...prev,
      requiredDocuments: [...prev.requiredDocuments, { name: '', description: '' }],
    }));
  };

  const updateDocument = (index, field, value) => {
    setForm(prev => {
      const docs = [...prev.requiredDocuments];
      docs[index] = { ...docs[index], [field]: value };
      return { ...prev, requiredDocuments: docs };
    });
  };

  const removeDocument = (index) => {
    setForm(prev => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter((_, i) => i !== index),
    }));
  };

  /* ── Benefits ── */
  const addBenefit = () => {
    setForm(prev => ({
      ...prev,
      benefits: [...prev.benefits, { title: '', description: '' }],
    }));
  };

  const updateBenefit = (index, field, value) => {
    setForm(prev => {
      const bens = [...prev.benefits];
      bens[index] = { ...bens[index], [field]: value };
      return { ...prev, benefits: bens };
    });
  };

  const removeBenefit = (index) => {
    setForm(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  /* ── Cover Image ── */
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, coverImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, coverImage: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Save ── */
  const handleSave = (publishAfterSave = false) => {
    const schemeData = {
      ...form,
      status: publishAfterSave ? 'published' : form.status || 'draft',
      createdByAdminId: admin?.id,
      communityId: admin?.communityId,
    };

    if (isEdit) {
      updateScheme(id, schemeData);
    } else {
      addScheme(schemeData);
    }
    navigate('/admin/schemes');
  };

  return (
    <div className="admin-page animate-fade-in">
      {/* Header */}
      <div className="admin-page__header">
        <div className="admin-page__header-left">
          <button className="admin-page__back" onClick={() => navigate('/admin/schemes')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="admin-page__title">{isEdit ? t('editScheme') : t('addNewScheme')}</h1>
            <p className="admin-page__subtitle">{t('governmentPrograms')}</p>
          </div>
        </div>
      </div>

      <div className="scheme-form">
        {/* ── Section: Basic Information ── */}
        <div className="scheme-form__section">
          <h2 className="scheme-form__section-title">{t('basicInformation')}</h2>
          <TextField label={t('schemeName')} value={form.schemeName} onChange={update('schemeName')} placeholder="Enter the official scheme name" name="schemeName" required />
          <TextField label={t('shortDescription')} value={form.shortDescription} onChange={update('shortDescription')} placeholder="Brief summary of the scheme (1–2 sentences)" name="shortDesc" maxLength={200} />
          <TextField label={t('fullDescription')} value={form.fullDescription} onChange={update('fullDescription')} placeholder="Detailed description of the government scheme..." name="fullDesc" multiline rows={5} />
          <div className="scheme-form__row">
            <TextField label={t('department')} value={form.department} onChange={update('department')} placeholder="e.g. Ministry of Labour & Employment" name="department" />
            <div>
              <label className="form-label">{t('schemeType')}</label>
              <select className="form-select" value={form.schemeType} onChange={(e) => update('schemeType')(e.target.value)}>
                <option value="">Select type...</option>
                {schemeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <TextField label={t('officialUrl')} value={form.officialUrl} onChange={update('officialUrl')} placeholder="https://..." name="officialUrl" />
          <div className="scheme-form__row">
            <TextField label={t('startDate')} value={form.startDate} onChange={update('startDate')} type="date" name="startDate" />
            <TextField label={t('endDate')} value={form.endDate} onChange={update('endDate')} type="date" name="endDate" />
          </div>
        </div>

        {/* ── Section: Cover Image ── */}
        <div className="scheme-form__section">
          <h2 className="scheme-form__section-title">{t('coverImage')}</h2>
          <div className="cover-upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="cover-upload-input"
            />
            <div
              className={`cover-upload__preview ${form.coverImage ? 'cover-upload__preview--has-image' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {form.coverImage ? (
                <img src={form.coverImage} alt="Cover preview" />
              ) : (
                <>
                  <Image size={32} />
                  <span className="text-sm">Click to upload cover photo</span>
                </>
              )}
            </div>
            {form.coverImage && (
              <div className="cover-upload__actions">
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>Replace</Button>
                <Button variant="ghost" size="sm" onClick={removeImage} icon={X}>Remove</Button>
              </div>
            )}
          </div>
        </div>

        {/* ── Section: Eligibility ── */}
        <div className="scheme-form__section">
          <h2 className="scheme-form__section-title">{t('eligibility')}</h2>
          <div>
            <label className="form-label">{t('targetWorkers')}</label>
            <div className="chip-grid">
              {workerCategories.map(cat => (
                <button
                  key={cat.id}
                  className={`chip ${form.targetCategories.includes(cat.id) ? 'chip--selected' : ''}`}
                  onClick={() => toggleCategory(cat.id)}
                  type="button"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">{t('broaderCriteria')}</label>
            <div className="chip-grid">
              {broaderEligibility.map(crit => (
                <button
                  key={crit.id}
                  className={`chip ${form.eligibilityCriteria.includes(crit.id) ? 'chip--selected' : ''}`}
                  onClick={() => toggleCriteria(crit.id)}
                  type="button"
                >
                  {crit.label}
                </button>
              ))}
            </div>
          </div>
          <div className="scheme-form__row">
            <TextField label="Minimum Age" value={form.ageMin} onChange={update('ageMin')} placeholder="e.g. 18" type="number" name="ageMin" />
            <TextField label="Maximum Age" value={form.ageMax} onChange={update('ageMax')} placeholder="e.g. 60" type="number" name="ageMax" />
          </div>
          <TextField label={t('incomeCategory')} value={form.incomeCategory} onChange={update('incomeCategory')} placeholder="e.g. BPL, Annual income below ₹2,00,000" name="incomeCategory" />
          <TextField label={t('otherEligibility')} value={form.otherEligibility} onChange={update('otherEligibility')} placeholder="Any other eligibility conditions..." name="otherEligibility" multiline rows={2} />
          <TextField label={t('eligibilityDescription')} value={form.eligibilityDescription} onChange={update('eligibilityDescription')} placeholder="Describe the actual eligibility requirements as stated by the government scheme..." name="eligDesc" multiline rows={4} />
        </div>

        {/* ── Section: Required Documents ── */}
        <div className="scheme-form__section">
          <h2 className="scheme-form__section-title">{t('requiredDocuments')}</h2>
          <div className="dynamic-list">
            {form.requiredDocuments.map((doc, i) => (
              <div key={i} className="dynamic-list__item">
                <div className="dynamic-list__item-fields">
                  <TextField label={`${t('documentName')} ${i + 1}`} value={doc.name} onChange={(v) => updateDocument(i, 'name', v)} placeholder="e.g. Aadhaar Card" name={`doc-name-${i}`} />
                  <TextField label={t('documentDescription')} value={doc.description} onChange={(v) => updateDocument(i, 'description', v)} placeholder="Additional details..." name={`doc-desc-${i}`} />
                </div>
                <div className="dynamic-list__item-actions">
                  <button className="dynamic-list__remove" onClick={() => removeDocument(i)} title="Remove">
                    <Minus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" icon={Plus} onClick={addDocument}>{t('addDocument')}</Button>
        </div>

        {/* ── Section: Benefits ── */}
        <div className="scheme-form__section">
          <h2 className="scheme-form__section-title">{t('schemeBenefits')}</h2>
          <div className="dynamic-list">
            {form.benefits.map((ben, i) => (
              <div key={i} className="dynamic-list__item">
                <div className="dynamic-list__item-fields">
                  <TextField label={`${t('benefitTitle')} ${i + 1}`} value={ben.title} onChange={(v) => updateBenefit(i, 'title', v)} placeholder="e.g. Monthly Pension" name={`ben-title-${i}`} />
                  <TextField label={t('benefitDescription')} value={ben.description} onChange={(v) => updateBenefit(i, 'description', v)} placeholder="Details of this benefit..." name={`ben-desc-${i}`} multiline rows={2} />
                </div>
                <div className="dynamic-list__item-actions">
                  <button className="dynamic-list__remove" onClick={() => removeBenefit(i)} title="Remove">
                    <Minus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" icon={Plus} onClick={addBenefit}>{t('addBenefit')}</Button>
        </div>

        {/* ── Section: Application Information ── */}
        <div className="scheme-form__section">
          <h2 className="scheme-form__section-title">{t('applicationProcess')}</h2>
          <TextField label={t('applicationProcess')} value={form.applicationProcess} onChange={update('applicationProcess')} placeholder="Describe the application process..." name="appProcess" multiline rows={3} />
          <TextField label={t('applicationInstructions')} value={form.applicationInstructions} onChange={update('applicationInstructions')} placeholder="Step-by-step instructions for workers..." name="appInstructions" multiline rows={3} />
          <TextField label={t('applicationLink')} value={form.applicationLink} onChange={update('applicationLink')} placeholder="https://..." name="appLink" />
          <TextField label={t('contactInfo')} value={form.contactInfo} onChange={update('contactInfo')} placeholder="Helpline number, email, office address..." name="contactInfo" multiline rows={2} />
          <TextField label={t('importantNotes')} value={form.importantNotes} onChange={update('importantNotes')} placeholder="Any important notes or deadlines..." name="importantNotes" multiline rows={2} />
        </div>

        {/* ── Actions ── */}
        <div className="scheme-form__actions">
          <Button variant="secondary" onClick={() => navigate('/admin/schemes')}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => handleSave(false)}>
            {t('saveDraft')}
          </Button>
          <Button onClick={() => handleSave(true)}>
            {t('saveAndPublish')}
          </Button>
        </div>
      </div>
    </div>
  );
}
