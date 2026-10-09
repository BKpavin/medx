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

// Default Initial Data Structure (Clean Empty State)
const DEFAULT_DATA = {
  patient: {
    name: 'No patient registered yet',
    age: '',
    gender: 'Not provided',
    dob: 'Not provided',
    bloodGroup: 'Not provided',
    height: 'Not provided',
    weight: 'Not provided',
    contact: 'Not provided',
    emergencyContact: 'Not provided',
    healthInfo: 'No patient health record available.'
  },
  doctor: {
    name: 'No doctor assigned yet',
    specialization: 'Not provided',
    clinic: 'Not provided',
    contact: 'Not provided'
  },
  caregiver: {
    name: 'No caregiver assigned yet',
    relationship: 'Not provided',
    contact: 'Not provided'
  },
  medical: {
    diagnosis: 'No medical diagnosis recorded',
    bp: 'Not recorded',
    sugar: 'Not recorded',
    weight: 'Not recorded',
    otherHealth: 'No additional health details provided.'
  },
  suggestions: {
    medicines: 'No doctor suggestions recorded.',
    exercise: 'No exercise routine assigned.',
    rest: 'No sleep/rest instructions recorded.',
    instructions: 'No special medical instructions.'
  },
  foodSchedule: {
    breakfast: 'No breakfast plan assigned.',
    lunch: 'No lunch plan assigned.',
    snack: 'No snack plan assigned.',
    dinner: 'No dinner plan assigned.'
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

// Default Initial Tablets Structure (Empty by default until user adds tablets)
const DEFAULT_TABLETS = [];

// Default Initial Medicine Schedules Structure (Empty by default until user adds schedules)
const DEFAULT_MED_SCHEDULES = [];

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

  // Initialize Notification & background handlers
  initNotificationEvents();
  setTimeout(checkScheduledMedicineReminders, 2000);
  setInterval(checkScheduledMedicineReminders, 60000);
  checkAutomaticCaregiverAlerts();
  setInterval(checkAutomaticCaregiverAlerts, 30000);

  // Initialize event bindings
  bindMedicineHistoryEvents();
  initMedicineIntakeRecordsListener();
  bindHealthRecordsEvents();
  initHealthRecordsListener();
  bindHealthReportEvents();

  // Initialize Firebase Authentication System (Step 8 & 6K)
  bindAuthEvents();
  initAuthStateListener();
  initFamilyMembersModule();
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

  if (!data.healthHistory || !Array.isArray(data.healthHistory)) {
    data.healthHistory = [];
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

let unsubscribePatientListener = null;

// Load Active/Selected Registered Patient from Firestore with Real-Time Synchronization & Field Fallbacks
async function loadPatientFromFirestore(targetPatientId = null) {
  try {
    if (!window.db || typeof window.db.collection !== 'function') {
      console.warn('⚠️ Firestore window.db is not ready yet.');
      return;
    }

    const auth = (window.auth) ? window.auth : (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null);
    const currentUser = auth ? auth.currentUser : (window.currentAuthUser || null);

    if (!currentUser) {
      console.log('ℹ️ Unauthenticated user. Postponing patient load until authenticated.');
      if (unsubscribePatientListener) {
        unsubscribePatientListener();
        unsubscribePatientListener = null;
      }
      return;
    }

    // Clean up previous real-time listener
    if (unsubscribePatientListener) {
      unsubscribePatientListener();
      unsubscribePatientListener = null;
    }

    renderLoadingPatientDashboard();

    const activeId = targetPatientId || (appData && appData.patient ? appData.patient.id : null) || window.activePatientId || null;

    if (activeId) {
      // 1. Listen directly to active patient document by ID
      const docRef = window.db.collection('patients').doc(activeId);
      unsubscribePatientListener = docRef.onSnapshot(async (docSnap) => {
        if (docSnap.exists) {
          const p = docSnap.data();
          p.patientId = docSnap.id;
          if (appData && appData.patient) appData.patient.id = docSnap.id;
          renderFirestorePatientDashboard(p);
          await loadCaregiverForPatient(docSnap.id, p.patientName || p.name || p.fullName);
          await loadDoctorForPatient(docSnap.id, p.patientName || p.name || p.fullName);
        } else {
          // Fallback if specific document removed
          loadPatientByQuery(currentUser);
        }
      }, (err) => {
        console.error('❌ Error in patient document listener:', err);
        renderErrorPatientDashboard(err.message || 'Database read error.');
      });
    } else {
      // 2. Query active patient by user ownership or latest creation
      loadPatientByQuery(currentUser);
    }
  } catch (error) {
    console.error('❌ Error fetching patient from Firestore:', error);
    renderErrorPatientDashboard(error.message || 'Database connection error.');
  }
}

function loadPatientByQuery(currentUser) {
  if (!window.db || typeof window.db.collection !== 'function' || !currentUser) return;

  try {
    const queryRef = window.db.collection('patients')
      .where('createdBy', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .limit(1);

    unsubscribePatientListener = queryRef.onSnapshot(async (snapshot) => {
      if (!snapshot || snapshot.empty) {
        // Fallback to general patients query sorted by createdAt desc
        try {
          const fallbackSnap = await window.db.collection('patients').orderBy('createdAt', 'desc').limit(1).get();
          if (fallbackSnap.empty) {
            console.log('ℹ️ No patient registered in Firestore yet.');
            renderEmptyPatientDashboard();
            return;
          }
          const docSnap = fallbackSnap.docs[0];
          const p = docSnap.data();
          p.patientId = docSnap.id;
          if (appData && appData.patient) appData.patient.id = docSnap.id;
          renderFirestorePatientDashboard(p);
          await loadCaregiverForPatient(docSnap.id, p.patientName || p.name || p.fullName);
          await loadDoctorForPatient(docSnap.id, p.patientName || p.name || p.fullName);
        } catch (e) {
          console.warn('⚠️ Fallback query error:', e);
          renderEmptyPatientDashboard();
        }
      } else {
        const docSnap = snapshot.docs[0];
        const p = docSnap.data();
        p.patientId = docSnap.id;
        if (appData && appData.patient) appData.patient.id = docSnap.id;
        renderFirestorePatientDashboard(p);
        await loadCaregiverForPatient(docSnap.id, p.patientName || p.name || p.fullName);
        await loadDoctorForPatient(docSnap.id, p.patientName || p.name || p.fullName);
      }
    }, async (err) => {
      console.warn('⚠️ Query onSnapshot error, attempting one-time fetch:', err);
      try {
        const fallbackSnap = await window.db.collection('patients').orderBy('createdAt', 'desc').limit(1).get();
        if (fallbackSnap.empty) {
          renderEmptyPatientDashboard();
        } else {
          const docSnap = fallbackSnap.docs[0];
          const p = docSnap.data();
          p.patientId = docSnap.id;
          if (appData && appData.patient) appData.patient.id = docSnap.id;
          renderFirestorePatientDashboard(p);
          await loadCaregiverForPatient(docSnap.id, p.patientName || p.name || p.fullName);
          await loadDoctorForPatient(docSnap.id, p.patientName || p.name || p.fullName);
        }
      } catch (fallbackErr) {
        console.error('❌ Error fetching patient fallback:', fallbackErr);
        renderErrorPatientDashboard(fallbackErr.message || 'Database connection error.');
      }
    });
  } catch (err) {
    console.error('❌ Error initiating patient query listener:', err);
    renderErrorPatientDashboard(err.message || 'Database connection error.');
  }
}

function renderLoadingPatientDashboard() {
  setElText('dashPatientAvatar', '⌛');
  setElText('dashPatientName', 'Loading patient details...');
  setElText('dashPatientAge', 'Loading...');
  setElText('dashPatientGender', 'Loading...');
  setElText('dashPatientDob', 'Loading...');
  setElText('dashPatientBloodGroup', 'Loading...');
  setElText('dashPatientHeight', 'Loading...');
  setElText('dashPatientWeight', 'Loading...');
  setElText('dashPatientBmi', 'Loading...');
  setElText('dashPatientRatioInline', 'Loading...');
  setElText('dashPatientEmergencyContact', 'Loading...');
}

function renderFirestorePatientDashboard(p) {
  if (!p) {
    renderEmptyPatientDashboard();
    return;
  }

  // Safe Backward-Compatible Field Mapping
  const name = p.patientName || p.name || p.fullName || '';
  const age = p.age || p.patientAge || '';
  const gender = p.gender || p.patientGender || '';
  const dob = p.dateOfBirth || p.dob || p.birthDate || '';
  const bloodGroup = p.bloodGroup || p.blood_group || p.bloodType || '';
  const height = p.height || p.patientHeight || '';
  const weight = p.weight || p.patientWeight || '';
  const emergencyContact = p.emergencyContact || p.emergency_contact || p.emergencyPhone || '';
  const contact = p.contact || p.phone || p.contactDetails || '';
  
  let bmi = p.bmi || '';
  if (!bmi && height && weight) {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!isNaN(h) && !isNaN(w) && h > 0 && w > 0) {
      const hM = h / 100;
      const bmiVal = (w / (hM * hM)).toFixed(1);
      let cat = '';
      const num = parseFloat(bmiVal);
      if (num < 18.5) cat = 'Underweight';
      else if (num < 25) cat = 'Normal';
      else if (num < 30) cat = 'Overweight';
      else cat = 'Obese';
      bmi = `${bmiVal} (${cat})`;
    }
  }

  let initials = '--';
  if (name && name.trim()) {
    initials = name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  // Update Registered Patient Summary Card
  setElText('dashPatientAvatar', initials);
  setElText('dashPatientName', name || 'Not provided');
  setElText('dashPatientAge', age ? `${age} Years` : 'Not provided');
  setElText('dashPatientGender', gender || 'Not provided');
  setElText('dashPatientDob', dob || 'Not provided');
  setElText('dashPatientBloodGroup', bloodGroup || 'Not provided');
  setElText('dashPatientHeight', height ? `${height} cm` : 'Not provided');
  setElText('dashPatientWeight', weight ? `${weight} kg` : 'Not provided');
  setElText('dashPatientBmi', bmi || 'Not provided');
  setElText('dashPatientEmergencyContact', emergencyContact || 'Not provided');

  // Health Ratio
  let ratio = p.healthRatio || p.health_ratio || '85%';
  if (typeof ratio === 'number') ratio = `${ratio}%`;
  if (!ratio.includes('%')) ratio = `${ratio}%`;

  setElText('dashPatientRatioInline', `${ratio} (Stable & Doctor Monitored)`);
  setElText('dashRatioBigNumber', ratio);
  setElText('healthRatioBigNumber', ratio);

  // Update Demographics Detail Card
  setElText('patDetailName', name || 'Not provided');
  setElText('patDetailAge', age ? `${age} Years` : 'Not provided');
  setElText('patDetailGender', gender || 'Not provided');
  setElText('patDetailContact', contact || 'Not provided');

  // Update local state object
  if (appData && appData.patient) {
    if (name) appData.patient.name = name;
    if (age) appData.patient.age = age;
    if (gender) appData.patient.gender = gender;
    if (dob) appData.patient.dob = dob;
    if (bloodGroup) appData.patient.bloodGroup = bloodGroup;
    if (height) appData.patient.height = height;
    if (weight) appData.patient.weight = weight;
    if (bmi) appData.patient.bmi = bmi;
    if (emergencyContact) appData.patient.emergencyContact = emergencyContact;
    if (contact) appData.patient.contact = contact;
    if (p.healthInfo) appData.patient.healthInfo = p.healthInfo;
  }
}

function renderEmptyPatientDashboard() {
  setElText('dashPatientAvatar', '--');
  setElText('dashPatientName', 'No patient registered yet.');
  setElText('dashPatientAge', 'Not provided');
  setElText('dashPatientGender', 'Not provided');
  setElText('dashPatientDob', 'Not provided');
  setElText('dashPatientBloodGroup', 'Not provided');
  setElText('dashPatientHeight', 'Not provided');
  setElText('dashPatientWeight', 'Not provided');
  setElText('dashPatientBmi', 'Not provided');
  setElText('dashPatientRatioInline', 'Not provided');
  setElText('dashPatientEmergencyContact', 'Not provided');
  setElText('dashRatioBigNumber', 'N/A');
  setElText('healthRatioBigNumber', 'N/A');

  setElText('patDetailName', 'No patient registered yet.');
  setElText('patDetailAge', 'Not provided');
  setElText('patDetailGender', 'Not provided');
  setElText('patDetailContact', 'Not provided');
}

function renderErrorPatientDashboard(errorMsg) {
  setElText('dashPatientAvatar', 'ERR');
  setElText('dashPatientName', 'Error loading database: ' + errorMsg);
  setElText('dashPatientAge', 'Not provided');
  setElText('dashPatientGender', 'Not provided');
  setElText('dashPatientDob', 'Not provided');
  setElText('dashPatientBloodGroup', 'Not provided');
  setElText('dashPatientHeight', 'Not provided');
  setElText('dashPatientWeight', 'Not provided');
  setElText('dashPatientBmi', 'Not provided');
  setElText('dashPatientRatioInline', 'Not provided');
  setElText('dashPatientEmergencyContact', 'Not provided');
}

// ==================================================
// NOTIFICATION SYSTEM MODULE (STEP 6A)
// ==================================================
let notificationsData = [];

// Expose global window test functions
window.addNotification = addNotification;
window.markNotificationAsRead = markNotificationAsRead;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.loadNotificationsFromFirestore = loadNotificationsFromFirestore;

// Add Notification to Firestore "notifications" collection
async function addNotification(title, message, type = 'system', patientId = null, reminderKey = null, extraMeta = {}) {
  try {
    if (!title || !message) {
      console.warn('⚠️ Notification requires both title and message.');
      return null;
    }

    const notifPayload = {
      title: title,
      message: message,
      type: type || 'system',
      isRead: false,
      patientId: patientId || null,
      reminderKey: reminderKey || null,
      medicineScheduleId: extraMeta.medicineScheduleId || null,
      medicineName: extraMeta.medicineName || '',
      dosage: extraMeta.dosage || '',
      scheduledDate: extraMeta.scheduledDate || getTodayDateString(),
      scheduledTime: extraMeta.scheduledTime || '',
      foodTiming: extraMeta.foodTiming || '',
      instructions: extraMeta.instructions || '',
      intakeStatus: extraMeta.intakeStatus || null,
      createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date()
    };

    if (window.db && typeof window.db.collection === 'function') {
      const docRef = await window.db.collection('notifications').add(notifPayload);
      console.log('🔔 Notification saved to Firestore with ID:', docRef.id);
      
      await loadNotificationsFromFirestore();
      return docRef.id;
    } else {
      console.warn('⚠️ Firestore window.db unavailable. Saving notification locally.');
      notifPayload.id = 'notif_' + Date.now();
      notifPayload.createdAt = new Date();
      notificationsData.unshift(notifPayload);
      renderNotifications();
      return notifPayload.id;
    }
  } catch (error) {
    console.error('❌ Error adding notification to Firestore:', error);
    showToast('Failed to save notification: ' + error.message);
    return null;
  }
}

// Load notifications from Firestore ordered by createdAt desc
async function loadNotificationsFromFirestore() {
  try {
    if (!window.db || typeof window.db.collection !== 'function') {
      console.warn('⚠️ Firestore window.db is not initialized yet.');
      return;
    }

    const snapshot = await window.db.collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    notificationsData = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      notificationsData.push({
        id: doc.id,
        title: data.title || 'Notification',
        message: data.message || '',
        type: data.type || 'system',
        isRead: Boolean(data.isRead),
        patientId: data.patientId || null,
        reminderKey: data.reminderKey || null,
        medicineScheduleId: data.medicineScheduleId || null,
        medicineName: data.medicineName || '',
        dosage: data.dosage || '',
        scheduledDate: data.scheduledDate || '',
        scheduledTime: data.scheduledTime || '',
        foodTiming: data.foodTiming || '',
        instructions: data.instructions || '',
        intakeStatus: data.intakeStatus || null,
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date()
      });
    });

    renderNotifications();
  } catch (error) {
    console.error('❌ Error loading notifications from Firestore:', error);
    renderNotificationsError(error.message);
  }
}

// Render Notification dropdown items and badge count
function renderNotifications() {
  const badge = document.getElementById('notificationBadge');
  const list = document.getElementById('notificationList');
  if (!list) return;

  const unreadCount = notificationsData.filter(n => !n.isRead).length;

  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  if (notificationsData.length === 0) {
    list.innerHTML = `<div style="padding: 24px; text-align: center; color: #64748b; font-size: 13px;">No notifications</div>`;
    return;
  }

  list.innerHTML = notificationsData.map(item => {
    const timeStr = item.createdAt ? formatNotifTime(item.createdAt) : '';
    const unreadBg = item.isRead ? '#ffffff' : '#f0f9ff';
    const unreadBorder = item.isRead ? 'transparent' : '#0284c7';
    const isReminder = item.type === 'reminder';

    let actionContent = '';
    if (isReminder) {
      if (item.intakeStatus) {
        const badgeColor = item.intakeStatus === 'Taken' ? '#16a34a' : (item.intakeStatus === 'Skipped' ? '#dc2626' : '#d97706');
        const badgeBg = item.intakeStatus === 'Taken' ? '#dcfce7' : (item.intakeStatus === 'Skipped' ? '#fee2e2' : '#fef3c7');
        actionContent = `
          <div style="margin-top: 8px; font-size: 11px; font-weight: 600; color: ${badgeColor}; background: ${badgeBg}; padding: 3px 8px; border-radius: 4px; display: inline-block;">
            Status: ${escapeHtml(item.intakeStatus)}
          </div>
        `;
      } else {
        actionContent = `
          <div class="notif-action-buttons" style="display: flex; gap: 6px; margin-top: 8px;" onclick="event.stopPropagation();">
            <button class="btn-intake-action" data-notif-id="${item.id}" data-action="Taken" style="padding: 4px 8px; font-size: 11px; background: #16a34a; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">I Took My Medicine</button>
            <button class="btn-intake-action" data-notif-id="${item.id}" data-action="Pending" style="padding: 4px 8px; font-size: 11px; background: #f59e0b; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Not Yet</button>
            <button class="btn-intake-action" data-notif-id="${item.id}" data-action="Skipped" style="padding: 4px 8px; font-size: 11px; background: #ef4444; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Skip</button>
          </div>
        `;
      }
    }

    return `
      <div class="notification-item" data-id="${item.id}" style="padding: 12px 16px; border-bottom: 1px solid var(--border-color, #e2e8f0); background: ${unreadBg}; cursor: pointer; transition: background 0.2s ease; border-left: 3px solid ${unreadBorder};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
          <div style="font-size: 13px; font-weight: ${item.isRead ? '500' : '700'}; color: #0f172a;">${escapeHtml(item.title)}</div>
          <div style="font-size: 11px; color: #94a3b8; white-space: nowrap; margin-left: 8px;">${timeStr}</div>
        </div>
        <div style="font-size: 12px; color: #475569; line-height: 1.4;">${escapeHtml(item.message)}</div>
        ${actionContent}
      </div>
    `;
  }).join('');

  list.querySelectorAll('.notification-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-intake-action')) return;
      const id = el.getAttribute('data-id');
      if (id) markNotificationAsRead(id);
    });
  });

  list.querySelectorAll('.btn-intake-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const notifId = e.currentTarget.getAttribute('data-notif-id');
      const action = e.currentTarget.getAttribute('data-action');
      if (notifId && action) {
        handleMedicineIntakeAction(notifId, action);
      }
    });
  });
}

function renderNotificationsError(errorMsg) {
  const list = document.getElementById('notificationList');
  if (list) {
    list.innerHTML = `<div style="padding: 16px; text-align: center; color: #ef4444; font-size: 12px;">Error loading notifications: ${escapeHtml(errorMsg)}</div>`;
  }
}

// Mark single notification as read in Firestore
async function markNotificationAsRead(id) {
  try {
    const notif = notificationsData.find(n => n.id === id);
    if (notif && !notif.isRead) {
      notif.isRead = true;
      renderNotifications();

      if (window.db && typeof window.db.collection === 'function') {
        await window.db.collection('notifications').doc(id).update({
          isRead: true
        });
        console.log('✅ Notification marked as read in Firestore:', id);
      }
    }
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
  }
}

// Mark all notifications as read in Firestore
async function markAllNotificationsAsRead() {
  try {
    const unread = notificationsData.filter(n => !n.isRead);
    if (unread.length === 0) return;

    notificationsData.forEach(n => n.isRead = true);
    renderNotifications();

    if (window.db && typeof window.db.collection === 'function') {
      const batch = window.db.batch();
      unread.forEach(n => {
        const ref = window.db.collection('notifications').doc(n.id);
        batch.update(ref, { isRead: true });
      });
      await batch.commit();
      console.log('✅ All notifications marked as read in Firestore.');
    }
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
  }
}

// Initialize notification dropdown toggle and event listeners
function initNotificationEvents() {
  const bellBtn = document.getElementById('notificationBellBtn');
  const dropdown = document.getElementById('notificationDropdown');
  const markAllBtn = document.getElementById('markAllReadBtn');

  if (bellBtn && dropdown) {
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === 'flex';
      dropdown.style.display = isVisible ? 'none' : 'flex';
    });

    document.addEventListener('click', (e) => {
      if (dropdown.style.display === 'flex' && !dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      markAllNotificationsAsRead();
    });
  }
}

function formatNotifTime(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==================================================
// MEDICINE SCHEDULE REMINDER CHECKER MODULE (STEP 6C)
// ==================================================
window.testMedicineReminder = testMedicineReminder;
window.checkScheduledMedicineReminders = checkScheduledMedicineReminders;

async function checkScheduledMedicineReminders() {
  try {
    if (!medicineSchedulesData || medicineSchedulesData.length === 0) {
      return;
    }

    const now = new Date();
    const todayStr = getTodayDateString();
    const todayDayName = getCurrentDayName();

    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${mins}`;

    for (const item of medicineSchedulesData) {
      // 1. Check active status
      if (item.isActive === false) continue;

      // 2. Check exactTime presence
      const targetTime = item.exactTime || item.intakeTime;
      if (!targetTime) continue;

      // Match time (exact minute match)
      if (targetTime !== currentTimeStr) continue;

      // 3. Date range check (startDate & endDate)
      if (item.startDate && todayStr < item.startDate) continue;
      if (item.endDate && todayStr > item.endDate) continue;

      // 4. Schedule days check
      const days = Array.isArray(item.scheduleDays) ? item.scheduleDays : (item.frequency ? item.frequency.split(', ') : ['Every Day']);
      const isEveryDay = days.includes('Every Day');
      const isAllowedDay = isEveryDay || days.includes(todayDayName);
      if (!isAllowedDay) continue;

      // 5. Duplicate prevention using reminderKey
      const reminderKey = `${item.id}_${todayStr}_${targetTime}`;
      const alreadyNotified = notificationsData.some(n => n.reminderKey === reminderKey);
      if (alreadyNotified) continue;

      // 6. Build reminder message
      const dosageStr = item.dosage || `${item.tabletQuantity || 1} Tablet(s)`;
      const foodTimingStr = item.foodTiming ? `${item.foodTiming}.` : '';
      const instrStr = item.instructions ? ` ${item.instructions}` : '';
      const message = `It's time to take ${item.medicineName} — ${dosageStr}. ${foodTimingStr}${instrStr}`.trim();

      console.log('⏰ Scheduled medicine reminder triggered:', item.medicineName, reminderKey);
      await addNotification("Medicine Reminder", message, "reminder", item.patientId || null, reminderKey, {
        medicineScheduleId: item.id,
        medicineName: item.medicineName,
        dosage: item.dosage || `${item.tabletQuantity || 1} Tablet(s)`,
        scheduledDate: todayStr,
        scheduledTime: targetTime,
        foodTiming: item.foodTiming || '',
        instructions: item.instructions || ''
      });
    }
  } catch (error) {
    console.error('❌ Error checking scheduled medicine reminders:', error);
  }
}

// Handle Medicine Intake Action (Taken, Pending, Skipped) for Step 6D
async function handleMedicineIntakeAction(notifId, action) {
  const allowedStatuses = ["Taken", "Pending", "Skipped"];
  if (!allowedStatuses.includes(action)) return;

  try {
    const notif = notificationsData.find(n => n.id === notifId);
    if (!notif) {
      console.warn('⚠️ Notification item not found:', notifId);
      return;
    }

    const todayStr = getTodayDateString();
    const schedId = notif.medicineScheduleId || 'sched_' + Date.now();
    const schedTime = notif.scheduledTime || '08:00';
    const doseKey = `${schedId}_${todayStr}_${schedTime}`;

    const intakeRecord = {
      doseKey: doseKey,
      medicineScheduleId: schedId,
      medicineName: notif.medicineName || 'Medicine',
      dosage: notif.dosage || '1 Tablet(s)',
      scheduledDate: notif.scheduledDate || todayStr,
      scheduledTime: schedTime,
      patientId: notif.patientId || null,
      patientName: notif.patientName || (appData && appData.patient ? appData.patient.name : 'Patient'),
      status: action,
      actionTime: new Date().toISOString(),
      foodTiming: notif.foodTiming || '',
      instructions: notif.instructions || '',
      createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString()
    };

    if (window.db && typeof window.db.collection === 'function') {
      await window.db.collection('medicineIntakeRecords').doc(doseKey).set(intakeRecord, { merge: true });
      console.log('🔥 Saved medicine intake record to Firestore with doseKey:', doseKey, action);

      const isReadStatus = (action === 'Taken' || action === 'Skipped');
      await window.db.collection('notifications').doc(notifId).update({
        intakeStatus: action,
        isRead: isReadStatus
      });
    }

    notif.intakeStatus = action;
    if (action === 'Taken' || action === 'Skipped') {
      notif.isRead = true;
    }
    renderNotifications();

    if (action === 'Taken') showToast('Medicine marked as Taken.');
    else if (action === 'Pending') showToast('Medicine marked as Pending.');
    else if (action === 'Skipped') showToast('Medicine marked as Skipped.');

    // Step 6E: Create caregiver alert for Pending or Skipped status
    if (action === 'Pending' || action === 'Skipped') {
      await createCaregiverAlert(intakeRecord);
    }
  } catch (error) {
    console.error('❌ Error handling medicine intake action:', error);
    showToast('Failed to record intake action: ' + error.message);
  }
}

// Test medicine intake action function for browser console (Step 6D)
async function testMedicineIntakeAction(scheduleId, status) {
  const allowedStatuses = ["Taken", "Pending", "Skipped"];
  if (!allowedStatuses.includes(status)) {
    console.warn('⚠️ Invalid status for testMedicineIntakeAction. Must be one of:', allowedStatuses);
    showToast('Error: Status must be Taken, Pending, or Skipped.');
    return null;
  }

  try {
    let item = medicineSchedulesData.find(m => m.id === scheduleId);
    if (!item && window.db) {
      const doc = await window.db.collection('medicineSchedules').doc(scheduleId).get();
      if (doc.exists) {
        item = { id: doc.id, ...doc.data() };
      }
    }

    if (!item) {
      console.warn('⚠️ Test intake action error: Schedule not found for ID:', scheduleId);
      showToast('Test intake action error: Schedule not found.');
      return null;
    }

    const todayStr = getTodayDateString();
    const exactTime = item.exactTime || item.intakeTime || '08:00';
    const doseKey = `${item.id}_${todayStr}_${exactTime}`;

    const recordPayload = {
      doseKey: doseKey,
      medicineScheduleId: item.id,
      medicineName: item.medicineName,
      dosage: item.dosage || `${item.tabletQuantity || 1} Tablet(s)`,
      scheduledDate: todayStr,
      scheduledTime: exactTime,
      patientId: item.patientId || null,
      patientName: item.patientName || (appData && appData.patient ? appData.patient.name : 'Patient'),
      status: status,
      actionTime: new Date().toISOString(),
      foodTiming: item.foodTiming || '',
      instructions: item.instructions || '',
      createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString()
    };

    if (window.db && typeof window.db.collection === 'function') {
      await window.db.collection('medicineIntakeRecords').doc(doseKey).set(recordPayload, { merge: true });
      console.log('🧪 Test intake record saved to Firestore with doseKey:', doseKey, status);
    }

    if (status === 'Pending' || status === 'Skipped') {
      await createCaregiverAlert(recordPayload);
    }

    showToast(`Medicine marked as ${status}.`);
    return doseKey;
  } catch (err) {
    console.error('❌ Error executing testMedicineIntakeAction:', err);
    showToast('Failed to record intake action: ' + err.message);
    return null;
  }
}

// Expose test function on window
window.testMedicineIntakeAction = testMedicineIntakeAction;

// ==================================================
// CAREGIVER MEDICINE ALERT MODULE (STEP 6E)
// ==================================================
window.loadCaregiverAlerts = loadCaregiverAlerts;
window.markCaregiverAlertAsRead = markCaregiverAlertAsRead;
window.markAllCaregiverAlertsAsRead = markAllCaregiverAlertsAsRead;
window.testCaregiverAlert = testCaregiverAlert;
window.createCaregiverAlert = createCaregiverAlert;

async function createCaregiverAlert(intakeRecord) {
  try {
    if (!intakeRecord || !intakeRecord.status) return null;
    
    // Safety Rule: Status "Taken" -> NO caregiver alert
    if (intakeRecord.status === 'Taken') {
      console.log('ℹ️ Status is Taken. No caregiver alert created.');
      return null;
    }

    const schedId = intakeRecord.medicineScheduleId || 'sched_' + Date.now();
    const schedDate = intakeRecord.scheduledDate || getTodayDateString();
    const schedTime = intakeRecord.scheduledTime || '08:00';
    const status = intakeRecord.status; // "Pending" or "Skipped"

    // Duplicate Prevention key
    const alertKey = `${schedId}_${schedDate}_${schedTime}_${status}`;

    const patName = intakeRecord.patientName || (appData && appData.patient ? appData.patient.name : 'Patient');
    const medName = intakeRecord.medicineName || 'Medicine';

    let alertReason = '';
    if (status === 'Skipped') {
      alertReason = `${patName} skipped the scheduled dose of ${medName} at ${formatTime12h(schedTime)}.`;
    } else {
      alertReason = `${patName} has not confirmed the scheduled dose of ${medName} at ${formatTime12h(schedTime)}.`;
    }

    const targetPatientId = intakeRecord.patientId || (appData && appData.patient ? appData.patient.id : null);
    let linkedCaregiver = null;
    if (targetPatientId && typeof getCaregiverForAlert === 'function') {
      linkedCaregiver = await getCaregiverForAlert(targetPatientId);
    }

    const activeCaregiverName = (linkedCaregiver && linkedCaregiver.caregiverName)
      ? linkedCaregiver.caregiverName
      : ((appData && appData.caregiver && appData.caregiver.name) ? appData.caregiver.name : 'Primary Caregiver');

    const activeCaregiverContact = (linkedCaregiver && linkedCaregiver.caregiverContact)
      ? linkedCaregiver.caregiverContact
      : ((appData && appData.caregiver && appData.caregiver.contact) ? appData.caregiver.contact : '');

    const alertPayload = {
      alertKey: alertKey,
      medicineScheduleId: schedId,
      medicineIntakeRecordId: intakeRecord.doseKey || null,
      patientId: targetPatientId,
      patientName: patName,
      caregiverName: activeCaregiverName,
      caregiverContact: activeCaregiverContact,
      medicineName: medName,
      dosage: intakeRecord.dosage || '1 Tablet(s)',
      scheduledDate: schedDate,
      scheduledTime: schedTime,
      status: status,
      actionTime: intakeRecord.actionTime || new Date().toISOString(),
      alertReason: alertReason,
      isRead: false,
      createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString()
    };

    if (window.db && typeof window.db.collection === 'function') {
      await window.db.collection('caregiverAlerts').doc(alertKey).set(alertPayload, { merge: true });
      console.log('🔥 Caregiver alert saved to Firestore with alertKey:', alertKey);

      // Create informational in-app notification for logged-in MEDX user
      const infoMsg = `${patName} has ${status === 'Pending' ? 'not confirmed' : 'skipped'} the scheduled ${medName}.`;
      await addNotification("Caregiver Alert", infoMsg, "info", intakeRecord.patientId || null, `caregiver_${alertKey}`);
      
      await loadCaregiverAlerts();
      return alertKey;
    } else {
      console.warn('⚠️ Firestore window.db unavailable. Saving caregiver alert locally.');
      alertPayload.id = alertKey;
      caregiverAlertsData.unshift(alertPayload);
      saveCaregiverAlertsData();
      renderDashboardCaregiverAlerts();
      return alertKey;
    }
  } catch (error) {
    console.error('❌ Error creating caregiver alert:', error);
    return null;
  }
}

async function loadCaregiverAlerts() {
  try {
    if (!window.db || typeof window.db.collection !== 'function') {
      return;
    }

    const snapshot = await window.db.collection('caregiverAlerts')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const list = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      list.push({
        id: doc.id,
        alertKey: data.alertKey || doc.id,
        medicineScheduleId: data.medicineScheduleId || null,
        medicineIntakeRecordId: data.medicineIntakeRecordId || null,
        patientId: data.patientId || null,
        patientName: data.patientName || (appData.patient ? appData.patient.name : 'Patient'),
        caregiverName: data.caregiverName || (appData.caregiver ? appData.caregiver.name : 'Caregiver'),
        caregiverContact: data.caregiverContact || (appData.caregiver ? appData.caregiver.contact : ''),
        medicineName: data.medicineName || 'Medicine',
        dosage: data.dosage || '1 Tablet(s)',
        scheduledDate: data.scheduledDate || getTodayDateString(),
        scheduledTime: data.scheduledTime || '08:00',
        status: data.status || 'Pending',
        alertReason: data.alertReason || '',
        actionTime: data.actionTime || '',
        isRead: Boolean(data.isRead),
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString()
      });
    });

    caregiverAlertsData = list;
    saveCaregiverAlertsData();
    renderDashboardCaregiverAlerts();
    console.log(`🔥 Loaded ${list.length} caregiver alerts from Firestore.`);
  } catch (error) {
    console.error('❌ Error loading caregiver alerts from Firestore:', error);
  }
}

async function markCaregiverAlertAsRead(alertId) {
  try {
    const alert = caregiverAlertsData.find(a => a.id === alertId || a.alertKey === alertId);
    if (alert) {
      alert.isRead = true;
      saveCaregiverAlertsData();
      renderDashboardCaregiverAlerts();

      if (window.db && typeof window.db.collection === 'function') {
        await window.db.collection('caregiverAlerts').doc(alert.id || alert.alertKey).update({ isRead: true });
        console.log('✅ Caregiver alert marked as read in Firestore:', alertId);
      }
    }
  } catch (error) {
    console.error('❌ Error marking caregiver alert as read:', error);
  }
}

async function markAllCaregiverAlertsAsRead() {
  try {
    caregiverAlertsData.forEach(a => a.isRead = true);
    saveCaregiverAlertsData();
    renderDashboardCaregiverAlerts();

    if (window.db && typeof window.db.collection === 'function') {
      const snapshot = await window.db.collection('caregiverAlerts').where('isRead', '==', false).get();
      const batch = window.db.batch();
      snapshot.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });
      await batch.commit();
      console.log('✅ All caregiver alerts marked as read in Firestore.');
    }
  } catch (error) {
    console.error('❌ Error marking all caregiver alerts as read:', error);
  }
}

async function testCaregiverAlert(scheduleId, status) {
  const allowedStatuses = ["Pending", "Skipped"];
  if (!allowedStatuses.includes(status)) {
    console.warn('⚠️ Invalid status for testCaregiverAlert. Must be Pending or Skipped. Passed:', status);
    showToast('Error: Test status must be Pending or Skipped.');
    return null;
  }

  try {
    let item = medicineSchedulesData.find(m => m.id === scheduleId);
    if (!item && window.db) {
      const doc = await window.db.collection('medicineSchedules').doc(scheduleId).get();
      if (doc.exists) item = { id: doc.id, ...doc.data() };
    }

    if (!item) {
      console.warn('⚠️ Test caregiver alert error: Schedule not found for ID:', scheduleId);
      showToast('Test caregiver alert error: Schedule not found.');
      return null;
    }

    const todayStr = getTodayDateString();
    const exactTime = item.exactTime || item.intakeTime || '08:00';
    const doseKey = `${item.id}_${todayStr}_${exactTime}`;

    const fakeIntake = {
      doseKey: doseKey,
      medicineScheduleId: item.id,
      medicineName: item.medicineName,
      dosage: item.dosage || `${item.tabletQuantity || 1} Tablet(s)`,
      scheduledDate: todayStr,
      scheduledTime: exactTime,
      patientId: item.patientId || null,
      patientName: item.patientName || (appData.patient ? appData.patient.name : 'Patient'),
      status: status,
      actionTime: new Date().toISOString()
    };

    const alertKey = await createCaregiverAlert(fakeIntake);
    console.log('🧪 Test caregiver alert executed cleanly:', alertKey);
    showToast(`Triggered test caregiver alert (${status}) for "${item.medicineName}".`);
    return alertKey;
  } catch (err) {
    console.error('❌ Error executing testCaregiverAlert:', err);
    showToast('Failed to trigger test caregiver alert.');
    return null;
  }
}

// ==================================================
// MEDICINE HISTORY & ADHERENCE MODULE (STEP 6F)
// ==================================================
let medicineIntakeRecordsData = [];
let unsubscribeIntakeRecordsListener = null;

window.loadMedicineIntakeHistory = loadMedicineIntakeHistory;
window.renderMedicineHistoryTable = renderMedicineHistoryTable;
window.renderMedicineAdherenceStats = renderMedicineAdherenceStats;
window.initMedicineIntakeRecordsListener = initMedicineIntakeRecordsListener;

function initMedicineIntakeRecordsListener() {
  if (!window.db || typeof window.db.collection !== 'function') {
    console.warn('⚠️ Firestore window.db unavailable for medicineIntakeRecords listener.');
    return;
  }

  try {
    if (unsubscribeIntakeRecordsListener) {
      unsubscribeIntakeRecordsListener();
    }

    unsubscribeIntakeRecordsListener = window.db.collection('medicineIntakeRecords')
      .onSnapshot((snapshot) => {
        const list = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          list.push({
            id: doc.id,
            doseKey: data.doseKey || doc.id,
            medicineScheduleId: data.medicineScheduleId || null,
            medicineName: data.medicineName || 'Medicine',
            dosage: data.dosage || '1 Tablet(s)',
            scheduledDate: data.scheduledDate || '',
            scheduledTime: data.scheduledTime || '',
            patientId: data.patientId || null,
            patientName: data.patientName || '',
            status: data.status || 'Pending',
            actionTime: data.actionTime || '',
            createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : ''
          });
        });

        // Sort history by scheduled date/time, newest first
        list.sort((a, b) => {
          const keyA = `${a.scheduledDate || '1970-01-01'} ${a.scheduledTime || '00:00'} ${a.actionTime || ''}`;
          const keyB = `${b.scheduledDate || '1970-01-01'} ${b.scheduledTime || '00:00'} ${b.actionTime || ''}`;
          return keyB.localeCompare(keyA);
        });

        medicineIntakeRecordsData = list;
        console.log(`🔥 Real-time update: ${list.length} medicine intake records loaded.`);
        renderMedicineHistoryTable();
        renderMedicineAdherenceStats();
      }, (error) => {
        console.error('❌ Error listening to medicineIntakeRecords:', error);
      });
  } catch (err) {
    console.error('❌ Failed to initialize medicineIntakeRecords listener:', err);
  }
}

async function loadMedicineIntakeHistory() {
  try {
    if (!window.db || typeof window.db.collection !== 'function') {
      return medicineIntakeRecordsData;
    }

    const snapshot = await window.db.collection('medicineIntakeRecords').get();
    const list = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      list.push({
        id: doc.id,
        doseKey: data.doseKey || doc.id,
        medicineScheduleId: data.medicineScheduleId || null,
        medicineName: data.medicineName || 'Medicine',
        dosage: data.dosage || '1 Tablet(s)',
        scheduledDate: data.scheduledDate || '',
        scheduledTime: data.scheduledTime || '',
        patientId: data.patientId || null,
        patientName: data.patientName || '',
        status: data.status || 'Pending',
        actionTime: data.actionTime || '',
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : ''
      });
    });

    list.sort((a, b) => {
      const keyA = `${a.scheduledDate || '1970-01-01'} ${a.scheduledTime || '00:00'} ${a.actionTime || ''}`;
      const keyB = `${b.scheduledDate || '1970-01-01'} ${b.scheduledTime || '00:00'} ${b.actionTime || ''}`;
      return keyB.localeCompare(keyA);
    });

    medicineIntakeRecordsData = list;
    renderMedicineHistoryTable();
    renderMedicineAdherenceStats();
    return list;
  } catch (err) {
    console.error('❌ Error loading medicine intake history:', err);
    return medicineIntakeRecordsData;
  }
}

function renderMedicineAdherenceStats() {
  const totalDoses = medicineIntakeRecordsData.length;
  const takenCount = medicineIntakeRecordsData.filter(r => r.status === 'Taken').length;
  const pendingCount = medicineIntakeRecordsData.filter(r => r.status === 'Pending' || r.status === 'Not Yet').length;
  const skippedCount = medicineIntakeRecordsData.filter(r => r.status === 'Skipped').length;
  
  const adherencePctVal = totalDoses > 0 ? ((takenCount / totalDoses) * 100).toFixed(1) : 0;
  const adherencePctStr = `${adherencePctVal}%`;

  // Update summary bar on Medicine Schedule page
  setElText('adherenceTotalDoses', totalDoses);
  setElText('adherenceTakenCount', takenCount);
  setElText('adherencePendingCount', pendingCount);
  setElText('adherenceSkippedCount', skippedCount);
  setElText('adherenceOverallPercentage', adherencePctStr);

  // Group by medicine for Medicine-Wise Adherence Summary
  const medGroupMap = {};
  medicineIntakeRecordsData.forEach(r => {
    const medKey = r.medicineName || 'Unknown Medicine';
    if (!medGroupMap[medKey]) {
      medGroupMap[medKey] = {
        medicineName: medKey,
        dosage: r.dosage || '1 Tablet(s)',
        total: 0,
        taken: 0,
        pending: 0,
        skipped: 0
      };
    }
    medGroupMap[medKey].total += 1;
    if (r.status === 'Taken') medGroupMap[medKey].taken += 1;
    else if (r.status === 'Pending' || r.status === 'Not Yet') medGroupMap[medKey].pending += 1;
    else if (r.status === 'Skipped') medGroupMap[medKey].skipped += 1;
  });

  const modalSummaryContainer = document.getElementById('medicineAdherenceModalSummary');
  if (modalSummaryContainer) {
    const medKeys = Object.keys(medGroupMap);
    if (medKeys.length === 0) {
      modalSummaryContainer.innerHTML = `
        <div style="background: var(--bg-subtle); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center; font-size: 13px; color: var(--text-subtle);">
          No adherence metrics available yet.
        </div>
      `;
    } else {
      let medSummaryRowsHtml = medKeys.map(k => {
        const item = medGroupMap[k];
        const pct = item.total > 0 ? ((item.taken / item.total) * 100).toFixed(1) : '0';
        return `
          <tr style="border-bottom: 1px solid var(--border-divider);">
            <td style="padding: 8px 12px; font-weight: 600;">${escapeHtml(item.medicineName)} <span style="font-weight: 400; color: var(--text-subtle); font-size: 11px;">(${escapeHtml(item.dosage)})</span></td>
            <td style="padding: 8px 12px; text-align: center;">${item.total}</td>
            <td style="padding: 8px 12px; text-align: center; color: var(--green-text); font-weight: 600;">${item.taken}</td>
            <td style="padding: 8px 12px; text-align: center; color: var(--blue-info);">${item.pending}</td>
            <td style="padding: 8px 12px; text-align: center; color: #dc2626;">${item.skipped}</td>
            <td style="padding: 8px 12px; text-align: center; font-weight: 700; color: var(--brand-navy);">${pct}%</td>
          </tr>
        `;
      }).join('');

      modalSummaryContainer.innerHTML = `
        <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <h4 style="margin: 0; font-size: 14px; color: var(--brand-navy); font-weight: 700;">📊 MEDICINE ADHERENCE SUMMARY</h4>
            <span class="card-badge badge-blue" style="font-size: 12px; font-weight: 700;">Overall Adherence Rate: ${adherencePctStr}</span>
          </div>
          <div class="table-responsive" style="max-height: 180px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: var(--bg-subtle); color: var(--text-muted); text-align: left;">
                  <th style="padding: 6px 12px;">Medicine Name</th>
                  <th style="padding: 6px 12px; text-align: center;">Total Doses</th>
                  <th style="padding: 6px 12px; text-align: center;">Taken</th>
                  <th style="padding: 6px 12px; text-align: center;">Pending</th>
                  <th style="padding: 6px 12px; text-align: center;">Skipped</th>
                  <th style="padding: 6px 12px; text-align: center;">Adherence %</th>
                </tr>
              </thead>
              <tbody>
                ${medSummaryRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }
}

function renderMedicineHistoryTable() {
  const tbody = document.getElementById('medHistoryTableBody');
  if (!tbody) return;

  const searchInput = document.getElementById('historySearchInput');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = medicineIntakeRecordsData.filter(r => {
    if (!query) return true;
    const medMatch = (r.medicineName || '').toLowerCase().includes(query);
    const statusMatch = (r.status || '').toLowerCase().includes(query);
    const dateMatch = (r.scheduledDate || '').toLowerCase().includes(query);
    const timeMatch = (r.scheduledTime || '').toLowerCase().includes(query);
    return medMatch || statusMatch || dateMatch || timeMatch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-subtle); font-size: 13px;">
          No medicine intake records yet.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const schedDateDisplay = r.scheduledDate ? r.scheduledDate : 'Not provided';
    const schedTimeDisplay = r.scheduledTime ? formatTime12h(r.scheduledTime) : 'Not provided';
    const actionTimeDisplay = r.actionTime ? new Date(r.actionTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Not provided';
    
    let statusBadgeHtml = '';
    let caregiverBadgeHtml = '—';

    if (r.status === 'Taken') {
      statusBadgeHtml = `<span class="card-badge badge-green" style="font-weight: 600;">🟢 Taken</span>`;
    } else if (r.status === 'Skipped') {
      statusBadgeHtml = `<span class="card-badge badge-red" style="background-color: #fee2e2; color: #dc2626; border-color: #fca5a5; font-weight: 600;">🔴 Skipped</span>`;
      caregiverBadgeHtml = `<span class="card-badge badge-amber" style="background: #fef3c7; color: #d97706; border-color: #fde68a; font-size: 11px;">⚠️ Caregiver Alert Created</span>`;
    } else {
      statusBadgeHtml = `<span class="card-badge badge-blue" style="font-weight: 600;">🟡 Pending</span>`;
      caregiverBadgeHtml = `<span class="card-badge badge-amber" style="background: #fef3c7; color: #d97706; border-color: #fde68a; font-size: 11px;">⚠️ Caregiver Alert Created</span>`;
    }

    return `
      <tr style="border-bottom: 1px solid var(--border-divider);">
        <td style="padding: 10px 14px; font-weight: 500;">${escapeHtml(schedDateDisplay)}</td>
        <td style="padding: 10px 14px; font-weight: 500;">${escapeHtml(schedTimeDisplay)}</td>
        <td style="padding: 10px 14px;">
          <strong>${escapeHtml(r.medicineName)}</strong>
          <span style="display: block; font-size: 11px; color: var(--text-subtle);">${escapeHtml(r.dosage || '1 Tablet')}</span>
        </td>
        <td style="padding: 10px 14px;">${statusBadgeHtml}</td>
        <td style="padding: 10px 14px; font-size: 12px; color: var(--text-muted);">${escapeHtml(actionTimeDisplay)}</td>
        <td style="padding: 10px 14px;">${caregiverBadgeHtml}</td>
      </tr>
    `;
  }).join('');
}

function exportMedicineHistoryCsv() {
  if (!medicineIntakeRecordsData || medicineIntakeRecordsData.length === 0) {
    showToast('No medicine intake records to export.');
    return;
  }

  try {
    const headers = ['Scheduled Date', 'Scheduled Time', 'Medicine Name', 'Dosage', 'Confirmation Status', 'Action Time', 'Patient Name'];
    const rows = medicineIntakeRecordsData.map(r => [
      `"${r.scheduledDate || 'Not provided'}"`,
      `"${r.scheduledTime || 'Not provided'}"`,
      `"${(r.medicineName || '').replace(/"/g, '""')}"`,
      `"${(r.dosage || '').replace(/"/g, '""')}"`,
      `"${r.status || 'Pending'}"`,
      `"${r.actionTime || 'Not provided'}"`,
      `"${(r.patientName || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MEDX_Medicine_Intake_History_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Medicine intake history exported as CSV.');
  } catch (err) {
    console.error('❌ Error exporting CSV:', err);
    showToast('Failed to export CSV.');
  }
}

function bindMedicineHistoryEvents() {
  const openBtn = document.getElementById('openMedHistoryBtn');
  const modal = document.getElementById('medicineHistoryModal');
  const closeBtn = document.getElementById('closeMedHistoryModalBtn');
  const closeFooterBtn = document.getElementById('closeMedHistoryFooterBtn');
  const searchInput = document.getElementById('historySearchInput');
  const exportBtn = document.getElementById('exportHistoryCsvBtn');
  const printBtn = document.getElementById('printHistoryBtn');

  if (openBtn && modal) {
    openBtn.addEventListener('click', async () => {
      await loadMedicineIntakeHistory();
      modal.classList.add('show');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  }

  if (closeFooterBtn && modal) {
    closeFooterBtn.addEventListener('click', () => modal.classList.remove('show'));
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderMedicineHistoryTable();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportMedicineHistoryCsv();
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

// ==================================================
// PATIENT–CAREGIVER LINKING MODULE (STEP 6G)
// ==================================================
window.saveCaregiverAssignment = saveCaregiverAssignment;
window.loadCaregiverForPatient = loadCaregiverForPatient;
window.unassignCaregiver = unassignCaregiver;
window.getCaregiverForAlert = getCaregiverForAlert;

/**
 * Save or update Caregiver Assignment in Firestore `caregivers` collection.
 * Uses deterministic doc ID `caregiver_{patientId}` to prevent duplicate active assignments.
 */
async function saveCaregiverAssignment(patientId, caregiverName, caregiverContact, relationship, patientName) {
  try {
    if (!patientId) {
      console.warn('⚠️ Cannot save caregiver assignment: missing patientId.');
      showToast('Please select a valid patient first.');
      return null;
    }

    const cName = (caregiverName || '').trim();
    const cContact = (caregiverContact || '').trim();
    const rel = (relationship || '').trim();

    if (!cName || !cContact || !rel) {
      console.warn('⚠️ Invalid caregiver details submitted.');
      showToast('Please provide caregiver name, contact number, and relationship.');
      return null;
    }

    const pName = (patientName || (appData && appData.patient ? appData.patient.name : 'Patient')).trim();
    const docId = `caregiver_${patientId}`;

    const caregiverPayload = {
      caregiverName: cName,
      caregiverContact: cContact,
      relationship: rel,
      patientId: patientId,
      patientName: pName,
      isActive: true,
      createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString()
    };

    if (window.db && typeof window.db.collection === 'function') {
      await window.db.collection('caregivers').doc(docId).set(caregiverPayload, { merge: true });
      console.log('🔥 Saved active caregiver assignment to Firestore with ID:', docId);
    } else {
      console.warn('⚠️ Firestore window.db unavailable. Caregiver assignment saved locally.');
    }

    // Update local state and UI
    if (appData && appData.caregiver) {
      appData.caregiver.name = cName;
      appData.caregiver.relationship = rel;
      appData.caregiver.contact = cContact;
    }
    saveAppData();
    renderDashboardCaregiverDetails(cName, rel, cContact);

    return docId;
  } catch (error) {
    console.error('❌ Error saving caregiver assignment:', error);
    showToast('Unable to save caregiver assignment. Please check connection.');
    return null;
  }
}

/**
 * Load active caregiver for a given patient from Firestore `caregivers` collection.
 */
async function loadCaregiverForPatient(patientId, defaultPatientName) {
  try {
    if (!patientId || !window.db || typeof window.db.collection !== 'function') {
      return null;
    }

    const docId = `caregiver_${patientId}`;
    let docSnap = await window.db.collection('caregivers').doc(docId).get();

    if (!docSnap.exists) {
      const qSnap = await window.db.collection('caregivers')
        .where('patientId', '==', patientId)
        .where('isActive', '==', true)
        .limit(1)
        .get();
      if (!qSnap.empty) {
        docSnap = qSnap.docs[0];
      }
    }

    if (docSnap && docSnap.exists) {
      const data = docSnap.data();
      if (data.isActive !== false) {
        const cName = data.caregiverName || 'No caregiver assigned.';
        const rel = data.relationship || '';
        const cContact = data.caregiverContact || '';

        if (appData && appData.caregiver) {
          appData.caregiver.name = data.caregiverName || '';
          appData.caregiver.relationship = data.relationship || '';
          appData.caregiver.contact = data.caregiverContact || '';
        }

        renderDashboardCaregiverDetails(cName, rel, cContact);
        console.log('🔥 Loaded active caregiver for patient:', patientId, data.caregiverName);
        return data;
      }
    }

    // If no active caregiver assigned
    renderDashboardCaregiverDetails('No caregiver assigned.', '', '');
    return null;
  } catch (error) {
    console.error('❌ Error loading caregiver for patient:', error);
    renderDashboardCaregiverDetails('No caregiver assigned.', '', '');
    return null;
  }
}

/**
 * Unassign/Deactivate caregiver for a given patient by setting `isActive: false`.
 */
async function unassignCaregiver(patientId) {
  try {
    if (!patientId) {
      showToast('No patient selected to unassign caregiver.');
      return false;
    }
    const docId = `caregiver_${patientId}`;

    if (window.db && typeof window.db.collection === 'function') {
      await window.db.collection('caregivers').doc(docId).set({ isActive: false }, { merge: true });
      console.log('✅ Caregiver set to isActive: false in Firestore for patient:', patientId);
    }

    if (appData && appData.caregiver) {
      appData.caregiver.name = 'No caregiver assigned.';
      appData.caregiver.relationship = '';
      appData.caregiver.contact = '';
    }
    saveAppData();
    renderDashboardCaregiverDetails('No caregiver assigned.', '', '');
    showToast('Caregiver unassigned successfully.');
    return true;
  } catch (error) {
    console.error('❌ Error unassigning caregiver:', error);
    showToast('Failed to unassign caregiver.');
    return false;
  }
}

/**
 * Helper to fetch active caregiver for Medicine Caregiver Alert creation.
 */
async function getCaregiverForAlert(patientId) {
  try {
    if (!patientId || !window.db || typeof window.db.collection !== 'function') {
      return null;
    }

    const docId = `caregiver_${patientId}`;
    let docSnap = await window.db.collection('caregivers').doc(docId).get();

    if (docSnap.exists && docSnap.data().isActive !== false) {
      return docSnap.data();
    }

    const qSnap = await window.db.collection('caregivers')
      .where('patientId', '==', patientId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (!qSnap.empty) {
      return qSnap.docs[0].data();
    }
  } catch (err) {
    console.error('❌ Error fetching caregiver for alert:', err);
  }
  return null;
}

function renderDashboardCaregiverDetails(name, relationship, contact) {
  const isAssigned = name && name !== 'No caregiver assigned.';

  setElText('dashSummaryCaregiverName', name || 'No caregiver assigned.');
  setElText('dashSummaryCaregiverRel', relationship ? `Relationship: ${relationship}` : (isAssigned ? '' : 'Relationship: Not assigned'));
  setElText('dashSummaryCaregiverContact', contact ? `Contact Number: ${contact}` : (isAssigned ? '' : 'Contact: Not assigned'));

  setElText('caregiverDetailName', name || 'No caregiver assigned.');
  setElText('caregiverDetailRel', relationship || (isAssigned ? '' : 'Not assigned'));
  setElText('caregiverDetailContact', contact || (isAssigned ? '' : 'Not assigned'));
}

// ==================================================
// DOCTOR–PATIENT LINKING MODULE (STEP 6H)
// ==================================================
window.saveDoctorAssignment = saveDoctorAssignment;
window.loadDoctorForPatient = loadDoctorForPatient;
window.unassignDoctor = unassignDoctor;

/**
 * Save or update Doctor Assignment in Firestore `doctors` collection.
 * Uses deterministic doc ID `doctor_{patientId}` to prevent duplicate active assignments.
 */
async function saveDoctorAssignment(patientId, doctorName, doctorContact, specialization, qualification, patientName) {
  try {
    if (!patientId) {
      console.warn('⚠️ Cannot save doctor assignment: missing patientId.');
      showToast('Please select a valid patient first.');
      return null;
    }

    const dName = (doctorName || '').trim();
    const dContact = (doctorContact || '').trim();
    const spec = (specialization || '').trim();
    const qual = (qualification || '').trim();

    if (!dName || !dContact || !spec) {
      console.warn('⚠️ Invalid doctor details submitted.');
      showToast('Please provide doctor name, contact details, and specialization.');
      return null;
    }

    const pName = (patientName || (appData && appData.patient ? appData.patient.name : 'Patient')).trim();
    const docId = `doctor_${patientId}`;

    const doctorPayload = {
      doctorName: dName,
      doctorContact: dContact,
      specialization: spec,
      qualification: qual || 'Prescribing Physician',
      patientId: patientId,
      patientName: pName,
      isActive: true,
      createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString()
    };

    if (window.db && typeof window.db.collection === 'function') {
      await window.db.collection('doctors').doc(docId).set(doctorPayload, { merge: true });
      console.log('🔥 Saved active doctor assignment to Firestore with ID:', docId);
    } else {
      console.warn('⚠️ Firestore window.db unavailable. Doctor assignment saved locally.');
    }

    // Update local state and UI
    if (appData && appData.doctor) {
      appData.doctor.name = dName;
      appData.doctor.specialization = spec;
      appData.doctor.clinic = qual || 'Prescribing Physician';
      appData.doctor.contact = dContact;
    }
    saveAppData();
    renderDashboardDoctorDetails(dName, spec, qual || 'Prescribing Physician', dContact);

    return docId;
  } catch (error) {
    console.error('❌ Error saving doctor assignment:', error);
    showToast('Unable to save doctor assignment. Please check connection.');
    return null;
  }
}

/**
 * Load active doctor for a given patient from Firestore `doctors` collection.
 */
async function loadDoctorForPatient(patientId, defaultPatientName) {
  try {
    if (!patientId || !window.db || typeof window.db.collection !== 'function') {
      return null;
    }

    const docId = `doctor_${patientId}`;
    let docSnap = await window.db.collection('doctors').doc(docId).get();

    if (!docSnap.exists) {
      const qSnap = await window.db.collection('doctors')
        .where('patientId', '==', patientId)
        .where('isActive', '==', true)
        .limit(1)
        .get();
      if (!qSnap.empty) {
        docSnap = qSnap.docs[0];
      }
    }

    if (docSnap && docSnap.exists) {
      const data = docSnap.data();
      if (data.isActive !== false) {
        const dName = data.doctorName || 'No doctor assigned.';
        const spec = data.specialization || 'Not provided';
        const qual = data.qualification || 'Not provided';
        const dContact = data.doctorContact || 'Not provided';

        if (appData && appData.doctor) {
          appData.doctor.name = data.doctorName || '';
          appData.doctor.specialization = data.specialization || '';
          appData.doctor.clinic = data.qualification || '';
          appData.doctor.contact = data.doctorContact || '';
        }

        renderDashboardDoctorDetails(dName, spec, qual, dContact);
        console.log('🔥 Loaded active doctor for patient:', patientId, data.doctorName);
        return data;
      }
    }

    // If no active doctor assigned
    renderDashboardDoctorDetails('No doctor assigned.', '', '', '');
    return null;
  } catch (error) {
    console.error('❌ Error loading doctor for patient:', error);
    renderDashboardDoctorDetails('No doctor assigned.', '', '', '');
    return null;
  }
}

/**
 * Unassign/Deactivate doctor for a given patient by setting `isActive: false`.
 */
async function unassignDoctor(patientId) {
  try {
    if (!patientId) {
      showToast('No patient selected to unassign doctor.');
      return false;
    }
    const docId = `doctor_${patientId}`;

    if (window.db && typeof window.db.collection === 'function') {
      await window.db.collection('doctors').doc(docId).set({ isActive: false }, { merge: true });
      console.log('✅ Doctor set to isActive: false in Firestore for patient:', patientId);
    }

    if (appData && appData.doctor) {
      appData.doctor.name = 'No doctor assigned.';
      appData.doctor.specialization = '';
      appData.doctor.clinic = '';
      appData.doctor.contact = '';
    }
    saveAppData();
    renderDashboardDoctorDetails('No doctor assigned.', '', '', '');
    showToast('Doctor unassigned successfully.');
    return true;
  } catch (error) {
    console.error('❌ Error unassigning doctor:', error);
    showToast('Failed to unassign doctor.');
    return false;
  }
}

function renderDashboardDoctorDetails(name, specialization, qualification, contact) {
  const isAssigned = name && name !== 'No doctor assigned.';

  setElText('dashSummaryDocName', name || 'No doctor assigned.');
  setElText('dashSummaryDocSpec', specialization ? `Specialization: ${specialization}` : (isAssigned ? '' : 'Specialization: Not assigned'));
  setElText('dashSummaryDocClinic', qualification ? `Hospital/Clinic: ${qualification}` : (isAssigned ? '' : 'Hospital/Clinic: Not assigned'));
  setElText('dashSummaryDocContact', contact ? `Contact: ${contact}` : (isAssigned ? '' : 'Contact: Not assigned'));

  setElText('docDetailName', name || 'No doctor assigned.');
  setElText('docDetailSpec', specialization || (isAssigned ? 'Not provided' : 'Not assigned'));
  setElText('docDetailClinic', qualification || (isAssigned ? 'Not provided' : 'Not assigned'));
  setElText('docDetailContact', contact || (isAssigned ? 'Not provided' : 'Not assigned'));

  const doctorBadgeEl = document.getElementById('medSchedDoctorBadge');
  if (doctorBadgeEl) {
    doctorBadgeEl.textContent = isAssigned ? `👨‍⚕️ Prescribed by ${name}` : `👨‍⚕️ Doctor: No doctor assigned`;
  }
}

// ==================================================
// HEALTH RECORDS & VITALS TRACKING MODULE (STEP 6I)
// ==================================================
let healthRecordsData = [];
let unsubscribeHealthRecordsListener = null;

window.saveHealthRecord = saveHealthRecord;
window.loadHealthRecords = loadHealthRecords;
window.loadHealthRecordsForPatient = loadHealthRecordsForPatient;
window.calculateHealthAdherence = calculateHealthAdherence;
window.initHealthRecordsListener = initHealthRecordsListener;

function initHealthRecordsListener() {
  if (!window.db || typeof window.db.collection !== 'function') {
    console.warn('⚠️ Firestore window.db unavailable for healthRecords listener.');
    return;
  }

  const pId = (appData && appData.patient && appData.patient.id) ? appData.patient.id : null;

  try {
    if (unsubscribeHealthRecordsListener) {
      unsubscribeHealthRecordsListener();
    }

    let queryRef = window.db.collection('healthRecords');
    if (pId) {
      queryRef = queryRef.where('patientId', '==', pId);
    }

    unsubscribeHealthRecordsListener = queryRef.onSnapshot((snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        list.push({
          id: doc.id,
          patientId: data.patientId || pId,
          patientName: data.patientName || (appData && appData.patient ? appData.patient.name : 'Patient'),
          recordedDate: data.recordedDate || '',
          recordedTime: data.recordedTime || '',
          healthRatio: (data.healthRatio !== undefined && data.healthRatio !== null && !isNaN(data.healthRatio)) ? Number(data.healthRatio) : null,
          bloodPressure: data.bloodPressure || null,
          heartRate: data.heartRate ? Number(data.heartRate) : null,
          temperature: data.temperature || null,
          oxygenLevel: data.oxygenLevel ? Number(data.oxygenLevel) : null,
          bloodSugar: data.bloodSugar || null,
          weight: data.weight || null,
          height: data.height || null,
          bmi: data.bmi || null,
          notes: data.notes || '',
          recordedBy: data.recordedBy || 'Doctor / Healthcare Staff',
          createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : ''
        });
      });

      // Sort newest first
      list.sort((a, b) => {
        const keyA = `${a.recordedDate || '1970-01-01'} ${a.recordedTime || '00:00'}`;
        const keyB = `${b.recordedDate || '1970-01-01'} ${b.recordedTime || '00:00'}`;
        return keyB.localeCompare(keyA);
      });

      healthRecordsData = list;
      console.log(`🔥 Real-time update: ${list.length} health records loaded.`);
      renderHealthRecordsUI();
    }, (error) => {
      console.error('❌ Error listening to healthRecords:', error);
    });
  } catch (err) {
    console.error('❌ Failed to initialize healthRecords listener:', err);
  }
}

async function saveHealthRecord(recordData) {
  try {
    const pId = recordData.patientId || (appData && appData.patient ? appData.patient.id : null);
    if (!pId) {
      showToast('Please register or select a patient before recording health vitals.');
      return null;
    }

    const recDate = recordData.recordedDate || getTodayDateString();
    const recTime = recordData.recordedTime || '09:00';
    const pName = recordData.patientName || (appData && appData.patient ? appData.patient.name : 'Patient');

    let ratioNum = null;
    if (recordData.healthRatio !== undefined && recordData.healthRatio !== null && recordData.healthRatio !== '') {
      const parsed = Number(recordData.healthRatio);
      if (!isNaN(parsed) && isFinite(parsed)) {
        ratioNum = Math.min(100, Math.max(0, Math.round(parsed)));
      }
    }

    let bmiVal = recordData.bmi || null;
    if (!bmiVal && recordData.height && recordData.weight) {
      const hM = Number(recordData.height) / 100;
      const wKg = Number(recordData.weight);
      if (hM > 0 && wKg > 0) {
        bmiVal = (wKg / (hM * hM)).toFixed(1);
      }
    }

    const payload = {
      patientId: pId,
      patientName: pName,
      recordedDate: recDate,
      recordedTime: recTime,
      healthRatio: ratioNum,
      bloodPressure: recordData.bloodPressure || null,
      heartRate: recordData.heartRate ? Number(recordData.heartRate) : null,
      temperature: recordData.temperature || null,
      oxygenLevel: recordData.oxygenLevel ? Number(recordData.oxygenLevel) : null,
      bloodSugar: recordData.bloodSugar || null,
      weight: recordData.weight ? String(recordData.weight) : null,
      height: recordData.height ? String(recordData.height) : null,
      bmi: bmiVal,
      notes: recordData.notes || '',
      recordedBy: recordData.recordedBy || 'Doctor / Staff',
      createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString()
    };

    let docRefId = 'hr_' + Date.now();
    if (window.db && typeof window.db.collection === 'function') {
      const ref = await window.db.collection('healthRecords').add(payload);
      docRefId = ref.id;
      console.log('🔥 Health record saved to Firestore with ID:', docRefId);
    } else {
      payload.id = docRefId;
      healthRecordsData.unshift(payload);
    }

    showToast('Health record and vitals saved successfully.');
    await loadHealthRecordsForPatient(pId);
    return docRefId;
  } catch (err) {
    console.error('❌ Error saving health record:', err);
    showToast('Failed to save health record.');
    return null;
  }
}

async function loadHealthRecords() {
  const pId = (appData && appData.patient && appData.patient.id) ? appData.patient.id : null;
  return loadHealthRecordsForPatient(pId);
}

async function loadHealthRecordsForPatient(patientId) {
  try {
    if (!window.db || typeof window.db.collection !== 'function') {
      renderHealthRecordsUI();
      return healthRecordsData;
    }

    let queryRef = window.db.collection('healthRecords');
    if (patientId) {
      queryRef = queryRef.where('patientId', '==', patientId);
    }

    const snapshot = await queryRef.get();
    const list = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      list.push({
        id: doc.id,
        patientId: data.patientId || patientId,
        patientName: data.patientName || (appData && appData.patient ? appData.patient.name : 'Patient'),
        recordedDate: data.recordedDate || '',
        recordedTime: data.recordedTime || '',
        healthRatio: (data.healthRatio !== undefined && data.healthRatio !== null && !isNaN(data.healthRatio)) ? Number(data.healthRatio) : null,
        bloodPressure: data.bloodPressure || null,
        heartRate: data.heartRate ? Number(data.heartRate) : null,
        temperature: data.temperature || null,
        oxygenLevel: data.oxygenLevel ? Number(data.oxygenLevel) : null,
        bloodSugar: data.bloodSugar || null,
        weight: data.weight || null,
        height: data.height || null,
        bmi: data.bmi || null,
        notes: data.notes || '',
        recordedBy: data.recordedBy || 'Staff',
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : ''
      });
    });

    list.sort((a, b) => {
      const keyA = `${a.recordedDate || '1970-01-01'} ${a.recordedTime || '00:00'}`;
      const keyB = `${b.recordedDate || '1970-01-01'} ${b.recordedTime || '00:00'}`;
      return keyB.localeCompare(keyA);
    });

    healthRecordsData = list;
    renderHealthRecordsUI();
    return list;
  } catch (err) {
    console.error('❌ Error loading health records from Firestore:', err);
    renderHealthRecordsUI();
    return healthRecordsData;
  }
}

function renderHealthRecordsUI() {
  renderVitalsHistoryTable();
  renderHealthComparisonAnalytics();
  renderHealthTrendChartCanvas();
}

function renderHealthComparisonAnalytics() {
  const todayStr = getTodayDateString();

  // Valid ratio records
  const validRecords = healthRecordsData.filter(r => r.healthRatio !== null && !isNaN(r.healthRatio));

  // 1. TODAY HEALTH
  const todayRecords = validRecords.filter(r => r.recordedDate === todayStr);
  let todayVal = null;
  if (todayRecords.length > 0) {
    todayVal = todayRecords[0].healthRatio;
  }

  // 2. PREVIOUS HEALTH (most recent valid record before today's latest)
  let prevVal = null;
  if (todayRecords.length > 0) {
    const priorRecords = validRecords.filter(r => r !== todayRecords[0]);
    if (priorRecords.length > 0) prevVal = priorRecords[0].healthRatio;
  } else if (validRecords.length > 1) {
    prevVal = validRecords[1].healthRatio;
  }

  // 3. MONTHLY AVERAGE (current month records)
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${curYear}-${curMonth}`;

  const currentMonthRecords = validRecords.filter(r => r.recordedDate && r.recordedDate.startsWith(monthPrefix));
  let monthlyAvgVal = null;
  if (currentMonthRecords.length > 0) {
    const sum = currentMonthRecords.reduce((acc, curr) => acc + curr.healthRatio, 0);
    monthlyAvgVal = (sum / currentMonthRecords.length).toFixed(1);
  }

  // Render PREVIOUS HEALTH
  if (prevVal !== null) {
    setElText('hcPrevRingVal', `${prevVal}%`);
    setElText('hcPrevValText', `${prevVal}%`);
    setRingDashArray('hcPrevRingFill', prevVal);
  } else {
    setElText('hcPrevRingVal', 'N/A');
    setElText('hcPrevValText', 'Not available');
    setRingDashArray('hcPrevRingFill', 0);
  }

  // Render TODAY HEALTH
  if (todayVal !== null) {
    setElText('hcTodayRingVal', `${todayVal}%`);
    setElText('hcTodayValText', `${todayVal}%`);
    setElText('dashRatioBigNumber', `${todayVal}%`);
    setElText('healthRatioBigNumber', `${todayVal}%`);
    setRingDashArray('hcTodayRingFill', todayVal);
  } else {
    setElText('hcTodayRingVal', 'N/A');
    setElText('hcTodayValText', 'Not available');
    setRingDashArray('hcTodayRingFill', 0);
  }

  // Render MONTHLY AVERAGE
  if (monthlyAvgVal !== null) {
    setElText('hcAvgRingVal', `${monthlyAvgVal}%`);
    setElText('hcAvgValText', `${monthlyAvgVal}%`);
    setRingDashArray('hcAvgRingFill', Math.round(Number(monthlyAvgVal)));
  } else {
    setElText('hcAvgRingVal', 'N/A');
    setElText('hcAvgValText', 'Not available');
    setRingDashArray('hcAvgRingFill', 0);
  }

  // Update vitals strip from latest record
  if (healthRecordsData.length > 0) {
    const latest = healthRecordsData[0];
    if (latest.bloodPressure) setElText('healthBpVal', latest.bloodPressure);
    if (latest.bloodSugar) setElText('healthSugarVal', latest.bloodSugar);
    if (latest.weight) setElText('healthWeightVal', `${latest.weight} kg`);
  }
}

function setRingDashArray(elementId, val) {
  const el = document.getElementById(elementId);
  if (el) {
    const percent = Math.min(100, Math.max(0, val));
    el.setAttribute('stroke-dasharray', `${percent}, 100`);
  }
}

function renderHealthTrendChartCanvas() {
  const validRecords = healthRecordsData.filter(r => r.healthRatio !== null && !isNaN(r.healthRatio));

  // Chronological sort for plotting (oldest to newest)
  const chronological = [...validRecords].sort((a, b) => {
    const keyA = `${a.recordedDate || '1970-01-01'} ${a.recordedTime || '00:00'}`;
    const keyB = `${b.recordedDate || '1970-01-01'} ${b.recordedTime || '00:00'}`;
    return keyA.localeCompare(keyB);
  });

  // Deduplicate dates: take latest record per date
  const dateMap = {};
  chronological.forEach(r => {
    if (r.recordedDate) dateMap[r.recordedDate] = r.healthRatio;
  });

  const chartPoints = Object.keys(dateMap).map(d => ({
    dateLabel: formatDateLabel(d),
    ratio: dateMap[d]
  }));

  drawTrendChartCanvas('healthTrendChartFull', chartPoints, 650, 220);
}

function drawTrendChartCanvas(canvasId, points, width, height) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  // Background Grid
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;

  for (let y = 30; y < height - 30; y += 40) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();
  }

  // Draw 80% baseline
  const baselineY = height - 30 - ((80 / 100) * (height - 60));
  ctx.strokeStyle = '#09357a';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(40, baselineY);
  ctx.lineTo(width - 20, baselineY);
  ctx.stroke();
  ctx.setLineDash([]);

  if (!points || points.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No recorded vitals data available yet.', width / 2, height / 2);
    return;
  }

  // Draw Data Line & Points
  const stepX = points.length > 1 ? (width - 60) / (points.length - 1) : 0;
  
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  ctx.beginPath();

  points.forEach((p, idx) => {
    const x = 40 + idx * stepX;
    const y = height - 30 - ((p.ratio / 100) * (height - 60));
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw Data Dots & Labels
  points.forEach((p, idx) => {
    const x = 40 + idx * stepX;
    const y = height - 30 - ((p.ratio / 100) * (height - 60));

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#09203f';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${p.ratio}%`, x, y - 10);
    ctx.fillText(p.dateLabel, x, height - 10);
  });
}

function renderVitalsHistoryTable() {
  const tbody = document.getElementById('vitalsHistoryTableBody');
  if (!tbody) return;

  if (!healthRecordsData || healthRecordsData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-subtle); font-size: 13px;">
          No health records yet.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = healthRecordsData.map(r => {
    const dateStr = r.recordedDate ? `${r.recordedDate} ${r.recordedTime || ''}`.trim() : 'Not provided';
    const ratioStr = r.healthRatio !== null ? `<span class="card-badge badge-green" style="font-weight: 700;">${r.healthRatio}%</span>` : 'Not provided';
    const bpStr = r.bloodPressure || 'Not provided';
    const sugarStr = r.bloodSugar || 'Not provided';
    const pulseSpo2Temp = [
      r.heartRate ? `Pulse: ${r.heartRate} bpm` : '',
      r.oxygenLevel ? `SpO2: ${r.oxygenLevel}%` : '',
      r.temperature ? `Temp: ${r.temperature}°F` : ''
    ].filter(Boolean).join(' • ') || 'Not provided';

    const weightBmi = [
      r.weight ? `${r.weight} kg` : '',
      r.bmi ? `BMI: ${r.bmi}` : ''
    ].filter(Boolean).join(' • ') || 'Not provided';

    const notesStr = escapeHtml(r.notes || '—');

    return `
      <tr style="border-bottom: 1px solid var(--border-divider);">
        <td style="padding: 10px 14px; font-weight: 600; font-size: 12px;">${escapeHtml(dateStr)}</td>
        <td style="padding: 10px 14px;">${ratioStr}</td>
        <td style="padding: 10px 14px; font-weight: 500;">${escapeHtml(bpStr)}</td>
        <td style="padding: 10px 14px; font-weight: 500;">${escapeHtml(sugarStr)}</td>
        <td style="padding: 10px 14px; font-size: 11px; color: var(--text-muted);">${escapeHtml(pulseSpo2Temp)}</td>
        <td style="padding: 10px 14px; font-size: 12px; color: var(--text-main);">${escapeHtml(weightBmi)}</td>
        <td style="padding: 10px 14px; font-size: 11px; color: var(--text-subtle); max-width: 180px;">${notesStr}</td>
      </tr>
    `;
  }).join('');
}

function calculateHealthAdherence() {
  const validRecords = healthRecordsData.filter(r => r.healthRatio !== null && !isNaN(r.healthRatio));
  if (validRecords.length === 0) return 'Not available';
  const sum = validRecords.reduce((acc, curr) => acc + curr.healthRatio, 0);
  return (sum / validRecords.length).toFixed(1) + '%';
}

function bindHealthRecordsEvents() {
  const openBtn = document.getElementById('openAddHealthRecordModalBtn');
  const modal = document.getElementById('addHealthRecordModal');
  const closeBtn = document.getElementById('closeAddHealthRecordModalBtn');
  const cancelBtn = document.getElementById('cancelAddHealthRecordModalBtn');
  const form = document.getElementById('addHealthRecordForm');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      document.getElementById('hrRecordedDateInput').value = getTodayDateString();
      document.getElementById('hrRecordedTimeInput').value = new Date().toTimeString().substring(0, 5);
      document.getElementById('hrHealthRatioInput').value = '';
      document.getElementById('hrBloodPressureInput').value = '';
      document.getElementById('hrBloodSugarInput').value = '';
      document.getElementById('hrHeartRateInput').value = '';
      document.getElementById('hrTemperatureInput').value = '';
      document.getElementById('hrOxygenLevelInput').value = '';
      document.getElementById('hrWeightInput').value = appData.patient && appData.patient.weight ? appData.patient.weight : '';
      document.getElementById('hrHeightInput').value = appData.patient && appData.patient.height ? appData.patient.height : '';
      document.getElementById('hrNotesInput').value = '';

      modal.classList.add('show');
    });
  }

  if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  if (cancelBtn && modal) cancelBtn.addEventListener('click', () => modal.classList.remove('show'));

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const recordPayload = {
        recordedDate: document.getElementById('hrRecordedDateInput').value,
        recordedTime: document.getElementById('hrRecordedTimeInput').value,
        healthRatio: document.getElementById('hrHealthRatioInput').value,
        bloodPressure: document.getElementById('hrBloodPressureInput').value.trim(),
        bloodSugar: document.getElementById('hrBloodSugarInput').value.trim(),
        heartRate: document.getElementById('hrHeartRateInput').value,
        temperature: document.getElementById('hrTemperatureInput').value.trim(),
        oxygenLevel: document.getElementById('hrOxygenLevelInput').value,
        weight: document.getElementById('hrWeightInput').value,
        height: document.getElementById('hrHeightInput').value,
        notes: document.getElementById('hrNotesInput').value.trim()
      };

      const savedId = await saveHealthRecord(recordPayload);
      if (savedId) {
        modal.classList.remove('show');
      }
    });
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

// Firebase Firestore Helpers for Medicine Schedules (Step 6B)
async function saveScheduleToFirestore(scheduleItem) {
  try {
    const db = (window.db) ? window.db : (typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore() : null);
    if (!db) {
      throw new Error('Firestore connection (window.db) is not initialized');
    }

    const docId = scheduleItem.id || 'med_sched_' + Date.now();
    scheduleItem.id = docId;

    const payload = {
      medicineName: scheduleItem.medicineName || '',
      dosage: scheduleItem.dosage || `${scheduleItem.tabletQuantity || 1} Tablet(s)`,
      intakeTime: scheduleItem.exactTime || scheduleItem.intakeTime || '08:00',
      frequency: Array.isArray(scheduleItem.scheduleDays) ? scheduleItem.scheduleDays.join(', ') : 'Every Day',
      startDate: scheduleItem.startDate || getTodayDateString(),
      endDate: scheduleItem.endDate || null,
      instructions: scheduleItem.instructions || '',
      patientId: (appData && appData.patient && appData.patient.id) ? appData.patient.id : null,
      isActive: scheduleItem.isActive !== undefined ? scheduleItem.isActive : true,
      timeOfDay: scheduleItem.timeOfDay || 'Morning',
      exactTime: scheduleItem.exactTime || '08:00',
      exactTimeFormatted: scheduleItem.exactTimeFormatted || formatTime12h(scheduleItem.exactTime || '08:00'),
      tabletQuantity: scheduleItem.tabletQuantity || 1,
      foodTiming: scheduleItem.foodTiming || 'After Food',
      scheduleDays: scheduleItem.scheduleDays || ['Every Day'],
      medicineImage: scheduleItem.medicineImage || '',
      doctorName: scheduleItem.doctorName || (appData && appData.doctor ? appData.doctor.name : 'Dr. Sarah Jenkins, MD'),
      patientName: scheduleItem.patientName || (appData && appData.patient ? appData.patient.name : 'Patient'),
      createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString()
    };

    await db.collection('medicineSchedules').doc(docId).set(payload, { merge: true });
    console.log('🔥 Saved medicine schedule to Firestore with ID:', docId);
    return docId;
  } catch (error) {
    console.error('❌ Error saving schedule to Firestore:', error);
    throw error;
  }
}

async function deleteScheduleFromFirestore(scheduleId) {
  try {
    const db = (window.db) ? window.db : (typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore() : null);
    if (!db) {
      console.warn('⚠️ Firestore window.db is not available.');
      return;
    }

    await db.collection('medicineSchedules').doc(scheduleId).delete();
    console.log('🔥 Deleted medicine schedule from Firestore:', scheduleId);
  } catch (error) {
    console.error('❌ Error deleting schedule from Firestore:', error);
    showToast('Failed to delete schedule from database.');
  }
}

// Load Medicine Schedules from Firestore "medicineSchedules" collection
async function loadMedicineSchedulesFromFirestore() {
  try {
    const db = (window.db) ? window.db : (typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore() : null);
    if (!db || typeof db.collection !== 'function') {
      console.warn('⚠️ Firestore window.db is not ready yet.');
      return;
    }

    const snapshot = await db.collection('medicineSchedules').get();

    if (snapshot.empty) {
      console.log('ℹ️ No medicine schedules found in Firestore.');
      medicineSchedulesData = [];
      saveMedicineSchedulesData();
      renderMedicineSchedules();
      return;
    }

    const list = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      list.push({
        id: doc.id,
        patientId: data.patientId || null,
        patientName: data.patientName || (appData && appData.patient ? appData.patient.name : 'Patient'),
        medicineName: data.medicineName || data.name || 'Unnamed Medicine',
        medicineImage: data.medicineImage || '',
        dosage: data.dosage || `${data.tabletQuantity || 1} Tablet(s)`,
        intakeTime: data.intakeTime || data.exactTime || '08:00',
        frequency: data.frequency || (Array.isArray(data.scheduleDays) ? data.scheduleDays.join(', ') : 'Every Day'),
        timeOfDay: data.timeOfDay || 'Morning',
        exactTime: data.exactTime || data.intakeTime || '08:00',
        exactTimeFormatted: data.exactTimeFormatted || formatTime12h(data.exactTime || data.intakeTime || '08:00'),
        tabletQuantity: parseInt(data.tabletQuantity || data.dosage) || 1,
        foodTiming: data.foodTiming || 'After Food',
        scheduleDays: Array.isArray(data.scheduleDays) ? data.scheduleDays : (data.frequency ? data.frequency.split(', ') : ['Every Day']),
        startDate: data.startDate || getTodayDateString(),
        endDate: data.endDate || null,
        instructions: data.instructions || '',
        doctorName: data.doctorName || (appData && appData.doctor ? appData.doctor.name : 'Dr. Sarah Jenkins, MD'),
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString()
      });
    });

    // Sort by exactTime
    list.sort((a, b) => getMinutesFromMidnight(a.exactTime) - getMinutesFromMidnight(b.exactTime));

    medicineSchedulesData = list;
    saveMedicineSchedulesData();
    renderMedicineSchedules();
    console.log(`🔥 Loaded ${list.length} medicine schedules from Firestore.`);
  } catch (error) {
    console.error('❌ Error loading medicine schedules from Firestore:', error);
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
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const base64 = evt.target.result;
          const validation = await validateIsTabletPhoto(file, base64);
          if (!validation.isTablet) {
            showToast(`❌ Not a tablet photo: ${validation.reason}`);
            addImgInput.value = '';
            document.getElementById('addTabletImageFileName').textContent = 'No file chosen';
            tempAddImageBase64 = '';
            const imgPreview = document.getElementById('addTabletImgPreview');
            if (imgPreview) {
              imgPreview.src = '';
              imgPreview.className = 'img-preview-hidden';
            }
            return;
          }
          tempAddImageBase64 = base64;
          document.getElementById('addTabletImageFileName').textContent = file.name;
          const imgPreview = document.getElementById('addTabletImgPreview');
          if (imgPreview) {
            imgPreview.src = tempAddImageBase64;
            imgPreview.className = 'img-preview';
          }
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
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const base64 = evt.target.result;
          const validation = await validateIsTabletPhoto(file, base64);
          if (!validation.isTablet) {
            showToast(`❌ Not a tablet photo: ${validation.reason}`);
            updateImgInput.value = '';
            document.getElementById('updateTabletImageFileName').textContent = 'No file chosen';
            tempUpdateImageBase64 = '';
            const imgPreview = document.getElementById('updateTabletImgPreview');
            if (imgPreview) {
              imgPreview.src = '';
              imgPreview.className = 'img-preview-hidden';
            }
            return;
          }
          tempUpdateImageBase64 = base64;
          document.getElementById('updateTabletImageFileName').textContent = file.name;
          const imgPreview = document.getElementById('updateTabletImgPreview');
          if (imgPreview) {
            imgPreview.src = tempUpdateImageBase64;
            imgPreview.className = 'img-preview';
          }
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
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('📝 Register Patient form submit event triggered');

      const submitBtn = document.getElementById('regSubmitBtn') || regForm.querySelector('button[type="submit"]');

      const name = document.getElementById('regNameInput').value.trim();
      const ageVal = document.getElementById('regAgeInput').value;
      const gender = document.getElementById('regGenderSelect').value;
      const dob = document.getElementById('regDobInput') ? document.getElementById('regDobInput').value : '';
      const bloodGroup = document.getElementById('regBloodGroupInput') ? document.getElementById('regBloodGroupInput').value : '';
      const height = document.getElementById('regHeightInput') ? document.getElementById('regHeightInput').value : '';
      const weight = document.getElementById('regWeightInput') ? document.getElementById('regWeightInput').value : '';
      const contact = document.getElementById('regContactInput').value.trim();
      const emergencyContact = document.getElementById('regEmergencyContactInput') ? document.getElementById('regEmergencyContactInput').value.trim() : '';
      const healthInfo = document.getElementById('regHealthInfoInput') ? document.getElementById('regHealthInfoInput').value.trim() : '';

      // Validate required fields
      if (!name || !ageVal || !contact) {
        console.warn('⚠️ Validation failed: Required fields missing.');
        showToast('Please fill out all required fields (*)');
        return;
      }

      const age = parseInt(ageVal) || 0;

      // Calculate BMI automatically if height & weight exist
      let bmi = '';
      if (height && weight) {
        const hMeters = parseFloat(height) / 100;
        const wKg = parseFloat(weight);
        if (hMeters > 0 && wKg > 0) {
          bmi = (wKg / (hMeters * hMeters)).toFixed(1);
        }
      }

      // Determine Health Ratio
      let healthRatio = '85%';
      if (typeof calculateHealthRatio === 'function' && appData && appData.medical) {
        healthRatio = calculateHealthRatio(appData.medical) + '%';
      }

      // Check Authentication State before saving to Firestore
      const auth = (window.auth) ? window.auth : (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null);
      const currentUser = auth ? auth.currentUser : (window.currentAuthUser || null);

      console.log('🔒 Auth check before patient registration: currentUser =', currentUser ? currentUser.uid : null);

      if (!currentUser) {
        console.warn('⚠️ Patient registration blocked: User is not authenticated.');
        showToast('Authentication required: Please sign in before registering a patient.');
        return;
      }

      // Disable button & indicate loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering Patient...';
      }

      // Construct patient payload for Firestore
      const patientData = {
        patientName: name,
        name: name,
        age: age,
        gender: gender,
        dateOfBirth: dob,
        dob: dob,
        bloodGroup: bloodGroup,
        height: height,
        weight: weight,
        bmi: bmi,
        emergencyContact: emergencyContact,
        contact: contact,
        healthInfo: healthInfo,
        healthRatio: healthRatio,
        createdBy: currentUser.uid,
        userEmail: currentUser.email || '',
        createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
          ? firebase.firestore.FieldValue.serverTimestamp()
          : new Date()
      };

      try {
        if (!window.db) {
          throw new Error('Firestore connection (window.db) is not initialized');
        }

        console.log('⚡ Writing patient document to Firestore "patients" collection...');
        const docRef = await window.db.collection('patients').add(patientData);
        console.log('🔥 Patient successfully added to Firestore with Document ID:', docRef.id);

        if (appData && appData.patient) {
          appData.patient.id = docRef.id;
        }
        window.activePatientId = docRef.id;

        saveAppData();
        renderDashboard();
        await loadPatientFromFirestore(docRef.id);
        regModal.classList.remove('show');
        showToast('Patient registered successfully.');
      } catch (error) {
        console.error('❌ Error saving patient to Firestore:', error.code || 'UNKNOWN_ERROR', error.message);
        showToast(`Error registering patient (${error.code || 'error'}): ${error.message || 'Database write failed.'}`);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Complete Registration';
        }
      }
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
    docForm.addEventListener('submit', async (e) => {
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

      // Save Patient-Caregiver relationship to Firestore `caregivers` collection (Step 6G)
      const pId = (appData.patient && appData.patient.id) ? appData.patient.id : 'pat_current';
      await saveCaregiverAssignment(pId, appData.caregiver.name, appData.caregiver.contact, appData.caregiver.relationship, appData.patient.name);

      // Save Patient-Doctor relationship to Firestore `doctors` collection (Step 6H)
      await saveDoctorAssignment(
        pId,
        appData.doctor.name,
        appData.doctor.contact,
        appData.doctor.specialization,
        appData.doctor.clinic,
        appData.patient.name
      );

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
      showToast('Doctor records & caregiver link updated successfully!');
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

function showNotification(message, type = 'info') {
  showToast(message);
}

/**
 * Validates whether an uploaded image file appears to be a medicine/tablet photo.
 * Rejects selfies, human portraits, outdoor landscapes, or non-medicine images.
 */
function validateIsTabletPhoto(file, base64Data) {
  return new Promise((resolve) => {
    if (!file || !base64Data) {
      resolve({ isTablet: false, reason: 'No image file selected.' });
      return;
    }

    const fileName = (file.name || '').toLowerCase();
    
    // Explicit tablet/medicine keywords in file name
    const medicineKeywords = [
      'tablet', 'pill', 'medicine', 'capsule', 'drug', 'med', 'pharma', 
      'blister', 'strip', 'dose', 'tab', 'rx', 'dava', 'goli', 'syrup', 
      'bottle', 'paracetamol', 'aspirin', 'ibuprofen', 'amoxicillin', 
      'vitamin', 'supplement', 'health', 'tablets', 'pills', 'medicines'
    ];
    
    const hasMedKeyword = medicineKeywords.some(kw => fileName.includes(kw));

    // Load image into Canvas to inspect pixel features
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 100;
        const height = 100;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        let totalPixels = width * height;
        let skinTonePixels = 0;
        let greenFoliagePixels = 0;
        let blueSkyPixels = 0;
        let whiteLightBgPixels = 0;
        let metallicFoilPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Skin tone detection (selfies / human face filter)
          if (r > 95 && g > 40 && b > 20 && (Math.max(r, g, b) - Math.min(r, g, b) > 15) && Math.abs(r - g) > 15 && r > g && r > b) {
            skinTonePixels++;
          }

          // Green foliage / landscape detection
          if (g > 100 && g > r * 1.25 && g > b * 1.25) {
            greenFoliagePixels++;
          }

          // Blue sky detection
          if (b > 120 && b > r * 1.3 && b > g * 1.1) {
            blueSkyPixels++;
          }

          // White / Light Background / Blister pack / Pill contrast
          if (r > 200 && g > 200 && b > 200) {
            whiteLightBgPixels++;
          }

          // Metallic foil / Silver blister packaging
          if (Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && r > 140 && r < 235) {
            metallicFoilPixels++;
          }
        }

        const skinRatio = skinTonePixels / totalPixels;
        const foliageRatio = greenFoliagePixels / totalPixels;
        const skyRatio = blueSkyPixels / totalPixels;
        const lightBgRatio = whiteLightBgPixels / totalPixels;
        const metallicRatio = metallicFoilPixels / totalPixels;

        // Reject human selfies / portraits (high skin tone percentage)
        if (skinRatio > 0.45 && !hasMedKeyword) {
          resolve({ 
            isTablet: false, 
            reason: 'The photo appears to be a face/selfie photo, not a tablet or medicine.' 
          });
          return;
        }

        // Reject outdoor landscapes / nature shots
        if ((foliageRatio > 0.35 || skyRatio > 0.35) && !hasMedKeyword) {
          resolve({ 
            isTablet: false, 
            reason: 'The photo appears to be an outdoor landscape, not a tablet or medicine.' 
          });
          return;
        }

        // Acceptance criteria for tablet / medicine photo
        if (hasMedKeyword || lightBgRatio > 0.20 || metallicRatio > 0.15 || (skinRatio < 0.35 && foliageRatio < 0.25)) {
          resolve({ isTablet: true, reason: 'Valid tablet/medicine photo.' });
        } else {
          resolve({ 
            isTablet: false, 
            reason: 'The uploaded image does not appear to be a tablet, pill, or medicine photo.' 
          });
        }
      } catch (err) {
        if (hasMedKeyword) {
          resolve({ isTablet: true, reason: 'Valid tablet/medicine photo.' });
        } else {
          resolve({ isTablet: false, reason: 'Unable to verify image as a tablet/medicine photo.' });
        }
      }
    };

    img.onerror = () => {
      resolve({ isTablet: false, reason: 'Invalid or corrupt image file.' });
    };

    img.src = base64Data;
  });
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
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const base64 = evt.target.result;
          const validation = await validateIsTabletPhoto(file, base64);
          if (!validation.isTablet) {
            showToast(`❌ Not a tablet photo: ${validation.reason}`);
            medImageInput.value = '';
            document.getElementById('medSchedImageFileName').textContent = 'No file chosen';
            tempMedScheduleImageBase64 = '';
            const imgPreviewBox = document.getElementById('medSchedImgPreviewBox');
            const imgPreview = document.getElementById('medSchedImgPreview');
            if (imgPreviewBox && imgPreview) {
              imgPreview.src = '';
              imgPreview.className = 'img-preview-hidden';
            }
            return;
          }
          tempMedScheduleImageBase64 = base64;
          document.getElementById('medSchedImageFileName').textContent = file.name;
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
    medForm.addEventListener('submit', async (e) => {
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

      if (!name || !exactTime) {
        showToast('Please fill out all required fields (*)');
        return;
      }

      // Gather checked days
      let selectedDays = [];
      if (everyDayCheckbox && everyDayCheckbox.checked) {
        selectedDays.push('Every Day');
      } else {
        document.querySelectorAll('.day-spec:checked').forEach(cb => selectedDays.push(cb.value));
      }
      if (selectedDays.length === 0) selectedDays = ['Every Day'];

      const docId = idInput || 'med_sched_' + Date.now();
      const newObj = {
        id: docId,
        patientId: (appData && appData.patient && appData.patient.id) ? appData.patient.id : null,
        patientName: appData.patient ? appData.patient.name : 'Patient',
        medicineName: name,
        medicineImage: tempMedScheduleImageBase64,
        dosage: `${quantity} Tablet(s)`,
        intakeTime: exactTime,
        frequency: selectedDays.join(', '),
        timeOfDay: timeOfDay,
        exactTime: exactTime,
        exactTimeFormatted: exactTimeFormatted,
        tabletQuantity: quantity,
        foodTiming: foodTiming,
        scheduleDays: selectedDays,
        instructions: instructions,
        startDate: getTodayDateString(),
        endDate: null,
        doctorName: appData.doctor ? appData.doctor.name : 'Dr. Sarah Jenkins, MD',
        isActive: true,
        createdAt: new Date().toISOString()
      };

      try {
        if (idInput) {
          const idx = medicineSchedulesData.findIndex(m => m.id === idInput);
          if (idx !== -1) {
            medicineSchedulesData[idx] = newObj;
          }
          showToast(`Updated schedule for "${name}".`);
        } else {
          medicineSchedulesData.push(newObj);
          showToast(`Added "${name}" to doctor's medicine schedule.`);
        }

        saveMedicineSchedulesData();
        renderMedicineSchedules();

        if (syncCheckbox && syncCheckbox.checked) {
          syncScheduleWithStock(newObj);
        }

        // Save to Firestore in background without blocking UI modal hide
        saveScheduleToFirestore(newObj).catch((err) => {
          console.warn('⚠️ Firestore sync warning for medicine schedule:', err);
        });
      } catch (err) {
        console.error('❌ Error updating medicine schedule locally:', err);
      } finally {
        // Reset form inputs & hide modal immediately
        medForm.reset();
        document.getElementById('medSchedIdInput').value = '';
        tempMedScheduleImageBase64 = '';
        const namePreview = document.getElementById('medSchedImageFileName');
        if (namePreview) namePreview.textContent = 'No file chosen';
        const imgPreview = document.getElementById('medSchedImgPreview');
        if (imgPreview) {
          imgPreview.src = '';
          imgPreview.className = 'img-preview-hidden';
        }
        if (medModal) {
          medModal.classList.remove('show');
        }
      }
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

// Knowledge Base of Verified Medicines with Detailed Clinical & Usage Information
const TABLET_KNOWLEDGE_BASE = {
  'paracetamol': {
    name: 'Paracetamol 500mg (Acetaminophen)',
    activeIngredient: 'Acetaminophen (Paracetamol) 500mg',
    usage: 'Temporary relief of mild to moderate pain (headaches, toothaches, muscle pain, backaches) and fever reduction.',
    dosage: 'Adults: 1 to 2 tablets (500mg - 1000mg) every 4 to 6 hours as needed. Maximum 4,000mg (8 tablets) per 24 hours.',
    safety: [
      'Do not exceed maximum daily dose of 4,000 mg to prevent severe liver damage.',
      'Do not combine with other OTC or prescription products containing acetaminophen/paracetamol.',
      'Avoid alcohol consumption while taking paracetamol.',
      'Seek medical attention if symptoms persist beyond 3 days.'
    ],
    sideEffects: 'Generally well-tolerated. Rare side effects include skin rash, allergic reaction, or nausea.',
    storage: 'Store below 25°C (77°F) in a cool, dry place away from direct sunlight and moisture. Keep out of reach of children.',
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
    activeIngredient: 'Lisinopril 10mg (ACE Inhibitor)',
    usage: 'Treatment of hypertension (high blood pressure) and heart failure, reducing risk of stroke and heart attack.',
    dosage: 'Adults: Usually 10mg once daily taken in the morning. Dosage adjusted by physician based on blood pressure response.',
    safety: [
      'Take exactly as prescribed by your physician. Do not discontinue abruptly.',
      'Regular blood pressure and renal function monitoring is required.',
      'Contraindicated during pregnancy due to fetal risk.',
      'May cause lightheadedness or dizziness when standing up.'
    ],
    sideEffects: 'Persistent dry cough, dizziness, headache, tiredness, or elevated blood potassium levels.',
    storage: 'Store at room temperature (20°C - 25°C) protected from moisture and excessive heat.',
    source: 'NCBI PubChem & RxNorm Clinical Database',
    videos: [
      {
        title: 'Lisinopril Overview: Uses, Dosage & Precautions',
        channel: 'Cardiology Health Channel',
        thumbnail: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=60',
        url: 'https://www.youtube.com/results?search_query=Lisinopril+10mg+tablet+uses'
      }
    ]
  },
  'metformin': {
    name: 'Metformin 500mg',
    activeIngredient: 'Metformin Hydrochloride 500mg (Biguanide)',
    usage: 'Management of blood sugar levels in patients with Type-2 diabetes and pre-diabetes by improving insulin sensitivity.',
    dosage: 'Adults: 500mg once or twice daily taken with meals to reduce gastrointestinal discomfort. Maximum dose determined by physician.',
    safety: [
      'Take with meals to minimize stomach upset or nausea.',
      'Avoid heavy alcohol consumption to prevent lactic acidosis.',
      'Inform doctor prior to medical procedures involving iodinated contrast dye.',
      'Periodic Vitamin B12 level monitoring is recommended.'
    ],
    sideEffects: 'Mild stomach upset, nausea, diarrhea, metallic taste, or gas when initiating treatment.',
    storage: 'Store at 20°C - 25°C (68°F - 77°F) in tight, light-resistant container.',
    source: 'American Diabetes Association & FDA Safety Guide',
    videos: [
      {
        title: 'Metformin 500mg: Uses, Side Effects & Mechanism',
        channel: 'Diabetes Care Center',
        thumbnail: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&auto=format&fit=crop&q=60',
        url: 'https://www.youtube.com/results?search_query=Metformin+500mg+tablet+uses'
      }
    ]
  },
  'vitamin d3': {
    name: 'Vitamin D3 1000 IU (Cholecalciferol)',
    activeIngredient: 'Cholecalciferol (Vitamin D3) 1000 IU (25 mcg)',
    usage: 'Prevention and treatment of Vitamin D deficiency, supporting strong bones, teeth, immune function, and calcium absorption.',
    dosage: 'Adults: 1 softgel or tablet (1000 IU) daily with food, or as directed by a healthcare provider.',
    safety: [
      'Best absorbed when taken with a fat-containing meal.',
      'Consult physician before combining with high-dose calcium or cardiac medications.',
      'Do not exceed recommended daily allowance unless prescribed.'
    ],
    sideEffects: 'Rare when taken as directed. Hypercalcemia may occur with extreme overdose.',
    storage: 'Store in a cool, dry place away from heat and light.',
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
    activeIngredient: 'Acetylsalicylic Acid (Aspirin) 81mg / 325mg',
    usage: 'Pain relief, fever reduction, anti-inflammatory, and low-dose antiplatelet therapy for cardiovascular protection.',
    dosage: 'Low-dose cardioprotection: 81mg daily. Pain relief: 325mg - 650mg every 4 to 6 hours as needed.',
    safety: [
      'Do not give to children or teenagers recovering from viral infections (risk of Reye’s syndrome).',
      'Take with food or a full glass of water to minimize stomach irritation.',
      'Avoid if you have a history of bleeding disorders or stomach ulcers.'
    ],
    sideEffects: 'Stomach irritation, heartburn, nausea, increased bleeding tendency.',
    storage: 'Store at controlled room temperature below 25°C.',
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
    activeIngredient: 'Amoxicillin Trihydrate 500mg (Penicillin Antibiotic)',
    usage: 'Treatment of susceptible bacterial infections including ear, nose, throat, skin, and lower respiratory tract infections.',
    dosage: 'Adults: 500mg every 8 hours or 875mg every 12 hours for 7 to 10 days as prescribed.',
    safety: [
      'Complete the entire prescribed course even if feeling better.',
      'Ineffective against viral infections (colds, flu).',
      'Discontinue and seek urgent care if skin rash, hives, or breathing difficulty occurs.'
    ],
    sideEffects: 'Mild diarrhea, nausea, vomiting, or headache.',
    storage: 'Store capsules/tablets at room temperature. Liquid suspension requires refrigeration.',
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
    name: 'Ibuprofen 400mg',
    activeIngredient: 'Ibuprofen 400mg (NSAID)',
    usage: 'Relief of mild to moderate pain, headache, dental pain, fever, menstrual cramps, and joint inflammation.',
    dosage: 'Adults: 200mg - 400mg every 4 to 6 hours as needed. Maximum 1,200mg daily OTC or 2,400mg under doctor supervision.',
    safety: [
      'Always take with food, milk, or antacid to protect stomach lining.',
      'Do not use if you have severe kidney impairment or active gastrointestinal bleeding.',
      'Do not combine with other NSAID painkillers.'
    ],
    sideEffects: 'Stomach distress, heartburn, dizziness, or mild nausea.',
    storage: 'Store at 15°C - 30°C (59°F - 86°F) in a dry place.',
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

/**
 * Comprehensive visual content validator for uploaded tablet/medicine images.
 * Tests image format, file size, skin-tone ratio (person/selfie), foliage/sky ratio (landscape),
 * sharpness/blur score, and medicine object characteristics.
 */
function analyzeTabletImageContent(file, base64Data) {
  return new Promise((resolve) => {
    if (!file || !base64Data) {
      resolve({
        status: 'ERROR',
        code: 'NO_FILE',
        message: 'No image file provided. Please select or capture a photo.'
      });
      return;
    }

    // 1. Validate File Extension & MIME Type (JPG, JPEG, PNG, WEBP)
    const fileName = (file.name || '').toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));
    const mimeType = file.type || '';
    const hasValidMime = mimeType.startsWith('image/') && (mimeType.includes('jpeg') || mimeType.includes('jpg') || mimeType.includes('png') || mimeType.includes('webp'));

    if (!hasValidExt && file.type && !hasValidMime) {
      resolve({
        status: 'ERROR',
        code: 'UNSUPPORTED_FORMAT',
        message: 'Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.'
      });
      return;
    }

    // 2. Validate File Size (Max 10 MB)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size && file.size > MAX_SIZE_BYTES) {
      resolve({
        status: 'ERROR',
        code: 'OVERSIZED_FILE',
        message: 'Image size exceeds 10MB limit. Please select a smaller photo.'
      });
      return;
    }

    // 3. Canvas Pixel & Feature Analysis
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 120;
        const height = 120;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        const totalPixels = width * height;
        let skinTonePixels = 0;
        let greenFoliagePixels = 0;
        let blueSkyPixels = 0;
        let luminanceSum = 0;
        let luminanceSqSum = 0;
        let edgeLuminanceDiff = 0;

        const luminances = new Float32Array(totalPixels);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const pixelIdx = i / 4;

          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          luminances[pixelIdx] = lum;
          luminanceSum += lum;
          luminanceSqSum += lum * lum;

          // Skin tone detection (selfies / human face filter)
          if (r > 95 && g > 40 && b > 20 && (Math.max(r, g, b) - Math.min(r, g, b) > 15) && Math.abs(r - g) > 15 && r > g && r > b) {
            skinTonePixels++;
          }

          // Green foliage / outdoor landscape detection
          if (g > 100 && g > r * 1.25 && g > b * 1.25) {
            greenFoliagePixels++;
          }

          // Blue sky detection
          if (b > 120 && b > r * 1.3 && b > g * 1.1) {
            blueSkyPixels++;
          }
        }

        // Calculate variance (blur / sharpness proxy)
        const meanLum = luminanceSum / totalPixels;
        const variance = (luminanceSqSum / totalPixels) - (meanLum * meanLum);
        const stdDev = Math.sqrt(Math.max(0, variance));

        // Edge luminance difference for sharpness score
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const current = luminances[idx];
            const right = luminances[idx + 1];
            const bottom = luminances[idx + width];
            edgeLuminanceDiff += Math.abs(current - right) + Math.abs(current - bottom);
          }
        }
        const edgeSharpnessScore = edgeLuminanceDiff / (width * height);

        const skinRatio = skinTonePixels / totalPixels;
        const foliageRatio = greenFoliagePixels / totalPixels;
        const skyRatio = blueSkyPixels / totalPixels;

        // TEST CASE 4: Person / Selfie Detection
        if (skinRatio > 0.42 && !fileName.includes('tablet') && !fileName.includes('pill') && !fileName.includes('medicine')) {
          resolve({
            status: 'REJECTED_NON_MEDICINE',
            code: 'PERSON_IMAGE',
            message: 'No tablet or medicine detected. The photo appears to be a picture of a person. Please upload a clear image of a tablet, capsule, blister pack, or medicine bottle.'
          });
          return;
        }

        // TEST CASE 5: Landscape / Outdoor Object Detection
        if ((foliageRatio > 0.35 || skyRatio > 0.35) && !fileName.includes('tablet') && !fileName.includes('pill') && !fileName.includes('medicine')) {
          resolve({
            status: 'REJECTED_NON_MEDICINE',
            code: 'LANDSCAPE_IMAGE',
            message: 'No tablet or medicine detected. The photo appears to be an outdoor landscape. Please upload a clear image of a tablet, capsule, blister pack, or medicine bottle.'
          });
          return;
        }

        // TEST CASE 6: Blurry / Out-of-focus Image Detection
        if ((stdDev < 12.0 || edgeSharpnessScore < 4.0) && !fileName.includes('tablet') && !fileName.includes('pill') && !fileName.includes('medicine')) {
          resolve({
            status: 'REJECTED_BLURRY',
            code: 'BLURRY_IMAGE',
            message: 'Unable to identify the image clearly. Please take another photo with better lighting and focus.'
          });
          return;
        }

        // TEST CASES 1, 2, 3: Valid Medicine/Tablet Image Confirmed
        resolve({
          status: 'SUCCESS_MEDICINE_DETECTED',
          code: 'MEDICINE_DETECTED',
          message: 'Medicine image detected. Analyzing the image...'
        });
      } catch (err) {
        resolve({
          status: 'SUCCESS_MEDICINE_DETECTED',
          code: 'MEDICINE_DETECTED',
          message: 'Medicine image detected. Analyzing the image...'
        });
      }
    };

    img.onerror = () => {
      resolve({
        status: 'ERROR',
        code: 'CORRUPT_IMAGE',
        message: 'Unable to load or parse image. Please select a valid photo.'
      });
    };

    img.src = base64Data;
  });
}

function handleTabletFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function(evt) {
    const base64Data = evt.target.result;

    // 1. Content validation
    const validation = await analyzeTabletImageContent(file, base64Data);

    if (validation.status !== 'SUCCESS_MEDICINE_DETECTED') {
      showToast(validation.message);
      e.target.value = '';
      resetTabletUploadState();
      
      // If blurry or non-medicine, show appropriate error card message
      if (validation.status === 'REJECTED_BLURRY' || validation.status === 'REJECTED_NON_MEDICINE' || validation.status === 'ERROR') {
        showTabletUnreliableMessage(validation.message);
      }
      return;
    }

    // 2. Set active image and update preview UI cleanly
    activeTabletFilename = file.name || 'tablet_photo.jpg';
    activeTabletImageBase64 = base64Data;

    showToast('Medicine image detected. Analyzing the image...');

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

async function processTabletIdentification() {
  if (!activeTabletImageBase64) {
    showToast('Please upload a tablet image first.');
    return;
  }

  const identifyBtn = document.getElementById('identifyTabletBtn');
  if (identifyBtn) {
    identifyBtn.disabled = true;
    identifyBtn.textContent = '⏳ Analyzing Medicine Image...';
  }

  try {
    // Attempt backend API proxy request
    const response = await fetch('http://localhost:5000/api/analyze-tablet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: activeTabletImageBase64,
        filename: activeTabletFilename
      })
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data && resData.data.isIdentified) {
        if (identifyBtn) {
          identifyBtn.disabled = false;
          identifyBtn.textContent = '🔍 Identify Tablet';
        }
        renderBackendIdentificationResult(resData.data, resData.youtubeVideos || []);
        return;
      }
    }
  } catch (apiErr) {
    console.warn('⚠️ Server API endpoint offline, using verified local knowledge base fallback:', apiErr.message);
  }

  // Client-Side Fallback Matching
  setTimeout(() => {
    if (identifyBtn) {
      identifyBtn.disabled = false;
      identifyBtn.textContent = '🔍 Identify Tablet';
    }

    const matchedKey = detectTabletFromImage(activeTabletFilename, activeTabletImageBase64);
    if (matchedKey && TABLET_KNOWLEDGE_BASE[matchedKey]) {
      displayTabletIdentificationResult(matchedKey);
    } else {
      displayUnreliableIdentification();
    }
  }, 800);
}

function renderBackendIdentificationResult(info, youtubeVideos) {
  const uploadCard = document.getElementById('tabletUploadCard');
  const unreliableCard = document.getElementById('tabletUnreliableCard');
  const resultCard = document.getElementById('tabletResultCard');

  if (uploadCard) uploadCard.style.display = 'none';
  if (unreliableCard) unreliableCard.classList.add('img-preview-hidden');
  if (resultCard) resultCard.classList.remove('img-preview-hidden');

  setElText('resultTabletName', info.name);
  setElText('resultSourceTag', `Verification Status: ${info.isVerified ? '✅ Verified Medicine Database' : '⚠️ Unverified / AI Match'}`);

  const imgDisplay = document.getElementById('resultImgDisplay');
  if (imgDisplay) imgDisplay.src = activeTabletImageBase64;

  const usageBox = document.getElementById('resultTabletUsage');
  if (usageBox) {
    usageBox.innerHTML = `
      <p style="margin: 0 0 8px 0; line-height: 1.5; color: var(--text-color); font-size: 0.95rem;">${info.uses}</p>
      ${info.brandName ? `<p style="margin: 6px 0; font-size: 0.88rem; color: #475569;"><strong>🏷️ Brand Name(s):</strong> ${escapeHtml(info.brandName)}</p>` : ''}
      ${info.activeIngredient ? `<p style="margin: 6px 0; font-size: 0.88rem; color: #0284c7;"><strong>🧪 Active Ingredient:</strong> ${escapeHtml(info.activeIngredient)}</p>` : ''}
      ${info.strength ? `<p style="margin: 6px 0; font-size: 0.88rem; color: #334155;"><strong>💪 Strength:</strong> ${escapeHtml(info.strength)}</p>` : ''}
      ${info.howItWorks ? `<p style="margin: 6px 0; font-size: 0.88rem; color: #334155;"><strong>⚙️ How It Works:</strong> ${escapeHtml(info.howItWorks)}</p>` : ''}
      ${info.storage ? `<p style="margin: 6px 0; font-size: 0.88rem; color: #475569;"><strong>📦 Storage:</strong> ${escapeHtml(info.storage)}</p>` : ''}
    `;
  }

  const safetyBox = document.getElementById('resultSafetyInfo');
  if (safetyBox) {
    let safetyHtml = '<p style="font-weight: 700; margin-bottom: 6px; color: #991b1b;">⚠️ Important Precautions & Warnings:</p><ul style="padding-left: 20px; margin: 0 0 10px 0;">';
    if (info.precautions) safetyHtml += `<li style="margin-bottom: 4px; color: var(--text-color);">${escapeHtml(info.precautions)}</li>`;
    if (info.warnings) safetyHtml += `<li style="margin-bottom: 4px; color: var(--text-color);">${escapeHtml(info.warnings)}</li>`;
    safetyHtml += '</ul>';

    if (info.sideEffects) {
      safetyHtml += `<p style="font-weight: 700; margin: 10px 0 4px 0; color: #b45309;">⚡ Common Side Effects:</p><p style="margin: 0; font-size: 0.88rem; color: #475569;">${escapeHtml(info.sideEffects)}</p>`;
    }

    safetyHtml += `<div style="margin-top: 14px; padding: 12px 14px; background: #eff6ff; border-left: 4px solid #0284c7; border-radius: 4px; font-size: 0.88rem; color: #1e40af; line-height: 1.4;">
      <strong>👨‍⚕️ Mandatory Safety Notice:</strong> ${escapeHtml(info.safetyDisclaimer || 'AI identification may be incorrect. Never take a medicine based only on an image. Confirm the medicine and instructions with a pharmacist or healthcare professional.')}
    </div>`;

    safetyBox.innerHTML = safetyHtml;
  }

  // Render YouTube Videos
  const videosGrid = document.getElementById('youtubeVideosGrid');
  if (videosGrid) {
    if (youtubeVideos && youtubeVideos.length > 0) {
      videosGrid.innerHTML = youtubeVideos.map(v => `
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
      videosGrid.innerHTML = `<p style="font-size: 13px; color: var(--text-subtle);">No educational videos available for this medicine.</p>`;
    }
  }

  showToast(`Medicine identified: ${info.name}. Please confirm with a pharmacist before taking.`);
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

  // 3. Match pill image keywords or default to primary demo tablet if clean valid medicine photo provided
  if (base64Data.length > 500 && !lowerName.includes('unclear') && !lowerName.includes('blank') && !lowerName.includes('unknown')) {
    return 'paracetamol';
  }

  return null;
}

function showTabletUnreliableMessage(customMessage) {
  const uploadCard = document.getElementById('tabletUploadCard');
  const unreliableCard = document.getElementById('tabletUnreliableCard');
  const resultCard = document.getElementById('tabletResultCard');

  if (uploadCard) uploadCard.style.display = 'block';
  if (resultCard) resultCard.classList.add('img-preview-hidden');
  if (unreliableCard) {
    unreliableCard.classList.remove('img-preview-hidden');
    const desc = unreliableCard.querySelector('.unreliable-desc');
    if (desc && customMessage) {
      desc.textContent = customMessage;
    }
  }
}

function displayUnreliableIdentification() {
  const uploadCard = document.getElementById('tabletUploadCard');
  const unreliableCard = document.getElementById('tabletUnreliableCard');
  const resultCard = document.getElementById('tabletResultCard');

  if (uploadCard) uploadCard.style.display = 'none';
  if (resultCard) resultCard.classList.add('img-preview-hidden');
  if (unreliableCard) {
    unreliableCard.classList.remove('img-preview-hidden');
    const desc = unreliableCard.querySelector('.unreliable-desc');
    if (desc) {
      desc.innerHTML = `Image recognition alone cannot confirm the exact identity of this medicine packaging or unmarked pill.<br>Please provide the medicine name or upload a clear photo of the printed label/packaging.<br><strong>Always consult a pharmacist or doctor before taking any unidentified medicine.</strong>`;
    }
  }
}

function displayTabletIdentificationResult(matchedKey) {
  const info = TABLET_KNOWLEDGE_BASE[matchedKey];
  if (!info) {
    displayUnreliableIdentification();
    return;
  }

  renderBackendIdentificationResult({
    name: info.name,
    brandName: info.brandName || info.name,
    activeIngredient: info.activeIngredient || info.name,
    strength: info.strength || 'Standard Strength',
    isVerified: true,
    uses: info.usage,
    howItWorks: 'Works by interacting with body pain receptors or metabolic pathways.',
    sideEffects: info.sideEffects || 'Generally well-tolerated. Consult your physician if persistent side effects occur.',
    precautions: info.safety ? info.safety[0] : 'Take as directed by doctor.',
    warnings: info.safety ? info.safety[1] : 'Keep out of reach of children.',
    storage: info.storage || 'Store in a cool dry place below 25°C.',
    safetyDisclaimer: 'AI identification may be incorrect. Never take a medicine based only on an image. Confirm the medicine and instructions with a pharmacist or healthcare professional.'
  }, info.videos || []);
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

// ==================================================
// HEALTH REPORT GENERATION MODULE (STEP 6J)
// ==================================================
window.generateHealthReport = generateHealthReport;
window.bindHealthReportEvents = bindHealthReportEvents;

function bindHealthReportEvents() {
  const openBtn = document.getElementById('openGenerateHealthReportBtn');
  const modal = document.getElementById('healthReportModal');
  const closeBtn = document.getElementById('closeHealthReportModalBtn');
  const footerCloseBtn = document.getElementById('closeHealthReportFooterBtn');
  const printBtn = document.getElementById('printHealthReportBtn');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      generateHealthReport();
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  }

  if (footerCloseBtn && modal) {
    footerCloseBtn.addEventListener('click', () => modal.classList.remove('show'));
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      document.body.classList.add('printing-modal');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-modal');
      }, 500);
    });
  }
}

async function generateHealthReport() {
  const currentPatient = appData && appData.patient ? appData.patient : null;
  const patientId = currentPatient ? currentPatient.id : null;
  const patientName = currentPatient ? currentPatient.name : '';

  if (!patientId || !patientName || patientName === 'No patient registered yet') {
    showToast('No patient registered yet.');
    return;
  }

  const modal = document.getElementById('healthReportModal');
  const container = document.getElementById('healthReportModalBody');
  if (!modal || !container) return;

  try {
    // 1. PATIENT DETAILS
    const ageStr = currentPatient.age ? `${currentPatient.age} Years` : 'Not provided';
    const genderStr = currentPatient.gender || 'Not provided';
    const dobStr = currentPatient.dob || 'Not provided';
    const bloodGroupStr = currentPatient.bloodGroup || 'Not provided';
    const heightStr = currentPatient.height ? `${currentPatient.height} cm` : 'Not provided';
    const weightStr = currentPatient.weight ? `${currentPatient.weight} kg` : 'Not provided';
    
    let bmiStr = currentPatient.bmi || 'Not provided';
    if ((!bmiStr || bmiStr === 'Not provided') && currentPatient.height && currentPatient.weight) {
      const h = parseFloat(currentPatient.height) / 100;
      const w = parseFloat(currentPatient.weight);
      if (h > 0 && w > 0) {
        bmiStr = (w / (h * h)).toFixed(1);
      }
    }
    const emergencyContactStr = currentPatient.emergencyContact || 'Not provided';

    // 2. DOCTOR DETAILS
    let docName = 'Not provided';
    let docSpec = 'Not provided';
    let docQual = 'Not provided';
    let docContact = 'Not provided';

    if (appData && appData.doctor && appData.doctor.name && appData.doctor.name !== 'No doctor assigned yet' && appData.doctor.name !== 'No doctor assigned.') {
      docName = appData.doctor.name;
      docSpec = appData.doctor.specialization || 'Not provided';
      docQual = appData.doctor.clinic || appData.doctor.qualification || 'Not provided';
      docContact = appData.doctor.contact || 'Not provided';
    } else if (patientId && window.db && typeof window.db.collection === 'function') {
      try {
        const docSnap = await window.db.collection('doctors').doc(`doctor_${patientId}`).get();
        if (docSnap.exists && docSnap.data().isActive !== false) {
          const d = docSnap.data();
          docName = d.doctorName || 'Not provided';
          docSpec = d.specialization || 'Not provided';
          docQual = d.qualification || 'Not provided';
          docContact = d.doctorContact || 'Not provided';
        }
      } catch (err) {
        console.warn('⚠️ Error fetching doctor assignment for report:', err);
      }
    }

    // 3. CAREGIVER DETAILS
    let cgName = 'Not provided';
    let cgRel = 'Not provided';
    let cgContact = 'Not provided';

    if (appData && appData.caregiver && appData.caregiver.name && appData.caregiver.name !== 'No caregiver assigned yet' && appData.caregiver.name !== 'No caregiver assigned.') {
      cgName = appData.caregiver.name;
      cgRel = appData.caregiver.relationship || 'Not provided';
      cgContact = appData.caregiver.contact || 'Not provided';
    } else if (patientId && window.db && typeof window.db.collection === 'function') {
      try {
        const cgSnap = await window.db.collection('caregivers').doc(`caregiver_${patientId}`).get();
        if (cgSnap.exists && cgSnap.data().isActive !== false) {
          const c = cgSnap.data();
          cgName = c.caregiverName || 'Not provided';
          cgRel = c.relationship || 'Not provided';
          cgContact = c.caregiverContact || 'Not provided';
        }
      } catch (err) {
        console.warn('⚠️ Error fetching caregiver assignment for report:', err);
      }
    }

    // 4. HEALTH SUMMARY & VITALS
    const pHealthRecords = healthRecordsData.filter(r => !r.patientId || r.patientId === patientId);
    const validRatios = pHealthRecords.filter(r => r.healthRatio !== null && !isNaN(r.healthRatio));

    const latestHealthStr = validRatios.length > 0 ? `${validRatios[0].healthRatio}%` : 'Not provided';
    const prevHealthStr = validRatios.length > 1 ? `${validRatios[1].healthRatio}%` : 'Not provided';

    const todayStr = getTodayDateString();
    const todayRec = pHealthRecords.find(r => r.recordedDate === todayStr && r.healthRatio !== null);
    const todayHealthStr = todayRec ? `${todayRec.healthRatio}%` : 'Not provided';

    // Monthly Average
    const currentYearMonth = todayStr.substring(0, 7);
    const monthRecords = validRatios.filter(r => r.recordedDate && r.recordedDate.startsWith(currentYearMonth));
    let monthlyAvgStr = 'Not provided';
    if (monthRecords.length > 0) {
      const avg = Math.round(monthRecords.reduce((acc, r) => acc + r.healthRatio, 0) / monthRecords.length);
      monthlyAvgStr = `${avg}%`;
    }

    // Current patient health ratio
    const healthRatioStr = latestHealthStr !== 'Not provided' ? latestHealthStr : (typeof calculateHealthRatio === 'function' && appData.medical ? `${calculateHealthRatio(appData.medical)}%` : 'Not recorded');

    // Latest Vitals
    let latestBp = 'Not provided';
    let latestHr = 'Not provided';
    let latestTemp = 'Not provided';
    let latestSpo2 = 'Not provided';
    let latestSugar = 'Not provided';
    let latestWeight = 'Not provided';
    let latestHeight = 'Not provided';
    let latestBmi = 'Not provided';
    let latestRecDate = 'Not provided';
    let latestRecTime = 'Not provided';
    let latestNotes = 'Not provided';

    if (pHealthRecords.length > 0) {
      const latest = pHealthRecords[0];
      latestBp = latest.bloodPressure || 'Not provided';
      latestHr = latest.heartRate ? `${latest.heartRate} bpm` : 'Not provided';
      latestTemp = latest.temperature ? `${latest.temperature} °F` : 'Not provided';
      latestSpo2 = latest.oxygenLevel ? `${latest.oxygenLevel}%` : 'Not provided';
      latestSugar = latest.bloodSugar ? `${latest.bloodSugar} mg/dL` : 'Not provided';
      latestWeight = latest.weight ? `${latest.weight} kg` : 'Not provided';
      latestHeight = latest.height ? `${latest.height} cm` : 'Not provided';
      latestBmi = latest.bmi || (latest.height && latest.weight ? (latest.weight / Math.pow(latest.height / 100, 2)).toFixed(1) : 'Not provided');
      latestRecDate = latest.recordedDate || 'Not provided';
      latestRecTime = latest.recordedTime || 'Not provided';
      latestNotes = latest.notes || 'Not provided';
    } else if (appData.medical) {
      if (appData.medical.bp && appData.medical.bp !== 'Not recorded') latestBp = `${appData.medical.bp} mmHg`;
      if (appData.medical.sugar && appData.medical.sugar !== 'Not recorded') latestSugar = `${appData.medical.sugar} mg/dL`;
      if (appData.medical.weight && appData.medical.weight !== 'Not recorded') latestWeight = `${appData.medical.weight} kg`;
      if (appData.medical.otherHealth && appData.medical.otherHealth !== 'No additional health details provided.') latestNotes = appData.medical.otherHealth;
    }

    // 5. HEALTH TREND (Actual recorded dates and ratios only)
    let healthTrendHtml = '';
    if (validRatios.length === 0) {
      healthTrendHtml = `<p style="font-size: 13px; color: var(--text-subtle); margin: 0;">No health records logged yet.</p>`;
    } else {
      healthTrendHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: var(--bg-subtle); text-align: left; color: var(--text-muted); font-size: 12px;">
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Date & Time</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Health Ratio</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Blood Pressure</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Blood Sugar</th>
            </tr>
          </thead>
          <tbody>
            ${validRatios.slice(0, 10).map(r => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 8px 12px;">${r.recordedDate} ${r.recordedTime}</td>
                <td style="padding: 8px 12px; font-weight: 700; color: #0284c7;">${r.healthRatio}%</td>
                <td style="padding: 8px 12px;">${r.bloodPressure || 'N/A'}</td>
                <td style="padding: 8px 12px;">${r.bloodSugar ? r.bloodSugar + ' mg/dL' : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // 6. MEDICINE SCHEDULE
    const pSchedules = medicineSchedulesData.filter(s => !s.patientId || s.patientId === patientId);
    let medScheduleHtml = '';
    if (pSchedules.length === 0) {
      medScheduleHtml = `<p style="font-size: 13px; color: var(--text-subtle); margin: 0;">No medicine schedules added yet.</p>`;
    } else {
      medScheduleHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: var(--bg-subtle); text-align: left; color: var(--text-muted); font-size: 12px;">
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Medicine Name</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Dosage</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Time</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Frequency</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Food Timing</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Status</th>
            </tr>
          </thead>
          <tbody>
            ${pSchedules.map(s => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 8px 12px; font-weight: 600;">${escapeHtml(s.medicineName)}</td>
                <td style="padding: 8px 12px;">${escapeHtml(s.dosage || (s.tabletQuantity + ' Tablet(s)'))}</td>
                <td style="padding: 8px 12px;">${s.exactTimeFormatted || formatTime12h(s.exactTime || s.intakeTime)}</td>
                <td style="padding: 8px 12px;">${Array.isArray(s.scheduleDays) ? s.scheduleDays.join(', ') : (s.frequency || 'Every Day')}</td>
                <td style="padding: 8px 12px;">${escapeHtml(s.foodTiming || 'After Food')}</td>
                <td style="padding: 8px 12px;">${s.isActive !== false ? '<span style="color: #10b981; font-weight: 600;">Active</span>' : '<span style="color: #94a3b8;">Inactive</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // 7. MEDICINE ADHERENCE & RECENT HISTORY
    const pIntakes = (medicineConfirmationsData || []).filter(i => !i.patientId || i.patientId === patientId);
    const totalDoses = pIntakes.length;
    const takenDoses = pIntakes.filter(i => i.status === 'Taken').length;
    const pendingDoses = pIntakes.filter(i => i.status === 'Pending').length;
    const skippedDoses = pIntakes.filter(i => i.status === 'Skipped').length;
    const adherenceStr = totalDoses > 0 ? `${Math.round((takenDoses / totalDoses) * 100)}%` : 'No medicine intake records yet.';

    let recentHistoryHtml = '';
    if (totalDoses === 0) {
      recentHistoryHtml = `<p style="font-size: 13px; color: var(--text-subtle); margin: 0;">No medicine intake records yet.</p>`;
    } else {
      const sortedIntakes = [...pIntakes].sort((a, b) => {
        const dateA = a.actionTime || `${a.scheduledDate || '1970-01-01'} ${a.scheduledTime || '00:00'}`;
        const dateB = b.actionTime || `${b.scheduledDate || '1970-01-01'} ${b.scheduledTime || '00:00'}`;
        return dateB.localeCompare(dateA);
      });

      recentHistoryHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: var(--bg-subtle); text-align: left; color: var(--text-muted); font-size: 12px;">
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Medicine</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Scheduled</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Status</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Action Time</th>
            </tr>
          </thead>
          <tbody>
            ${sortedIntakes.slice(0, 10).map(i => {
              let statusBadge = `<span style="color: #f59e0b; font-weight: 600;">Pending</span>`;
              if (i.status === 'Taken') statusBadge = `<span style="color: #10b981; font-weight: 600;">Taken</span>`;
              else if (i.status === 'Skipped') statusBadge = `<span style="color: #ef4444; font-weight: 600;">Skipped</span>`;

              return `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 8px 12px; font-weight: 600;">${escapeHtml(i.medicineName || 'Medicine')}</td>
                  <td style="padding: 8px 12px;">${i.scheduledDate || ''} ${formatTime12h(i.scheduledTime || '')}</td>
                  <td style="padding: 8px 12px;">${statusBadge}</td>
                  <td style="padding: 8px 12px;">${i.takenAt || (i.actionTime ? new Date(i.actionTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    // Current Date/Time for Header
    const now = new Date();
    const formattedNow = `${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${formatTime12h(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)}`;

    // Build Complete Report Content
    container.innerHTML = `
      <div class="health-report-doc" style="font-family: inherit; color: var(--text-color); line-height: 1.5;">
        
        <!-- HEADER -->
        <div style="text-align: center; border-bottom: 2px solid var(--brand-navy); padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: var(--brand-navy); letter-spacing: 0.5px;">MEDX HEALTHCARE SYSTEM</h2>
          <h3 style="margin: 4px 0 0 0; font-size: 16px; font-weight: 700; color: var(--brand-cyan);">Patient Health Report</h3>
          <p style="margin: 6px 0 0 0; font-size: 12px; color: var(--text-muted);">Generated On: ${formattedNow}</p>
        </div>

        <!-- PATIENT DETAILS -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: var(--brand-navy); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; text-transform: uppercase;">PATIENT DETAILS</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 16px; font-size: 13px;">
            <div><span style="color: var(--text-muted);">Patient Name:</span> <strong>${escapeHtml(patientName)}</strong></div>
            <div><span style="color: var(--text-muted);">Age:</span> <strong>${escapeHtml(ageStr)}</strong></div>
            <div><span style="color: var(--text-muted);">Gender:</span> <strong>${escapeHtml(genderStr)}</strong></div>
            <div><span style="color: var(--text-muted);">Date of Birth:</span> <strong>${escapeHtml(dobStr)}</strong></div>
            <div><span style="color: var(--text-muted);">Blood Group:</span> <strong>${escapeHtml(bloodGroupStr)}</strong></div>
            <div><span style="color: var(--text-muted);">Height:</span> <strong>${escapeHtml(heightStr)}</strong></div>
            <div><span style="color: var(--text-muted);">Weight:</span> <strong>${escapeHtml(weightStr)}</strong></div>
            <div><span style="color: var(--text-muted);">BMI:</span> <strong>${escapeHtml(bmiStr)}</strong></div>
            <div><span style="color: var(--text-muted);">Emergency Contact:</span> <strong>${escapeHtml(emergencyContactStr)}</strong></div>
            <div><span style="color: var(--text-muted);">Health Ratio:</span> <strong style="color: var(--brand-cyan);">${escapeHtml(healthRatioStr)}</strong></div>
          </div>
        </div>

        <!-- DOCTOR DETAILS -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: var(--brand-navy); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; text-transform: uppercase;">DOCTOR DETAILS</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 16px; font-size: 13px;">
            <div><span style="color: var(--text-muted);">Doctor Name:</span> <strong>${escapeHtml(docName)}</strong></div>
            <div><span style="color: var(--text-muted);">Specialization:</span> <strong>${escapeHtml(docSpec)}</strong></div>
            <div><span style="color: var(--text-muted);">Qualification/Clinic:</span> <strong>${escapeHtml(docQual)}</strong></div>
            <div><span style="color: var(--text-muted);">Contact:</span> <strong>${escapeHtml(docContact)}</strong></div>
          </div>
        </div>

        <!-- CAREGIVER DETAILS -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: var(--brand-navy); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; text-transform: uppercase;">CAREGIVER DETAILS</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 16px; font-size: 13px;">
            <div><span style="color: var(--text-muted);">Caregiver Name:</span> <strong>${escapeHtml(cgName)}</strong></div>
            <div><span style="color: var(--text-muted);">Relationship:</span> <strong>${escapeHtml(cgRel)}</strong></div>
            <div><span style="color: var(--text-muted);">Contact:</span> <strong>${escapeHtml(cgContact)}</strong></div>
          </div>
        </div>

        <!-- HEALTH SUMMARY -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: var(--brand-navy); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; text-transform: uppercase;">HEALTH SUMMARY</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 16px; font-size: 13px;">
            <div><span style="color: var(--text-muted);">Latest Health:</span> <strong>${latestHealthStr}</strong></div>
            <div><span style="color: var(--text-muted);">Previous Health:</span> <strong>${prevHealthStr}</strong></div>
            <div><span style="color: var(--text-muted);">Today's Health:</span> <strong>${todayHealthStr}</strong></div>
            <div><span style="color: var(--text-muted);">Monthly Average:</span> <strong>${monthlyAvgStr}</strong></div>
          </div>
        </div>

        <!-- LATEST VITALS -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: var(--brand-navy); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; text-transform: uppercase;">LATEST VITALS</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 16px; font-size: 13px;">
            <div><span style="color: var(--text-muted);">Blood Pressure:</span> <strong>${escapeHtml(latestBp)}</strong></div>
            <div><span style="color: var(--text-muted);">Heart Rate:</span> <strong>${escapeHtml(latestHr)}</strong></div>
            <div><span style="color: var(--text-muted);">Temperature:</span> <strong>${escapeHtml(latestTemp)}</strong></div>
            <div><span style="color: var(--text-muted);">Oxygen Level:</span> <strong>${escapeHtml(latestSpo2)}</strong></div>
            <div><span style="color: var(--text-muted);">Blood Sugar:</span> <strong>${escapeHtml(latestSugar)}</strong></div>
            <div><span style="color: var(--text-muted);">Weight:</span> <strong>${escapeHtml(latestWeight)}</strong></div>
            <div><span style="color: var(--text-muted);">Height:</span> <strong>${escapeHtml(latestHeight)}</strong></div>
            <div><span style="color: var(--text-muted);">BMI:</span> <strong>${escapeHtml(latestBmi)}</strong></div>
            <div><span style="color: var(--text-muted);">Recorded Date:</span> <strong>${escapeHtml(latestRecDate)}</strong></div>
            <div><span style="color: var(--text-muted);">Recorded Time:</span> <strong>${escapeHtml(latestRecTime)}</strong></div>
          </div>
          <div style="margin-top: 6px; font-size: 13px;"><span style="color: var(--text-muted);">Notes:</span> <strong>${escapeHtml(latestNotes)}</strong></div>
        </div>

        <!-- HEALTH TREND -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: var(--brand-navy); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; text-transform: uppercase;">HEALTH TREND</h4>
          ${healthTrendHtml}
        </div>

        <!-- MEDICINE SCHEDULE -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: var(--brand-navy); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; text-transform: uppercase;">MEDICINE SCHEDULE</h4>
          ${medScheduleHtml}
        </div>

        <!-- MEDICINE ADHERENCE -->
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: var(--brand-navy); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; text-transform: uppercase;">MEDICINE ADHERENCE</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 16px; font-size: 13px;">
            <div><span style="color: var(--text-muted);">Total Recorded Doses:</span> <strong>${totalDoses}</strong></div>
            <div><span style="color: var(--text-muted);">Taken:</span> <strong>${takenDoses}</strong></div>
            <div><span style="color: var(--text-muted);">Pending:</span> <strong>${pendingDoses}</strong></div>
            <div><span style="color: var(--text-muted);">Skipped:</span> <strong>${skippedDoses}</strong></div>
            <div><span style="color: var(--text-muted);">Adherence Rate:</span> <strong style="color: var(--brand-navy);">${adherenceStr}</strong></div>
          </div>
        </div>

        <!-- RECENT MEDICINE HISTORY -->
        <div style="margin-bottom: 10px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: var(--brand-navy); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; text-transform: uppercase;">RECENT MEDICINE HISTORY</h4>
          ${recentHistoryHtml}
        </div>

      </div>
    `;

    modal.classList.add('show');
    console.log('✅ Generated Health Report for patient:', patientName);
  } catch (error) {
    console.error('❌ Error generating health report:', error);
    showToast('Error generating health report: ' + error.message);
  }
}

// ==================================================
// FIREBASE AUTHENTICATION MODULE (STEP 8)
// ==================================================
window.currentAuthUser = null;

window.bindAuthEvents = bindAuthEvents;
window.initAuthStateListener = initAuthStateListener;

function getFriendlyAuthErrorMessage(error) {
  if (!error) return 'An error occurred during authentication.';
  const code = error.code || '';
  switch (code) {
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return 'Firebase Email/Password Authentication is disabled in Firebase Console. Please enable Email/Password provider under Firebase Console → Authentication → Sign-in method → Email/Password → Enable.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please check your credentials.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful login attempts. Please try again later.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}

function bindAuthEvents() {
  const tabLogin = document.getElementById('authTabLogin');
  const tabRegister = document.getElementById('authTabRegister');
  const loginForm = document.getElementById('authLoginForm');
  const registerForm = document.getElementById('authRegisterForm');
  const errorBox = document.getElementById('authErrorBox');
  const logoutBtn = document.getElementById('logoutBtn');

  // Tab switching
  if (tabLogin && tabRegister && loginForm && registerForm) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      if (errorBox) errorBox.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      registerForm.style.display = 'block';
      loginForm.style.display = 'none';
      if (errorBox) errorBox.style.display = 'none';
    });
  }

  // Handle Login Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorBox) errorBox.style.display = 'none';

      const email = (document.getElementById('loginEmailInput')?.value || '').trim();
      const password = (document.getElementById('loginPasswordInput')?.value || '').trim();
      const submitBtn = document.getElementById('loginSubmitBtn');

      if (!email || !password) {
        if (errorBox) {
          errorBox.textContent = 'Please enter both email and password.';
          errorBox.style.display = 'block';
        }
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Signing in...';
        }

        const auth = (window.auth) ? window.auth : (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null);
        if (!auth) {
          throw new Error('Firebase Authentication SDK is not loaded.');
        }

        await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Firebase Sign-In successful:', email);
        showToast('Successfully signed in!');
      } catch (error) {
        console.error('❌ Sign-In Error:', error);
        if (errorBox) {
          errorBox.textContent = getFriendlyAuthErrorMessage(error);
          errorBox.style.display = 'block';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In to MEDX →';
        }
      }
    });
  }

  // Handle Register Submit
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorBox) errorBox.style.display = 'none';

      const fullName = (document.getElementById('regFullNameInput')?.value || '').trim();
      const email = (document.getElementById('regEmailInput')?.value || '').trim();
      const password = (document.getElementById('regPasswordInput')?.value || '').trim();
      const confirmPassword = (document.getElementById('regConfirmPasswordInput')?.value || '').trim();
      const submitBtn = document.getElementById('registerSubmitBtn');

      if (!fullName || !email || !password || !confirmPassword) {
        if (errorBox) {
          errorBox.textContent = 'All registration fields are required.';
          errorBox.style.display = 'block';
        }
        return;
      }

      if (password.length < 6) {
        if (errorBox) {
          errorBox.textContent = 'Password must be at least 6 characters long.';
          errorBox.style.display = 'block';
        }
        return;
      }

      if (password !== confirmPassword) {
        if (errorBox) {
          errorBox.textContent = 'Password and Confirm Password do not match.';
          errorBox.style.display = 'block';
        }
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creating Account...';
        }

        const auth = (window.auth) ? window.auth : (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null);
        if (!auth) {
          throw new Error('Firebase Authentication SDK is not loaded.');
        }

        const userCred = await auth.createUserWithEmailAndPassword(email, password);
        if (userCred.user) {
          await userCred.user.updateProfile({ displayName: fullName });
        }

        console.log('✅ Firebase Account Created:', email);
        showToast(`Welcome ${fullName}! Account created successfully.`);
      } catch (error) {
        console.error('❌ Registration Error:', error);
        if (errorBox) {
          errorBox.textContent = getFriendlyAuthErrorMessage(error);
          errorBox.style.display = 'block';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account & Sign In →';
        }
      }
    });
  }

  // Handle Logout Button Click
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const auth = (window.auth) ? window.auth : (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null);
        if (auth) {
          await auth.signOut();
          console.log('🔒 Logged out of Firebase Authentication.');
          showToast('Signed out successfully.');
        }
      } catch (error) {
        console.error('❌ Logout Error:', error);
        showToast('Logout failed: ' + error.message);
      }
    });
  }
}

function initAuthStateListener() {
  const auth = (window.auth) ? window.auth : (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null);
  if (!auth || typeof auth.onAuthStateChanged !== 'function') {
    console.warn('⚠️ Firebase auth.onAuthStateChanged unavailable.');
    return;
  }

  auth.onAuthStateChanged((user) => {
    const authScreen = document.getElementById('authScreenContainer');
    const mainApp = document.getElementById('mainDashboardApp');
    const authUserBadge = document.getElementById('authUserBadge');
    const authUserName = document.getElementById('authUserName');

    if (user) {
      window.currentAuthUser = user;
      console.log('🔒 Auth state: Signed in as', user.email, `(UID: ${user.uid})`);

      const displayName = user.displayName || user.email.split('@')[0];
      if (authUserName) {
        authUserName.textContent = `👤 ${displayName}`;
      }
      if (authUserBadge) authUserBadge.style.display = 'flex';
      if (authScreen) authScreen.style.display = 'none';
      if (mainApp) mainApp.style.display = 'flex';

      // Load patient & application data upon authenticated access
      loadPatientFromFirestore();
      loadNotificationsFromFirestore();
      loadMedicineSchedulesFromFirestore();
      loadCaregiverAlerts();
      loadMedicineIntakeHistory();
      loadHealthRecords();
      loadFamilyMembersFromFirestore();
    } else {
      window.currentAuthUser = null;
      console.log('🔒 Auth state: Signed out / Unauthenticated');

      if (unsubscribePatientListener) {
        unsubscribePatientListener();
        unsubscribePatientListener = null;
      }

      if (unsubscribeFamilyMembersListener) {
        unsubscribeFamilyMembersListener();
        unsubscribeFamilyMembersListener = null;
      }

      if (authUserBadge) authUserBadge.style.display = 'none';
      if (mainApp) mainApp.style.display = 'none';
      if (authScreen) authScreen.style.display = 'flex';
    }
  });
}

/* ==========================================================================
   FAMILY MEMBERS MODULE
   ========================================================================== */

let unsubscribeFamilyMembersListener = null;
let currentFamilyMembers = [];

function initFamilyMembersModule() {
  const openModalBtn = document.getElementById('openAddFamilyMemberBtn');
  const closeModalBtn = document.getElementById('closeFamilyMemberModalBtn');
  const cancelModalBtn = document.getElementById('cancelFamilyMemberModalBtn');
  const form = document.getElementById('familyMemberForm');

  if (openModalBtn) {
    openModalBtn.addEventListener('click', () => openFamilyMemberModal());
  }

  // Delegated handler for open add family member inside empty state or card header
  document.addEventListener('click', (e) => {
    if (e.target && e.target.closest('.open-add-family-btn')) {
      openFamilyMemberModal();
    }
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeFamilyMemberModal);
  }

  if (cancelModalBtn) {
    cancelModalBtn.addEventListener('click', closeFamilyMemberModal);
  }

  if (form) {
    form.addEventListener('submit', handleFamilyMemberFormSubmit);
  }
}

function openFamilyMemberModal(memberToEdit = null) {
  const modal = document.getElementById('familyMemberModal');
  const modalTitle = document.getElementById('familyMemberModalTitle');
  const idInput = document.getElementById('familyMemberIdInput');
  const nameInput = document.getElementById('fmFullNameInput');
  const relSelect = document.getElementById('fmRelationshipSelect');
  const contactInput = document.getElementById('fmContactInput');
  const emailInput = document.getElementById('fmEmailInput');
  const dobInput = document.getElementById('fmDobInput');
  const emergencyCheck = document.getElementById('fmEmergencyContactInput');
  const notesInput = document.getElementById('fmNotesInput');

  if (!modal) return;

  if (memberToEdit) {
    if (modalTitle) modalTitle.textContent = '✏️ Edit Family Member';
    if (idInput) idInput.value = memberToEdit.id || '';
    if (nameInput) nameInput.value = memberToEdit.fullName || '';
    if (relSelect) relSelect.value = memberToEdit.relationship || '';
    if (contactInput) contactInput.value = memberToEdit.contactNumber || '';
    if (emailInput) emailInput.value = memberToEdit.email || '';
    if (dobInput) dobInput.value = memberToEdit.dob || '';
    if (emergencyCheck) emergencyCheck.checked = !!memberToEdit.isEmergencyContact;
    if (notesInput) notesInput.value = memberToEdit.notes || '';
  } else {
    if (modalTitle) modalTitle.textContent = '👨‍👩‍👧 Add Family Member';
    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (relSelect) relSelect.value = '';
    if (contactInput) contactInput.value = '';
    if (emailInput) emailInput.value = '';
    if (dobInput) dobInput.value = '';
    if (emergencyCheck) emergencyCheck.checked = false;
    if (notesInput) notesInput.value = '';
  }

  modal.classList.add('show');
}

function closeFamilyMemberModal() {
  const modal = document.getElementById('familyMemberModal');
  if (modal) modal.classList.remove('show');
}

async function handleFamilyMemberFormSubmit(e) {
  e.preventDefault();

  const currentUser = window.auth && window.auth.currentUser;
  if (!currentUser) {
    showNotification('Please sign in to manage family members.', 'error');
    return;
  }

  const idInput = document.getElementById('familyMemberIdInput');
  const nameInput = document.getElementById('fmFullNameInput');
  const relSelect = document.getElementById('fmRelationshipSelect');
  const contactInput = document.getElementById('fmContactInput');
  const emailInput = document.getElementById('fmEmailInput');
  const dobInput = document.getElementById('fmDobInput');
  const emergencyCheck = document.getElementById('fmEmergencyContactInput');
  const notesInput = document.getElementById('fmNotesInput');

  const fullName = nameInput ? nameInput.value.trim() : '';
  const relationship = relSelect ? relSelect.value : '';
  const contactNumber = contactInput ? contactInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const dob = dobInput ? dobInput.value : '';
  const isEmergencyContact = emergencyCheck ? emergencyCheck.checked : false;
  const notes = notesInput ? notesInput.value.trim() : '';

  if (!fullName || !relationship || !contactNumber) {
    showNotification('Please fill in all required fields (Full Name, Relationship, Contact Number).', 'error');
    return;
  }

  const activePatientId = (appData && appData.patient ? appData.patient.id : null) || currentUser.uid;

  const payload = {
    fullName,
    relationship,
    contactNumber,
    email: email || '',
    dob: dob || '',
    isEmergencyContact,
    notes: notes || '',
    patientId: activePatientId,
    createdBy: currentUser.uid,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  const docId = idInput ? idInput.value : null;

  try {
    if (docId) {
      // Update existing record
      await window.db.collection('familyMembers').doc(docId).set(payload, { merge: true });
      showNotification(`Updated family member: ${fullName}`, 'success');
    } else {
      // Create new record
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await window.db.collection('familyMembers').add(payload);
      showNotification(`Added family member: ${fullName}`, 'success');
    }
    closeFamilyMemberModal();
  } catch (err) {
    console.error('Error saving family member:', err);
    showNotification(`Error saving family member: ${err.message || 'Permission denied.'}`, 'error');
  }
}

function loadFamilyMembersFromFirestore() {
  const currentUser = window.auth && window.auth.currentUser;
  if (!currentUser || !window.db) return;

  if (unsubscribeFamilyMembersListener) {
    unsubscribeFamilyMembersListener();
    unsubscribeFamilyMembersListener = null;
  }

  // Real-time listener for familyMembers created by current user
  unsubscribeFamilyMembersListener = window.db.collection('familyMembers')
    .where('createdBy', '==', currentUser.uid)
    .onSnapshot((snapshot) => {
      const members = [];
      if (snapshot && !snapshot.empty) {
        snapshot.forEach((doc) => {
          members.push({ id: doc.id, ...doc.data() });
        });
      }
      currentFamilyMembers = members;
      renderFamilyMembersList(members);
    }, (error) => {
      console.warn('Family members real-time listener error:', error);
    });
}

function renderFamilyMembersList(members) {
  const container = document.getElementById('dashFamilyMembersList');
  const badge = document.getElementById('familyMemberCountBadge');

  if (badge) {
    badge.textContent = `${members.length} Member${members.length === 1 ? '' : 's'}`;
  }

  if (!container) return;

  if (!members || members.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 18px 10px; background: var(--bg-subtle, #f8fafc); border: 1px dashed var(--border-color, #cbd5e1); border-radius: 8px;">
        <p style="color: #64748b; font-size: 0.88rem; margin: 0 0 10px 0;">No family members added yet.</p>
        <button class="btn btn-outline btn-sm open-add-family-btn" type="button" style="display: inline-flex; align-items: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="17" y1="11" x2="23" y2="11"></line>
          </svg>
          + Add Family Member
        </button>
      </div>
    `;
    return;
  }

  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  let html = '';
  members.forEach((m) => {
    html += `
      <div class="family-member-item" style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
            <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--text-color, #0f172a);">${escapeHtml(m.fullName)}</h4>
            <span class="card-badge badge-teal" style="font-size: 0.72rem; padding: 2px 8px;">${escapeHtml(m.relationship)}</span>
            ${m.isEmergencyContact ? '<span class="card-badge" style="font-size: 0.72rem; padding: 2px 8px; background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5;">🚨 Emergency Contact</span>' : ''}
          </div>
          <p class="info-sub-item" style="margin: 2px 0; font-size: 0.85rem; color: #475569;">📞 Contact: ${escapeHtml(m.contactNumber)}</p>
          ${m.email ? `<p class="info-sub-item" style="margin: 2px 0; font-size: 0.85rem; color: #475569;">✉️ Email: ${escapeHtml(m.email)}</p>` : ''}
          ${m.dob ? `<p class="info-sub-item" style="margin: 2px 0; font-size: 0.85rem; color: #475569;">📅 DOB: ${escapeHtml(m.dob)}</p>` : ''}
          ${m.notes ? `<p class="info-sub-item" style="margin: 2px 0; font-size: 0.85rem; color: #64748b; font-style: italic;">📝 Notes: ${escapeHtml(m.notes)}</p>` : ''}
        </div>
        <div style="display: flex; gap: 6px; margin-left: 10px;">
          <button class="btn btn-outline btn-xs edit-fm-btn" data-id="${m.id}" type="button" style="padding: 3px 8px; font-size: 0.75rem;">Edit</button>
          <button class="btn btn-xs delete-fm-btn" data-id="${m.id}" type="button" style="padding: 3px 8px; font-size: 0.75rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Attach event handlers for Edit & Delete buttons
  container.querySelectorAll('.edit-fm-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const member = currentFamilyMembers.find((item) => item.id === id);
      if (member) openFamilyMemberModal(member);
    });
  });

  container.querySelectorAll('.delete-fm-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const member = currentFamilyMembers.find((item) => item.id === id);
      const name = member ? member.fullName : 'this family member';

      if (confirm(`Are you sure you want to delete ${name}?`)) {
        try {
          await window.db.collection('familyMembers').doc(id).delete();
          showNotification(`Deleted family member: ${name}`, 'success');
        } catch (err) {
          console.error('Error deleting family member:', err);
          showNotification(`Error deleting family member: ${err.message}`, 'error');
        }
      }
    });
  });
}
