// ============================================================================
// BAPS SWAMINARAYAN SANSTHA THAILAND
// Pujya Dr. Gyanvatsal Swami Inspirational Discourse 2026
// Google Apps Script Backend (Code.gs)
//
// Automatically organizes event operations into 13 structured sheets:
// 1. Raw_Responses (Chronological submissions with full audit trail)
// 2. All_Female (All female attendees alphabetically)
// 3. All_Male (All male attendees alphabetically)
// 4. Adults_All (All adults - Primary & Additional)
// 5. Adults_Male (Adult male attendees)
// 6. Adults_Female (Adult female attendees)
// 7. Children_All (All children with Parent Name, Phone, and Registration ID)
// 8. Children_Male (Male children with Parent details and Registration ID)
// 9. Children_Female (Female children with Parent details and Registration ID)
// 10. Grouped_By_Family (Registrant as family head, with family members grouped underneath)
// 11. Broadcasts (Send automated announcements to all attendees with permanent lock)
// 12. Event_Settings (Live controls: Event Date, Time, Venue, Countdown Target)
// 13. Workspace (Free scratchpad tab for coordinator notes, tasks & calculations)
// ============================================================================

const DEFAULT_EVENT_NAME = "From Burnout to Balance - Pujya Dr. Gyanvatsal Swami";
const DEFAULT_EVENT_DATE = "Sunday, 13 December 2026";
const DEFAULT_START_TIME = "5:30 PM";
const DEFAULT_DOORS_OPEN = "5:00 PM";
const DEFAULT_VENUE = "The Tio Chew Association of Thailand, Bangkok";
const DEFAULT_VENUE_ADDRESS = "No. 1, Chan Road, Soi Yenchit 12, Thung Wat Don, Sathorn, Bangkok 10120";
const DEFAULT_COUNTDOWN_ISO = "2026-12-13T17:30:00+07:00";
const OFFICIAL_EMAIL = "baps.bangkok@gmail.com";

/**
 * 1. Custom Admin Menu added to Google Sheets UI
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🕉️ BAPS Event Admin')
    .addItem('🛠️ Auto-Fix Phone Number #ERROR! in Sheet', 'fixPhoneNumberFormulaErrors')
    .addSeparator()
    .addItem('📨 Send Pending Broadcasts', 'sendPendingBroadcasts')
    .addItem('🧪 Send Test Broadcast Email', 'testSendBroadcastEmail')
    .addSeparator()
    .addItem('⚙️ Initialize / Format All Sheets', 'setupAllTabs')
    .addItem('🔄 Refresh All Tabs from Raw_Responses', 'refreshAllTabsFromRaw')
    .addSeparator()
    .addItem('📊 View Event Attendance Statistics', 'showAttendanceStats')
    .addToUi();
}

/**
 * 2. Handles incoming POST requests from the website registration form
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const result = submitRegistration(payload);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 3. Handles GET requests (Live settings sync & countdown target for website)
 */
function doGet(e) {
  try {
    // Return live event settings for dynamic countdown & date display
    if (e && e.parameter && e.parameter.action === 'getSettings') {
      const settings = getEventSettings();
      return ContentService.createTextOutput(JSON.stringify(settings))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rawSheet = ss.getSheetByName("Raw_Responses");
    const count = rawSheet ? Math.max(0, rawSheet.getLastRow() - 1) : 0;
    const settings = getEventSettings();
    
    const info = {
      status: "active",
      event: settings.eventName,
      date: settings.eventDate,
      time: settings.startTime + " ICT (Doors open " + settings.doorsOpen + ")",
      venue: settings.venueName,
      venueAddress: settings.venueAddress,
      countdownTarget: settings.countdownTarget,
      totalAttendeesRegistered: count,
      serverTime: new Date().toISOString()
    };
    return ContentService.createTextOutput(JSON.stringify(info))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput("BAPS Bangkok Registration API is active.")
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * 4. Reads Event Settings from the Event_Settings tab
 */
function getEventSettings() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let settingsSheet = ss.getSheetByName("Event_Settings");
    if (!settingsSheet) {
      setupAllTabs(ss);
      settingsSheet = ss.getSheetByName("Event_Settings");
    }

    const data = settingsSheet.getDataRange().getValues();
    const map = {};
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0] ? data[i][0].toString().trim() : "";
      const val = data[i][1] !== undefined ? data[i][1] : "";
      if (key) map[key] = val;
    }

    return {
      success: true,
      eventName: map["Event Name"] || DEFAULT_EVENT_NAME,
      eventDate: map["Event Date"] || DEFAULT_EVENT_DATE,
      startTime: map["Start Time"] || DEFAULT_START_TIME,
      doorsOpen: map["Doors Open"] || DEFAULT_DOORS_OPEN,
      venueName: map["Venue Name"] || DEFAULT_VENUE,
      venueAddress: map["Venue Address"] || DEFAULT_VENUE_ADDRESS,
      countdownTarget: map["Target Countdown ISO"] || DEFAULT_COUNTDOWN_ISO,
      contactPhone: map["Contact Phone"] || "+66 81 234 5678",
      officialEmail: map["Official Email"] || OFFICIAL_EMAIL
    };
  } catch (e) {
    return {
      success: true,
      eventName: DEFAULT_EVENT_NAME,
      eventDate: DEFAULT_EVENT_DATE,
      startTime: DEFAULT_START_TIME,
      doorsOpen: DEFAULT_DOORS_OPEN,
      venueName: DEFAULT_VENUE,
      venueAddress: DEFAULT_VENUE_ADDRESS,
      countdownTarget: DEFAULT_COUNTDOWN_ISO,
      contactPhone: "+66 81 234 5678",
      officialEmail: OFFICIAL_EMAIL
    };
  }
}

/**
 * 5. Main Submission Logic: Saves to Raw_Responses and auto-populates category tabs
 */
function submitRegistration(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    setupAllTabs(ss);

    const rawSheet = ss.getSheetByName("Raw_Responses");
    const allMaleSheet = ss.getSheetByName("All_Male");
    const allFemaleSheet = ss.getSheetByName("All_Female");
    const adultsAllSheet = ss.getSheetByName("Adults_All");
    const adultsMaleSheet = ss.getSheetByName("Adults_Male");
    const adultsFemaleSheet = ss.getSheetByName("Adults_Female");
    const childrenAllSheet = ss.getSheetByName("Children_All");
    const childrenMaleSheet = ss.getSheetByName("Children_Male");
    const childrenFemaleSheet = ss.getSheetByName("Children_Female");
    const familyGroupSheet = ss.getSheetByName("Grouped_By_Family");

    const timestamp = new Date();
    const formattedTimestamp = Utilities.formatDate(timestamp, "GMT+7", "yyyy-MM-dd HH:mm:ss");

    let regId = data.regId;
    if (!regId || regId.trim() === "") {
      const mmdd = Utilities.formatDate(timestamp, "GMT+7", "MMdd");
      const randNum = Math.floor(1000 + Math.random() * 9000);
      regId = "GS-" + mmdd + "-" + randNum;
    }

    const parentName = (data.parentName || "").toString().trim();
    const whatsappNumber = formatPhone(data.whatsappNumber);
    const parentEmail = (data.parentEmail || "").toString().trim();
    const primaryGender = (data.primaryGender || "Male").toString().trim();

    const additionalAdults = Array.isArray(data.adults) ? data.adults : [];
    const children = Array.isArray(data.children) ? data.children : [];

    const termsVersion = (data.termsVersion || "v1.0 (2026-11-26)").toString();
    const termsAccepted = (data.termsConsentAccepted === true || data.termsConsentAccepted === "true") ? "Accepted" : "No";
    const marketingConsent = (data.marketingConsent === true || data.marketingConsent === "true") ? "Consent Given" : "No";
    const photoConsent = (data.photoConsent === true || data.photoConsent === "true") ? "Consent Given" : "No";

    const allAttendees = [];
    allAttendees.push({
      name: parentName,
      gender: primaryGender,
      type: "Primary Registrant",
      phone: whatsappNumber,
      email: parentEmail,
      badgeId: regId + "-A1"
    });

    additionalAdults.forEach((att, idx) => {
      const aName = (att.name || "").toString().trim();
      if (aName) {
        allAttendees.push({
          name: aName,
          gender: (att.gender || "Male").toString().trim(),
          type: "Additional Adult",
          phone: formatPhone(att.phone || whatsappNumber),
          email: (att.email || "").toString().trim(),
          badgeId: regId + "-A" + (idx + 2)
        });
      }
    });

    children.forEach((ch, idx) => {
      const cName = (ch.name || "").toString().trim();
      if (cName) {
        allAttendees.push({
          name: cName,
          gender: (ch.gender || "Male").toString().trim(),
          type: "Child (12 & Under)",
          phone: whatsappNumber,
          email: parentEmail,
          badgeId: regId + "-C" + (idx + 1)
        });
      }
    });

    const rawRows = [];
    const allMaleRows = [];
    const allFemaleRows = [];
    const adultsAllRows = [];
    const adultsMaleRows = [];
    const adultsFemaleRows = [];
    const childrenAllRows = [];
    const childrenMaleRows = [];
    const childrenFemaleRows = [];
    const familyRows = [];

    familyRows.push([
      "★ FAMILY HEAD: " + parentName + " (" + regId + ")",
      "Primary Registrant",
      primaryGender,
      regId + "-A1",
      whatsappNumber,
      parentEmail,
      parentName,
      regId,
      formattedTimestamp
    ]);

    allAttendees.forEach((att, idx) => {
      rawRows.push([
        formattedTimestamp,
        regId,
        att.badgeId,
        att.type,
        att.name,
        att.gender,
        att.phone,
        att.email,
        parentName,
        whatsappNumber,
        parentEmail,
        regId,
        termsVersion,
        termsAccepted,
        marketingConsent,
        photoConsent
      ]);

      if (att.gender.toLowerCase() === "female") {
        allFemaleRows.push([
          att.name, att.type, regId, att.badgeId,
          att.phone, att.email, parentName, whatsappNumber
        ]);
      } else {
        allMaleRows.push([
          att.name, att.type, regId, att.badgeId,
          att.phone, att.email, parentName, whatsappNumber
        ]);
      }

      if (att.type.includes("Adult") || att.type.includes("Primary")) {
        adultsAllRows.push([
          att.name, att.gender, att.type, regId, att.badgeId,
          att.phone, att.email, parentName, whatsappNumber
        ]);
        if (att.gender.toLowerCase() === "female") {
          adultsFemaleRows.push([
            att.name, att.type, regId, att.badgeId,
            att.phone, att.email, parentName, whatsappNumber
          ]);
        } else {
          adultsMaleRows.push([
            att.name, att.type, regId, att.badgeId,
            att.phone, att.email, parentName, whatsappNumber
          ]);
        }
      } else if (att.type.includes("Child")) {
        childrenAllRows.push([
          att.name, att.gender, parentName, whatsappNumber,
          parentEmail, regId, att.badgeId, formattedTimestamp
        ]);
        if (att.gender.toLowerCase() === "female") {
          childrenFemaleRows.push([
            att.name, parentName, whatsappNumber, regId,
            att.badgeId, formattedTimestamp
          ]);
        } else {
          childrenMaleRows.push([
            att.name, parentName, whatsappNumber, regId,
            att.badgeId, formattedTimestamp
          ]);
        }
      }

      if (idx > 0) {
        familyRows.push([
          "   ↳ " + att.name,
          att.type,
          att.gender,
          att.badgeId,
          att.phone,
          att.email,
          parentName,
          regId,
          formattedTimestamp
        ]);
      }
    });

    familyRows.push(["", "", "", "", "", "", "", "", ""]);

    insertBatch(rawSheet, rawRows);
    insertBatch(allMaleSheet, allMaleRows);
    insertBatch(allFemaleSheet, allFemaleRows);
    insertBatch(adultsAllSheet, adultsAllRows);
    insertBatch(adultsMaleSheet, adultsMaleRows);
    insertBatch(adultsFemaleSheet, adultsFemaleRows);
    insertBatch(childrenAllSheet, childrenAllRows);
    insertBatch(childrenMaleSheet, childrenMaleRows);
    insertBatch(childrenFemaleSheet, childrenFemaleRows);
    insertBatch(familyGroupSheet, familyRows);

    if (parentEmail && parentEmail.includes("@")) {
      try {
        sendConfirmationEmail({
          parentName: parentName,
          parentEmail: parentEmail,
          regId: regId,
          attendees: allAttendees,
          timestamp: formattedTimestamp
        });
      } catch (eEmail) {
        Logger.log("Confirmation email warning: " + eEmail.toString());
      }
    }

    return {
      success: true,
      regId: regId,
      attendeeCount: allAttendees.length,
      primaryRegistrant: parentName
    };

  } catch (err) {
    Logger.log("Registration error: " + err.toString());
    return {
      success: false,
      error: err.toString()
    };
  }
}

/**
 * 6. Send Automated Email Broadcast to Subscribed Attendees (Permanent Lock in Col C)
 */
function sendPendingBroadcasts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupAllTabs(ss);

  const broadcastSheet = ss.getSheetByName("Broadcasts");
  const rawSheet = ss.getSheetByName("Raw_Responses");
  const settings = getEventSettings();

  const lastRow = broadcastSheet.getLastRow();
  if (lastRow < 2) {
    showAlertSafe("No broadcast rows found in the 'Broadcasts' tab. Add a Subject in Column A and Message Body in Column B.");
    return { sentRows: 0, message: "No broadcast rows found." };
  }

  // Gather unique valid parent emails from Raw_Responses
  const recipientEmails = getSubscribedEmails(rawSheet);
  if (recipientEmails.length === 0) {
    showAlertSafe("No recipient email addresses found in 'Raw_Responses' yet.");
    return { sentRows: 0, message: "No subscribed recipients." };
  }

  const broadcastValues = broadcastSheet.getRange(2, 1, lastRow - 1, 3).getValues();
  let rowsSentCount = 0;

  for (let i = 0; i < broadcastValues.length; i++) {
    const rowNumber = i + 2;
    const subject = broadcastValues[i][0] ? broadcastValues[i][0].toString().trim() : "";
    const messageBody = broadcastValues[i][1] ? broadcastValues[i][1].toString().trim() : "";
    const statusText = broadcastValues[i][2] ? broadcastValues[i][2].toString().trim() : "";

    // Skip rows already locked with "Sent..."
    if (statusText !== "" && /^sent/i.test(statusText)) {
      continue;
    }

    if (!subject || !messageBody) {
      continue;
    }

    const formattedBodyHtml = messageBody
      .split(/\r?\n/)
      .map(function(line) {
        return line.trim() === "" 
          ? "<br/>" 
          : `<p style="margin: 0 0 12px; font-size: 14.5px; line-height: 1.6; color: #334155;">${escapeHtml(line)}</p>`;
      })
      .join("");

    const mainContentHtml = `
      <h2 style="margin: 0 0 14px; font-size: 20px; color: #0F172A; font-family: -apple-system, sans-serif; font-weight: 800;">${escapeHtml(subject)}</h2>
      <div style="margin-bottom: 20px;">
        ${formattedBodyHtml}
      </div>
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-top: 18px;">
        <p style="margin: 3px 0; font-size: 13px; color: #475569;"><strong>Event:</strong> ${escapeHtml(settings.eventName)}</p>
        <p style="margin: 3px 0; font-size: 13px; color: #475569;"><strong>Date &amp; Time:</strong> ${escapeHtml(settings.eventDate)} • ${escapeHtml(settings.startTime)} ICT</p>
        <p style="margin: 3px 0; font-size: 13px; color: #475569;"><strong>Venue:</strong> ${escapeHtml(settings.venueName)}</p>
        <p style="margin: 3px 0; font-size: 12px; color: #64748B;">${escapeHtml(settings.venueAddress)}</p>
      </div>
    `;

    let deliveredCount = 0;
    recipientEmails.forEach(function(email) {
      try {
        const htmlBody = wrapEmailTemplate(subject, mainContentHtml, settings);
        const plainText = subject + "\n\n" + messageBody + "\n\nEvent: " + settings.eventDate + " • " + settings.venueName;
        MailApp.sendEmail({
          to: email,
          replyTo: OFFICIAL_EMAIL,
          name: "BAPS Swaminarayan Sanstha Bangkok",
          subject: subject,
          body: plainText,
          htmlBody: htmlBody
        });
        deliveredCount++;
      } catch (e) {
        Logger.log("Failed sending broadcast to " + email + ": " + e.toString());
      }
    });

    const sentTimestamp = "Sent at " + Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss") + " (" + deliveredCount + " sent)";
    const statusCell = broadcastSheet.getRange(rowNumber, 3);
    statusCell.setValue(sentTimestamp);
    statusCell.setBackground("#DCFCE7").setFontColor("#15803D").setFontWeight("bold");
    broadcastSheet.getRange(rowNumber, 1, 1, 2).setBackground("#F8FAFC");
    rowsSentCount++;
  }

  if (rowsSentCount > 0) {
    showAlertSafe("Success! Sent " + rowsSentCount + " broadcast announcement(s) to " + recipientEmails.length + " attendee email(s). Sent rows are permanently locked.");
  } else {
    showAlertSafe("No new unsent broadcast rows found. (Rows already marked 'Sent at...' are permanently locked and skipped.)");
  }

  return { sentRows: rowsSentCount, recipients: recipientEmails.length };
}

/**
 * 7. Send a Test Broadcast to the current user's email
 */
function testSendBroadcastEmail() {
  const userEmail = Session.getActiveUser().getEmail() || OFFICIAL_EMAIL;
  const settings = getEventSettings();
  const subject = "[TEST BROADCAST] " + settings.eventName;
  const bodyHtml = `
    <h2 style="margin: 0 0 14px; font-size: 20px; color: #0F172A;">Test Announcement Message</h2>
    <p style="margin: 0 0 12px; font-size: 14.5px; line-height: 1.6; color: #334155;">
      This is a test broadcast preview. When you run <strong>Send Pending Broadcasts</strong> from the admin menu, messages formatted in the <strong>Broadcasts</strong> tab will be sent out like this to all registered attendees!
    </p>
  `;
  const html = wrapEmailTemplate(subject, bodyHtml, settings);
  MailApp.sendEmail({
    to: userEmail,
    replyTo: OFFICIAL_EMAIL,
    name: "BAPS Swaminarayan Sanstha Bangkok",
    subject: subject,
    body: "This is a test broadcast email from BAPS Bangkok.",
    htmlBody: html
  });
  showAlertSafe("Test broadcast sent successfully to " + userEmail);
}

/**
 * Helper: Collects all unique emails from Raw_Responses
 */
function getSubscribedEmails(rawSheet) {
  if (!rawSheet) return [];
  const lastRow = rawSheet.getLastRow();
  if (lastRow < 2) return [];

  // Email is in Column 8 (Attendee Email) and Column 11 (Primary Email)
  const data = rawSheet.getRange(2, 1, lastRow - 1, 16).getValues();
  const emailsSet = {};

  for (let i = 0; i < data.length; i++) {
    const attendeeEmail = data[i][7] ? data[i][7].toString().trim().toLowerCase() : "";
    const primaryEmail = data[i][10] ? data[i][10].toString().trim().toLowerCase() : "";

    [attendeeEmail, primaryEmail].forEach(e => {
      if (e && e.includes("@") && e.includes(".") && !emailsSet[e]) {
        emailsSet[e] = true;
      }
    });
  }

  return Object.keys(emailsSet);
}

/**
 * Branded Email Template Wrapper
 */
function wrapEmailTemplate(title, contentHtml, settings) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px 12px; color: #1E293B;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
        <div style="background: #A94808; padding: 26px 24px; text-align: center; color: #FFFFFF;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #FED7AA; margin-bottom: 4px;">BAPS SWAMINARAYAN SANSTHA THAILAND</div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">${escapeHtml(settings.eventName)}</h1>
        </div>
        <div style="padding: 24px;">
          ${contentHtml}
        </div>
        <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px; text-align: center; font-size: 11.5px; color: #94A3B8;">
          Copyright © 2026 BAPS Bangkok Thailand. All Rights Reserved.<br/>
          Crafted with dedication by THE MOZZERELLA COMPANY • mozzerellaofficial@gmail.com
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 8. Automated Registration Confirmation Email
 */
function sendConfirmationEmail(info) {
  const settings = getEventSettings();
  const subject = "Entry Pass Confirmed: " + settings.eventName + " (" + info.regId + ")";

  let attendeeRowsHtml = "";
  let attendeeTextList = "";

  info.attendees.forEach(function(att, idx) {
    const roleColor = att.type.includes("Child") ? "#15803D" : (att.type.includes("Primary") ? "#92400E" : "#0369A1");
    const roleBg = att.type.includes("Child") ? "#DCFCE7" : (att.type.includes("Primary") ? "#FEF3C7" : "#E0F2FE");
    attendeeRowsHtml += `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13.5px; color: #0F172A; font-weight: 700;">
          ${idx + 1}. ${escapeHtml(att.name)}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 12px;">
          <span style="background-color: ${roleBg}; color: ${roleColor}; padding: 3px 8px; border-radius: 6px; font-weight: 700; text-transform: uppercase;">${escapeHtml(att.type)}</span>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #475569;">
          ${escapeHtml(att.gender)}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-family: monospace; font-weight: 700; color: #A94808;">
          ${escapeHtml(att.badgeId)}
        </td>
      </tr>
    `;
    attendeeTextList += `  ${idx + 1}. ${att.name} (${att.type}, ${att.gender}) - Badge ID: ${att.badgeId}\n`;
  });

  const mainContent = `
    <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6; color: #1E293B;">
      <strong>Jai Swaminarayan, ${escapeHtml(info.parentName)}!</strong>
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
      Thank you for registering. Your entry pass for the inspirational discourse by <strong>Pujya Dr. Gyanvatsal Swami</strong> is confirmed. We look forward to welcoming you and your family!
    </p>

    <!-- Group Pass ID Highlight Box -->
    <div style="background-color: #FFFDF9; border: 2px dashed #A94808; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 22px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8E3804; font-weight: 800; margin-bottom: 4px;">Group Pass ID</div>
      <div style="font-size: 24px; font-weight: 800; color: #A94808; font-family: monospace; letter-spacing: 1px;">${escapeHtml(info.regId)}</div>
      <div style="font-size: 12px; color: #78716C; margin-top: 4px;">Total Reserved: <strong>${info.attendees.length} ${info.attendees.length === 1 ? 'Seat' : 'Seats'}</strong></div>
    </div>

    <!-- Event Schedule & Venue Box -->
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 18px; margin-bottom: 22px;">
      <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: #0F172A; margin-bottom: 10px; letter-spacing: 0.5px;">Event Schedule &amp; Venue</div>
      <p style="margin: 5px 0; font-size: 13.5px; color: #334155;"><strong>Date:</strong> ${escapeHtml(settings.eventDate)}</p>
      <p style="margin: 5px 0; font-size: 13.5px; color: #334155;"><strong>Time:</strong> ${escapeHtml(settings.startTime)} ICT (Doors open at ${escapeHtml(settings.doorsOpen)})</p>
      <p style="margin: 5px 0; font-size: 13.5px; color: #334155;"><strong>Venue:</strong> ${escapeHtml(settings.venueName)}</p>
      <p style="margin: 5px 0; font-size: 12px; color: #64748B;">${escapeHtml(settings.venueAddress)}</p>
      <p style="margin: 5px 0; font-size: 13.5px; color: #334155;"><strong>Admission:</strong> Free for all registered attendees</p>
    </div>

    <!-- Registered Attendees Badges Table -->
    <div style="margin-bottom: 22px;">
      <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: #0F172A; margin-bottom: 10px; letter-spacing: 0.5px;">Registered Attendees &amp; Badge IDs</div>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #F1F5F9; text-align: left;">
            <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569;">Attendee Name</th>
            <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569;">Category</th>
            <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569;">Gender</th>
            <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569;">Badge ID</th>
          </tr>
        </thead>
        <tbody>
          ${attendeeRowsHtml}
        </tbody>
      </table>
    </div>

    <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 12px 14px; margin-bottom: 20px; font-size: 13px; color: #065F46; line-height: 1.5;">
      💡 <strong>Check-in Notice:</strong> Please arrive by ${escapeHtml(settings.doorsOpen)} and keep your Group Pass ID (${escapeHtml(info.regId)}) ready on your mobile screen or printed out for seamless entry at the welcome desk.
    </div>

    <p style="margin: 0; font-size: 12.5px; color: #64748B; line-height: 1.5;">
      For any queries, please contact BAPS Swaminarayan Sanstha Bangkok at <a href="mailto:${OFFICIAL_EMAIL}" style="color: #A94808; font-weight: 600; text-decoration: underline;">${OFFICIAL_EMAIL}</a> or ${escapeHtml(settings.contactPhone)}.
    </p>
  `;

  const htmlBody = wrapEmailTemplate("Registration Confirmed", mainContent, settings);
  const plainText = "Jai Swaminarayan, " + info.parentName + "!\n\n" +
    "Your registration for " + settings.eventName + " is confirmed.\n\n" +
    "Group Pass ID: " + info.regId + "\n" +
    "Total Seats Reserved: " + info.attendees.length + "\n" +
    "Date & Time: " + settings.eventDate + " • " + settings.startTime + "\n" +
    "Venue: " + settings.venueName + "\n\n" +
    "Registered Attendees:\n" + attendeeTextList + "\n" +
    "Contact: " + OFFICIAL_EMAIL + "\n" +
    "BAPS Swaminarayan Sanstha Bangkok";

  MailApp.sendEmail({
    to: info.parentEmail,
    replyTo: OFFICIAL_EMAIL,
    name: "BAPS Swaminarayan Sanstha Bangkok",
    subject: subject,
    body: plainText,
    htmlBody: htmlBody
  });
}

/**
 * 9. Initializes and formats all 13 sheets including Workspace, Broadcasts, and Event_Settings
 */
function setupAllTabs(ssInstance) {
  const ss = ssInstance || SpreadsheetApp.getActiveSpreadsheet();

  const tabConfigs = [
    {
      name: "Raw_Responses",
      color: "#1E293B",
      headers: [
        "Timestamp", "Registration ID", "Attendee Badge ID", "Attendee Type",
        "Attendee Name", "Gender", "Phone Number", "Email Address",
        "Primary Contact Name", "Primary Phone", "Primary Email", "Family Group ID",
        "Terms Version", "Terms Accepted", "Marketing Consent", "Photo Consent"
      ]
    },
    {
      name: "All_Male",
      color: "#0284C7",
      headers: [
        "Attendee Name", "Category", "Registration ID", "Badge ID",
        "Phone Number", "Email Address", "Primary Contact Name", "Primary Phone"
      ]
    },
    {
      name: "All_Female",
      color: "#D946EF",
      headers: [
        "Attendee Name", "Category", "Registration ID", "Badge ID",
        "Phone Number", "Email Address", "Primary Contact Name", "Primary Phone"
      ]
    },
    {
      name: "Adults_All",
      color: "#D97706",
      headers: [
        "Full Name", "Gender", "Role", "Registration ID", "Badge ID",
        "Phone Number", "Email Address", "Primary Contact Name", "Primary Phone"
      ]
    },
    {
      name: "Adults_Male",
      color: "#0EA5E9",
      headers: [
        "Full Name", "Role", "Registration ID", "Badge ID",
        "Phone Number", "Email Address", "Primary Contact Name", "Primary Phone"
      ]
    },
    {
      name: "Adults_Female",
      color: "#F43F5E",
      headers: [
        "Full Name", "Role", "Registration ID", "Badge ID",
        "Phone Number", "Email Address", "Primary Contact Name", "Primary Phone"
      ]
    },
    {
      name: "Children_All",
      color: "#10B981",
      headers: [
        "Child Name", "Gender", "Parent Name", "Parent Phone",
        "Parent Email", "Registration ID", "Badge ID", "Registration Time"
      ]
    },
    {
      name: "Children_Male",
      color: "#06B6D4",
      headers: [
        "Child Name", "Parent Name", "Parent Phone", "Registration ID",
        "Badge ID", "Registration Time"
      ]
    },
    {
      name: "Children_Female",
      color: "#EC4899",
      headers: [
        "Child Name", "Parent Name", "Parent Phone", "Registration ID",
        "Badge ID", "Registration Time"
      ]
    },
    {
      name: "Grouped_By_Family",
      color: "#F59E0B",
      headers: [
        "Family Group Hierarchy", "Role / Relationship", "Gender", "Badge ID",
        "Phone", "Email", "Parent / Primary Contact", "Registration ID", "Timestamp"
      ]
    },
    {
      name: "Broadcasts",
      color: "#6366F1",
      headers: [
        "Subject (Column A)",
        "Message Body (Column B)",
        "Status / Sent Lock Timestamp (Column C - DO NOT EDIT)"
      ]
    },
    {
      name: "Event_Settings",
      color: "#EAB308",
      headers: [
        "Setting Name", "Value", "Description / Guidance"
      ]
    },
    {
      name: "Workspace",
      color: "#64748B",
      headers: [
        "Workspace & Free Notes", "Use this sheet freely for coordinator notes, tasks, seating planning, or calculations."
      ]
    }
  ];

  tabConfigs.forEach(cfg => {
    let sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
    }

    try {
      sheet.setTabColor(cfg.color);
    } catch (e) {}

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(cfg.headers);
      const headerRange = sheet.getRange(1, 1, 1, cfg.headers.length);
      headerRange
        .setBackground(cfg.color)
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setFontFamily("Plus Jakarta Sans")
        .setFontSize(11)
        .setVerticalAlignment("middle");
      sheet.setRowHeight(1, 38);
      sheet.setFrozenRows(1);

      // Populate default settings in Event_Settings
      if (cfg.name === "Event_Settings") {
        const defaultSettings = [
          ["Event Name", DEFAULT_EVENT_NAME, "Official event title shown in headings and emails"],
          ["Event Date", DEFAULT_EVENT_DATE, "Shown on website countdown and header badges"],
          ["Start Time", DEFAULT_START_TIME, "Event start time (e.g. 5:30 PM)"],
          ["Doors Open", DEFAULT_DOORS_OPEN, "Doors open time for registration (e.g. 5:00 PM)"],
          ["Venue Name", DEFAULT_VENUE, "Venue name shown across cards and confirmation"],
          ["Venue Address", DEFAULT_VENUE_ADDRESS, "Detailed address of venue"],
          ["Target Countdown ISO", DEFAULT_COUNTDOWN_ISO, "Exact target timestamp for live countdown timer (YYYY-MM-DDTHH:mm:ss+07:00)"],
          ["Contact Phone", "+66 81 234 5678", "Organizer inquiry WhatsApp / phone"],
          ["Official Email", OFFICIAL_EMAIL, "Official contact & reply-to email address"]
        ];
        defaultSettings.forEach(r => sheet.appendRow(r));
        sheet.setColumnWidth(1, 200);
        sheet.setColumnWidth(2, 320);
        sheet.setColumnWidth(3, 400);
        sheet.getRange("A2:A10").setFontWeight("bold");
        sheet.getRange("B2:B10").setBackground("#FFFDE7").setNumberFormat("@");
      }

      if (cfg.name === "Broadcasts") {
        sheet.setColumnWidth(1, 260);
        sheet.setColumnWidth(2, 480);
        sheet.setColumnWidth(3, 300);
      }

      if (cfg.name === "Workspace") {
        sheet.setColumnWidth(1, 240);
        sheet.setColumnWidth(2, 600);
      }
    }
  });
}

/**
 * 10. Admin Utility: Clears and re-syncs all category tabs from Raw_Responses
 */
function refreshAllTabsFromRaw() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupAllTabs(ss);

  const rawSheet = ss.getSheetByName("Raw_Responses");
  if (!rawSheet || rawSheet.getLastRow() < 2) {
    showAlertSafe("Raw_Responses sheet is empty. No attendee data to re-sync.");
    return;
  }

  const rawData = rawSheet.getRange(2, 1, rawSheet.getLastRow() - 1, 16).getValues();

  const clearSheetKeepHeader = (name) => {
    const s = ss.getSheetByName(name);
    if (s && s.getLastRow() > 1) {
      s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn()).clearContent();
    }
    return s;
  };

  const allMaleSheet = clearSheetKeepHeader("All_Male");
  const allFemaleSheet = clearSheetKeepHeader("All_Female");
  const adultsAllSheet = clearSheetKeepHeader("Adults_All");
  const adultsMaleSheet = clearSheetKeepHeader("Adults_Male");
  const adultsFemaleSheet = clearSheetKeepHeader("Adults_Female");
  const childrenAllSheet = clearSheetKeepHeader("Children_All");
  const childrenMaleSheet = clearSheetKeepHeader("Children_Male");
  const childrenFemaleSheet = clearSheetKeepHeader("Children_Female");
  const familyGroupSheet = clearSheetKeepHeader("Grouped_By_Family");

  const allMaleRows = [];
  const allFemaleRows = [];
  const adultsAllRows = [];
  const adultsMaleRows = [];
  const adultsFemaleRows = [];
  const childrenAllRows = [];
  const childrenMaleRows = [];
  const childrenFemaleRows = [];

  const familyGroups = {};

  rawData.forEach(row => {
    const timestamp = row[0];
    const regId = row[1];
    const badgeId = row[2];
    const type = row[3];
    const name = row[4];
    const gender = row[5];
    const phone = formatPhone(row[6]);
    const email = row[7];
    const parentName = row[8];
    const parentPhone = formatPhone(row[9]);
    const parentEmail = row[10];

    if (!name || name.toString().trim() === "") return;

    if (gender.toString().toLowerCase() === "female") {
      allFemaleRows.push([name, type, regId, badgeId, phone, email, parentName, parentPhone]);
    } else {
      allMaleRows.push([name, type, regId, badgeId, phone, email, parentName, parentPhone]);
    }

    if (type.includes("Adult") || type.includes("Primary")) {
      adultsAllRows.push([name, gender, type, regId, badgeId, phone, email, parentName, parentPhone]);
      if (gender.toString().toLowerCase() === "female") {
        adultsFemaleRows.push([name, type, regId, badgeId, phone, email, parentName, parentPhone]);
      } else {
        adultsMaleRows.push([name, type, regId, badgeId, phone, email, parentName, parentPhone]);
      }
    } else if (type.includes("Child")) {
      childrenAllRows.push([name, gender, parentName, parentPhone, parentEmail, regId, badgeId, timestamp]);
      if (gender.toString().toLowerCase() === "female") {
        childrenFemaleRows.push([name, parentName, parentPhone, regId, badgeId, timestamp]);
      } else {
        childrenMaleRows.push([name, parentName, parentPhone, regId, badgeId, timestamp]);
      }
    }

    if (!familyGroups[regId]) {
      familyGroups[regId] = {
        parentName: parentName,
        parentPhone: parentPhone,
        parentEmail: parentEmail,
        timestamp: timestamp,
        members: []
      };
    }

    familyGroups[regId].members.push({
      name: name,
      type: type,
      gender: gender,
      badgeId: badgeId,
      phone: phone,
      email: email
    });
  });

  const sortByName = (a, b) => a[0].toString().localeCompare(b[0].toString());
  allMaleRows.sort(sortByName);
  allFemaleRows.sort(sortByName);
  adultsAllRows.sort(sortByName);
  adultsMaleRows.sort(sortByName);
  adultsFemaleRows.sort(sortByName);
  childrenAllRows.sort(sortByName);
  childrenMaleRows.sort(sortByName);
  childrenFemaleRows.sort(sortByName);

  insertBatch(allMaleSheet, allMaleRows);
  insertBatch(allFemaleSheet, allFemaleRows);
  insertBatch(adultsAllSheet, adultsAllRows);
  insertBatch(adultsMaleSheet, adultsMaleRows);
  insertBatch(adultsFemaleSheet, adultsFemaleRows);
  insertBatch(childrenAllSheet, childrenAllRows);
  insertBatch(childrenMaleSheet, childrenMaleRows);
  insertBatch(childrenFemaleSheet, childrenFemaleRows);

  const familyRows = [];
  Object.keys(familyGroups).forEach(regId => {
    const grp = familyGroups[regId];
    familyRows.push([
      "★ FAMILY HEAD: " + grp.parentName + " (" + regId + ")",
      "Primary Registrant",
      grp.members[0] ? grp.members[0].gender : "Male",
      grp.members[0] ? grp.members[0].badgeId : regId + "-A1",
      grp.parentPhone,
      grp.parentEmail,
      grp.parentName,
      regId,
      grp.timestamp
    ]);

    for (let m = 1; m < grp.members.length; m++) {
      const mem = grp.members[m];
      familyRows.push([
        "   ↳ " + mem.name,
        mem.type,
        mem.gender,
        mem.badgeId,
        mem.phone,
        mem.email,
        grp.parentName,
        regId,
        grp.timestamp
      ]);
    }

    familyRows.push(["", "", "", "", "", "", "", "", ""]);
  });

  insertBatch(familyGroupSheet, familyRows);
  showAlertSafe("All 9 category tabs refreshed and sorted alphabetically from Raw_Responses!");
}

/**
 * Batch insert helper (Forces plain text format to prevent '+' being parsed as formula)
 */
function insertBatch(sheet, rows) {
  if (!sheet || !rows || rows.length === 0) return;
  const startRow = Math.max(2, sheet.getLastRow() + 1);
  const numRows = rows.length;
  const numCols = rows[0].length;
  const range = sheet.getRange(startRow, 1, numRows, numCols);
  range.setNumberFormat("@");
  range.setValues(rows);
}

/**
 * Sanitizes and formats phone numbers for Google Sheets.
 * Always prepends single quote (') if starting with '+' so Google Sheets never throws #ERROR! (Formula parse error).
 */
function formatPhone(phone) {
  if (!phone) return "";
  let s = phone.toString().trim();
  if (!s) return "";
  if (s.startsWith("'")) return s;
  if (s.startsWith("+") || /^[0-9]/.test(s)) {
    return "'" + s;
  }
  return s;
}

/**
 * 12. Auto-Fix Phone Number #ERROR! in Raw Sheet
 * Scans Raw_Responses and fixes cells where '+' was parsed as a formula
 */
function fixPhoneNumberFormulaErrors() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = ss.getSheetByName("Raw_Responses");
  if (!rawSheet) {
    showAlertSafe("Raw_Responses sheet not found.");
    return;
  }
  const lastRow = rawSheet.getLastRow();
  if (lastRow < 2) {
    showAlertSafe("No response rows found in Raw_Responses.");
    return;
  }

  const range = rawSheet.getRange(2, 1, lastRow - 1, 16);
  const formulas = range.getFormulas();
  const values = range.getValues();
  let fixCount = 0;

  for (let r = 0; r < values.length; r++) {
    // Column G (Index 6) is Attendee Phone Number
    const fG = formulas[r][6];
    const vG = values[r][6];
    if (fG && (fG.startsWith("=+") || fG.startsWith("="))) {
      const clean = "'" + fG.replace(/^=/, "");
      rawSheet.getRange(r + 2, 7).setNumberFormat("@").setValue(clean);
      fixCount++;
    } else if (typeof vG === "string" && vG.startsWith("+") && !vG.startsWith("'+")) {
      rawSheet.getRange(r + 2, 7).setNumberFormat("@").setValue("'" + vG);
      fixCount++;
    }

    // Column J (Index 9) is Primary Phone
    const fJ = formulas[r][9];
    const vJ = values[r][9];
    if (fJ && (fJ.startsWith("=+") || fJ.startsWith("="))) {
      const clean = "'" + fJ.replace(/^=/, "");
      rawSheet.getRange(r + 2, 10).setNumberFormat("@").setValue(clean);
      fixCount++;
    } else if (typeof vJ === "string" && vJ.startsWith("+") && !vJ.startsWith("'+")) {
      rawSheet.getRange(r + 2, 10).setNumberFormat("@").setValue("'" + vJ);
      fixCount++;
    }
  }

  // Ensure Columns G and J are formatted as text
  rawSheet.getRange("G2:G" + lastRow).setNumberFormat("@");
  rawSheet.getRange("J2:J" + lastRow).setNumberFormat("@");

  // Re-synchronize all 9 filtered tabs with the fixed numbers
  refreshAllTabsFromRaw();

  showAlertSafe("Repaired " + fixCount + " phone number cells. All category tabs have been refreshed and synchronized!");
}

/**
 * 11. View Event Attendance Statistics popup
 */
function showAttendanceStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = ss.getSheetByName("Raw_Responses");
  const total = rawSheet ? Math.max(0, rawSheet.getLastRow() - 1) : 0;

  const countSheetRows = (name) => {
    const s = ss.getSheetByName(name);
    return s ? Math.max(0, s.getLastRow() - 1) : 0;
  };

  const maleTotal = countSheetRows("All_Male");
  const femaleTotal = countSheetRows("All_Female");
  const adultsTotal = countSheetRows("Adults_All");
  const childrenTotal = countSheetRows("Children_All");

  const msg = 
    "📊 BAPS Bangkok Discourse Attendance Stats:\n\n" +
    "• Total Registered Attendees: " + total + "\n" +
    "• Total Male Attendees: " + maleTotal + "\n" +
    "• Total Female Attendees: " + femaleTotal + "\n" +
    "• Total Adults: " + adultsTotal + "\n" +
    "• Total Children (12 & Under): " + childrenTotal + "\n\n" +
    "Check individual tabs for categorized and alphabetically sorted lists.";

  showAlertSafe(msg);
}

/**
 * Safe alert helper
 */
function showAlertSafe(msg) {
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    Logger.log(msg);
  }
}

/**
 * Escapes HTML characters
 */
function escapeHtml(text) {
  if (!text) return "";
  return text.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
