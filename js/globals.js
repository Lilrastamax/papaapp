import { DB, S, saveDB, delFrom } from './store.js';
import { cloudPushSettings } from './api.js';
import { render, viewDocument } from './render.js';
import { navigate } from './nav.js';
import { showSettings, showSchoolEditModal, showExtraVisitModal, showSundayOverrideModal, closeM } from './modal.js';
import { showCustodyModal, resetCustody } from './screens/agenda.js';
import { addApptForDate } from './screens/home.js';
import { doRecurringTask } from './screens/misc.js';
import { toast } from './ui.js';
import { exportData } from './main.js';

export function exposeGlobals() {
  window.DB = DB;
  window.S = S;
  window.saveDB = saveDB;
  window.delFrom = delFrom;
  window.cloudPushSettings = cloudPushSettings;
  window.render = render;
  window.navigate = navigate;
  window.showSettings = showSettings;
  window.showSchoolEditModal = showSchoolEditModal;
  window.showExtraVisitModal = showExtraVisitModal;
  window.showCustodyModal = showCustodyModal;
  window.resetCustody = resetCustody;
  window.showSundayOverrideModal = showSundayOverrideModal;
  window.addApptForDate = addApptForDate;
  window.viewDocument = viewDocument;
  window.doRecurringTask = doRecurringTask;
  window.exportData = exportData;
  window.closeM = closeM;
  window.toast = toast;
}
