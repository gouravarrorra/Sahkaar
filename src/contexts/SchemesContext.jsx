import { createContext, useContext, useState, useCallback } from 'react';

const SchemesContext = createContext();

const STORAGE_KEY = 'sahkaar-schemes';
const APP_STORAGE_KEY = 'sahkaar-scheme-applications';

function generateId(prefix = 'SCH') {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function loadFromStorage(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

/* ── Worker categories (shared) ── */
export const workerCategories = [
  { id: 'electrician', label: 'Electrician' },
  { id: 'plumber', label: 'Plumber' },
  { id: 'carpenter', label: 'Carpenter' },
  { id: 'painter', label: 'Painter' },
  { id: 'domestic_helper', label: 'Domestic Helper' },
  { id: 'caregiver', label: 'Caregiver' },
  { id: 'driver', label: 'Driver' },
  { id: 'gardener', label: 'Gardener' },
  { id: 'cleaner', label: 'Cleaner' },
  { id: 'technician', label: 'Technician' },
];

export const broaderEligibility = [
  { id: 'all_workers', label: 'All Workers' },
  { id: 'certified', label: 'Certified Workers' },
  { id: 'uncertified', label: 'Uncertified Workers' },
  { id: 'training_required', label: 'Workers Requiring Training' },
];

export const schemeTypes = [
  'Social Security',
  'Skill Development',
  'Financial Assistance',
  'Health & Insurance',
  'Housing',
  'Education',
  'Pension',
  'Employment',
  'Other',
];

/* ── Application status flow ── */
export const applicationStatuses = [
  { id: 'not_applied', label: 'Not Applied' },
  { id: 'application_started', label: 'Application Started' },
  { id: 'documents_pending', label: 'Documents Pending' },
  { id: 'documents_submitted', label: 'Documents Submitted' },
  { id: 'application_submitted', label: 'Application Submitted' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

/* ── Default empty scheme ── */
export function createEmptyScheme(adminId = '', communityId = 'C001') {
  return {
    id: '',
    schemeName: '',
    shortDescription: '',
    fullDescription: '',
    department: '',
    schemeType: '',
    coverImage: '',
    officialUrl: '',
    startDate: '',
    endDate: '',
    eligibilityDescription: '',
    targetCategories: [],
    eligibilityCriteria: [],
    ageMin: '',
    ageMax: '',
    incomeCategory: '',
    otherEligibility: '',
    benefits: [],
    requiredDocuments: [],
    applicationProcess: '',
    applicationInstructions: '',
    applicationLink: '',
    contactInfo: '',
    importantNotes: '',
    status: 'draft',
    createdByAdminId: adminId,
    communityId,
    createdAt: '',
    updatedAt: '',
    isArchived: false,
  };
}

export function SchemesProvider({ children }) {
  const [schemes, setSchemes] = useState(() => loadFromStorage(STORAGE_KEY, []));
  const [applications, setApplications] = useState(() => loadFromStorage(APP_STORAGE_KEY, []));

  const persistSchemes = useCallback((updatedSchemes) => {
    setSchemes(updatedSchemes);
    saveToStorage(STORAGE_KEY, updatedSchemes);
  }, []);

  const persistApplications = useCallback((updatedApps) => {
    setApplications(updatedApps);
    saveToStorage(APP_STORAGE_KEY, updatedApps);
  }, []);

  /* ── Scheme CRUD ── */
  const addScheme = useCallback((schemeData) => {
    const now = new Date().toISOString();
    const newScheme = {
      ...schemeData,
      id: generateId('SCH'),
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    };
    const updated = [...schemes, newScheme];
    persistSchemes(updated);
    return newScheme;
  }, [schemes, persistSchemes]);

  const updateScheme = useCallback((id, updates) => {
    const updated = schemes.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    persistSchemes(updated);
  }, [schemes, persistSchemes]);

  const publishScheme = useCallback((id) => {
    updateScheme(id, { status: 'published' });
  }, [updateScheme]);

  const unpublishScheme = useCallback((id) => {
    updateScheme(id, { status: 'unpublished' });
  }, [updateScheme]);

  const archiveScheme = useCallback((id) => {
    updateScheme(id, { isArchived: true, status: 'unpublished' });
  }, [updateScheme]);

  const deleteScheme = useCallback((id) => {
    // Soft delete — mark as archived and unpublished
    updateScheme(id, { isArchived: true, status: 'unpublished' });
  }, [updateScheme]);

  const hardDeleteScheme = useCallback((id) => {
    const updated = schemes.filter(s => s.id !== id);
    persistSchemes(updated);
    // Also remove associated applications
    const updatedApps = applications.filter(a => a.schemeId !== id);
    persistApplications(updatedApps);
  }, [schemes, applications, persistSchemes, persistApplications]);

  /* ── Scheme queries ── */
  const getSchemeById = useCallback((id) => {
    return schemes.find(s => s.id === id) || null;
  }, [schemes]);

  const getAllSchemes = useCallback((communityId) => {
    if (!communityId) return schemes;
    return schemes.filter(s => s.communityId === communityId);
  }, [schemes]);

  const getPublishedSchemes = useCallback((communityId) => {
    return schemes.filter(s =>
      s.status === 'published' && !s.isArchived &&
      (!communityId || s.communityId === communityId)
    );
  }, [schemes]);

  const getSchemeStats = useCallback((communityId) => {
    const communitySchemes = communityId
      ? schemes.filter(s => s.communityId === communityId)
      : schemes;
    const communityApps = communityId
      ? applications.filter(a => a.communityId === communityId)
      : applications;

    return {
      total: communitySchemes.filter(s => !s.isArchived).length,
      published: communitySchemes.filter(s => s.status === 'published' && !s.isArchived).length,
      draft: communitySchemes.filter(s => s.status === 'draft' && !s.isArchived).length,
      expired: communitySchemes.filter(s => (s.status === 'expired' || s.status === 'unpublished') && !s.isArchived).length,
      archived: communitySchemes.filter(s => s.isArchived).length,
      totalApplications: communityApps.length,
      pendingApplications: communityApps.filter(a =>
        !['approved', 'rejected', 'not_applied'].includes(a.applicationStatus)
      ).length,
    };
  }, [schemes, applications]);

  /* ── Application CRUD ── */
  const createApplication = useCallback((schemeId, workerId, communityId) => {
    // Check if application already exists
    const existing = applications.find(a => a.schemeId === schemeId && a.workerId === workerId);
    if (existing) return existing;

    const now = new Date().toISOString();
    const newApp = {
      id: generateId('APP'),
      schemeId,
      workerId,
      communityId: communityId || 'C001',
      applicationStatus: 'application_started',
      submittedAt: now,
      updatedAt: now,
      adminNotes: '',
    };
    const updated = [...applications, newApp];
    persistApplications(updated);
    return newApp;
  }, [applications, persistApplications]);

  const updateApplicationStatus = useCallback((appId, status, notes) => {
    const updated = applications.map(a =>
      a.id === appId
        ? { ...a, applicationStatus: status, adminNotes: notes ?? a.adminNotes, updatedAt: new Date().toISOString() }
        : a
    );
    persistApplications(updated);
  }, [applications, persistApplications]);

  const getApplicationsForScheme = useCallback((schemeId) => {
    return applications.filter(a => a.schemeId === schemeId);
  }, [applications]);

  const getApplicationsForWorker = useCallback((workerId) => {
    return applications.filter(a => a.workerId === workerId);
  }, [applications]);

  const getApplication = useCallback((schemeId, workerId) => {
    return applications.find(a => a.schemeId === schemeId && a.workerId === workerId) || null;
  }, [applications]);

  const getAllApplications = useCallback((communityId) => {
    if (!communityId) return applications;
    return applications.filter(a => a.communityId === communityId);
  }, [applications]);

  /* ── Eligibility Matching (informational only) ── */
  const checkEligibility = useCallback((scheme, worker) => {
    if (!scheme || !worker) return { status: 'unknown', label: 'More Information Required' };

    // Check if scheme targets all workers
    if (scheme.eligibilityCriteria?.includes('all_workers')) {
      return { status: 'eligible', label: 'Potentially Eligible' };
    }

    // Check category match
    const workerSkills = worker.skills || [];
    const targetCategories = scheme.targetCategories || [];
    const categoryMatch = targetCategories.length === 0 ||
      targetCategories.some(cat => workerSkills.includes(cat));

    // Check certification criteria
    const certCriteria = scheme.eligibilityCriteria || [];
    let certMatch = true;
    if (certCriteria.includes('certified')) {
      const hasCert = workerSkills.some(skill => worker.certifications?.[skill]);
      if (!hasCert) certMatch = false;
    }
    if (certCriteria.includes('uncertified')) {
      const allCerted = workerSkills.every(skill => worker.certifications?.[skill]);
      if (allCerted) certMatch = false;
    }

    if (categoryMatch && certMatch) {
      return { status: 'eligible', label: 'Potentially Eligible' };
    }
    if (!categoryMatch) {
      return { status: 'not_eligible', label: 'Eligibility Criteria Not Met' };
    }
    return { status: 'info_needed', label: 'More Information Required' };
  }, []);

  const value = {
    schemes,
    applications,
    addScheme,
    updateScheme,
    publishScheme,
    unpublishScheme,
    archiveScheme,
    deleteScheme,
    hardDeleteScheme,
    getSchemeById,
    getAllSchemes,
    getPublishedSchemes,
    getSchemeStats,
    createApplication,
    updateApplicationStatus,
    getApplicationsForScheme,
    getApplicationsForWorker,
    getApplication,
    getAllApplications,
    checkEligibility,
  };

  return (
    <SchemesContext.Provider value={value}>
      {children}
    </SchemesContext.Provider>
  );
}

export function useSchemes() {
  const context = useContext(SchemesContext);
  if (!context) throw new Error('useSchemes must be used within SchemesProvider');
  return context;
}
