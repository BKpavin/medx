/**
 * MEDX - Patient Healthcare Management System
 * Pure Vanilla JavaScript Implementation
 */

// LocalStorage Persistence Key
const STORAGE_KEY = 'MEDX_PATIENT_DATA_V1';

// Default Initial Demo Data Structure
const DEFAULT_DATA = {
  patient: {
    name: 'Eleanor Vance',
    age: 65,
    gender: 'Female',
    contact: '+1 (555) 892-1049 • eleanor.vance@example.com',
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

// Global App State
let appData = loadAppData();

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
  bindModalEvents();
  bindActionEvents();
});

// Load App Data from LocalStorage with Fallback
function loadAppData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Error loading LocalStorage:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

// Save App Data to LocalStorage
function saveAppData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (err) {
    console.error('Error saving LocalStorage:', err);
  }
}

/**
 * 6 & 12. Calculate Patient Health Ratio (%)
 * Dynamic formula based on doctor-entered vitals parameters.
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

  // Weighted Health Ratio
  const totalRatio = Math.round(bpScore * 0.4 + sugarScore * 0.35 + weightScore * 0.25);
  // Cap between 60% and 99%
  return Math.min(Math.max(totalRatio, 60), 99);
}

/**
 * Render All Dashboard Sections with Active Data
 */
function renderDashboard() {
  const p = appData.patient;
  const d = appData.doctor;
  const c = appData.caregiver;
  const m = appData.medical;
  const s = appData.suggestions;
  const f = appData.foodSchedule;

  // 1. TOP HEADER: DOCTOR & CAREGIVER DETAILS
  document.getElementById('headerDocName').textContent = d.name;
  document.getElementById('headerDocSpec').textContent = `Specialization: ${d.specialization}`;
  document.getElementById('headerDocClinic').textContent = `Hospital/Clinic: ${d.clinic}`;
  document.getElementById('headerDocContact').textContent = `Contact: ${d.contact}`;

  document.getElementById('headerCaregiverName').textContent = c.name;
  document.getElementById('headerCaregiverRel').textContent = `Relationship: ${c.relationship}`;
  document.getElementById('headerCaregiverContact').textContent = `Contact Number: ${c.contact}`;

  // 2. REGISTERED PATIENT
  const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PT';
  document.getElementById('dashPatientAvatar').textContent = initials;
  document.getElementById('dashPatientName').textContent = p.name;
  document.getElementById('dashPatientAge').textContent = `${p.age} Years`;
  document.getElementById('dashPatientGender').textContent = p.gender || 'Not Specified';
  document.getElementById('dashPatientContact').textContent = p.contact;

  // Calculate & Render Health Ratio
  const healthRatio = calculateHealthRatio(m);
  document.getElementById('dashPatientRatioInline').textContent = `${healthRatio}% (Stable & Doctor Monitored)`;
  document.getElementById('dashRatioBigNumber').textContent = `${healthRatio}%`;

  const ratioBadge = document.getElementById('ratioStatusBadge');
  if (ratioBadge) {
    if (healthRatio >= 85) {
      ratioBadge.textContent = 'Optimal Status';
      ratioBadge.className = 'card-badge badge-green';
    } else {
      ratioBadge.textContent = 'Moderate Care';
      ratioBadge.className = 'card-badge badge-blue';
    }
  }

  // 3. PATIENT DETAILS GIVEN BY DOCTOR
  document.getElementById('dashDiagnosis').textContent = m.diagnosis;
  document.getElementById('dashBp').textContent = m.bp ? `${m.bp} mmHg` : 'N/A';
  document.getElementById('dashSugar').textContent = m.sugar ? `${m.sugar} mg/dL` : 'N/A';
  document.getElementById('dashWeight').textContent = m.weight ? `${m.weight} kg` : 'N/A';
  document.getElementById('dashOtherHealth').textContent = m.otherHealth;

  // 4. DOCTOR SUGGESTIONS
  document.getElementById('dashMedicines').textContent = s.medicines;
  document.getElementById('dashExercise').textContent = s.exercise;
  document.getElementById('dashRest').textContent = s.rest;
  document.getElementById('dashInstructions').textContent = s.instructions;

  // 5. FOOD SCHEDULE
  document.getElementById('dashBreakfast').textContent = f.breakfast;
  document.getElementById('dashLunch').textContent = f.lunch;
  document.getElementById('dashSnack').textContent = f.snack;
  document.getElementById('dashDinner').textContent = f.dinner;

  // Render HTML5 Canvas Health Trend Graph
  drawHealthTrendGraph(healthRatio);
}

/**
 * 6. Draw Health Ratio Trend Graph on HTML5 Canvas
 */
function drawHealthTrendGraph(currentRatio) {
  const canvas = document.getElementById('healthTrendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Handle high resolution canvas crisp rendering
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  // Background Grid Lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;

  for (let y = 30; y < height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Target Baseline 80% line
  const targetY = height - (80 / 100) * (height - 30) - 15;
  ctx.strokeStyle = 'rgba(9, 53, 122, 0.25)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, targetY);
  ctx.lineTo(width, targetY);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  // Data Trend Points (simulate weekly historical ratio trend ending at currentRatio)
  const historical = [
    currentRatio - 6,
    currentRatio - 4,
    currentRatio - 2,
    currentRatio - 5,
    currentRatio - 1,
    currentRatio
  ];

  const paddingX = 30;
  const stepX = (width - paddingX * 2) / (historical.length - 1);

  // Gradient under curve
  const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
  fillGradient.addColorStop(0, 'rgba(2, 132, 199, 0.35)');
  fillGradient.addColorStop(1, 'rgba(2, 132, 199, 0.0)');

  ctx.beginPath();
  historical.forEach((val, i) => {
    const x = paddingX + i * stepX;
    const y = height - (val / 100) * (height - 30) - 15;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  // Complete path for fill
  const lastX = paddingX + (historical.length - 1) * stepX;
  ctx.lineTo(lastX, height);
  ctx.lineTo(paddingX, height);
  ctx.closePath();
  ctx.fillStyle = fillGradient;
  ctx.fill();

  // Draw Line Curve
  ctx.beginPath();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  historical.forEach((val, i) => {
    const x = paddingX + i * stepX;
    const y = height - (val / 100) * (height - 30) - 15;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw Data Nodes
  historical.forEach((val, i) => {
    const x = paddingX + i * stepX;
    const y = height - (val / 100) * (height - 30) - 15;

    ctx.beginPath();
    ctx.arc(x, y, i === historical.length - 1 ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = i === historical.length - 1 ? '#09357a' : '#0284c7';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

/**
 * Bind Action Toolbar Events
 */
function bindActionEvents() {
  // Print / Export EHR
  const printBtn = document.getElementById('printEhrBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Reset to Demo Data
  const resetBtn = document.getElementById('resetDemoBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset dashboard data to initial sample patient record?')) {
        appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
        saveAppData();
        renderDashboard();
        showToast('Dashboard reset to default demo data.');
      }
    });
  }
}

/**
 * Bind Patient Registration & Doctor Update Modal Events
 */
function bindModalEvents() {
  // Patient Registration Modal
  const openRegBtn = document.getElementById('openRegisterBtn');
  const regModal = document.getElementById('patientRegisterModal');
  const closeRegBtns = document.querySelectorAll('.closeRegisterModal');
  const regForm = document.getElementById('patientRegisterForm');

  if (openRegBtn) {
    openRegBtn.addEventListener('click', () => {
      document.getElementById('regNameInput').value = appData.patient.name;
      document.getElementById('regAgeInput').value = appData.patient.age;
      document.getElementById('regGenderSelect').value = appData.patient.gender;
      document.getElementById('regContactInput').value = appData.patient.contact;
      document.getElementById('regHealthInfoInput').value = appData.patient.healthInfo;
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
      appData.patient.contact = document.getElementById('regContactInput').value;
      appData.patient.healthInfo = document.getElementById('regHealthInfoInput').value;

      saveAppData();
      renderDashboard();
      regModal.classList.remove('show');
      showToast('New patient registered successfully!');
    });
  }

  // Doctor Update Portal Modal
  const openDocBtn = document.getElementById('openDoctorUpdateBtn');
  const docModal = document.getElementById('doctorUpdateModal');
  const closeDocBtn = document.getElementById('closeDoctorModalBtn');
  const cancelDocBtn = document.getElementById('cancelDoctorModalBtn');
  const docForm = document.getElementById('doctorUpdateForm');

  if (openDocBtn) {
    openDocBtn.addEventListener('click', () => {
      // Pre-fill Doctor & Caregiver Info
      document.getElementById('docNameInput').value = appData.doctor.name;
      document.getElementById('docSpecInput').value = appData.doctor.specialization;
      document.getElementById('docClinicInput').value = appData.doctor.clinic;
      document.getElementById('docContactInput').value = appData.doctor.contact;

      document.getElementById('caregiverNameInput').value = appData.caregiver.name;
      document.getElementById('caregiverRelInput').value = appData.caregiver.relationship;
      document.getElementById('caregiverContactInput').value = appData.caregiver.contact;

      // Pre-fill Medical Info
      document.getElementById('diagInput').value = appData.medical.diagnosis;
      document.getElementById('bpInput').value = appData.medical.bp;
      document.getElementById('sugarInput').value = appData.medical.sugar;
      document.getElementById('weightInput').value = appData.medical.weight;
      document.getElementById('otherHealthInput').value = appData.medical.otherHealth;

      // Pre-fill Suggestions
      document.getElementById('medsInput').value = appData.suggestions.medicines;
      document.getElementById('exerciseInput').value = appData.suggestions.exercise;
      document.getElementById('restInput').value = appData.suggestions.rest;
      document.getElementById('instructionsInput').value = appData.suggestions.instructions;

      // Pre-fill Food Schedule
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

      // Update Doctor & Caregiver Data
      appData.doctor.name = document.getElementById('docNameInput').value;
      appData.doctor.specialization = document.getElementById('docSpecInput').value;
      appData.doctor.clinic = document.getElementById('docClinicInput').value;
      appData.doctor.contact = document.getElementById('docContactInput').value;

      appData.caregiver.name = document.getElementById('caregiverNameInput').value;
      appData.caregiver.relationship = document.getElementById('caregiverRelInput').value;
      appData.caregiver.contact = document.getElementById('caregiverContactInput').value;

      // Update Medical Data
      appData.medical.diagnosis = document.getElementById('diagInput').value;
      appData.medical.bp = document.getElementById('bpInput').value;
      appData.medical.sugar = document.getElementById('sugarInput').value;
      appData.medical.weight = document.getElementById('weightInput').value;
      appData.medical.otherHealth = document.getElementById('otherHealthInput').value;

      // Update Suggestions
      appData.suggestions.medicines = document.getElementById('medsInput').value;
      appData.suggestions.exercise = document.getElementById('exerciseInput').value;
      appData.suggestions.rest = document.getElementById('restInput').value;
      appData.suggestions.instructions = document.getElementById('instructionsInput').value;

      // Update Food Schedule
      appData.foodSchedule.breakfast = document.getElementById('bfInput').value;
      appData.foodSchedule.lunch = document.getElementById('lunchInput').value;
      appData.foodSchedule.snack = document.getElementById('snackInput').value;
      appData.foodSchedule.dinner = document.getElementById('dinnerInput').value;

      saveAppData();
      renderDashboard();
      docModal.classList.remove('show');
      showToast('Doctor records & health ratio updated successfully!');
    });
  }
}

// Toast Helper Function
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
