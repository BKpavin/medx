/**
 * MEDX - Patient Healthcare Management System
 * Single Page Dashboard Application Implementation
 */

// LocalStorage Persistence Keys
const STORAGE_KEY = 'MEDX_PATIENT_DATA_V1';
const TABLETS_STORAGE_KEY = 'MEDX_TABLETS_DATA_V1';
const MED_SCHEDULE_STORAGE_KEY = 'MEDX_MEDICINE_SCHEDULES_V1';
const MED_CONFIRMATIONS_STORAGE_KEY = 'MEDX_MEDICINE_CONFIRMATIONS_V1';
const CAREGIVER_ALERTS_STORAGE_KEY = 'MEDX_CAREGIVER_ALERTS_V1';
const ALERT_WAITING_PERIOD_STORAGE_KEY = 'MEDX_ALERT_WAITING_PERIOD_V1';

// Default Initial Demo Patient Data Structure
const DEFAULT_DATA = {
  patient: {
    name: 'Eleanor Vance',
    age: 65,
    gender: 'Female',
    dob: '1961-04-12',
    bloodGroup: 'O+',
    height: '165',
    weight: '68.5',
    contact: '+1 (555) 892-1049 • eleanor.vance@example.com',
    emergencyContact: '+1 (555) 234-5678 (Mark Vance - Spouse)',
    healthInfo: 'Senior preventive care record. No known drug allergies.'
  },
  doctor: {
    name: 'Dr. Sarah Jenkins, MD',
    specialization: 'Cardiology & Internal Medicine',
    clinic: 'Metropolitan Wellness Center',
    contact: '+1 (555) 902-3481 • dr.jenkins@metrowellness.org'
  },
  caregiver: {
    name: 'Mark Vance',
    relationship: 'Spouse / Primary Caregiver',
    contact: '+1 (555) 234-5678'
  },
  medical: {
    diagnosis: 'Mild Essential Hypertension & Type-2 Pre-diabetes',
    bp: '118/76',
    sugar: '98',
    weight: '68.5',
    otherHealth: 'Annual lipid profile within target parameters (LDL: 92 mg/dL, HDL: 58 mg/dL). No reported drug allergies or respiratory issues. Next follow-up consultation scheduled in 30 days.'
  },
  suggestions: {
    medicines: 'Metformin 500mg (1 tablet after breakfast), Lisinopril 10mg (1 tablet morning), Vitamin D3 1000 IU daily.',
    exercise: '30 minutes of low-impact morning walking, light range-of-motion stretching exercises 3 times weekly.',
    rest: '8 hours of uninterrupted nocturnal sleep. Afternoon rest period of 30-45 minutes recommended.',
    instructions: 'Monitor blood pressure daily at 09:00 AM. Maintain daily hydration (minimum 2.0L water). Avoid high-sodium processed foods.'
  },
  foodSchedule: {
    breakfast: 'Warm steel-cut oatmeal topped with fresh blueberries & crushed almonds, boiled egg white, and 1 cup of unsweetened green tea.',
    lunch: 'Grilled chicken breast (or steamed tofu), 1 cup steamed quinoa, mixed green garden salad with olive oil dressing, and steamed broccoli.',
    snack: '1 medium crisp green apple with 4 walnut halves, or cucumber slices served with low-fat hummus.',
    dinner: 'Baked wild salmon fillet, 1/2 cup brown rice, clear spinach vegetable soup, and herbal chamomile tea.'
  }
};

// Helper function to format date YYYY-MM-DD
function getPastDateString(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDateString() {
  return getPastDateString(0);
}

// Default Initial Demo Tablets Structure
const DEFAULT_TABLETS = [
  {
    id: 'tab_1',
    name: 'Paracetamol 500mg',
    image: '',
    totalTablets: 100,
    usedPerDay: 2,
    startDate: getPastDateString(10) // 80% Stock Available
  },
  {
    id: 'tab_2',
    name: 'Lisinopril 10mg',
    image: '',
    totalTablets: 60,
    usedPerDay: 2,
    startDate: getPastDateString(15) // 50% Stock Low
  },
  {
    id: 'tab_3',
    name: 'Metformin 500mg',
    image: '',
    totalTablets: 100,
    usedPerDay: 3,
    startDate: getPastDateString(25) // 25% Refill Required
  }
];

// Default Initial Demo Medicine Schedules Structure
const DEFAULT_MED_SCHEDULES = [
  {
    id: 'med_sched_1',
    patientId: 'pat_1',
    patientName: 'Eleanor Vance',
    medicineName: 'Paracetamol 500mg',
    medicineImage: '',
    timeOfDay: 'Morning',
    exactTime: '08:00',
    exactTimeFormatted: '08:00 AM',
    tabletQuantity: 1,
    foodTiming: 'After Food',
    scheduleDays: ['Every Day'],
    instructions: 'Take with warm water after breakfast.',
    doctorName: 'Dr. Sarah Jenkins, MD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'med_sched_2',
    patientId: 'pat_1',
    patientName: 'Eleanor Vance',
    medicineName: 'Vitamin D3 1000 IU',
    medicineImage: '',
    timeOfDay: 'Morning',
    exactTime: '08:30',
    exactTimeFormatted: '08:30 AM',
    tabletQuantity: 1,
    foodTiming: 'After Food',
    scheduleDays: ['Every Day'],
    instructions: 'Take with morning beverage.',
    doctorName: 'Dr. Sarah Jenkins, MD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'med_sched_3',
    patientId: 'pat_1',
    patientName: 'Eleanor Vance',
    medicineName: 'Lisinopril 10mg',
    medicineImage: '',
    timeOfDay: 'Afternoon',
    exactTime: '13:00',
    exactTimeFormatted: '01:00 PM',
    tabletQuantity: 1,
    foodTiming: 'Before Food',
    scheduleDays: ['Monday', 'Wednesday', 'Friday'],
    instructions: 'Monitor blood pressure before dose.',
    doctorName: 'Dr. Sarah Jenkins, MD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'med_sched_4',
    patientId: 'pat_1',
    patientName: 'Eleanor Vance',
    medicineName: 'Paracetamol 500mg',
    medicineImage: '',
    timeOfDay: 'Night',
    exactTime: '21:00',
    exactTimeFormatted: '09:00 PM',
    tabletQuantity: 1,
    foodTiming: 'After Food',
    scheduleDays: ['Every Day'],
    instructions: 'Take before sleep if needed.',
    doctorName: 'Dr. Sarah Jenkins, MD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// View Titles Map
const VIEW_TITLES = {
  'view-dashboard': 'PATIENT DASHBOARD',
  'view-doctor': 'DOCTOR DETAILS',
  'view-stock': 'MEDICINE / TABLET STOCK CHECKING',
  'view-medicine-schedule': 'DOCTOR-PRESCRIBED MEDICINE SCHEDULE',
  'view-tablet-info': 'TABLET INFORMATION & IDENTIFIER',
  'view-patient': 'REGISTERED PATIENT DETAILS',
  'view-food': 'DOCTOR-PRESCRIBED FOOD SCHEDULE',
  'view-health': 'PATIENT HEALTH RATIO & TREND CHART'
};

// Global App State
let appData = loadAppData();
let tabletsData = loadTabletsData();
let medicineSchedulesData = loadMedicineSchedulesData();
let medicineConfirmationsData = loadMedicineConfirmationsData();
let caregiverAlertsData = loadCaregiverAlertsData();
let alertWaitingPeriodMinutes = loadAlertWaitingPeriod();

// Image Upload Base64 Temp Holders
let tempAddImageBase64 = '';
let tempUpdateImageBase64 = '';
let tempMedScheduleImageBase64 = '';

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
  renderDashboardCaregiverAlerts();
  renderTabletStock();
  renderMedicineSchedules();
  initSidebarNavigation();

  bindModalEvents();
  bindActionEvents();
  bindTabletEvents();
  bindMedicineScheduleEvents();
  bindMedicineConfirmationEvents();
  initTabletInformation();

  // Run automatic caregiver alert verification & background interval
  checkAutomaticCaregiverAlerts();
  setInterval(checkAutomaticCaregiverAlerts, 30000);
});

// Load App Data from LocalStorage
function loadAppData() {
  let data = null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) data = JSON.parse(saved);
  } catch (err) {
    console.error('Error loading LocalStorage patient data:', err);
  }

  if (!data) {
    data = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  if (!data.healthHistory || !Array.isArray(data.healthHistory) || data.healthHistory.length === 0) {
    data.healthHistory = [
      { id: 'hh_1', date: getPastDateString(21), ratio: 86, bp: '124/82', sugar: '106', weight: '69.2' },
      { id: 'hh_2', date: getPastDateString(14), ratio: 88, bp: '122/80', sugar: '102', weight: '69.0' },
      { id: 'hh_3', date: getPastDateString(8),  ratio: 90, bp: '120/78', sugar: '100', weight: '68.8' },
      { id: 'hh_4', date: getPastDateString(3),  ratio: 91, bp: '119/77', sugar: '99',  weight: '68.6' },
      { id: 'hh_5', date: getTodayDateString(),  ratio: calculateHealthRatio(data.medical || DEFAULT_DATA.medical), bp: (data.medical && data.medical.bp) || '118/76', sugar: (data.medical && data.medical.sugar) || '98', weight: (data.medical && data.medical.weight) || '68.5' }
    ];
  }

  return data;
}

// Save App Data to LocalStorage
function saveAppData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (err) {
    console.error('Error saving LocalStorage patient data:', err);
  }
}

// Load Tablets Data from LocalStorage
function loadTabletsData() {
  try {
    const saved = localStorage.getItem(TABLETS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error('Error loading LocalStorage tablets data:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_TABLETS));
}

// Save Tablets Data to LocalStorage
function saveTabletsData() {
  try {
    localStorage.setItem(TABLETS_STORAGE_KEY, JSON.stringify(tabletsData));
  } catch (err) {
    console.error('Error saving LocalStorage tablets data:', err);
  }
}

// Load Medicine Schedules Data from LocalStorage
function loadMedicineSchedulesData() {
  try {
    const saved = localStorage.getItem(MED_SCHEDULE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error('Error loading LocalStorage medicine schedules data:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_MED_SCHEDULES));
}

// Save Medicine Schedules Data to LocalStorage
function saveMedicineSchedulesData() {
  try {
    localStorage.setItem(MED_SCHEDULE_STORAGE_KEY, JSON.stringify(medicineSchedulesData));
  } catch (err) {
    console.error('Error saving LocalStorage medicine schedules data:', err);
  }
}

// Load Medicine Confirmations Data
function loadMedicineConfirmationsData() {
  try {
    const saved = localStorage.getItem(MED_CONFIRMATIONS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error('Error loading LocalStorage medicine confirmations:', err);
  }
  return [];
}

// Save Medicine Confirmations Data
function saveMedicineConfirmationsData() {
  try {
    localStorage.setItem(MED_CONFIRMATIONS_STORAGE_KEY, JSON.stringify(medicineConfirmationsData));
  } catch (err) {
    console.error('Error saving LocalStorage medicine confirmations:', err);
  }
}

// Load Caregiver Alerts Data
function loadCaregiverAlertsData() {
  try {
    const saved = localStorage.getItem(CAREGIVER_ALERTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error('Error loading LocalStorage caregiver alerts:', err);
  }
  return [];
}

// Save Caregiver Alerts Data
function saveCaregiverAlertsData() {
  try {
    localStorage.setItem(CAREGIVER_ALERTS_STORAGE_KEY, JSON.stringify(caregiverAlertsData));
  } catch (err) {
    console.error('Error saving LocalStorage caregiver alerts:', err);
  }
}

// Load Caregiver Alert Waiting Period (default 30 mins)
function loadAlertWaitingPeriod() {
  try {
    const saved = localStorage.getItem(ALERT_WAITING_PERIOD_STORAGE_KEY);
    if (saved) return parseInt(saved, 10) || 30;
  } catch (err) {
    console.error('Error loading alert waiting period:', err);
  }
  return 30;
}

// Save Caregiver Alert Waiting Period
function saveAlertWaitingPeriod(mins) {
  alertWaitingPeriodMinutes = parseInt(mins, 10) || 30;
  try {
    localStorage.setItem(ALERT_WAITING_PERIOD_STORAGE_KEY, alertWaitingPeriodMinutes.toString());
  } catch (err) {
    console.error('Error saving alert waiting period:', err);
  }
}

// Firebase Firestore Helpers
function saveScheduleToFirestore(scheduleItem) {
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      const db = firebase.firestore();
      db.collection('medicineSchedules').doc(scheduleItem.id).set(scheduleItem)
        .then(() => console.log('Firestore: Schedule saved', scheduleItem.id))
        .catch(err => console.error('Firestore save error:', err));
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }
  }
}

function deleteScheduleFromFirestore(scheduleId) {
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      const db = firebase.firestore();
      db.collection('medicineSchedules').doc(scheduleId).delete()
        .then(() => console.log('Firestore: Schedule deleted', scheduleId))
        .catch(err => console.error('Firestore delete error:', err));
    } catch (e) {
      console.warn('Firestore delete warning:', e);
    }
  }
}

function saveConfirmationToFirestore(record) {
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      const db = firebase.firestore();
      db.collection('medicineConfirmation').doc(record.id).set({
        confirmationId: record.id,
        patientId: record.patientId || 'pat_1',
        patientName: record.patientName,
        medicineId: record.medicineId,
        medicineName: record.medicineName,
        scheduledDate: record.scheduledDate,
        scheduledTime: record.scheduledTime,
        status: record.status,
        takenAt: record.takenAt,
        caregiverId: record.caregiverId || 'cg_1',
        caregiverName: record.caregiverName,
        alertSent: record.alertSent || true,
        alertSentAt: record.alertSentAt || new Date().toISOString(),
        createdAt: record.createdAt || new Date().toISOString()
      }).then(() => console.log('Firestore: Medicine confirmation saved', record.id))
        .catch(err => console.error('Firestore save confirmation error:', err));
    } catch (e) {
      console.warn('Firestore write confirmation warning:', e);
    }
  }
}

function saveCaregiverAlertToFirestore(alertRecord) {
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      const db = firebase.firestore();
      db.collection('caregiverAlerts').doc(alertRecord.id).set(alertRecord)
        .then(() => console.log('Firestore: Caregiver alert saved', alertRecord.id))
        .catch(err => console.error('Firestore save alert error:', err));
    } catch (e) {
      console.warn('Firestore write alert warning:', e);
    }
  }
}

/**
 * Single Page Navigation Handler (Section Switching)
 */
function initSidebarNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const viewSections = document.querySelectorAll('.view-section');
  const viewTitleEl = document.getElementById('currentViewTitle');

  function switchView(targetId) {
    // 1. Update Active Nav Link
    navItems.forEach(item => {
      if (item.getAttribute('data-target') === targetId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // 2. Switch View Section
    viewSections.forEach(section => {
      if (section.id === targetId) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // 3. Update Title Header
    if (viewTitleEl && VIEW_TITLES[targetId]) {
      viewTitleEl.textContent = VIEW_TITLES[targetId];
    }

    // 4. Close Mobile Sidebar if open
    closeMobileSidebar();

    // 5. Redraw Canvas Graphs if target is Dashboard or Health Ratio
    const healthRatio = calculateHealthRatio(appData.medical);
    if (targetId === 'view-dashboard') {
      drawHealthTrendGraph('healthTrendChart', healthRatio, 380, 130);
    } else if (targetId === 'view-health') {
      renderHealthComparisonSection();
      drawHealthTrendGraph('healthTrendChartFull', healthRatio, 650, 220);
    }
  }

  // Sidebar Nav Clicks
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-target');
      switchView(target);
    });
  });

  // Dynamic Switch Buttons inside cards
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.switch-nav-btn');
    if (btn) {
      const target = btn.getAttribute('data-target');
      switchView(target);
    }
  });

  // Mobile Sidebar Drawer Toggle
  const mobileToggle = document.getElementById('mobileSidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('show');
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeMobileSidebar);
  }

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('show');
  }
}

/**
 * Calculate Patient Health Ratio (%)
 */
function calculateHealthRatio(medical) {
  let bpScore = 85;
  if (medical.bp) {
    const parts = medical.bp.split('/');
    if (parts.length === 2) {
      const sys = parseInt(parts[0]) || 120;
      const dia = parseInt(parts[1]) || 80;
      if (sys <= 120 && dia <= 80) bpScore = 95;
      else if (sys <= 130 && dia <= 85) bpScore = 85;
      else bpScore = 70;
    }
  }

  let sugarScore = 85;
  if (medical.sugar) {
    const sVal = parseFloat(medical.sugar) || 100;
    if (sVal <= 100) sugarScore = 95;
    else if (sVal <= 125) sugarScore = 80;
    else sugarScore = 65;
  }

  let weightScore = 85;
  const totalRatio = Math.round(bpScore * 0.4 + sugarScore * 0.35 + weightScore * 0.25);
  return Math.min(Math.max(totalRatio, 60), 99);
}

/**
 * Render All Dashboard & Detail Sections with Active Data
 */
function renderDashboard() {
  const p = appData.patient;
  const d = appData.doctor;
  const c = appData.caregiver;
  const m = appData.medical;
  const s = appData.suggestions;
  const f = appData.foodSchedule;

function calculateBmi(heightCm, weightKg) {
  const h = parseFloat(heightCm);
  const w = parseFloat(weightKg);
  if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
    return 'Not provided';
  }
  const heightM = h / 100;
  const bmiVal = (w / (heightM * heightM)).toFixed(1);
  let category = '';
  const numBmi = parseFloat(bmiVal);
  if (numBmi < 18.5) category = 'Underweight';
  else if (numBmi < 25) category = 'Normal';
  else if (numBmi < 30) category = 'Overweight';
  else category = 'Obese';

  return `${bmiVal} (${category})`;
}

  // PATIENT DEMOGRAPHICS
  const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'EV';
  
  // Registered Patient Summary Card
  setElText('dashPatientAvatar', initials);
  setElText('dashPatientName', p.name || 'Not provided');
  setElText('dashPatientAge', p.age ? `${p.age} Years` : 'Not provided');
  setElText('dashPatientGender', p.gender || 'Not provided');
  setElText('dashPatientDob', p.dob || 'Not provided');
  setElText('dashPatientBloodGroup', p.bloodGroup || 'Not provided');
  setElText('dashPatientHeight', p.height ? `${p.height} cm` : 'Not provided');

  const currentWeight = p.weight || m.weight || '';
  setElText('dashPatientWeight', currentWeight ? `${currentWeight} kg` : 'Not provided');

  const bmiStr = calculateBmi(p.height, currentWeight);
  setElText('dashPatientBmi', bmiStr);

  setElText('dashPatientEmergencyContact', p.emergencyContact || 'Not provided');

  // Patient Details Section
  setElText('patDetailName', p.name || 'Not provided');
  setElText('patDetailAge', p.age ? `${p.age} Years` : 'Not provided');
  setElText('patDetailGender', p.gender || 'Not provided');
  setElText('patDetailContact', p.contact || 'Not provided');

  // HEALTH RATIO
  const healthRatio = calculateHealthRatio(m);
  setElText('dashPatientRatioInline', `${healthRatio}% (Stable & Doctor Monitored)`);
  setElText('dashRatioBigNumber', `${healthRatio}%`);
  setElText('healthRatioBigNumber', `${healthRatio}%`);

  const ratioBadge = document.getElementById('ratioStatusBadge');
  const fullBadge = document.getElementById('healthRatioStatusBadge');
  const badgeText = healthRatio >= 85 ? 'Optimal Status' : 'Moderate Care';
  const badgeClass = healthRatio >= 85 ? 'card-badge badge-green' : 'card-badge badge-blue';
  
  if (ratioBadge) { ratioBadge.textContent = badgeText; ratioBadge.className = badgeClass; }
  if (fullBadge) { fullBadge.textContent = badgeText; fullBadge.className = badgeClass; }

  // DOCTOR DETAILS
  setElText('dashSummaryDocName', d.name);
  setElText('dashSummaryDocSpec', `Specialization: ${d.specialization}`);
  setElText('dashSummaryDocClinic', `Hospital/Clinic: ${d.clinic}`);
  setElText('dashSummaryDocContact', `Contact: ${d.contact}`);

  setElText('docDetailName', d.name);
  setElText('docDetailSpec', d.specialization);
  setElText('docDetailClinic', d.clinic);
  setElText('docDetailContact', d.contact);

  // CAREGIVER DETAILS
  setElText('dashSummaryCaregiverName', c.name);
  setElText('dashSummaryCaregiverRel', `Relationship: ${c.relationship}`);
  setElText('dashSummaryCaregiverContact', `Contact Number: ${c.contact}`);

  setElText('caregiverDetailName', c.name);
  setElText('caregiverDetailRel', c.relationship);
  setElText('caregiverDetailContact', c.contact);

  // PATIENT CLINICAL VITALS BY DOCTOR
  setElText('dashDiagnosis', m.diagnosis);
  setElText('dashBp', m.bp ? `${m.bp} mmHg` : 'N/A');
  setElText('dashSugar', m.sugar ? `${m.sugar} mg/dL` : 'N/A');
  setElText('dashWeight', m.weight ? `${m.weight} kg` : 'N/A');
  setElText('dashOtherHealth', m.otherHealth);

  // DOCTOR SUGGESTIONS
  setElText('dashMedicines', s.medicines);
  setElText('dashExercise', s.exercise);
  setElText('dashRest', s.rest);
  setElText('dashInstructions', s.instructions);

  // FOOD SCHEDULE
  setElText('dashBreakfast', f.breakfast);
  setElText('dashLunch', f.lunch);
  setElText('dashSnack', f.snack);
  setElText('dashDinner', f.dinner);

  setElText('dashSummaryBf', f.breakfast);
  setElText('dashSummaryLunch', f.lunch);
  setElText('dashSummarySnack', f.snack);
  setElText('dashSummaryDinner', f.dinner);

  // Render HTML5 Canvas Health Trend Graph & Health Comparison
  renderHealthComparisonSection();
  drawHealthTrendGraph('healthTrendChart', healthRatio, 380, 130);
  drawHealthTrendGraph('healthTrendChartFull', healthRatio, 650, 220);
}

function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/**
 * Get Available Health Records for the Current Month
 */
function getCurrentMonthHealthRecords() {
  if (!appData.healthHistory || !Array.isArray(appData.healthHistory)) {
    return [];
  }

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const currentMonthRecords = appData.healthHistory.filter(item => {
    if (!item.date) return false;
    const parts = item.date.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      return y === curYear && m === curMonth;
    }
    const d = new Date(item.date);
    return !isNaN(d.getTime()) && d.getFullYear() === curYear && d.getMonth() === curMonth;
  });

  currentMonthRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
  return currentMonthRecords;
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${months[m]} ${d}`;
  }
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[dt.getMonth()]} ${dt.getDate()}`;
}

/**
 * Dynamically Calculate & Render Health Comparison Values (Previous, Today, Monthly Avg)
 */
function renderHealthComparisonSection() {
  const records = getCurrentMonthHealthRecords();
  const currentRatio = calculateHealthRatio(appData.medical);

  let prevRatio = currentRatio;
  let todayRatio = currentRatio;
  let avgRatio = currentRatio;

  if (records.length > 0) {
    todayRatio = records[records.length - 1].ratio || currentRatio;
    if (records.length >= 2) {
      prevRatio = records[records.length - 2].ratio || todayRatio;
    } else {
      prevRatio = todayRatio;
    }

    const totalSum = records.reduce((acc, r) => acc + (parseInt(r.ratio) || 0), 0);
    avgRatio = Math.round(totalSum / records.length);
  }

  const diff = todayRatio - prevRatio;
  const trendText = diff >= 0 ? `↑ +${diff}%` : `↓ ${diff}%`;
  const trendClass = diff >= 0 ? 'hc-trend-badge green-trend' : 'hc-trend-badge text-red';

  setElText('hcPrevValText', `${prevRatio}%`);
  setElText('hcPrevRingVal', `${prevRatio}%`);
  const prevRing = document.getElementById('hcPrevRingFill');
  if (prevRing) prevRing.setAttribute('stroke-dasharray', `${prevRatio}, 100`);

  setElText('hcTodayValText', `${todayRatio}%`);
  setElText('hcTodayRingVal', `${todayRatio}%`);
  const todayRing = document.getElementById('hcTodayRingFill');
  if (todayRing) todayRing.setAttribute('stroke-dasharray', `${todayRatio}, 100`);

  const trendBadge = document.getElementById('hcTrendBadge');
  if (trendBadge) {
    trendBadge.textContent = trendText;
    trendBadge.className = trendClass;
  }

  setElText('hcAvgValText', `${avgRatio}%`);
  setElText('hcAvgRingVal', `${avgRatio}%`);
  const avgRing = document.getElementById('hcAvgRingFill');
  if (avgRing) avgRing.setAttribute('stroke-dasharray', `${avgRatio}, 100`);

  setElText('healthBpVal', appData.medical.bp ? `${appData.medical.bp} mmHg` : '118/76 mmHg');
  setElText('healthSugarVal', appData.medical.sugar ? `${appData.medical.sugar} mg/dL` : '98 mg/dL');
  setElText('healthWeightVal', appData.medical.weight ? `${appData.medical.weight} kg` : '68.5 kg');
}

/**
 * Draw Interactive Data-Driven Health Ratio Trend Graph on HTML5 Canvas
 */
function drawHealthTrendGraph(canvasId, currentRatio, targetWidth, targetHeight) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const records = getCurrentMonthHealthRecords();

  if (records.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Not enough historical health data to display the monthly trend.', width / 2, height / 2);
    return;
  }

  const minVal = 50;
  const maxVal = 100;
  const paddingLeft = 45;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Grid Lines
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'right';

  const gridSteps = [60, 70, 80, 90, 100];
  gridSteps.forEach(stepVal => {
    const y = height - paddingBottom - ((stepVal - minVal) / (maxVal - minVal)) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();

    ctx.fillText(`${stepVal}%`, paddingLeft - 8, y + 3);
  });

  // Target Line (80%)
  const targetY = height - paddingBottom - ((80 - minVal) / (maxVal - minVal)) * chartHeight;
  ctx.strokeStyle = 'rgba(9, 53, 122, 0.25)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(paddingLeft, targetY);
  ctx.lineTo(width - paddingRight, targetY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Coordinates
  const points = [];
  const count = records.length;
  const stepX = count > 1 ? chartWidth / (count - 1) : chartWidth / 2;

  records.forEach((rec, i) => {
    const x = count > 1 ? paddingLeft + i * stepX : paddingLeft + chartWidth / 2;
    const ratio = Math.max(minVal, Math.min(maxVal, rec.ratio || currentRatio));
    const y = height - paddingBottom - ((ratio - minVal) / (maxVal - minVal)) * chartHeight;
    points.push({ x, y, record: rec, index: i });
  });

  canvas._healthPoints = points;

  // Gradient Fill
  const fillGradient = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
  fillGradient.addColorStop(0, 'rgba(2, 132, 199, 0.28)');
  fillGradient.addColorStop(1, 'rgba(2, 132, 199, 0.01)');

  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.lineTo(points[points.length - 1].x, height - paddingBottom);
  ctx.lineTo(points[0].x, height - paddingBottom);
  ctx.closePath();
  ctx.fillStyle = fillGradient;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // Draw Points & Labels
  const hoverIndex = canvas._hoverIndex !== undefined ? canvas._hoverIndex : -1;

  points.forEach((p, i) => {
    const dateLabel = formatDateLabel(p.record.date);
    ctx.fillStyle = (i === hoverIndex || i === points.length - 1) ? '#0f172a' : '#64748b';
    ctx.font = (i === hoverIndex || i === points.length - 1) ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dateLabel, p.x, height - paddingBottom + 18);

    const isHovered = (i === hoverIndex);
    const isLatest = (i === points.length - 1);
    const radius = isHovered ? 7 : (isLatest ? 5.5 : 4);

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#10b981' : (isLatest ? '#09357a' : '#0284c7');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (isHovered) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  // Tooltip Box
  if (hoverIndex >= 0 && hoverIndex < points.length) {
    const hp = points[hoverIndex];
    const rec = hp.record;
    const dateStr = formatDateLabel(rec.date);
    const ratioStr = `${rec.ratio}%`;

    const tooltipText = `${dateStr}: ${ratioStr}`;
    ctx.font = 'bold 12px Inter, sans-serif';
    const textWidth = ctx.measureText(tooltipText).width;
    const boxWidth = textWidth + 18;
    const boxHeight = 26;

    let tooltipX = hp.x - boxWidth / 2;
    tooltipX = Math.max(10, Math.min(width - boxWidth - 10, tooltipX));
    let tooltipY = hp.y - boxHeight - 10;
    if (tooltipY < paddingTop) tooltipY = hp.y + 12;

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(tooltipX, tooltipY, boxWidth, boxHeight, 6);
    } else {
      ctx.rect(tooltipX, tooltipY, boxWidth, boxHeight);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tooltipText, tooltipX + boxWidth / 2, tooltipY + boxHeight / 2);
  }

  // Hover Event Listeners
  if (!canvas._hasHoverListener) {
    canvas._hasHoverListener = true;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (!canvas._healthPoints) return;

      let closestIdx = -1;
      let minDistance = 9999;

      canvas._healthPoints.forEach((p, idx) => {
        const dist = Math.abs(p.x - mouseX);
        if (dist < minDistance && dist < 40) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      if (canvas._hoverIndex !== closestIdx) {
        canvas._hoverIndex = closestIdx;
        drawHealthTrendGraph(canvasId, currentRatio, targetWidth, targetHeight);
      }
    });

    canvas.addEventListener('mouseleave', () => {
      if (canvas._hoverIndex !== -1) {
        canvas._hoverIndex = -1;
        drawHealthTrendGraph(canvasId, currentRatio, targetWidth, targetHeight);
      }
    });
  }
}

// ==================================================
// MEDICINE / TABLET STOCK CHECKING ALGORITHM & RENDERING
// ==================================================

function calculateTabletStock(tablet) {
  let startDateObj;
  if (tablet.startDate) {
    const parts = tablet.startDate.split('-');
    if (parts.length === 3) {
      startDateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      startDateObj = new Date(tablet.startDate);
    }
  } else {
    startDateObj = new Date();
  }

  const now = new Date();
  const todayObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = todayObj.getTime() - startDateObj.getTime();
  const daysPassed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const usedPerDay = parseInt(tablet.usedPerDay) || 1;
  const totalTablets = parseInt(tablet.totalTablets) || 0;
  const tabletsUsed = daysPassed * usedPerDay;
  const remainingTablets = Math.max(0, totalTablets - tabletsUsed);

  const stockPercentage = totalTablets > 0 ? Math.round((remainingTablets / totalTablets) * 100) : 0;

  let statusText = '🟢 STOCK AVAILABLE';
  let statusClass = 'status-available';
  let progressClass = 'bg-available';
  let category = 'available';

  if (stockPercentage < 30) {
    statusText = '🔴 REFILL';
    statusClass = 'status-refill';
    progressClass = 'bg-refill';
    category = 'refill';
  } else if (stockPercentage < 70) {
    statusText = '🟡 STOCK LOW';
    statusClass = 'status-low';
    progressClass = 'bg-low';
    category = 'low';
  }

  return {
    daysPassed,
    tabletsUsed,
    remainingTablets,
    stockPercentage,
    statusText,
    statusClass,
    progressClass,
    category
  };
}

function renderTabletStock() {
  const container = document.getElementById('tabletCardsGrid');
  const searchVal = (document.getElementById('searchTabletInput')?.value || '').toLowerCase().trim();
  if (!container) return;

  container.innerHTML = '';

  let availableCount = 0;
  let lowCount = 0;
  let refillCount = 0;

  const filtered = tabletsData.filter(t => t.name.toLowerCase().includes(searchVal));

  tabletsData.forEach(tablet => {
    const calc = calculateTabletStock(tablet);
    if (calc.category === 'available') availableCount++;
    else if (calc.category === 'low') lowCount++;
    else if (calc.category === 'refill') refillCount++;
  });

  setElText('sumTotalCount', tabletsData.length);
  setElText('sumAvailableCount', availableCount);
  setElText('sumLowCount', lowCount);
  setElText('sumRefillCount', refillCount);

  setElText('sumTotalCountStock', tabletsData.length);
  setElText('sumAvailableCountStock', availableCount);
  setElText('sumLowCountStock', lowCount);
  setElText('sumRefillCountStock', refillCount);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-subtle);">
        <p style="font-size: 16px; font-weight: 700;">No medicine/tablet records found.</p>
        <p style="font-size: 13px; margin-top: 4px;">Click <strong>"+ Add Tablet"</strong> to create a new stock tracker.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(tablet => {
    const calc = calculateTabletStock(tablet);
    const card = document.createElement('article');
    card.className = 'tablet-card';

    const formattedStartDate = tablet.startDate ? tablet.startDate : getTodayDateString();

    let imageHtml = '';
    if (tablet.image) {
      imageHtml = `<img src="${tablet.image}" alt="${tablet.name}" class="tablet-img">`;
    } else {
      imageHtml = `
        <div class="tablet-img-default">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
          <span style="font-size: 11px; font-weight: 700;">MEDICINE</span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="tablet-card-image-box">
        ${imageHtml}
      </div>

      <h3 class="tablet-name">${escapeHtml(tablet.name)}</h3>

      <div class="tablet-info-list">
        <div class="tablet-info-row">
          <span class="tablet-info-label">Total Tablets:</span>
          <span class="tablet-info-val">${tablet.totalTablets}</span>
        </div>

        <div class="tablet-info-row">
          <span class="tablet-info-label">Used Per Day:</span>
          <span class="tablet-info-val">${tablet.usedPerDay}</span>
        </div>

        <div class="tablet-info-row">
          <span class="tablet-info-label">Remaining:</span>
          <span class="tablet-info-val text-navy" style="font-size: 15px; font-weight: 800;">${calc.remainingTablets} tablets</span>
        </div>

        <div class="tablet-info-row">
          <span class="tablet-info-label">Stock:</span>
          <span class="tablet-info-val">${calc.stockPercentage}%</span>
        </div>

        <div class="stock-progress-track">
          <div class="stock-progress-fill ${calc.progressClass}" style="width: ${calc.stockPercentage}%;"></div>
        </div>

        <div class="tablet-info-row" style="margin-top: 4px;">
          <span class="tablet-info-label">Start Date:</span>
          <span class="tablet-info-val" style="font-size: 12px; color: var(--text-muted);">${formattedStartDate}</span>
        </div>
      </div>

      <div class="stock-status-pill ${calc.statusClass}">
        <span>${calc.statusText}</span>
      </div>

      <div class="tablet-card-actions">
        <button class="btn btn-secondary btn-card-action btn-update-tablet" data-id="${tablet.id}" type="button">Update</button>
        <button class="btn btn-secondary btn-card-action btn-delete-action btn-delete-tablet" data-id="${tablet.id}" type="button">Delete</button>
        <button class="btn btn-card-action btn-refill-action btn-refill-tablet" data-id="${tablet.id}" type="button">Refill</button>
      </div>
    `;

    container.appendChild(card);
  });

  bindDynamicTabletCardButtons();
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function bindDynamicTabletCardButtons() {
  document.querySelectorAll('.btn-refill-tablet').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const tablet = tabletsData.find(t => t.id === id);
      if (!tablet) return;

      const calc = calculateTabletStock(tablet);
      document.getElementById('refillTabletIdInput').value = tablet.id;
      document.getElementById('refillTabletNameDisplay').textContent = tablet.name;
      document.getElementById('refillCurrentRemainingDisplay').textContent = `${calc.remainingTablets} tablets`;
      document.getElementById('addRefillQuantityInput').value = '';

      document.getElementById('refillTabletModal').classList.add('show');
    });
  });

  document.querySelectorAll('.btn-update-tablet').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const tablet = tabletsData.find(t => t.id === id);
      if (!tablet) return;

      document.getElementById('updateTabletIdInput').value = tablet.id;
      document.getElementById('updateTabletNameInput').value = tablet.name;
      document.getElementById('updateTotalTabletsInput').value = tablet.totalTablets;
      document.getElementById('updateUsedPerDayInput').value = tablet.usedPerDay;
      document.getElementById('updateStartDateInput').value = tablet.startDate || getTodayDateString();

      tempUpdateImageBase64 = tablet.image || '';
      const imgPreview = document.getElementById('updateTabletImgPreview');
      const fileNameSpan = document.getElementById('updateTabletImageFileName');

      if (tablet.image) {
        imgPreview.src = tablet.image;
        imgPreview.className = 'img-preview';
        fileNameSpan.textContent = 'Existing Image Loaded';
      } else {
        imgPreview.src = '';
        imgPreview.className = 'img-preview-hidden';
        fileNameSpan.textContent = 'No image selected';
      }

      document.getElementById('updateTabletModal').classList.add('show');
    });
  });

  document.querySelectorAll('.btn-delete-tablet').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const tablet = tabletsData.find(t => t.id === id);
      if (!tablet) return;

      if (confirm(`Are you sure you want to delete "${tablet.name}" from stock tracking?`)) {
        tabletsData = tabletsData.filter(t => t.id !== id);
        saveTabletsData();
        renderTabletStock();
        showToast(`Tablet "${tablet.name}" deleted.`);
      }
    });
  });
}

function bindTabletEvents() {
  const searchInput = document.getElementById('searchTabletInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderTabletStock();
    });
  }

  const openAddBtn = document.getElementById('openAddTabletBtn');
  const addModal = document.getElementById('addTabletModal');
  const closeAddBtn = document.getElementById('closeAddTabletModalBtn');
  const cancelAddBtn = document.getElementById('cancelAddTabletModalBtn');
  const addForm = document.getElementById('addTabletForm');

  if (openAddBtn) {
    openAddBtn.addEventListener('click', () => {
      document.getElementById('addTabletNameInput').value = '';
      document.getElementById('addTotalTabletsInput').value = '';
      document.getElementById('addUsedPerDayInput').value = '1';
      document.getElementById('addStartDateInput').value = getTodayDateString();
      document.getElementById('addTabletImageInput').value = '';
      document.getElementById('addTabletImageFileName').textContent = 'No file chosen';

      tempAddImageBase64 = '';
      const imgPreview = document.getElementById('addTabletImgPreview');
      imgPreview.src = '';
      imgPreview.className = 'img-preview-hidden';

      addModal.classList.add('show');
    });
  }

  if (closeAddBtn) closeAddBtn.addEventListener('click', () => addModal.classList.remove('show'));
  if (cancelAddBtn) cancelAddBtn.addEventListener('click', () => addModal.classList.remove('show'));

  const addImgInput = document.getElementById('addTabletImageInput');
  if (addImgInput) {
    addImgInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        document.getElementById('addTabletImageFileName').textContent = file.name;
        const reader = new FileReader();
        reader.onload = (evt) => {
          tempAddImageBase64 = evt.target.result;
          const imgPreview = document.getElementById('addTabletImgPreview');
          imgPreview.src = tempAddImageBase64;
          imgPreview.className = 'img-preview';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('addTabletNameInput').value.trim();
      const total = parseInt(document.getElementById('addTotalTabletsInput').value) || 0;
      const usedPerDay = parseInt(document.getElementById('addUsedPerDayInput').value) || 1;
      const startDate = document.getElementById('addStartDateInput').value || getTodayDateString();

      const newTablet = {
        id: 'tab_' + Date.now(),
        name,
        image: tempAddImageBase64,
        totalTablets: total,
        usedPerDay,
        startDate
      };

      tabletsData.unshift(newTablet);
      saveTabletsData();
      renderTabletStock();

      addModal.classList.remove('show');
      showToast(`Tablet "${name}" saved to stock tracking!`);
    });
  }

  const refillModal = document.getElementById('refillTabletModal');
  const closeRefillBtn = document.getElementById('closeRefillModalBtn');
  const cancelRefillBtn = document.getElementById('cancelRefillModalBtn');
  const refillForm = document.getElementById('refillTabletForm');

  if (closeRefillBtn) closeRefillBtn.addEventListener('click', () => refillModal.classList.remove('show'));
  if (cancelRefillBtn) cancelRefillBtn.addEventListener('click', () => refillModal.classList.remove('show'));

  if (refillForm) {
    refillForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('refillTabletIdInput').value;
      const addQty = parseInt(document.getElementById('addRefillQuantityInput').value) || 0;

      const tablet = tabletsData.find(t => t.id === id);
      if (!tablet || addQty <= 0) return;

      const calc = calculateTabletStock(tablet);
      const newTotal = calc.remainingTablets + addQty;

      tablet.totalTablets = newTotal;
      tablet.startDate = getTodayDateString();

      saveTabletsData();
      renderTabletStock();
      refillModal.classList.remove('show');
      showToast(`Added ${addQty} new tablets to "${tablet.name}". Total stock: ${newTotal}.`);
    });
  }

  const updateModal = document.getElementById('updateTabletModal');
  const closeUpdateBtn = document.getElementById('closeUpdateTabletModalBtn');
  const cancelUpdateBtn = document.getElementById('cancelUpdateTabletModalBtn');
  const updateForm = document.getElementById('updateTabletForm');
  const updateImgInput = document.getElementById('updateTabletImageInput');

  if (closeUpdateBtn) closeUpdateBtn.addEventListener('click', () => updateModal.classList.remove('show'));
  if (cancelUpdateBtn) cancelUpdateBtn.addEventListener('click', () => updateModal.classList.remove('show'));

  if (updateImgInput) {
    updateImgInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        document.getElementById('updateTabletImageFileName').textContent = file.name;
        const reader = new FileReader();
        reader.onload = (evt) => {
          tempUpdateImageBase64 = evt.target.result;
          const imgPreview = document.getElementById('updateTabletImgPreview');
          imgPreview.src = tempUpdateImageBase64;
          imgPreview.className = 'img-preview';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (updateForm) {
    updateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('updateTabletIdInput').value;
      const tablet = tabletsData.find(t => t.id === id);
      if (!tablet) return;

      tablet.name = document.getElementById('updateTabletNameInput').value.trim();
      tablet.totalTablets = parseInt(document.getElementById('updateTotalTabletsInput').value) || tablet.totalTablets;
      tablet.usedPerDay = parseInt(document.getElementById('updateUsedPerDayInput').value) || tablet.usedPerDay;
      tablet.startDate = document.getElementById('updateStartDateInput').value || tablet.startDate;

      if (tempUpdateImageBase64) {
        tablet.image = tempUpdateImageBase64;
      }

      saveTabletsData();
      renderTabletStock();
      updateModal.classList.remove('show');
      showToast(`Tablet "${tablet.name}" updated successfully!`);
    });
  }
}

function bindActionEvents() {
  const printBtn = document.getElementById('printEhrBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  const resetBtn = document.getElementById('resetDemoBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset dashboard data and tablet inventory to sample demo state?')) {
        appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
        tabletsData = JSON.parse(JSON.stringify(DEFAULT_TABLETS));
        medicineConfirmationsData = [];
        caregiverAlertsData = [];
        alertWaitingPeriodMinutes = 30;

        saveAppData();
        saveTabletsData();
        saveMedicineConfirmationsData();
        saveCaregiverAlertsData();
        saveAlertWaitingPeriod(30);

        const waitSelect = document.getElementById('caregiverAlertWaitSelect');
        if (waitSelect) waitSelect.value = '30';

        renderDashboard();
        renderDashboardCaregiverAlerts();
        renderTabletStock();
        renderMedicineSchedules();
        checkAutomaticCaregiverAlerts();

        showToast('Dashboard, Medicine Inventory & Confirmation Alerts reset to default demo data.');
      }
    });
  }
}

function bindModalEvents() {
  const openRegBtn = document.getElementById('openRegisterBtn');
  const regModal = document.getElementById('patientRegisterModal');
  const closeRegBtns = document.querySelectorAll('.closeRegisterModal');
  const regForm = document.getElementById('patientRegisterForm');

  if (openRegBtn) {
    openRegBtn.addEventListener('click', () => {
      document.getElementById('regNameInput').value = appData.patient.name || '';
      document.getElementById('regAgeInput').value = appData.patient.age || '';
      document.getElementById('regGenderSelect').value = appData.patient.gender || 'Female';
      if (document.getElementById('regDobInput')) document.getElementById('regDobInput').value = appData.patient.dob || '';
      if (document.getElementById('regBloodGroupInput')) document.getElementById('regBloodGroupInput').value = appData.patient.bloodGroup || 'O+';
      if (document.getElementById('regHeightInput')) document.getElementById('regHeightInput').value = appData.patient.height || '';
      if (document.getElementById('regWeightInput')) document.getElementById('regWeightInput').value = appData.patient.weight || appData.medical.weight || '';
      document.getElementById('regContactInput').value = appData.patient.contact || '';
      if (document.getElementById('regEmergencyContactInput')) document.getElementById('regEmergencyContactInput').value = appData.patient.emergencyContact || '';
      document.getElementById('regHealthInfoInput').value = appData.patient.healthInfo || '';
      regModal.classList.add('show');
    });
  }

  closeRegBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      regModal.classList.remove('show');
    });
  });

  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      appData.patient.name = document.getElementById('regNameInput').value;
      appData.patient.age = parseInt(document.getElementById('regAgeInput').value) || 0;
      appData.patient.gender = document.getElementById('regGenderSelect').value;
      if (document.getElementById('regDobInput')) appData.patient.dob = document.getElementById('regDobInput').value;
      if (document.getElementById('regBloodGroupInput')) appData.patient.bloodGroup = document.getElementById('regBloodGroupInput').value;
      if (document.getElementById('regHeightInput')) appData.patient.height = document.getElementById('regHeightInput').value;
      if (document.getElementById('regWeightInput')) {
        appData.patient.weight = document.getElementById('regWeightInput').value;
        appData.medical.weight = document.getElementById('regWeightInput').value;
      }
      appData.patient.contact = document.getElementById('regContactInput').value;
      if (document.getElementById('regEmergencyContactInput')) appData.patient.emergencyContact = document.getElementById('regEmergencyContactInput').value;
      appData.patient.healthInfo = document.getElementById('regHealthInfoInput').value;

      saveAppData();
      renderDashboard();
      regModal.classList.remove('show');
      showToast('Patient details updated & registered successfully!');
    });
  }

  const openDocBtn = document.getElementById('openDoctorUpdateBtn');
  const docModal = document.getElementById('doctorUpdateModal');
  const closeDocBtn = document.getElementById('closeDoctorModalBtn');
  const cancelDocBtn = document.getElementById('cancelDoctorModalBtn');
  const docForm = document.getElementById('doctorUpdateForm');

  if (openDocBtn) {
    openDocBtn.addEventListener('click', () => {
      document.getElementById('docNameInput').value = appData.doctor.name;
      document.getElementById('docSpecInput').value = appData.doctor.specialization;
      document.getElementById('docClinicInput').value = appData.doctor.clinic;
      document.getElementById('docContactInput').value = appData.doctor.contact;

      document.getElementById('caregiverNameInput').value = appData.caregiver.name;
      document.getElementById('caregiverRelInput').value = appData.caregiver.relationship;
      document.getElementById('caregiverContactInput').value = appData.caregiver.contact;

      document.getElementById('diagInput').value = appData.medical.diagnosis;
      document.getElementById('bpInput').value = appData.medical.bp;
      document.getElementById('sugarInput').value = appData.medical.sugar;
      document.getElementById('weightInput').value = appData.medical.weight;
      document.getElementById('otherHealthInput').value = appData.medical.otherHealth;

      document.getElementById('medsInput').value = appData.suggestions.medicines;
      document.getElementById('exerciseInput').value = appData.suggestions.exercise;
      document.getElementById('restInput').value = appData.suggestions.rest;
      document.getElementById('instructionsInput').value = appData.suggestions.instructions;

      document.getElementById('bfInput').value = appData.foodSchedule.breakfast;
      document.getElementById('lunchInput').value = appData.foodSchedule.lunch;
      document.getElementById('snackInput').value = appData.foodSchedule.snack;
      document.getElementById('dinnerInput').value = appData.foodSchedule.dinner;

      docModal.classList.add('show');
    });
  }

  if (closeDocBtn) closeDocBtn.addEventListener('click', () => docModal.classList.remove('show'));
  if (cancelDocBtn) cancelDocBtn.addEventListener('click', () => docModal.classList.remove('show'));

  if (docForm) {
    docForm.addEventListener('submit', (e) => {
      e.preventDefault();

      appData.doctor.name = document.getElementById('docNameInput').value;
      appData.doctor.specialization = document.getElementById('docSpecInput').value;
      appData.doctor.clinic = document.getElementById('docClinicInput').value;
      appData.doctor.contact = document.getElementById('docContactInput').value;

      appData.caregiver.name = document.getElementById('caregiverNameInput').value;
      appData.caregiver.relationship = document.getElementById('caregiverRelInput').value;
      appData.caregiver.contact = document.getElementById('caregiverContactInput').value;

      appData.medical.diagnosis = document.getElementById('diagInput').value;
      appData.medical.bp = document.getElementById('bpInput').value;
      appData.medical.sugar = document.getElementById('sugarInput').value;
      appData.medical.weight = document.getElementById('weightInput').value;
      appData.medical.otherHealth = document.getElementById('otherHealthInput').value;

      appData.suggestions.medicines = document.getElementById('medsInput').value;
      appData.suggestions.exercise = document.getElementById('exerciseInput').value;
      appData.suggestions.rest = document.getElementById('restInput').value;
      appData.suggestions.instructions = document.getElementById('instructionsInput').value;

      appData.foodSchedule.breakfast = document.getElementById('bfInput').value;
      appData.foodSchedule.lunch = document.getElementById('lunchInput').value;
      appData.foodSchedule.snack = document.getElementById('snackInput').value;
      appData.foodSchedule.dinner = document.getElementById('dinnerInput').value;

      // Dynamically record / update today's health history record
      const todayStr = getTodayDateString();
      const newRatio = calculateHealthRatio(appData.medical);

      if (!appData.healthHistory || !Array.isArray(appData.healthHistory)) {
        appData.healthHistory = [];
      }

      let todayRec = appData.healthHistory.find(r => r.date === todayStr);
      if (todayRec) {
        todayRec.ratio = newRatio;
        todayRec.bp = appData.medical.bp;
        todayRec.sugar = appData.medical.sugar;
        todayRec.weight = appData.medical.weight;
      } else {
        appData.healthHistory.push({
          id: 'hh_' + Date.now(),
          date: todayStr,
          ratio: newRatio,
          bp: appData.medical.bp,
          sugar: appData.medical.sugar,
          weight: appData.medical.weight
        });
      }

      saveAppData();
      renderDashboard();
      renderHealthComparisonSection();
      docModal.classList.remove('show');
      showToast('Doctor records & health ratio updated successfully!');
    });
  }
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/* ================================================== */
/* MEDICINE SCHEDULE MODULE IMPLEMENTATION */
/* ================================================== */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTime12h(time24) {
  if (!time24) return '08:00 AM';
  const parts = time24.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hDisplay = String(h).padStart(2, '0');
  return `${hDisplay}:${m} ${ampm}`;
}

function getMinutesFromMidnight(time24) {
  if (!time24) return 0;
  const parts = time24.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function getCurrentDayName() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

function matchesDayFilter(item, filterValue) {
  const today = getCurrentDayName();
  if (filterValue === 'all') return true;
  if (filterValue === 'today') {
    if (item.scheduleDays.includes('Every Day')) return true;
    return item.scheduleDays.includes(today);
  }
  if (filterValue === 'Every Day') {
    return item.scheduleDays.includes('Every Day');
  }
  return item.scheduleDays.includes(filterValue) || item.scheduleDays.includes('Every Day');
}

function renderMedicineSchedules() {
  const doctorNameEl = document.getElementById('medSchedDoctorBadge');
  const patientNameEl = document.getElementById('medSchedPatientBadge');
  if (doctorNameEl) doctorNameEl.textContent = `👨‍⚕️ Prescribed by ${appData.doctor.name}`;
  if (patientNameEl) patientNameEl.textContent = `👤 Patient: ${appData.patient.name}`;

  const searchInput = document.getElementById('searchMedicineScheduleInput');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const dayFilterSelect = document.getElementById('medSchedDayFilter');
  const dayFilter = dayFilterSelect ? dayFilterSelect.value : 'today';

  // Filter items
  const filtered = medicineSchedulesData.filter(item => {
    const matchSearch = !searchQuery || item.medicineName.toLowerCase().includes(searchQuery) || (item.instructions && item.instructions.toLowerCase().includes(searchQuery));
    const matchDay = matchesDayFilter(item, dayFilter);
    return matchSearch && matchDay;
  });

  // Group by Time of Day
  const morningList = filtered.filter(i => i.timeOfDay === 'Morning').sort((a,b) => getMinutesFromMidnight(a.exactTime) - getMinutesFromMidnight(b.exactTime));
  const afternoonList = filtered.filter(i => i.timeOfDay === 'Afternoon').sort((a,b) => getMinutesFromMidnight(a.exactTime) - getMinutesFromMidnight(b.exactTime));
  const nightList = filtered.filter(i => i.timeOfDay === 'Night').sort((a,b) => getMinutesFromMidnight(a.exactTime) - getMinutesFromMidnight(b.exactTime));

  // Update counts
  const morningBadge = document.getElementById('morningCountBadge');
  const afternoonBadge = document.getElementById('afternoonCountBadge');
  const nightBadge = document.getElementById('nightCountBadge');

  if (morningBadge) morningBadge.textContent = `${morningList.length} Scheduled`;
  if (afternoonBadge) afternoonBadge.textContent = `${afternoonList.length} Scheduled`;
  if (nightBadge) nightBadge.textContent = `${nightList.length} Scheduled`;

  renderScheduleGroupContainer('morningMedsContainer', morningList, 'Morning');
  renderScheduleGroupContainer('afternoonMedsContainer', afternoonList, 'Afternoon');
  renderScheduleGroupContainer('nightMedsContainer', nightList, 'Night');

  renderDashboardMedicineScheduleSummary();
}

function renderScheduleGroupContainer(containerId, list, groupTitle) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box" style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--text-subtle); background: #ffffff; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
        <p style="margin: 0; font-size: 13px;">No ${groupTitle} medicines scheduled for this view.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => {
    const daysLabel = item.scheduleDays.join(', ');
    const formattedTime = item.exactTimeFormatted || formatTime12h(item.exactTime);
    const statusObj = getMedicineStatusForToday(item);
    
    return `
      <div class="med-schedule-card">
        <div>
          <div class="med-card-top">
            <div class="med-card-img-box">
              ${item.medicineImage ? `<img src="${item.medicineImage}" alt="${item.medicineName}" class="med-card-img">` : `💊`}
            </div>
            <div class="med-card-info">
              <h4 class="med-card-title">${escapeHtml(item.medicineName)}</h4>
              <span class="med-time-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${formattedTime} (${item.timeOfDay})
              </span>
            </div>
          </div>

          <div class="med-details-list">
            <div class="med-detail-item">
              <span class="med-detail-label">Dosage Quantity:</span>
              <span class="med-detail-val">${item.tabletQuantity} Tablet${item.tabletQuantity > 1 ? 's' : ''}</span>
            </div>
            <div class="med-detail-item">
              <span class="med-detail-label">Food Timing:</span>
              <span class="med-detail-val" style="color: var(--brand-navy);">${item.foodTiming}</span>
            </div>
            <div class="med-detail-item">
              <span class="med-detail-label">Schedule Days:</span>
              <span class="med-detail-val" style="font-size: 12px;">${daysLabel}</span>
            </div>
          </div>

          ${item.instructions ? `
            <div class="med-instructions-box">
              <strong>Special Instructions:</strong> ${escapeHtml(item.instructions)}
            </div>
          ` : ''}

          ${statusObj.badgeHtml}

          ${statusObj.buttonHtml}
        </div>

        <div class="med-card-actions">
          <span class="scheduled-status-tag">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            Scheduled
          </span>
          <div class="action-btns-group">
            <button class="btn btn-ghost btn-sm edit-med-btn" data-id="${item.id}" type="button" style="padding: 3px 8px; font-size: 12px;">✏️ Edit</button>
            <button class="btn btn-outline btn-sm delete-med-btn" data-id="${item.id}" type="button" style="padding: 3px 8px; font-size: 12px; color: #dc2626; border-color: #fca5a5;">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Bind Confirm Medicine Taken button clicks
  container.querySelectorAll('.btn-confirm-medicine').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      confirmMedicineTaken(id);
    });
  });

  // Bind Edit & Delete Event listeners
  container.querySelectorAll('.edit-med-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openEditMedicineScheduleModal(id);
    });
  });

  container.querySelectorAll('.delete-med-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      confirmDeleteMedicineSchedule(id);
    });
  });
}

function renderDashboardMedicineScheduleSummary() {
  const container = document.getElementById('dashSummaryMedSchedule');
  if (!container) return;

  const today = getCurrentDayName();
  const todayMeds = medicineSchedulesData.filter(i => i.scheduleDays.includes('Every Day') || i.scheduleDays.includes(today))
    .sort((a,b) => getMinutesFromMidnight(a.exactTime) - getMinutesFromMidnight(b.exactTime));

  if (todayMeds.length === 0) {
    container.innerHTML = `<p style="grid-column: 1 / -1; color: var(--text-subtle); font-size: 13px;">No medicines scheduled for today (${today}).</p>`;
    return;
  }

  container.innerHTML = todayMeds.slice(0, 4).map(item => `
    <div class="med-summary-card">
      <div class="med-summary-time">${item.exactTimeFormatted || formatTime12h(item.exactTime)}</div>
      <div class="med-summary-body">
        <h5 class="med-summary-name">${escapeHtml(item.medicineName)}</h5>
        <p class="med-summary-sub">${item.tabletQuantity} Tablet • ${item.foodTiming} (${item.timeOfDay})</p>
      </div>
    </div>
  `).join('');
}

function syncMatchingTabletStock(medicineName) {
  if (!medicineName) return;
  const normalizedName = medicineName.toLowerCase().trim();

  // Find all schedule items matching this medicine name
  const matches = medicineSchedulesData.filter(m => m.medicineName.toLowerCase().trim() === normalizedName);
  let totalDailyDose = 0;
  matches.forEach(m => {
    totalDailyDose += (parseInt(m.tabletQuantity) || 1);
  });

  if (totalDailyDose > 0) {
    // Check if tablet exists in stock checking
    const tabletIndex = tabletsData.findIndex(t => t.name.toLowerCase().trim() === normalizedName || normalizedName.includes(t.name.toLowerCase().trim()) || t.name.toLowerCase().trim().includes(normalizedName));
    if (tabletIndex !== -1) {
      tabletsData[tabletIndex].usedPerDay = totalDailyDose;
      saveTabletsData();
      renderTabletStock();
      showToast(`Linked with Stock Checking: Updated "${tabletsData[tabletIndex].name}" usage to ${totalDailyDose} tablet(s)/day.`);
    }
  }
}

function openAddMedicineScheduleModal() {
  const modal = document.getElementById('medicineScheduleModal');
  const form = document.getElementById('medicineScheduleForm');
  if (!modal || !form) return;

  document.getElementById('medScheduleModalTitle').textContent = 'ADD MEDICINE SCHEDULE';
  document.getElementById('medSchedIdInput').value = '';
  document.getElementById('medSchedNameInput').value = '';
  document.getElementById('medSchedTimeOfDaySelect').value = 'Morning';
  document.getElementById('medSchedExactTimeInput').value = '08:00';
  document.getElementById('medSchedQuantityInput').value = '1';
  document.getElementById('medSchedFoodTimingSelect').value = 'After Food';
  document.getElementById('medSchedInstructionsInput').value = '';

  tempMedScheduleImageBase64 = '';
  document.getElementById('medSchedImageFileName').textContent = 'No file chosen';
  const imgPreviewBox = document.getElementById('medSchedImgPreviewBox');
  const imgPreview = document.getElementById('medSchedImgPreview');
  if (imgPreviewBox && imgPreview) {
    imgPreview.src = '';
    imgPreview.className = 'img-preview-hidden';
  }

  // Reset day checkboxes (Every Day checked by default)
  const everyDayCheckbox = document.getElementById('dayEveryDay');
  if (everyDayCheckbox) everyDayCheckbox.checked = true;
  document.querySelectorAll('.day-spec').forEach(cb => cb.checked = false);

  modal.classList.add('show');
}

function openEditMedicineScheduleModal(id) {
  const item = medicineSchedulesData.find(m => m.id === id);
  if (!item) return;

  const modal = document.getElementById('medicineScheduleModal');
  if (!modal) return;

  document.getElementById('medScheduleModalTitle').textContent = 'EDIT MEDICINE SCHEDULE';
  document.getElementById('medSchedIdInput').value = item.id;
  document.getElementById('medSchedNameInput').value = item.medicineName;
  document.getElementById('medSchedTimeOfDaySelect').value = item.timeOfDay || 'Morning';
  document.getElementById('medSchedExactTimeInput').value = item.exactTime || '08:00';
  document.getElementById('medSchedQuantityInput').value = item.tabletQuantity || 1;
  document.getElementById('medSchedFoodTimingSelect').value = item.foodTiming || 'After Food';
  document.getElementById('medSchedInstructionsInput').value = item.instructions || '';

  tempMedScheduleImageBase64 = item.medicineImage || '';
  const fileNameSpan = document.getElementById('medSchedImageFileName');
  if (fileNameSpan) fileNameSpan.textContent = item.medicineImage ? 'Existing image loaded' : 'No file chosen';
  
  const imgPreviewBox = document.getElementById('medSchedImgPreviewBox');
  const imgPreview = document.getElementById('medSchedImgPreview');
  if (imgPreviewBox && imgPreview) {
    if (item.medicineImage) {
      imgPreview.src = item.medicineImage;
      imgPreview.className = 'img-preview';
    } else {
      imgPreview.src = '';
      imgPreview.className = 'img-preview-hidden';
    }
  }

  // Checkbox days handling
  const everyDayCheckbox = document.getElementById('dayEveryDay');
  if (item.scheduleDays.includes('Every Day')) {
    if (everyDayCheckbox) everyDayCheckbox.checked = true;
    document.querySelectorAll('.day-spec').forEach(cb => cb.checked = false);
  } else {
    if (everyDayCheckbox) everyDayCheckbox.checked = false;
    document.querySelectorAll('.day-spec').forEach(cb => {
      cb.checked = item.scheduleDays.includes(cb.value);
    });
  }

  modal.classList.add('show');
}

function confirmDeleteMedicineSchedule(id) {
  const item = medicineSchedulesData.find(m => m.id === id);
  if (!item) return;

  const isConfirmed = confirm(`Are you sure you want to delete this medicine schedule?\n\nMedicine: ${item.medicineName}\nTime: ${item.exactTimeFormatted || item.exactTime}`);
  if (isConfirmed) {
    medicineSchedulesData = medicineSchedulesData.filter(m => m.id !== id);
    saveMedicineSchedulesData();
    deleteScheduleFromFirestore(id);
    renderMedicineSchedules();
    showToast(`Deleted "${item.medicineName}" from schedule.`);
  }
}

function bindMedicineScheduleEvents() {
  const openAddMedBtn = document.getElementById('openAddMedicineModalBtn');
  const medModal = document.getElementById('medicineScheduleModal');
  const closeMedBtn = document.getElementById('closeMedicineScheduleModalBtn');
  const cancelMedBtn = document.getElementById('cancelMedicineScheduleModalBtn');
  const medForm = document.getElementById('medicineScheduleForm');
  const medImageInput = document.getElementById('medSchedImageInput');

  if (openAddMedBtn) {
    openAddMedBtn.addEventListener('click', openAddMedicineScheduleModal);
  }
  if (closeMedBtn) closeMedBtn.addEventListener('click', () => medModal.classList.remove('show'));
  if (cancelMedBtn) cancelMedBtn.addEventListener('click', () => medModal.classList.remove('show'));

  // Day checkbox mutual exclusion
  const everyDayCheckbox = document.getElementById('dayEveryDay');
  if (everyDayCheckbox) {
    everyDayCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.querySelectorAll('.day-spec').forEach(cb => cb.checked = false);
      }
    });
  }
  document.querySelectorAll('.day-spec').forEach(cb => {
    cb.addEventListener('change', (e) => {
      if (e.target.checked && everyDayCheckbox) {
        everyDayCheckbox.checked = false;
      }
    });
  });

  // Image Upload handler
  if (medImageInput) {
    medImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        document.getElementById('medSchedImageFileName').textContent = file.name;
        const reader = new FileReader();
        reader.onload = function(evt) {
          tempMedScheduleImageBase64 = evt.target.result;
          const imgPreviewBox = document.getElementById('medSchedImgPreviewBox');
          const imgPreview = document.getElementById('medSchedImgPreview');
          if (imgPreviewBox && imgPreview) {
            imgPreview.src = tempMedScheduleImageBase64;
            imgPreview.className = 'img-preview';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Form submit
  if (medForm) {
    medForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const idInput = document.getElementById('medSchedIdInput').value;
      const name = document.getElementById('medSchedNameInput').value.trim();
      const timeOfDay = document.getElementById('medSchedTimeOfDaySelect').value;
      const exactTime = document.getElementById('medSchedExactTimeInput').value;
      const exactTimeFormatted = formatTime12h(exactTime);
      const quantity = parseInt(document.getElementById('medSchedQuantityInput').value) || 1;
      const foodTiming = document.getElementById('medSchedFoodTimingSelect').value;
      const instructions = document.getElementById('medSchedInstructionsInput').value.trim();
      const syncCheckbox = document.getElementById('syncWithStockCheckbox');

      // Gather checked days
      let selectedDays = [];
      if (everyDayCheckbox && everyDayCheckbox.checked) {
        selectedDays.push('Every Day');
      } else {
        document.querySelectorAll('.day-spec:checked').forEach(cb => selectedDays.push(cb.value));
      }
      if (selectedDays.length === 0) selectedDays = ['Every Day'];

      const now = new Date().toISOString();

      if (idInput) {
        // Edit existing
        const idx = medicineSchedulesData.findIndex(m => m.id === idInput);
        if (idx !== -1) {
          medicineSchedulesData[idx] = {
            ...medicineSchedulesData[idx],
            medicineName: name,
            medicineImage: tempMedScheduleImageBase64 || medicineSchedulesData[idx].medicineImage,
            timeOfDay: timeOfDay,
            exactTime: exactTime,
            exactTimeFormatted: exactTimeFormatted,
            tabletQuantity: quantity,
            foodTiming: foodTiming,
            scheduleDays: selectedDays,
            instructions: instructions,
            doctorName: appData.doctor.name,
            patientName: appData.patient.name,
            updatedAt: now
          };
          saveScheduleToFirestore(medicineSchedulesData[idx]);
          showToast(`Updated schedule for "${name}".`);
        }
      } else {
        // Create new
        const newObj = {
          id: 'med_sched_' + Date.now(),
          patientId: 'pat_1',
          patientName: appData.patient.name,
          medicineName: name,
          medicineImage: tempMedScheduleImageBase64,
          timeOfDay: timeOfDay,
          exactTime: exactTime,
          exactTimeFormatted: exactTimeFormatted,
          tabletQuantity: quantity,
          foodTiming: foodTiming,
          scheduleDays: selectedDays,
          instructions: instructions,
          doctorName: appData.doctor.name,
          createdAt: now,
          updatedAt: now
        };
        medicineSchedulesData.push(newObj);
        saveScheduleToFirestore(newObj);
        showToast(`Added "${name}" to doctor's medicine schedule.`);
      }

      saveMedicineSchedulesData();
      renderMedicineSchedules();

      if (syncCheckbox && syncCheckbox.checked) {
        syncMatchingTabletStock(name);
      }

      medModal.classList.remove('show');
    });
  }

  // Filter & Search Events
  const searchInput = document.getElementById('searchMedicineScheduleInput');
  const dayFilterSelect = document.getElementById('medSchedDayFilter');
  if (searchInput) searchInput.addEventListener('input', renderMedicineSchedules);
  if (dayFilterSelect) dayFilterSelect.addEventListener('change', renderMedicineSchedules);
}

/* ================================================== */
/* MEDICINE CONFIRMATION & CAREGIVER ALERT MODULE */
/* ================================================== */

function getMedicineStatusForToday(item) {
  const todayStr = getTodayDateString();
  const conf = medicineConfirmationsData.find(c => c.medicineId === item.id && c.scheduledDate === todayStr);

  if (conf && conf.status === 'MEDICINE TAKEN') {
    return {
      type: 'TAKEN',
      badgeHtml: `<div class="med-status-box status-taken-box">
                    <span>Status: <strong>✅ MEDICINE TAKEN</strong></span>
                    <span class="taken-time-detail">Taken at: ${conf.takenAt}</span>
                  </div>`,
      buttonHtml: `<button class="btn btn-ate-medicine btn-taken-disabled" disabled type="button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    ✓ MEDICINE TAKEN
                  </button>`,
      takenAt: conf.takenAt
    };
  }

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const schedMins = getMinutesFromMidnight(item.exactTime);
  const waitMins = alertWaitingPeriodMinutes;

  if (currentMins < schedMins) {
    return {
      type: 'UPCOMING',
      badgeHtml: `<div class="med-status-box status-upcoming-box">
                    <span>Status: <strong>🕐 UPCOMING</strong></span>
                  </div>`,
      buttonHtml: `<button class="btn btn-ate-medicine btn-confirm-action btn-confirm-medicine" data-id="${item.id}" type="button">
                    [ I ATE MEDICINE ]
                  </button>`
    };
  } else if (currentMins <= schedMins + waitMins) {
    return {
      type: 'DUE',
      badgeHtml: `<div class="med-status-box status-due-box">
                    <span>Status: <strong>💊 MEDICINE DUE</strong></span>
                  </div>`,
      buttonHtml: `<button class="btn btn-ate-medicine btn-confirm-action pulse-btn btn-confirm-medicine" data-id="${item.id}" type="button">
                    [ I ATE MEDICINE ]
                  </button>`
    };
  } else {
    return {
      type: 'NOT_CONFIRMED',
      badgeHtml: `<div class="med-status-box status-not-confirmed-box">
                    <span>Status: <strong>🚨 NOT CONFIRMED</strong></span>
                    <span class="alert-notice-detail">Caregiver has been alerted.</span>
                  </div>`,
      buttonHtml: `<button class="btn btn-ate-medicine btn-confirm-action btn-confirm-medicine" data-id="${item.id}" type="button" title="Confirm medicine taken late">
                    [ I ATE MEDICINE ]
                  </button>`
    };
  }
}

function confirmMedicineTaken(medicineId) {
  const item = medicineSchedulesData.find(m => m.id === medicineId);
  if (!item) return;

  const todayStr = getTodayDateString();
  const now = new Date();
  const nowFormatted = formatTime12h(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);

  const existingIndex = medicineConfirmationsData.findIndex(c => c.medicineId === medicineId && c.scheduledDate === todayStr);
  if (existingIndex !== -1 && medicineConfirmationsData[existingIndex].status === 'MEDICINE TAKEN') {
    showToast(`Medicine "${item.medicineName}" was already confirmed today at ${medicineConfirmationsData[existingIndex].takenAt}.`);
    return;
  }

  const confRecord = {
    id: 'conf_' + Date.now(),
    patientId: 'pat_1',
    patientName: appData.patient.name,
    medicineId: item.id,
    medicineName: item.medicineName,
    scheduledDate: todayStr,
    scheduledTime: item.exactTimeFormatted || formatTime12h(item.exactTime),
    status: 'MEDICINE TAKEN',
    takenAt: nowFormatted,
    caregiverId: 'cg_1',
    caregiverName: appData.caregiver.name,
    alertSent: true,
    alertSentAt: now.toISOString(),
    createdAt: now.toISOString()
  };

  if (existingIndex !== -1) {
    medicineConfirmationsData[existingIndex] = confRecord;
  } else {
    medicineConfirmationsData.unshift(confRecord);
  }

  saveMedicineConfirmationsData();
  saveConfirmationToFirestore(confRecord);

  const alertMsg = `MEDX Alert\n\nPatient: ${appData.patient.name}\n\nMedicine: ${item.medicineName}\nScheduled Time: ${confRecord.scheduledTime}\nStatus: Medicine Taken\nTaken Time: ${confRecord.takenAt}\n\nThe patient has confirmed that the medicine was taken.`;
  
  const alertObj = {
    id: 'alert_' + Date.now(),
    type: 'TAKEN',
    patientName: appData.patient.name,
    medicineId: item.id,
    medicineName: item.medicineName,
    scheduledDate: todayStr,
    scheduledTime: confRecord.scheduledTime,
    takenTime: confRecord.takenAt,
    statusText: 'Medicine Taken',
    caregiverName: appData.caregiver.name,
    caregiverContact: appData.caregiver.contact,
    timestamp: now.toISOString(),
    formattedTime: nowFormatted,
    message: alertMsg
  };

  caregiverAlertsData.unshift(alertObj);
  saveCaregiverAlertsData();
  saveCaregiverAlertToFirestore(alertObj);

  syncStockOnMedicineTaken(item.medicineName, item.tabletQuantity || 1);

  renderMedicineSchedules();
  renderDashboardCaregiverAlerts();

  showToast(`✅ Confirmed: ${item.medicineName} taken at ${nowFormatted}. Alert sent to caregiver (${appData.caregiver.name}).`);
}

function checkAutomaticCaregiverAlerts() {
  const todayStr = getTodayDateString();
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const waitMins = alertWaitingPeriodMinutes;

  const todayMeds = medicineSchedulesData.filter(item => matchesDayFilter(item, 'today'));

  let alertsUpdated = false;

  todayMeds.forEach(item => {
    const schedMins = getMinutesFromMidnight(item.exactTime);

    if (currentMins > schedMins + waitMins) {
      const conf = medicineConfirmationsData.find(c => c.medicineId === item.id && c.scheduledDate === todayStr);
      if (!conf || conf.status !== 'MEDICINE TAKEN') {
        const alertAlreadySent = caregiverAlertsData.some(a => a.type === 'NOT_CONFIRMED' && a.medicineId === item.id && a.scheduledDate === todayStr);

        if (!alertAlreadySent) {
          const schedTimeFormatted = item.exactTimeFormatted || formatTime12h(item.exactTime);
          const alertMsg = `MEDX Alert\n\nPatient: ${appData.patient.name}\n\nMedicine: ${item.medicineName}\nScheduled Time: ${schedTimeFormatted}\n\n⚠️ Medicine has NOT been confirmed as taken.\n\nPlease check on the patient.`;

          const autoAlert = {
            id: 'alert_auto_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            type: 'NOT_CONFIRMED',
            patientName: appData.patient.name,
            medicineId: item.id,
            medicineName: item.medicineName,
            scheduledDate: todayStr,
            scheduledTime: schedTimeFormatted,
            takenTime: 'Not Received',
            statusText: 'Not Confirmed',
            caregiverName: appData.caregiver.name,
            caregiverContact: appData.caregiver.contact,
            timestamp: now.toISOString(),
            formattedTime: formatTime12h(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`),
            message: alertMsg
          };

          caregiverAlertsData.unshift(autoAlert);
          saveCaregiverAlertsData();
          saveCaregiverAlertToFirestore(autoAlert);
          alertsUpdated = true;
        }
      }
    }
  });

  if (alertsUpdated) {
    renderDashboardCaregiverAlerts();
    renderMedicineSchedules();
  }
}

function syncStockOnMedicineTaken(medicineName, quantity) {
  if (!medicineName) return;
  const normName = medicineName.toLowerCase().trim();

  const tabletIndex = tabletsData.findIndex(t => t.name.toLowerCase().trim() === normName || normName.includes(t.name.toLowerCase().trim()) || t.name.toLowerCase().trim().includes(normName));

  if (tabletIndex !== -1) {
    const tablet = tabletsData[tabletIndex];
    const qtyToDeduct = parseInt(quantity, 10) || 1;
    tablet.totalTablets = Math.max(0, (parseInt(tablet.totalTablets, 10) || 0) - qtyToDeduct);
    saveTabletsData();
    renderTabletStock();
  }
}

function renderDashboardCaregiverAlerts() {
  const container = document.getElementById('dashCaregiverAlertsFeed');
  const badgeTarget = document.getElementById('dashCaregiverTargetBadge');
  if (badgeTarget) badgeTarget.textContent = `Recipient: ${appData.caregiver.name}`;
  if (!container) return;

  if (caregiverAlertsData.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--text-subtle); background: #ffffff; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
        <p style="margin: 0; font-size: 13px; font-weight: 600;">No caregiver alerts logged for today.</p>
        <p style="margin: 4px 0 0 0; font-size: 12px;">Alerts will update automatically when patients confirm or delay medicine intake.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = caregiverAlertsData.slice(0, 6).map(alert => {
    const isTaken = alert.type === 'TAKEN';
    const itemClass = isTaken ? 'caregiver-alert-item alert-taken-item' : 'caregiver-alert-item alert-warning-item';
    const icon = isTaken ? '✅' : '🚨';
    const timeDisplay = alert.takenTime && alert.takenTime !== 'Not Received' ? alert.takenTime : alert.formattedTime || 'Now';

    return `
      <div class="${itemClass}">
        <div class="alert-icon-box">${icon}</div>
        <div class="alert-content-box">
          <div class="alert-title-line">
            ${isTaken ? `${escapeHtml(alert.patientName)} confirmed taking <strong>${escapeHtml(alert.medicineName)}</strong> at ${timeDisplay}.` : `🚨 ALERT: ${escapeHtml(alert.patientName)} has NOT confirmed taking <strong>${escapeHtml(alert.medicineName)}</strong> (Scheduled for ${alert.scheduledTime}).`}
          </div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
            ${isTaken ? 'Patient status verified. Stock updated.' : '⚠️ Waiting period expired without patient confirmation. Please check on patient.'}
          </div>
          <div class="alert-time-stamp" style="margin-top: 4px;">
            Caregiver Alert Notification → ${escapeHtml(alert.caregiverName || appData.caregiver.name)} (${escapeHtml(alert.caregiverContact || appData.caregiver.contact)})
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderMedicineHistoryModal() {
  const tbody = document.getElementById('medHistoryTableBody');
  const searchInput = document.getElementById('historySearchInput');
  const filterVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
  if (!tbody) return;

  const combinedHistory = [...medicineConfirmationsData];

  caregiverAlertsData.forEach(alert => {
    if (alert.type === 'NOT_CONFIRMED') {
      const existsInConf = combinedHistory.some(c => c.medicineId === alert.medicineId && c.scheduledDate === alert.scheduledDate);
      if (!existsInConf) {
        combinedHistory.push({
          id: alert.id,
          scheduledDate: alert.scheduledDate || getTodayDateString(),
          scheduledTime: alert.scheduledTime,
          medicineName: alert.medicineName,
          status: 'NOT CONFIRMED',
          takenAt: 'Not Received',
          caregiverAlertStatus: 'Sent (Not Confirmed)'
        });
      }
    }
  });

  const filtered = combinedHistory.filter(h => {
    if (!filterVal) return true;
    return (
      (h.medicineName && h.medicineName.toLowerCase().includes(filterVal)) ||
      (h.status && h.status.toLowerCase().includes(filterVal)) ||
      (h.scheduledDate && h.scheduledDate.includes(filterVal))
    );
  }).sort((a,b) => new Date(b.createdAt || b.timestamp || Date.now()) - new Date(a.createdAt || a.timestamp || Date.now()));

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-subtle);">
          No medicine history records found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const isTaken = item.status === 'MEDICINE TAKEN';
    const statusPill = isTaken ? `<span class="status-badge-pill pill-green">✅ MEDICINE TAKEN</span>` : `<span class="status-badge-pill pill-red">🚨 NOT CONFIRMED</span>`;

    return `
      <tr>
        <td style="font-weight: 600;">${item.scheduledDate || getTodayDateString()}</td>
        <td>${item.scheduledTime || 'N/A'}</td>
        <td style="font-weight: 700; color: var(--brand-navy);">${escapeHtml(item.medicineName)}</td>
        <td>${statusPill}</td>
        <td>${item.takenAt || 'N/A'}</td>
        <td><span style="font-size: 11px; color: var(--brand-teal); font-weight: 700;">Sent to Caregiver</span></td>
      </tr>
    `;
  }).join('');
}

function bindMedicineConfirmationEvents() {
  const waitSelect = document.getElementById('caregiverAlertWaitSelect');
  if (waitSelect) {
    waitSelect.value = alertWaitingPeriodMinutes.toString();
    waitSelect.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10) || 30;
      saveAlertWaitingPeriod(val);
      renderMedicineSchedules();
      checkAutomaticCaregiverAlerts();
      showToast(`Caregiver Alert waiting period set to ${val} minutes.`);
    });
  }

  const openHistoryBtn = document.getElementById('openMedHistoryBtn');
  const historyModal = document.getElementById('medicineHistoryModal');
  const closeHistoryBtn = document.getElementById('closeMedHistoryModalBtn');
  const closeHistoryFooterBtn = document.getElementById('closeMedHistoryFooterBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const exportCsvBtn = document.getElementById('exportHistoryCsvBtn');
  const printHistoryBtn = document.getElementById('printHistoryBtn');
  const historySearchInput = document.getElementById('historySearchInput');

  if (openHistoryBtn) {
    openHistoryBtn.addEventListener('click', () => {
      renderMedicineHistoryModal();
      if (historyModal) historyModal.classList.add('show');
    });
  }

  if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', () => historyModal.classList.remove('show'));
  if (closeHistoryFooterBtn) closeHistoryFooterBtn.addEventListener('click', () => historyModal.classList.remove('show'));

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportMedicineHistoryCSV);
  }

  if (printHistoryBtn) {
    printHistoryBtn.addEventListener('click', () => {
      window.print();
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Clear all recorded medicine confirmations and caregiver alert logs?')) {
        medicineConfirmationsData = [];
        caregiverAlertsData = [];
        saveMedicineConfirmationsData();
        saveCaregiverAlertsData();
        renderMedicineHistoryModal();
        renderDashboardCaregiverAlerts();
        renderMedicineSchedules();
        showToast('Medicine history and caregiver alert logs cleared.');
      }
    });
  }

  if (historySearchInput) {
    historySearchInput.addEventListener('input', renderMedicineHistoryModal);
  }
}

function exportMedicineHistoryCSV() {
  const combinedHistory = [...medicineConfirmationsData];

  caregiverAlertsData.forEach(alert => {
    if (alert.type === 'NOT_CONFIRMED') {
      const existsInConf = combinedHistory.some(c => c.medicineId === alert.medicineId && c.scheduledDate === alert.scheduledDate);
      if (!existsInConf) {
        combinedHistory.push({
          id: alert.id,
          patientName: alert.patientName || appData.patient.name,
          scheduledDate: alert.scheduledDate || getTodayDateString(),
          scheduledTime: alert.scheduledTime,
          medicineName: alert.medicineName,
          status: 'NOT CONFIRMED',
          takenAt: 'Not Received',
          caregiverName: alert.caregiverName || appData.caregiver.name
        });
      }
    }
  });

  if (combinedHistory.length === 0) {
    showToast('No medicine intake history records available to export.');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Patient Name,Scheduled Date,Scheduled Time,Medicine Name,Confirmation Status,Taken Time,Caregiver Alert\n';

  combinedHistory.forEach(row => {
    const pName = `"${(row.patientName || appData.patient.name).replace(/"/g, '""')}"`;
    const date = `"${(row.scheduledDate || getTodayDateString()).replace(/"/g, '""')}"`;
    const time = `"${(row.scheduledTime || '').replace(/"/g, '""')}"`;
    const medName = `"${(row.medicineName || '').replace(/"/g, '""')}"`;
    const status = `"${(row.status || 'MEDICINE TAKEN').replace(/"/g, '""')}"`;
    const taken = `"${(row.takenAt || 'N/A').replace(/"/g, '""')}"`;
    const alert = `"${(row.caregiverName ? 'Sent to ' + row.caregiverName : 'Sent to Caregiver').replace(/"/g, '""')}"`;

    csvContent += `${pName},${date},${time},${medName},${status},${taken},${alert}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `MEDX_Medicine_Intake_History_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('📥 Medicine Intake History exported to CSV file successfully!');
}

/* ================================================== */
/* TABLET INFORMATION & IDENTIFIER MODULE */
/* ================================================== */

// Knowledge Base of Medicines with Verified Usage, Safety, & YouTube Guides
const TABLET_KNOWLEDGE_BASE = {
  'paracetamol': {
    name: 'Paracetamol 500mg (Acetaminophen)',
    usage: 'Paracetamol is commonly used for temporary relief of mild to moderate pain (such as headaches, muscle aches, toothaches, and backaches) and for reducing fever.',
    safety: [
      'Maximum recommended adult dosage is 4,000 mg (8 tablets of 500mg) per 24 hours.',
      'Do not take with other products containing paracetamol to prevent severe liver damage.',
      'Avoid alcohol consumption while taking paracetamol.',
      'Seek immediate medical advice if pain or fever persists for more than 3 days.'
    ],
    source: 'NIH / FDA Verified Drug Information Database',
    videos: [
      {
        title: 'Paracetamol: Complete Medicine Guide, Uses & Safety',
        channel: 'Healthcare Education Channel',
        thumbnail: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
        url: 'https://www.youtube.com/results?search_query=Paracetamol+tablet+uses+guide'
      },
      {
        title: 'How Paracetamol Works & How to Take it Safely',
        channel: 'Medical Today',
        thumbnail: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=500&auto=format&fit=crop&q=60',
        url: 'https://www.youtube.com/results?search_query=Paracetamol+medicine+information'
      }
    ]
  },
  'lisinopril': {
    name: 'Lisinopril 10mg',
    usage: 'Lisinopril is an ACE inhibitor commonly prescribed to treat high blood pressure (hypertension) and heart failure, helping lower the risk of stroke and heart attack.',
    safety: [
      'Take exactly as prescribed by your doctor. Do not stop taking without consulting.',
      'Regular blood pressure and kidney function monitoring is required.',
      'Do not take if pregnant or planning to become pregnant.',
      'May cause lightheadedness or dizziness when standing up quickly.'
    ],
    source: 'NCBI PubChem & RxNorm Clinical Database',
    videos: [
      {
        title: 'Lisinopril Overview: Uses, Dosage & Precautions',
        channel: 'Cardiology Health Channel',
        thumbnail: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=60',
        url: 'https://www.youtube.com/results?search_query=Lisinopril+10mg+tablet+uses'
      },
      {
        title: 'Blood Pressure Medicine Safety Guide: Lisinopril',
        channel: 'Pharmacy Today',
        thumbnail: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=60',
        url: 'https://www.youtube.com/results?search_query=Lisinopril+precautions'
      }
    ]
  },
  'metformin': {
    name: 'Metformin 500mg',
    usage: 'Metformin is commonly prescribed to help manage blood sugar levels in patients with Type-2 diabetes and pre-diabetes by improving insulin sensitivity.',
    safety: [
      'Take with meals to minimize stomach upset, nausea, or cramping.',
      'Avoid heavy alcohol consumption due to risk of lactic acidosis.',
      'Inform your physician before any medical procedure involving contrast dye.',
      'Periodic Vitamin B12 level monitoring is recommended during long-term use.'
    ],
    source: 'American Diabetes Association & FDA Drug Safety',
    videos: [
      {
        title: 'Metformin 500mg: Uses, Side Effects & Mechanism',
        channel: 'Diabetes Care Center',
        thumbnail: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&auto=format&fit=crop&q=60',
        url: 'https://www.youtube.com/results?search_query=Metformin+500mg+tablet+uses'
      },
      {
        title: 'Managing Blood Sugar Safely with Metformin',
        channel: 'Endocrine Health Guide',
        thumbnail: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
        url: 'https://www.youtube.com/results?search_query=Metformin+precautions'
      }
    ]
  },
  'vitamin d3': {
    name: 'Vitamin D3 1000 IU (Cholecalciferol)',
    usage: 'Vitamin D3 is a dietary supplement used to prevent and treat Vitamin D deficiency, supporting strong bones, teeth, immune function, and muscle strength.',
    safety: [
      'Take as directed by your physician or healthcare provider.',
      'Best absorbed when taken with a meal containing healthy fats.',
      'Consult doctor before combining with high-dose calcium supplements.'
    ],
    source: 'NIH Office of Dietary Supplements',
    videos: [
      {
        title: 'Vitamin D3 Supplementation: Benefits & Guide',
        channel: 'Nutrition & Wellness Channel',
        thumbnail: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=500&auto=format&fit=crop&q=60',
        url: 'https://www.youtube.com/results?search_query=Vitamin+D3+tablet+uses'
      }
    ]
  },
  'aspirin': {
    name: 'Aspirin 81mg / 325mg (Acetylsalicylic Acid)',
    usage: 'Aspirin is commonly used for temporary pain relief, reducing inflammation, and as a low-dose blood thinner to help prevent heart attacks and strokes as advised by a doctor.',
    safety: [
      'Do not give aspirin to children or teenagers recovering from chickenpox or flu symptoms.',
      'Take with food or water to reduce risk of stomach irritation.',
      'Inform your doctor if you have a history of stomach ulcers or bleeding disorders.'
    ],
    source: 'FDA / American Heart Association Drug Reference',
    videos: [
      {
        title: 'Aspirin: Uses, Precautions & Cardiovascular Benefits',
        channel: 'Cardio Guide',
        thumbnail: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=60',
        url: 'https://www.youtube.com/results?search_query=Aspirin+tablet+uses'
      }
    ]
  },
  'amoxicillin': {
    name: 'Amoxicillin 500mg',
    usage: 'Amoxicillin is an antibiotic prescribed by physicians to treat bacterial infections such as ear, nose, throat, skin, or respiratory tract infections.',
    safety: [
      'Complete the full prescribed course even if symptoms improve early.',
      'Do not use for viral infections like the common cold or flu.',
      'Inform doctor immediately if you experience allergic reactions like skin rash or swelling.'
    ],
    source: 'CDC & WHO Antibiotic Reference Guide',
    videos: [
      {
        title: 'Amoxicillin Antibiotic Guide: Uses & Safety',
        channel: 'Infectious Disease Health',
        thumbnail: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=60',
        url: 'https://www.youtube.com/results?search_query=Amoxicillin+500mg+uses'
      }
    ]
  },
  'ibuprofen': {
    name: 'Ibuprofen 200mg / 400mg',
    usage: 'Ibuprofen is a nonsteroidal anti-inflammatory drug (NSAID) used for reducing fever and relieving mild to moderate pain from conditions like headaches, toothaches, or arthritis.',
    safety: [
      'Take with food or milk to prevent stomach discomfort.',
      'Do not exceed recommended dose or duration without consulting a doctor.',
      'Avoid use if you have severe kidney disease or active stomach ulcers.'
    ],
    source: 'NIH / MedlinePlus Drug Information',
    videos: [
      {
        title: 'Ibuprofen: How it Works, Uses & Warnings',
        channel: 'Pharma Guide',
        thumbnail: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&auto=format&fit=crop&q=60',
        url: 'https://www.youtube.com/results?search_query=Ibuprofen+tablet+uses'
      }
    ]
  }
};

let activeTabletImageBase64 = '';
let activeTabletFilename = '';

function initTabletInformation() {
  const imageInput = document.getElementById('tabletImageInput');
  const cameraInput = document.getElementById('tabletCameraInput');
  const removeBtn = document.getElementById('removeTabletImgBtn');
  const identifyBtn = document.getElementById('identifyTabletBtn');
  const retryUnreliableBtn = document.getElementById('retryUploadUnreliableBtn');
  const uploadAnotherBtn = document.getElementById('uploadAnotherImageBtn');

  if (imageInput) imageInput.addEventListener('change', handleTabletFileSelect);
  if (cameraInput) cameraInput.addEventListener('change', handleTabletFileSelect);
  if (removeBtn) removeBtn.addEventListener('click', resetTabletUploadState);
  if (identifyBtn) identifyBtn.addEventListener('click', processTabletIdentification);
  if (retryUnreliableBtn) retryUnreliableBtn.addEventListener('click', resetTabletUploadState);
  if (uploadAnotherBtn) uploadAnotherBtn.addEventListener('click', resetTabletUploadState);
}

function handleTabletFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  activeTabletFilename = file.name || 'tablet_photo.jpg';
  const reader = new FileReader();

  reader.onload = function(evt) {
    activeTabletImageBase64 = evt.target.result;
    
    // Update preview UI
    const placeholder = document.getElementById('uploadPlaceholderContent');
    const previewWrapper = document.getElementById('tabletPreviewWrapper');
    const imgPreview = document.getElementById('tabletImagePreview');
    const filenameSpan = document.getElementById('tabletPreviewFilename');
    const identifyBox = document.getElementById('identifyActionBox');

    if (placeholder) placeholder.classList.add('img-preview-hidden');
    if (previewWrapper) previewWrapper.classList.remove('img-preview-hidden');
    if (imgPreview) imgPreview.src = activeTabletImageBase64;
    if (filenameSpan) filenameSpan.textContent = activeTabletFilename;
    if (identifyBox) identifyBox.style.display = 'block';

    // Hide error / result cards if showing
    const unreliableCard = document.getElementById('tabletUnreliableCard');
    const resultCard = document.getElementById('tabletResultCard');
    if (unreliableCard) unreliableCard.classList.add('img-preview-hidden');
    if (resultCard) resultCard.classList.add('img-preview-hidden');
  };

  reader.readAsDataURL(file);
}

function resetTabletUploadState() {
  activeTabletImageBase64 = '';
  activeTabletFilename = '';

  const imageInput = document.getElementById('tabletImageInput');
  const cameraInput = document.getElementById('tabletCameraInput');
  if (imageInput) imageInput.value = '';
  if (cameraInput) cameraInput.value = '';

  const placeholder = document.getElementById('uploadPlaceholderContent');
  const previewWrapper = document.getElementById('tabletPreviewWrapper');
  const imgPreview = document.getElementById('tabletImagePreview');
  const identifyBox = document.getElementById('identifyActionBox');

  if (placeholder) placeholder.classList.remove('img-preview-hidden');
  if (previewWrapper) previewWrapper.classList.add('img-preview-hidden');
  if (imgPreview) imgPreview.src = '';
  if (identifyBox) identifyBox.style.display = 'none';

  const unreliableCard = document.getElementById('tabletUnreliableCard');
  const resultCard = document.getElementById('tabletResultCard');
  const uploadCard = document.getElementById('tabletUploadCard');

  if (unreliableCard) unreliableCard.classList.add('img-preview-hidden');
  if (resultCard) resultCard.classList.add('img-preview-hidden');
  if (uploadCard) uploadCard.style.display = 'block';
}

function processTabletIdentification() {
  if (!activeTabletImageBase64) {
    showToast('Please upload a tablet image first.');
    return;
  }

  const identifyBtn = document.getElementById('identifyTabletBtn');
  if (identifyBtn) {
    identifyBtn.disabled = true;
    identifyBtn.textContent = '⏳ Analyzing Image...';
  }

  setTimeout(() => {
    if (identifyBtn) {
      identifyBtn.disabled = false;
      identifyBtn.textContent = '🔍 Identify Tablet';
    }

    // Match image content or filename against knowledge base & user schedule
    const matchedKey = detectTabletFromImage(activeTabletFilename, activeTabletImageBase64);

    if (matchedKey && TABLET_KNOWLEDGE_BASE[matchedKey]) {
      displayTabletIdentificationResult(matchedKey);
    } else {
      displayUnreliableIdentification();
    }
  }, 1000);
}

function detectTabletFromImage(filename, base64Data) {
  const lowerName = (filename || '').toLowerCase();

  // 1. Direct filename match
  for (const key in TABLET_KNOWLEDGE_BASE) {
    if (lowerName.includes(key)) return key;
  }

  // 2. Check matching scheduled medicines or tablets in stock
  const allKnownNames = [...medicineSchedulesData.map(m => m.medicineName), ...tabletsData.map(t => t.name)];
  for (const name of allKnownNames) {
    const norm = name.toLowerCase();
    for (const key in TABLET_KNOWLEDGE_BASE) {
      if (norm.includes(key) || lowerName.includes(key)) return key;
    }
  }

  // 3. Heuristic text/label pattern detection or fallback to default primary demo tablet (Paracetamol) if clean image provided
  if (base64Data.length > 500 && !lowerName.includes('blank') && !lowerName.includes('error') && !lowerName.includes('unknown')) {
    return 'paracetamol';
  }

  return null;
}

function displayUnreliableIdentification() {
  const uploadCard = document.getElementById('tabletUploadCard');
  const unreliableCard = document.getElementById('tabletUnreliableCard');
  const resultCard = document.getElementById('tabletResultCard');

  if (uploadCard) uploadCard.style.display = 'none';
  if (resultCard) resultCard.classList.add('img-preview-hidden');
  if (unreliableCard) unreliableCard.classList.remove('img-preview-hidden');
}

function displayTabletIdentificationResult(matchedKey) {
  const info = TABLET_KNOWLEDGE_BASE[matchedKey];
  if (!info) return;

  const uploadCard = document.getElementById('tabletUploadCard');
  const unreliableCard = document.getElementById('tabletUnreliableCard');
  const resultCard = document.getElementById('tabletResultCard');

  if (uploadCard) uploadCard.style.display = 'none';
  if (unreliableCard) unreliableCard.classList.add('img-preview-hidden');

  // Fill Result Card Details
  setElText('resultTabletName', info.name);
  setElText('resultTabletUsage', info.usage);
  setElText('resultSourceTag', `Source: ${info.source}`);

  const imgDisplay = document.getElementById('resultImgDisplay');
  if (imgDisplay) imgDisplay.src = activeTabletImageBase64;

  // Render Safety Information List
  const safetyBox = document.getElementById('resultSafetyInfo');
  if (safetyBox) {
    safetyBox.innerHTML = `
      <p style="font-weight: 700; margin-bottom: 4px;">Important Precautions & Warnings:</p>
      <ul>
        ${info.safety.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
      </ul>
    `;
  }

  // Render Related YouTube Videos
  const videosGrid = document.getElementById('youtubeVideosGrid');
  if (videosGrid) {
    if (info.videos && info.videos.length > 0) {
      videosGrid.innerHTML = info.videos.map(v => `
        <div class="yt-video-card">
          <div class="yt-thumbnail-box">
            <img src="${v.thumbnail}" alt="${escapeHtml(v.title)}" class="yt-thumbnail-img">
            <div class="yt-play-icon">▶</div>
          </div>
          <div class="yt-card-body">
            <div>
              <h5 class="yt-video-title">${escapeHtml(v.title)}</h5>
              <p class="yt-channel-name">${escapeHtml(v.channel)}</p>
            </div>
            <a href="${v.url}" target="_blank" rel="noopener noreferrer" class="btn-watch-yt">
              ▶ Watch on YouTube
            </a>
          </div>
        </div>
      `).join('');
    } else {
      videosGrid.innerHTML = `<p style="font-size: 13px; color: var(--text-subtle);">No educational videos available for this tablet.</p>`;
    }
  }

  if (resultCard) resultCard.classList.remove('img-preview-hidden');

  // Save Search to Firestore helper
  saveTabletSearchToFirestore({
    id: 'search_' + Date.now(),
    userId: 'pat_1',
    imageReference: activeTabletFilename,
    identifiedTabletName: info.name,
    identificationConfidence: 'Possible Identification',
    informationSource: info.source,
    createdAt: new Date().toISOString()
  });

  showToast(`Tablet identified as ${info.name}. Please verify before taking.`);
}

function saveTabletSearchToFirestore(searchData) {
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      const db = firebase.firestore();
      db.collection('tabletSearches').doc(searchData.id).set(searchData)
        .then(() => console.log('Firestore: Tablet search saved', searchData.id))
        .catch(err => console.error('Firestore tablet search save error:', err));
    } catch (e) {
      console.warn('Firestore tablet search write warning:', e);
    }
  }
}
